from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_get_ai_portrait():
    payload = {
        "datetime": "2025-01-01T00:00:00+00:00",
        "coordinates": "25.0375198,121.5636796",
    }

    response = client.post("/api/v1/divination/zodiac/portrait", json=payload)

    assert response.status_code == 200

    data = response.json()
    assert "core_identity" in data
    assert "psychological_dynamics" in data
    assert "drive_career_values" in data
    assert "growth_pathway" in data
