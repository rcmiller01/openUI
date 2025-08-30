import asyncio
from backend.main import create_app, startup_for_tests, health_check
import json

app = create_app()
shutdown = startup_for_tests()

# Call the health_check coroutine directly to avoid ASGI/static file routing
result = asyncio.run(health_check())
print(json.dumps(result, indent=2))

shutdown()

