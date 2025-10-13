import openai
import base64


def parse_freight_offer_image(image_path: str, api_key: str) -> dict:
    """
    Sends a freight offer screenshot to OpenAI GPT-4o and returns extracted route data as JSON.

    Args:
        image_path (str): Path to the PNG/JPG image file.
        api_key (str): Your OpenAI API key.

    Returns:
        dict: Parsed JSON response from GPT-4o.
    """

    openai.api_key = api_key

    # 1. Read and encode the image as base64
    with open(image_path, "rb") as img_file:
        base64_image = base64.b64encode(img_file.read()).decode("utf-8")

    # 2. Prepare the request
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Extract all route details from this freight offer image and return as JSON."},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}}
                ]
            }
        ]
    )

    # 3. Extract and return the content (usually as stringified JSON)
    content = response.choices[0].message.content
    return content


from base.entry_data import API_KEY_OPENAI
import os

api_key = API_KEY_OPENAI
# Ensure image path is correct relative to this script
script_dir = os.path.dirname(os.path.abspath(__file__))
image_file = os.path.join(script_dir, "freight_offer.png")

json_output = parse_freight_offer_image(image_file, api_key)
with open("freight_offer_output.json", "w", encoding="utf-8") as f:
  f.write(json_output)

print(json_output)