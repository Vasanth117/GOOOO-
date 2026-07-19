import os, asyncio, groq
client = groq.AsyncGroq(api_key=os.environ.get('GROQ_API_KEY'))
async def test(model):
 b64='iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNkYPhfz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC'
 try:
  res = await client.chat.completions.create(messages=[{'role':'user', 'content':[{'type':'text','text':'What is this?'},{'type':'image_url','image_url':{'url':f'data:image/jpeg;base64,{b64}'}}]}], model=model, max_tokens=20)
  print('SUCCESS:', model, res.choices[0].message.content)
 except Exception as e:
  print('ERROR', model, type(e), e)
asyncio.run(test('qwen/qwen3.6-27b'))
