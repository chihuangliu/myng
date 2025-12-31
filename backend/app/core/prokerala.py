import os
from prokerala_api import ApiClient

def get_client() -> ApiClient:
    """
    Returns an instance of the Prokerala ApiClient.
    Checks for PROKERALA_CLIENT_ID and PROKERALA_CLIENT_SECRET in environment variables.
    Falls back to PROLERALA_ID and PROLERALA_SECRET if not found.
    """
    client_id = os.getenv("PROKERALA_CLIENT_ID") or os.getenv("PROLERALA_ID")
    client_secret = os.getenv("PROKERALA_CLIENT_SECRET") or os.getenv("PROLERALA_SECRET")
    
    if not client_id or not client_secret:
        raise ValueError("PROKERALA_CLIENT_ID and PROKERALA_CLIENT_SECRET must be set in environment variables.")
        
    return ApiClient(client_id, client_secret)
