from app.core.prokerala import get_client
from app.core.location import get_coordinates

def test_get_natal_planet_position_taipei():
    client = get_client()
    datetime = "2025-01-01T00:00:00+00:00"
    coordinates = get_coordinates("Taipei")
    
    # Ensure we got coordinates
    assert coordinates is not None
    
    response = client.get_natal_planet_position(
        datetime=datetime,
        coordinates=coordinates,
        ayanamsa=0,
        house_system="placidus",
        orb="default",
        birth_time_rectification="flat-chart",
        aspect_filter="major",
        la="en"
    )

    assert response["status"] == "ok"
    
    planet_positions = response["data"]["planet_positions"]
    sun_data = next((p for p in planet_positions if p["id"] == 0), None)
    
    assert sun_data is not None
    
    expected_sun_data = {
        'degree': 10.813610810832301,
        'house_number': 12,
        'id': 0,
        'is_retrograde': False,
        'longitude': 280.8136108108323,
        'name': 'Sun',
        'zodiac': {
            'id': 9,
            'lord': {'id': 6, 'name': 'Saturn'},
            'name': 'Capricorn'
        }
    }
    
    # Verify strict equality for the fields present in expected_sun_data
    # Note: real API response might have extra fields, but user expectation defines these specific values.
    # To be safe and strict as per request implied by "if 'id' == 0, we get { ... }"
    # I will assert that the checks match.
    
    assert sun_data['degree'] == expected_sun_data['degree']
    assert sun_data['house_number'] == expected_sun_data['house_number']
    assert sun_data['id'] == expected_sun_data['id']
    assert sun_data['is_retrograde'] == expected_sun_data['is_retrograde']
    assert sun_data['longitude'] == expected_sun_data['longitude']
    assert sun_data['name'] == expected_sun_data['name']
    assert sun_data['zodiac'] == expected_sun_data['zodiac']
