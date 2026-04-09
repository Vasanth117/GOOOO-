from pathlib import Path
from PIL import Image
import io

MODEL_PATH = Path("runs/classify/goo_ai_models/crop_classifier/weights/best.pt")

try:
    from ultralytics import YOLO
    model = YOLO(str(MODEL_PATH))
    print("YOLO instance created successfully.")

    # create a dummy plant image 224x224
    img = Image.new('RGB', (224, 224), color = 'green')
    results = model.predict(source=img, imgsz=224, verbose=True)
    
    top1_idx = results[0].probs.top1
    top1_conf = float(results[0].probs.top1conf)
    raw_label = results[0].names[top1_idx]
    print(f"Top 1: {raw_label} with config {top1_conf}")

except Exception as e:
    import traceback
    traceback.print_exc()
