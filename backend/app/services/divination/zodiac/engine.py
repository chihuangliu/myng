from app.core.location import get_coordinates
from functools import cache
import json
from pydantic import BaseModel, ValidationError
from typing import Any
from pprint import pprint
from dataclasses import dataclass
from datetime import date
from backend.app.services.ai.chat import get_chat_response
from backend.app.core.prokerala import get_client as prokerala_client
from .prompts import portrait_prompt, daily_transit_prompt


@dataclass
class Sign:
    name: str


class PortraitSection(BaseModel):
    model_config = {"frozen": True}
    content: str
    summary: str


class Portrait(BaseModel):
    model_config = {"frozen": True}
    core_identity: PortraitSection
    psychological_dynamics: PortraitSection
    drive_career_values: PortraitSection
    growth_pathway: PortraitSection


class DailyTransit(BaseModel):
    headline: str
    mood_word: str
    the_tension: str
    the_shift: str
    pro_tip: str


class ZodiacPortraitError(Exception):
    pass


class ZodiacDailyTransitError(Exception):
    pass


class ZodiacEngine:
    ai_retries = 3
    key_aspects = {
        "Conjunction",
        "Opposition",
        "Square",
        "Trine",
        "Sextile",
    }
    planets = {
        "Sun",
        "Moon",
        "Mercury",
        "Venus",
        "Mars",
        "Jupiter",
        "Saturn",
        "Uranus",
        "Neptune",
        "Pluto",
    }
    orb_rules = {
        "Moon": 1.5,
        "Sun": 2.5,
        "Mercury": 2.5,
        "Venus": 2.5,
        "Mars": 2.5,
        "Jupiter": 1.0,
        "Saturn": 1.0,
        "Uranus": 1.0,
        "Neptune": 1.0,
        "Pluto": 1.0,
        "Chiron": 1.0,
        "True North Node": 1.0,
        "True South Node": 1.0,
        "Lilith": 1.5,
        "Ascendant": 2.5,
        "Midheaven": 2.5,
    }

    def __init__(self):
        self.prokerala_client = prokerala_client()
        self.portrait_prompt = portrait_prompt
        self.daily_transit_prompt = daily_transit_prompt

    def get_sign(self, query_date: date) -> Sign:
        month = query_date.month
        day = query_date.day

        if (month == 3 and day >= 21) or (month == 4 and day <= 19):
            return Sign(name="Aries")
        elif (month == 4 and day >= 20) or (month == 5 and day <= 20):
            return Sign(name="Taurus")
        elif (month == 5 and day >= 21) or (month == 6 and day <= 20):
            return Sign(name="Gemini")
        elif (month == 6 and day >= 21) or (month == 7 and day <= 22):
            return Sign(name="Cancer")
        elif (month == 7 and day >= 23) or (month == 8 and day <= 22):
            return Sign(name="Leo")
        elif (month == 8 and day >= 23) or (month == 9 and day <= 22):
            return Sign(name="Virgo")
        elif (month == 9 and day >= 23) or (month == 10 and day <= 22):
            return Sign(name="Libra")
        elif (month == 10 and day >= 23) or (month == 11 and day <= 21):
            return Sign(name="Scorpio")
        elif (month == 11 and day >= 22) or (month == 12 and day <= 21):
            return Sign(name="Sagittarius")
        elif (month == 12 and day >= 22) or (month == 1 and day <= 19):
            return Sign(name="Capricorn")
        elif (month == 1 and day >= 20) or (month == 2 and day <= 18):
            return Sign(name="Aquarius")
        else:
            return Sign(name="Pisces")

    def get_portrait(self, datetime: str, coordinates: str) -> dict[str, Any]:
        """
        Retrieves the astrological portrait for a given datetime and coordinates.

        Example return value:
        {
          "profile": {
            "Sun": { "sign": "Aquarius", "house": 8, "degree": 23.0 },
            "Moon": { "sign": "Scorpio", "house": 4, "degree": 7.9 },
            "Mercury": { "sign": "Aquarius", "house": 7, "degree": 8.0 },
            "Venus": { "sign": "Aries", "house": 10, "degree": 4.3 },
            "Mars": { "sign": "Taurus", "house": 10, "degree": 5.7 },
            "Ascendant": { "sign": "Cancer", "degree": 17.5 },
            "MidHeaven": { "sign": "Pisces", "degree": 18.9 }
          },
          "key_aspects": [
            { "p1": "Moon", "p2": "Mars", "type": "Opposition", "orb": 2.2 },
            { "p1": "Moon", "p2": "Mercury", "type": "Square", "orb": 0.05 },
            { "p1": "Venus", "p2": "Mars", "type": "Semi Sextile", "orb": 1.3 }
          ],
          "house_cusps": {
            "1": "Cancer",
            "2": "Leo",
            "10": "Pisces"
          }
        }
        """

        response = self.prokerala_client.get_natal_planet_position(
            datetime=datetime, coordinates=coordinates
        )

        if response.get("status") != "ok":
            raise ValueError(f"Prokerala API error: {response}")

        data = response.get("data", {})
        planet_positions = data.get("planet_positions", [])
        angles = data.get("angles", [])
        aspects = data.get("aspects", [])
        houses = data.get("houses", [])

        profile = {}

        for p in planet_positions:
            name = p.get("name")
            if name in self.planets:
                profile[name] = {
                    "sign": p.get("zodiac", {}).get("name"),
                    "house": p.get("house_number"),
                    "degree": round(p.get("degree", 0), 1),
                }

        target_angles = {"Ascendant": "Ascendant", "Mid Heaven": "MidHeaven"}
        for a in angles:
            name = a.get("name")
            if name in target_angles:
                key = target_angles[name]
                profile[key] = {
                    "sign": a.get("zodiac", {}).get("name"),
                    "degree": round(a.get("degree", 0), 1),
                }

        key_aspects = []
        for asp in aspects:
            aspect_type = asp.get("aspect", {}).get("name")
            if aspect_type not in self.key_aspects:
                continue
            p1 = asp.get("planet_one", {}).get("name")
            p2 = asp.get("planet_two", {}).get("name")
            orb = asp.get("orb")

            if p1 and p2 and aspect_type and orb is not None:
                key_aspects.append(
                    {"p1": p1, "p2": p2, "type": aspect_type, "orb": round(orb, 2)}
                )

        house_cusps = {}
        for h in houses:
            number = h.get("number")
            sign = h.get("start_cusp", {}).get("zodiac", {}).get("name")
            if number and sign:
                house_cusps[str(number)] = sign

        return {
            "profile": profile,
            "key_aspects": key_aspects,
            "house_cusps": house_cusps,
        }

    @cache
    def get_ai_portrait(self, datetime: str, coordinates: str) -> Portrait:
        portrait = self.get_portrait(datetime, coordinates)
        prompt = self.portrait_prompt.format(DATA=portrait)

        for _ in range(self.ai_retries):
            try:
                response = get_chat_response(
                    messages=[{"role": "user", "content": prompt}]
                )
                return Portrait(**json.loads(response))
            except (json.JSONDecodeError, ValidationError):
                continue

        raise ZodiacPortraitError(
            f"Failed to generate a valid AI portrait after {self.ai_retries} retries."
        )

    def _clean_transit_data(self, api_response, top_k: int = 3):
        raw_aspects = api_response.get("data", {}).get("transit_natal_aspects", [])
        hard_aspects = []
        soft_aspects = []

        for item in raw_aspects:
            if not item or "planet_one" not in item or "aspect" not in item:
                continue

            transit_planet = item["planet_one"]["name"]
            natal_planet = item["planet_two"]["name"]
            aspect_name = item["aspect"]["name"]

            if aspect_name not in self.key_aspects:
                continue

            orb = float(item["orb"])
            orb_limit = self.orb_rules.get(transit_planet, 2.5)

            if orb <= orb_limit:
                aspect_type = (
                    "Hard" if aspect_name in ["Square", "Opposition"] else "Soft"
                )
                entry = {
                    "event": f"Transit {transit_planet} {aspect_name} Natal {natal_planet}",
                    "orb": round(orb, 2),
                    "type": aspect_type,
                }
                if aspect_type == "Hard":
                    hard_aspects.append(entry)
                else:
                    soft_aspects.append(entry)

        hard_aspects.sort(key=lambda x: x["orb"])
        soft_aspects.sort(key=lambda x: x["orb"])

        return hard_aspects[:top_k] + soft_aspects[:top_k]

    def get_transit_natal_aspects(
        self,
        birth_datetime: str,
        birth_coordinates: str,
        transit_datetime: str,
        current_coordinates: str,
    ) -> dict[str, Any]:
        response = self.prokerala_client.get_transit_planet_position(
            birth_datetime, birth_coordinates, transit_datetime, current_coordinates
        )

        return self._clean_transit_data(response)

    @cache
    def get_ai_daily_transit(
        self,
        birth_datetime: str,
        transit_datetime: str,
        current_coordinates: str,
        ai_portrait: Portrait | None = None,
        birth_city: str | None = None,
        birth_coordinates: str | None = None,
    ) -> DailyTransit:
        if not birth_coordinates:
            if not birth_city:
                raise ValueError(
                    "birth_city is required if birth_coordinates is not provided"
                )
            birth_coordinates = get_coordinates(birth_city)
        transit_data = self.get_transit_natal_aspects(
            birth_datetime, birth_coordinates, transit_datetime, current_coordinates
        )
        portrait = ai_portrait or self.get_ai_portrait(
            birth_datetime, birth_coordinates
        )
        prompt = self.daily_transit_prompt.format(
            USER_PORTRAIT=portrait, TRANSIT_DATA=transit_data
        )
        for _ in range(self.ai_retries):
            try:
                response = get_chat_response(
                    messages=[{"role": "user", "content": prompt}]
                )
                return DailyTransit(**json.loads(response))
            except (json.JSONDecodeError, ValidationError):
                continue

        raise ZodiacDailyTransitError(
            f"Failed to generate a valid AI daily transit after {self.ai_retries} retries."
        )


if __name__ == "__main__":
    engine = ZodiacEngine()
    # response = engine.get_ai_portrait(
    #     "2025-01-01T00:00:00+00:00", "25.0375198,121.5636796"
    # )
    # pprint(response)

    response = engine.get_ai_daily_transit(
        "2000-01-01T00:00:00+00:00",
        "25.0375198,121.5636796",
        "2025-05-05T00:00:00+00:00",
        "25.0375198,121.5636796",
    )
    pprint(response)
