import asyncio
import os
import groq

os.environ.setdefault("GROQ_API_KEY", "your-api-key-here")
client = groq.AsyncGroq()

async def main():
    models = await client.models.list()
    for m in models.data:
        print("Model:", m.id)
    
if __name__ == "__main__":
    asyncio.run(main())
