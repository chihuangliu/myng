from backend.app.services.divination.zodiac.engine import get_zodiac_engine
import json

engine = get_zodiac_engine()


def get_daily_transit_context(
    birth_datetime: str,
    birth_coordinates: str,
    transit_datetime: str,
    current_coordinates: str,
):
    """
    Calculates the astrological transit aspects for a user at a specific time.
    Use this when the user asks about their daily horoscope, fortune, vibe, or planetary influences.
    """
    try:
        data = engine.get_transit_natal_aspects(
            birth_datetime=birth_datetime,
            birth_coordinates=birth_coordinates,
            transit_datetime=transit_datetime,
            current_coordinates=current_coordinates,
        )
        return json.dumps(data)
    except Exception as e:
        return json.dumps({"error": str(e)})


def get_natal_chart_context(
    birth_datetime: str,
    birth_coordinates: str,
):
    """
    Retrieves the user's natal chart (planet positions, houses, aspects).
    Use this when the user asks about their personal astrology (e.g., 'What is my moon sign?', 'Do I have any squares?').
    """
    try:
        data = engine.get_portrait(
            datetime=birth_datetime,
            coordinates=birth_coordinates,
        )
        return json.dumps(data)
    except Exception as e:
        return json.dumps({"error": str(e)})


# Tool Definition for the AI
TRANSIT_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "get_daily_transit_context",
        "description": "Get the raw astrological transit data (aspects between current planets and birth chart). Use this to interpret the daily vibe.",
        "parameters": {
            "type": "object",
            "properties": {
                "transit_datetime": {
                    "type": "string",
                    "description": "The current date/time in ISO format (e.g. 2025-01-04T12:00:00)",
                }
            },
            "required": ["transit_datetime"],
        },
    },
}

NATAL_CHART_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "get_natal_chart_context",
        "description": "Get the user's natal chart details (planet positions, signs, houses, aspects). Use this to answer questions about their personal birth chart.",
        "parameters": {
            "type": "object",
            "properties": {},  # No parameters needed from AI, we inject birth data
            "required": [],
        },
    },
}

# Note: birth_datetime/coordinates are injected from context, not asked from the AI,
# to prevent the AI from hallucinating them or asking the user repeatedly.
# We will wrap the execution logic in the Agent to merge user context + AI arguments.
