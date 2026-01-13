from geopy.geocoders import Nominatim
from typing import Optional
from functools import cache
from timezonefinder import TimezoneFinder

geolocator = Nominatim(user_agent="myng_app")
tf = TimezoneFinder(in_memory=True)


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


def get_timezone(latitude: float, longitude: float) -> Optional[str]:
    """
    Get the timezone string for a given latitude and longitude.
    """
    return tf.timezone_at(lat=latitude, lng=longitude)


if __name__ == "__main__":
    print(get_coordinates("Taipei"))
