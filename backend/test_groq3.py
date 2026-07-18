import asyncio
import os
import groq

os.environ.setdefault("GROQ_API_KEY", "your-api-key-here")
client = groq.AsyncGroq()

async def main():
    models = await client.models.list()
    for m in models.data:
        if "vision" in m.id.lower() or "llava" in m.id.lower():
            print("Vision model:", m.id)
    
if __name__ == "__main__":
    asyncio.run(main())
