import asyncio
from app.database import connect_db
from app.controllers import ai_controller
from app.models.user import User
from app.schemas.ai_schema import AdvisorChatRequest

async def main():
    await connect_db()
    u = User(name="Test Farmer", email="test@example.com", password_hash="hash")
    req = AdvisorChatRequest(message="How do I manage soil moisture for tomatoes?")
    res = await ai_controller.get_advisor_advice(u, req)
    print("SUCCESS RESULT:", res.get("expert_agent_name"))
    print("ADVICE PREVIEW:", str(res.get("advice"))[:100])

if __name__ == "__main__":
    asyncio.run(main())
