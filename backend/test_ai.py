import asyncio
import os
from dotenv import load_dotenv
import groq

async def test_groq():
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    print(f"Testing Groq with key: {api_key[:10]}...")
    
    client = groq.AsyncGroq(api_key=api_key)
    try:
        response = await client.chat.completions.create(
            messages=[{"role": "user", "content": "Say hello"}],
            model="llama-3-1-8b-instant",
        )
        print("Groq success:", response.choices[0].message.content)
    except Exception as e:
        print("Groq failure:", e)

if __name__ == "__main__":
    asyncio.run(test_groq())
