from .fixtures import prokerala_natal_planet_position
from unittest.mock import patch
from backend.app.services.divination.zodiac.engine import ZodiacEngine


def test_get_portrait(prokerala_natal_planet_position):
    engine = ZodiacEngine()

    with patch.object(
        engine.prokerala_client,
        "get_natal_planet_position",
        return_value=prokerala_natal_planet_position,
    ):
        portrait = engine.get_portrait("2026-01-01T00:00:00Z", "25.03,121.56")

    profile = portrait["profile"]

    assert profile["Sun"]["sign"] == "Capricorn"
    assert profile["Sun"]["house"] == 12
    assert profile["Sun"]["degree"] == 10.8

    key_aspects = portrait["key_aspects"]

    for aspect in key_aspects:
        if aspect["p1"] == "Moon" and aspect["p2"] == "Uranus":
            assert aspect["type"] == "Trine"

    house_cusps = portrait["house_cusps"]
    assert house_cusps["1"] == "Aquarius"
    assert house_cusps["10"] == "Scorpio"
