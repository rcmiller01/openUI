import asyncio
from backend.main import create_app, startup_for_tests, health_check


def test_health_direct_call():
    """Start app lifespan and call health_check() directly."""
    shutdown = startup_for_tests()
    try:
        result = asyncio.run(health_check())
        assert isinstance(result, dict)
        assert result.get("status") == "healthy"
        services = result.get("services", {})
        assert "llm_manager" in services
    finally:
        shutdown()
