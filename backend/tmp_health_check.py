from main import app, startup_for_tests
shutdown = startup_for_tests()
from fastapi.testclient import TestClient
import json
client = TestClient(app)
print(json.dumps(client.get("/health").json(), indent=2))
shutdown()
