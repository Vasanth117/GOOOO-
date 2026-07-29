import os
import httpx
from dotenv import load_dotenv

def main():
    load_dotenv()
    key = os.environ.get('GROQ_API_KEY')
    r = httpx.get('https://api.groq.com/openai/v1/models', headers={'Authorization': f'Bearer {key}'})
    data = r.json()
    if 'data' in data:
        models = [m['id'] for m in data['data']]
        print("Vision models:")
        print([m for m in models if 'vision' in m.lower() or 'vl' in m.lower()])
        print("All models:")
        print(models)
    else:
        print("Error fetching models:", data)

if __name__ == '__main__':
    main()
