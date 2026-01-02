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
    assert "content" in data["core_identity"]
    assert "summary" in data["core_identity"]
    assert "psychological_dynamics" in data
    assert "content" in data["psychological_dynamics"]
    assert "summary" in data["psychological_dynamics"]
    assert "drive_career_values" in data
    assert "content" in data["drive_career_values"]
    assert "summary" in data["drive_career_values"]
    assert "growth_pathway" in data
    assert "content" in data["growth_pathway"]
    assert "summary" in data["growth_pathway"]
