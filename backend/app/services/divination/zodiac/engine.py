from pprint import pprint
from dataclasses import dataclass
from datetime import date
from backend.app.services.ai.chat import get_client as chat_client
from backend.app.core.prokerala import get_client as prokerala_client
from typing import Any


@dataclass
class Sign:
    name: str


class ZodiacEngine:
    key_aspects = {
        "Conjunction",
        "Opposition",
        "Square",
        "Trine",
        "Sextile",
    }

    def __init__(self):
        self.chat_client = chat_client()
        self.prokerala_client = prokerala_client()

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

        # Process planets
        target_planets = [
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
        ]
        for p in planet_positions:
            name = p.get("name")
            if name in target_planets:
                profile[name] = {
                    "sign": p.get("zodiac", {}).get("name"),
                    "house": p.get("house_number"),
                    "degree": round(p.get("degree", 0), 1),
                }

        # Process angles (Ascendant, Mid Heaven)
        # Note: API returns "Mid Heaven" but user requested "MidHeaven" key in profile
        target_angles = {"Ascendant": "Ascendant", "Mid Heaven": "MidHeaven"}
        for a in angles:
            name = a.get("name")
            if name in target_angles:
                key = target_angles[name]
                profile[key] = {
                    "sign": a.get("zodiac", {}).get("name"),
                    "degree": round(a.get("degree", 0), 1),
                }

        # Process aspects
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

        # Process house cusps
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


if __name__ == "__main__":
    engine = ZodiacEngine()
    portrait = engine.get_portrait(
        "2025-01-01T00:00:00+00:00", "25.0375198,121.5636796"
    )
    pprint(portrait)
