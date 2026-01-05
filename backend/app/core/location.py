from geopy.geocoders import Nominatim
from typing import Optional
from functools import cache

geolocator = Nominatim(user_agent="myng_app")


class GeopyError(Exception):
    pass


@cache
def get_coordinates(city: str) -> Optional[str]:
    """
    Get the latitude and longitude for a given city name.

    Args:
        city: The name of the city.

    Returns:
        A string "latitude,longitude" if found, else None.
    """
    location = geolocator.geocode(city)

    if location:
        return f"{location.latitude},{location.longitude}"
    else:
        raise GeopyError("Location not found for city: " + city)


if __name__ == "__main__":
    print(get_coordinates("Taipei"))
