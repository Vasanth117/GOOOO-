import asyncio
import os
import groq

os.environ.setdefault("GROQ_API_KEY", "your-api-key-here")
client = groq.AsyncGroq()

async def test_model(model_name):
    print(f"Testing {model_name}...")
    try:
        # A tiny 1x1 black pixel base64 image
        b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        response = await client.chat.completions.create(
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": "What is this?"},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
                ]
            }],
            model=model_name,
            max_tokens=10
        )
        print(f"SUCCESS: {model_name} works!")
    except Exception as e:
        print(f"ERROR on {model_name}: {e}")

async def main():
    await test_model("llama-3.2-11b-vision-preview")
    await test_model("llama-3.2-11b-vision-instruct")
    await test_model("llama-3.2-90b-vision-preview")
    await test_model("llama-3.2-90b-vision-instruct")
    
if __name__ == "__main__":
    asyncio.run(main())
