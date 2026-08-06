import asyncio
import websockets

async def test_ws():
    try:
        print("Connecting...")
        async with websockets.connect('ws://localhost:8001/ws') as ws:
            print("Connected!")
            await ws.send('ping')
            response = await ws.recv()
            print(f"Received: {response}")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_ws())
