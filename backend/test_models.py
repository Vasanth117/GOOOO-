import asyncio
import os
from dotenv import load_dotenv
import groq

load_dotenv()

async def f():
    client = groq.AsyncGroq(api_key=os.getenv('GROQ_API_KEY'))
    models = await client.models.list()
    print([m.id for m in models.data])

asyncio.run(f())
