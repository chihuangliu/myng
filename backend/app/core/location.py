from geopy.geocoders import ｀
from typing import Optional

def get_coordinates(city: str) -> Optional[str]:
    """
    Get the latitude and longitude for a given city name.
    
    Args:
        city: The name of the city.
        
    Returns:
        A string "latitude,longitude" if found, else None.
    """
    geolocator = Nominatim(user_agent="myng_app")
    location = geolocator.geocode(city)
    
    if location:
        return f"{location.latitude},{location.longitude}"
        return None
