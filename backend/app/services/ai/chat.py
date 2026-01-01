
import os
from openai import OpenAI
from dotenv import load_dotenv
from openai.types.chat import ChatCompletionMessageParam

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in the environment variables.")

client = OpenAI(
    api_key=GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

def get_chat_response(messages: list[ChatCompletionMessageParam], model_name: str = "gemini-3-flash-preview") -> str:
    """
    Sends a message to the Gemini API via the OpenAI client and returns the response.
    """
    response = client.chat.completions.create(
        model=model_name,
        messages=messages
    )
    return response.choices[0].message.content

if __name__ == "__main__":
    try:
        response = get_chat_response([
            {"role": "user", "content": "Hello, AI!"}
        ])
        print(f"Response from AI: {response}")
    except Exception as e:
        print(f"Error: {e}")
