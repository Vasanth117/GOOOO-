import asyncio
import base64
import io
from PIL import Image
from app.services.ai_service import client, VISION_MODEL, _clean_json_response

async def main():
    print(f"Testing {VISION_MODEL} with 800x800 image...")
    img = Image.new('RGB', (800, 800), color='green')
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    
    try:
        res = await client.chat.completions.create(
            messages=[{
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': 'Is this a plant? Reply ONLY with {"is_plant": true/false}'},
                    {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}}
                ]
            }],
            model=VISION_MODEL
        )
        content = res.choices[0].message.content
        print("Raw Output:")
        print(content)
        
        cleaned = _clean_json_response(content)
        print("Cleaned JSON:")
        print(cleaned)
    except Exception as e:
        print("Exception caught:")
        print(type(e).__name__)
        print(e)

if __name__ == '__main__':
    asyncio.run(main())
