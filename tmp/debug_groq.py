import asyncio
from app.config import settings
import groq

async def test():
    if not settings.GROQ_API_KEY:
        print("No Groq API key")
        return
    client = groq.AsyncGroq(api_key=settings.GROQ_API_KEY)
    models = await client.models.list()
    for m in models.data:
        print(m.id)

if __name__ == "__main__":
    asyncio.run(test())
