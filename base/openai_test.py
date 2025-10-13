from openai import OpenAI

from base.entry_data import API_KEY_OPENAI


client = OpenAI(
  api_key=API_KEY_OPENAI
)

response = client.responses.create(
  model="gpt-4o-mini",
  input="write a haiku about ai",
  store=True,
)

print(response.output_text);