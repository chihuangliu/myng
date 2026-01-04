import os
from typing import Any, Dict
from prokerala_api import ApiClient
import pprint


class ProkeralaClient:
    planet_id_map = {
        "SUN": 0,
        "MOON": 1,
        "MERCURY": 2,
        "VENUS": 3,
        "MARS": 4,
        "JUPITER": 5,
        "SATURN": 6,
        "URANUS": 7,
        "NEPTUNE": 8,
        "PLUTO": 9,
        "ASCENDANT": 100,
        "RAHU": 101,
        "KETU": 102,
    }

    def __init__(self):
        client_id = os.getenv("PROKERALA_CLIENT_ID")
        client_secret = os.getenv("PROKERALA_SECRET")

        if not client_id or not client_secret:
            raise ValueError(
                "PROKERALA_CLIENT_ID and PROKERALA_CLIENT_SECRET must be set in environment variables."
            )

        self.client = ApiClient(client_id, client_secret)

    def get_natal_planet_position(
        self,
        datetime: str,
        coordinates: str,
        birth_time_unknown: bool = False,
        ayanamsa: int = 0,
        house_system: str = "placidus",
        orb: str = "default",
        birth_time_rectification: str = "flat-chart",
        aspect_filter: str = "major",
        la: str = "en",
    ) -> Dict[str, Any]:
        """
        Get natal planet positions.

        :param datetime: Date and time in ISO 8601 format YYYY-MM-DDTHH:MM:SSZ
        :param coordinates: Latitude and longitude string eg: '10.214747,78.097626'
        :param birth_time_unknown: Boolean, default False
        :param ayanamsa: 0 for Tropical (default), 1 for Lahiri, 3 for Raman, 5 for KP
        :param house_system: House system (placidus, koch, etc)
        :param orb: 'default' or 'exact'
        :param birth_time_rectification: 'flat-chart' or 'true-sunrise-chart'
        :param aspect_filter: 'major' to filter main aspects
        :param la: Language code (en, de, es)
        """
        params = {
            "ayanamsa": ayanamsa,
            "house_system": house_system,
            "orb": orb,
            "birth_time_rectification": birth_time_rectification,
            "aspect_filter": aspect_filter,
            "la": la,
            "profile": {
                "datetime": datetime,
                "coordinates": coordinates,
                "birth_time_unknown": birth_time_unknown,
            },
        }
        return self.client.get("/v2/astrology/natal-planet-position", params)

    def get_composite_planet_aspect(
        self,
        primary_profile: Dict[str, Any],
        secondary_profile: Dict[str, Any],
        transit_datetime: str,
        current_coordinates: str,
        ayanamsa: int = 0,
        house_system: str = "placidus",
        orb: str = "default",
        birth_time_rectification: str = "flat-chart",
        la: str = "en",
    ) -> Dict[str, Any]:
        """
        Get composite planet aspects.

        :param primary_profile: Dictionary containing profile data
        :param secondary_profile: Dictionary containing secondary profile data
        :param transit_datetime: Date and time in ISO 8601 format
        :param current_coordinates: Latitude and longitude string
        :param ayanamsa: 0 for Tropical (default), etc.
        :param house_system: House system
        :param orb: 'default' or 'exact'
        :param birth_time_rectification: 'flat-chart' or 'true-sunrise-chart'
        :param la: Language code
        """
        params = {
            "primary_profile": primary_profile,
            "secondary_profile": secondary_profile,
            "transit_datetime": transit_datetime,
            "current_coordinates": current_coordinates,
            "ayanamsa": ayanamsa,
            "house_system": house_system,
            "orb": orb,
            "birth_time_rectification": birth_time_rectification,
            "la": la,
        }
        return self.client.get("/v2/astrology/composite-planet-aspect", params)

    def get_transit_planet_position(
        self,
        birth_datetime: str,
        birth_coordinates: str,
        transit_datetime: str,
        current_coordinates: str,
        ayanamsa: int = 0,
        house_system: str = "placidus",
        orb: str = "default",
        birth_time_rectification: str = "flat-chart",
        la: str = "en",
        birth_time_unknown: bool = False,
    ) -> Dict[str, Any]:
        """
        Get transit planet positions.

        :param birth_datetime: Date and time in ISO 8601 format
        :param birth_coordinates: Latitude and longitude string
        :param current_coordinates: Latitude and longitude string
        :param transit_datetime: Date and time in ISO 8601 format
        :param current_coordinates: Latitude and longitude string
        :param ayanamsa: 0 for Tropical (default), etc.
        :param house_system: House system
        :param orb: 'default' or 'exact'
        :param birth_time_rectification: 'flat-chart' or 'true-sunrise-chart'
        :param la: Language code
        """
        params = {
            "current_coordinates": current_coordinates,
            "transit_datetime": transit_datetime,
            "ayanamsa": ayanamsa,
            "house_system": house_system,
            "orb": orb,
            "birth_time_rectification": birth_time_rectification,
            "la": la,
            "profile": {
                "datetime": birth_datetime,
                "coordinates": birth_coordinates,
                "birth_time_unknown": birth_time_unknown,
            },
        }
        return self.client.get("/v2/astrology/transit-planet-position", params)


_client = ProkeralaClient()
get_client = lambda: _client

if __name__ == "__main__":
    client = get_client()
    pprint.pprint(
        client.get_natal_planet_position(
            "2025-01-01T00:00:00+00:00",
            "25.0375198,121.5636796",
            ayanamsa=0,
            house_system="placidus",
            orb="default",
            birth_time_rectification="flat-chart",
            aspect_filter="major",
            la="en",
        )
    )
