from datetime import datetime
from typing import Optional

from app.models.product import Product
from app.models.order import Order, OrderStatus
from app.models.reward import Reward, RewardType
from app.models.user import User
from app.models.farm_profile import FarmProfile
from app.schemas.marketplace_schema import CreateProductRequest, UpdateProductRequest, CreateOrderRequest
from app.services.notification_service import send_notification
from app.models.notification import NotificationType
from app.utils.response_utils import error_response, not_found
import logging

logger = logging.getLogger(__name__)


# ─── PRODUCT ACTIONS ─────────────────────────────────────────

async def create_product(user: User, data: CreateProductRequest) -> dict:
    """Sellers or Admins create products."""
    product = Product(
        seller_id=str(user.id),
        name=data.name,
        description=data.description,
        category=data.category,
        price=data.price,
        stock=data.stock,
        image_url=data.image_url,
        is_goo_verified=data.is_goo_verified,
    )
    await product.insert()
    logger.info(f"Product {product.id} created by seller {user.id}")
    return _product_to_dict(product)


async def get_products(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    page: int = 1,
    limit: int = 20,
) -> dict:
    """Browse the marketplace."""
    query: dict = {}
    if category:
        query["category"] = category
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price

    skip = (page - 1) * limit
    products = await Product.find(query).skip(skip).limit(limit).to_list()
    total = await Product.find(query).count()

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "has_next": (skip + limit) < total,
        "products": [_product_to_dict(p) for p in products],
    }


async def get_product_detail(product_id: str) -> dict:
    product = await Product.get(product_id)
    if not product:
        not_found("Product")
    return _product_to_dict(product)


async def update_product(product_id: str, user: User, data: UpdateProductRequest) -> dict:
    product = await Product.get(product_id)
    if not product:
        not_found("Product")
    
    if product.seller_id != str(user.id) and user.role.value != "admin":
        error_response("Unauthorized to update this product", 403)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    await product.save()
    return _product_to_dict(product)


# ─── ORDER ACTIONS ───────────────────────────────────────────

async def place_order(user: User, data: CreateOrderRequest) -> dict:
    """Buy a product using cash or points."""
    product = await Product.get(data.product_id)
    if not product:
        not_found("Product")

    if product.stock < data.quantity:
        error_response("Insufficient stock", 400)

    total_price = product.price * data.quantity
    points_used = 0
    final_cash_price = total_price

    # Point conversion: 100 points = $1
    if data.use_points:
        farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
        if not farm:
            error_response("Farm profile required to use points", 400)
        
        available_points = farm.sustainability_score
        needed_points = int(total_price * 100)
        
        points_used = min(available_points, needed_points)
        discount = points_used / 100.0
        final_cash_price = max(0, total_price - discount)
        
        # Deduct points from farm score
        farm.sustainability_score -= points_used
        await farm.save()

    # Create order
    order = Order(
        buyer_id=str(user.id),
        seller_id=product.seller_id,
        product_id=data.product_id,
        quantity=data.quantity,
        total_price=total_price,
        paid_with_points=points_used,
        final_cash_price=final_cash_price,
        status=OrderStatus.PENDING,
    )
    await order.insert()

    # Reduce stock
    product.stock -= data.quantity
    await product.save()

    # Notify seller
    await send_notification(
        user_id=product.seller_id,
        notif_type=NotificationType.SYSTEM,
        title="🛍️ New Order!",
        message=f"You have a new order for {data.quantity}x {product.name}",
        link=f"/orders/{order.id}",
    )

    # Log point redemption if points used
    if points_used > 0:
        await Reward(
            farmer_id=str(user.id),
            reward_type=RewardType.VOUCHER, # repurposed for direct product discount
            points_cost=points_used,
            description=f"Redeemed points for {product.name} discount",
            is_redeemed=True,
            redeemed_at=datetime.utcnow(),
        ).insert()

    return {
        "order_id": str(order.id),
        "status": order.status.value,
        "total_price": total_price,
        "points_used": points_used,
        "final_cash_price": final_cash_price,
    }


async def update_order_status(order_id: str, user: User, status: OrderStatus) -> dict:
    """Sellers update the status of an order."""
    order = await Order.get(order_id)
    if not order:
        not_found("Order")

    # Only the seller of this product or an admin can update status
    if order.seller_id != str(user.id) and user.role.value != "admin":
        error_response("Unauthorized to update this order", 403)

    order.status = status
    order.updated_at = datetime.utcnow()
    await order.save()

    # Notify buyer
    status_emoji = {
        OrderStatus.CONFIRMED: "✅",
        OrderStatus.SHIPPED: "🚚",
        OrderStatus.DELIVERED: "🎁",
        OrderStatus.CANCELLED: "❌"
    }.get(status, "📦")

    await send_notification(
        user_id=order.buyer_id,
        notif_type=NotificationType.SYSTEM,
        title=f"{status_emoji} Order Update!",
        message=f"Your order for highly organic product has been marked as {status.value.upper()}.",
        link=f"/marketplace",
    )

    return {
        "order_id": str(order.id),
        "new_status": order.status.value
    }


# ─── SELLER DASHBOARD ────────────────────────────────────────

async def get_seller_dashboard(user: User) -> dict:
    """Returns total income, active sales, and order history for a seller."""
    my_products = await Product.find(Product.seller_id == str(user.id)).to_list()
    product_ids = [str(p.id) for p in my_products]
    
    # Get all orders involving this seller
    orders = await Order.find(Order.seller_id == str(user.id)).sort(-Order.placed_at).to_list()
    
    total_income = sum([o.total_price for o in orders if o.status != OrderStatus.CANCELLED])
    sales_count = len(orders)
    
    # Serialize orders
    orders_data = []
    for o in orders:
        product = next((p for p in my_products if str(p.id) == o.product_id), None)
        orders_data.append({
            "id": str(o.id),
            "product_name": product.name if product else "Unknown Product",
            "quantity": o.quantity,
            "total_price": o.total_price,
            "final_cash_price": o.final_cash_price,
            "status": o.status.value,
            "created_at": o.placed_at.isoformat()
        })

    return {
        "total_income": total_income,
        "sales": sales_count,
        "recent_orders": orders_data,
        "products": [_product_to_dict(p) for p in my_products]
    }

async def get_my_orders(user: User) -> list:
    """Returns buyer orders for live tracking views."""
    orders = await Order.find(Order.buyer_id == str(user.id)).sort(-Order.placed_at).to_list()
    orders_data = []
    for o in orders:
        product = await Product.get(o.product_id)
        orders_data.append({
            "id": str(o.id),
            "product_name": product.name if product else "Unknown Product",
            "product_image": product.image_url if product else None,
            "seller_id": o.seller_id,
            "quantity": o.quantity,
            "total_price": o.total_price,
            "final_cash_price": o.final_cash_price,
            "status": o.status.value,
            "created_at": o.placed_at.isoformat()
        })
    return orders_data

# ─── SERIALIZER ──────────────────────────────────────────────

def _product_to_dict(p: Product) -> dict:
    return {
        "id": str(p.id),
        "seller_id": p.seller_id,
        "name": p.name,
        "description": p.description,
        "category": p.category,
        "price": p.price,
        "stock": p.stock,
        "image_url": p.image_url,
        "is_goo_verified": p.is_goo_verified,
        "created_at": p.created_at.isoformat(),
    }
