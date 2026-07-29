import asyncio
import base64
from app.services.ai_service import client

async def test_model(model_name):
    print(f'Testing model: {model_name}')
    b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4FAcH4j9UAAAAASUVORK5CYII='
    try:
        res = await client.chat.completions.create(
            messages=[{
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': 'Is this a plant?'},
                    {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}}
                ]
            }],
            model=model_name
        )
        print("Success:", res.choices[0].message.content)
    except Exception as e:
        print("Error:", type(e).__name__)
        print(e)

async def main():
    await test_model('qwen/qwen3.6-27b')
    await test_model('llama-3.2-11b-vision-preview')
    await test_model('llama-3.2-90b-vision-preview')

if __name__ == '__main__':
    asyncio.run(main())
