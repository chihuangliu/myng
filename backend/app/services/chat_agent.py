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
        user_birth_data should contain:
        - birth_datetime
        - birth_coordinates
        - transit_datetime
        - current_coordinates (or fall back to birth)
        """
        self.user_context = user_context
        if self.user_context["current_coordinates"] is None:
            self.user_context["current_coordinates"] = self.user_context[
                "birth_coordinates"
            ]
        logger.info(f"ZodiacAgent initialized for user: {self.user_context}")

    def _execute_tool(self, tool_call):
        name = tool_call.function.name
        args = json.loads(tool_call.function.arguments)
        logger.info(f"Agent executing tool: {name} with arguments: {args}")

        if name == "get_daily_transit_context":
            result = get_daily_transit_context(
                birth_datetime=self.user_context["birth_datetime"],
                birth_coordinates=self.user_context["birth_coordinates"],
                transit_datetime=args["transit_datetime"],
                current_coordinates=self.user_context.get(
                    "current_coordinates", self.user_context["birth_coordinates"]
                ),
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
        conversation_history: list of {"role": "user"|"assistant"|"system", "content": ...}
        """
        logger.info("Agent starting new chat turn")

        system_prompt = {
            "role": "system",
            "content": f"""You are a mystic AI astrologer. 
            You have access to the user's birth chart data implicitly. 
            The user's birth date is {self.user_context.get("birth_datetime")}.
            
            Your goal is to answer questions using astrological insights.
            
            TOOLS:
            1. 'get_daily_transit_context': Use this if the user asks about their day, current vibe, or future planetary influence.
            2. 'get_natal_chart_context': Use this if the user's question need their natal chart data (e.g., 'What is my rising sign?', 'Do I have a Scorpio Moon?', 'Explain my 7th house').
            
            Do not guess. Use the appropriate tool to get the real data.
            
            When interpreting tool output:
            - Be empathetic but honest.
            - Explain technical terms simply.
            - Keep it conversational.
            """,
        }

        messages = [system_prompt] + conversation_history
        logger.debug(f"Sending messages to AI: {json.dumps(messages, indent=2)}")

        tools = [TRANSIT_TOOL_DEFINITION, NATAL_CHART_TOOL_DEFINITION]

        response_msg = get_chat_completion(
            messages=messages, tools=tools, tool_choice="auto"
        )

        if response_msg.tool_calls:
            logger.info(
                f"AI requested tool calls: {[tc.function.name for tc in response_msg.tool_calls]}"
            )
            messages.append(response_msg)

            for tool_call in response_msg.tool_calls:
                tool_result = self._execute_tool(tool_call)

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": tool_result,
                    }
                )

            logger.debug("Requesting final response with tool results in context")
            final_response = get_chat_completion(messages=messages, tools=tools)
            logger.info("Final agent response generated")
            logger.debug(f"Response content: {final_response.content}")
            return final_response.content

        logger.info("AI returned direct response")
        logger.debug(f"Response content: {response_msg.content}")
        return response_msg.content
