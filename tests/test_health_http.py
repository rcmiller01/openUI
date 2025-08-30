import requests


def test_health_http():
    """Integration test that queries the running backend at localhost:8000/health.

    This test expects the CI workflow to start the container with port 8000 published
    (see .github/workflows/docker-smoke.yml).
    """
    url = "http://localhost:8000/health"
    resp = requests.get(url, timeout=5)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "healthy"
    assert "services" in data
