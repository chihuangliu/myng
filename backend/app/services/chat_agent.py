import json
import logging
from backend.app.services.ai.chat import get_chat_completion
from backend.app.services.ai.tools import (
    TRANSIT_TOOL_DEFINITION,
    NATAL_CHART_TOOL_DEFINITION,
    get_daily_transit_context,
    get_natal_chart_context,
)

logger = logging.getLogger(__name__)


class ZodiacAgent:
    def __init__(self, user_context: dict):
        """
        user_context should contain:
        - birth_datetime
        - birth_coordinates
        - transit_datetime
        - current_coordinates (or fall back to birth)
        """
        self.user_context = user_context
        if self.user_context.get("current_coordinates") is None:
            self.user_context["current_coordinates"] = self.user_context[
                "birth_coordinates"
            ]
        logger.info(f"ZodiacAgent initialized for user: {self.user_context}")

    def _get_system_prompt(self):
        return {
            "role": "system",
            "content": f"""You are a mystic AI astrologer. 
            You have access to the user's birth chart data implicitly. 
            The user's birth date is {self.user_context.get("birth_datetime")}.
            
            Your goal is to answer questions using astrological insights.
            
            TOOLS:
            1. 'get_daily_transit_context': Use this if the user asks about their day, current vibe, or future planetary influence.
            2. 'get_natal_chart_context': Use this if the user asks about their specific chart placements (e.g., 'What is my rising sign?', 'Do I have a Scorpio Moon?', 'Explain my 7th house').
            
            Do not guess. Use the appropriate tool to get the real data.
            
            When interpreting tool output:
            - Be empathetic but honest.
            - Explain technical terms simply.
            - Keep it conversational.
            """,
        }

    def _execute_tool(self, tool_call):
        name = tool_call.function.name
        args = json.loads(tool_call.function.arguments)
        logger.info(f"Agent executing tool: {name} with arguments: {args}")

        if name == "get_daily_transit_context":
            result = get_daily_transit_context(
                birth_datetime=self.user_context["birth_datetime"],
                birth_coordinates=self.user_context["birth_coordinates"],
                transit_datetime=args.get("transit_datetime", self.user_context.get("transit_datetime")),
                current_coordinates=self.user_context["current_coordinates"],
            )
            logger.debug(f"Tool execution result: {result[:200]}...")
            return result

        elif name == "get_natal_chart_context":
            result = get_natal_chart_context(
                birth_datetime=self.user_context["birth_datetime"],
                birth_coordinates=self.user_context["birth_coordinates"],
            )
            logger.debug(f"Tool execution result: {result[:200]}...")
            return result

        logger.warning(f"Attempted to execute unknown tool: {name}")
        return json.dumps({"error": "Unknown tool"})

    def chat(self, conversation_history: list[dict]):
        """
        Standard non-streaming chat.
        """
        logger.info("Agent starting new chat turn")
        messages = [self._get_system_prompt()] + conversation_history
        tools = [TRANSIT_TOOL_DEFINITION, NATAL_CHART_TOOL_DEFINITION]

        response_msg = get_chat_completion(
            messages=messages, tools=tools, tool_choice="auto"
        )

        if response_msg.tool_calls:
            logger.info(f"AI requested tool calls: {[tc.function.name for tc in response_msg.tool_calls]}")
            messages.append(response_msg)

            for tool_call in response_msg.tool_calls:
                tool_result = self._execute_tool(tool_call)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result,
                })

            final_response = get_chat_completion(messages=messages, tools=tools)
            return final_response.content

        return response_msg.content

    def chat_stream(self, conversation_history: list[dict]):
        """
        Yields tokens for the chat response.
        """
        logger.info("Agent starting new streaming chat turn")
        messages = [self._get_system_prompt()] + conversation_history
        tools = [TRANSIT_TOOL_DEFINITION, NATAL_CHART_TOOL_DEFINITION]

        # Initial call to see if tools are needed
        response_msg = get_chat_completion(
            messages=messages, tools=tools, tool_choice="auto", stream=False
        )

        if response_msg.tool_calls:
            logger.info(f"AI requested tool calls: {[tc.function.name for tc in response_msg.tool_calls]}")
            messages.append(response_msg)

            for tool_call in response_msg.tool_calls:
                tool_result = self._execute_tool(tool_call)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result,
                })

            # Final call with streaming
            stream = get_chat_completion(messages=messages, tools=tools, stream=True)
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        else:
            yield response_msg.content or ""