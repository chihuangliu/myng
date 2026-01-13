import os
from openai import OpenAI
from dotenv import load_dotenv
from openai.types.chat import ChatCompletionMessageParam

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is not set in the environment variables.")

_client = OpenAI(
    api_key=OPENAI_API_KEY,
    base_url=os.getenv("OPENAI_BASE_URL"),
)

get_client = lambda: _client


def get_chat_response(
    messages: list[ChatCompletionMessageParam],
    model_name: str = os.getenv("AI_MODEL_NAME"),
    client: OpenAI = _client,
    **kwargs,
) -> str:
    """
    Sends a message to an OPENAI Compatible API via the OpenAI client and returns the response content.
    """

    response = client.chat.completions.create(
        model=model_name, messages=messages, **kwargs
    )
    return response.choices[0].message.content


def get_chat_completion(
    messages: list[ChatCompletionMessageParam],
    model_name: str = os.getenv("AI_MODEL_NAME"),
    client: OpenAI = _client,
    tools: list = None,
    tool_choice: str = "auto",
    stream: bool = False,
    **kwargs,
):
    """
    Sends a message to an AI and returns the full response object.
    Supports tools/function calling and streaming.
    """
    params = {
        "model": model_name,
        "messages": messages,
        "stream": stream,
        **kwargs,
    }
    if tools:
        params["tools"] = tools
        params["tool_choice"] = tool_choice

    return client.chat.completions.create(**params)


if __name__ == "__main__":
    client = get_client()
    response = get_chat_response([{"role": "user", "content": "Hello, AI!"}])
    print(f"Response from AI: {response}")
