import asyncio
from app.main import app
from httpx import ASGITransport, AsyncClient

async def test():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/ai/advisor", json={"message": "test"})
        print("Status code:", response.status_code)
        # Avoid print crashing on cp1252 by ignoring unicode errors
        print("Response:", response.text.encode('utf-8').decode('cp1252', errors='ignore'))

if __name__ == "__main__":
    asyncio.run(test())
