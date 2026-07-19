import os, asyncio, groq
client = groq.AsyncGroq(api_key=os.environ.get('GROQ_API_KEY'))
async def test(model):
 url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/230px-React-icon.svg.png'
 try:
  res = await client.chat.completions.create(messages=[{'role':'user', 'content':[{'type':'text','text':'What is this logo?'},{'type':'image_url','image_url':{'url':url}}]}], model=model, max_tokens=20)
  print('SUCCESS:', model, res.choices[0].message.content)
 except Exception as e:
  print('ERROR', model, type(e), e)
async def main():
  await test('qwen/qwen3.6-27b')
  await test('llama-3.2-11b-vision-preview')
asyncio.run(main())
