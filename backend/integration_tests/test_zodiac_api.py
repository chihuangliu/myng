from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_get_ai_portrait_real():
    # Define the request payload
    # Taipei, 2025-01-01
    payload = {
        "datetime": "2025-01-01T00:00:00+00:00",
        "coordinates": "25.0375198,121.5636796",
    }

    # Make a POST request to the endpoint
    response = client.post("/api/v1/divination/zodiac/portrait", json=payload)

    # Assert the response status code
    assert response.status_code == 200

    # Get content
    data = response.json()
    assert "content" in data
    content = data["content"]

    # Basic verification based on prompt structure
    assert isinstance(content, str)
    assert len(content) > 100

    # Check for expected headers from the prompt
    assert "core identity" in content.lower()
    assert "growth pathway" in content.lower()
