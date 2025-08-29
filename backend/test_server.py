"""
Simple test server for Open-Deep-Coder backend
"""

import os
from datetime import datetime
from typing import Any

# Load environment variables
try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    # dotenv not installed, read .env manually
    env_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"
    )
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    os.environ[key] = value


import httpx
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# Simple data models
class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime | None = None
    model: str | None = None
    tokens: int | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str | None = None
    stream: bool = False
    context: dict[str, Any] | None = None


class ChatResponse(BaseModel):
    message: ChatMessage
    model: str
    tokens: int
    finish_reason: str
    context: dict[str, Any] | None = None


class LLMModel(BaseModel):
    id: str
    name: str
    provider: str
    capabilities: list[str]
    context_length: int
    is_available: bool


# Create FastAPI app
app = FastAPI(
    title="Open-Deep-Coder API",
    description="Agentic IDE with multi-agent coding workflow",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "http://127.0.0.1:1420"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# HTTP clients
httpx_client = httpx.AsyncClient(timeout=30.0)


# Mock data with real model detection
async def get_available_models():
    models = []

    # Check Ollama models
    try:
        response = await httpx_client.get(f"{OLLAMA_BASE_URL}/api/tags")
        if response.status_code == 200:
            data = response.json()
            for model_data in data.get("models", []):
                models.append(
                    LLMModel(
                        id=model_data["name"],
                        name=model_data["name"],
                        provider="ollama",
                        capabilities=["chat", "completion"],
                        context_length=4096,
                        is_available=True,
                    )
                )
    except Exception as e:
        print(f"Could not connect to Ollama at {OLLAMA_BASE_URL}: {e}")

    # Check OpenRouter models if API key is available
    if OPENROUTER_API_KEY:
        try:
            response = await httpx_client.get(
                "https://openrouter.ai/api/v1/models",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "https://github.com/rcmiller01/openUI",
                    "X-Title": "Open-Deep-Coder",
                },
            )
            if response.status_code == 200:
                data = response.json()
                for model_data in data.get("data", [])[:10]:  # Limit to first 10 models
                    models.append(
                        LLMModel(
                            id=model_data["id"],
                            name=model_data.get("name", model_data["id"]),
                            provider="openrouter",
                            capabilities=["chat", "completion"],
                            context_length=model_data.get("context_length", 4096),
                            is_available=True,
                        )
                    )
        except Exception as e:
            print(f"Could not connect to OpenRouter: {e}")

    # Fallback mock models if no real ones available
    if not models:
        models = [
            LLMModel(
                id="mock-gpt-3.5-turbo",
                name="GPT-3.5 Turbo (Mock)",
                provider="openrouter",
                capabilities=["chat", "completion"],
                context_length=4096,
                is_available=True,
            ),
            LLMModel(
                id="mock-llama2:7b",
                name="Llama 2 7B (Mock)",
                provider="ollama",
                capabilities=["chat", "completion"],
                context_length=2048,
                is_available=True,
            ),
        ]

    return models


mock_models = []


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0",
        "services": {"llm_manager": True, "agent_manager": True, "file_system": True},
    }


@app.get("/api/models", response_model=list[LLMModel])
async def get_available_models_endpoint():
    global mock_models
    if not mock_models:
        mock_models = await get_available_models()
    return mock_models


@app.post("/api/chat", response_model=ChatResponse)
async def chat_completion(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    last_message = request.messages[-1].content

    # Try to use real LLM if model is specified and available
    if request.model:
        global mock_models
        if not mock_models:
            mock_models = await get_available_models()

        # Find the model
        selected_model = None
        for model in mock_models:
            if model.id == request.model:
                selected_model = model
                break

        if selected_model:
            # Try real LLM call
            try:
                if selected_model.provider == "ollama":
                    # Ollama API call
                    ollama_messages = [
                        {"role": msg.role, "content": msg.content}
                        for msg in request.messages
                    ]
                    response = await httpx_client.post(
                        f"{OLLAMA_BASE_URL}/api/chat",
                        json={
                            "model": selected_model.id,
                            "messages": ollama_messages,
                            "stream": False,
                        },
                    )
                    if response.status_code == 200:
                        data = response.json()
                        response_content = data["message"]["content"]

                        response_message = ChatMessage(
                            role="assistant",
                            content=response_content,
                            timestamp=datetime.now(),
                            model=selected_model.id,
                            tokens=len(response_content.split()),
                        )

                        return ChatResponse(
                            message=response_message,
                            model=selected_model.id,
                            tokens=len(response_content.split()),
                            finish_reason="stop",
                            context={"provider": "ollama"},
                        )

                elif selected_model.provider == "openrouter" and OPENROUTER_API_KEY:
                    # OpenRouter API call
                    openai_messages = [
                        {"role": msg.role, "content": msg.content}
                        for msg in request.messages
                    ]
                    response = await httpx_client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                            "HTTP-Referer": "https://github.com/rcmiller01/openUI",
                            "X-Title": "Open-Deep-Coder",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": selected_model.id,
                            "messages": openai_messages,
                            "max_tokens": 2000,
                            "temperature": 0.7,
                        },
                    )
                    if response.status_code == 200:
                        data = response.json()
                        choice = data["choices"][0]
                        response_content = choice["message"]["content"]

                        response_message = ChatMessage(
                            role="assistant",
                            content=response_content,
                            timestamp=datetime.now(),
                            model=selected_model.id,
                            tokens=data.get("usage", {}).get(
                                "total_tokens", len(response_content.split())
                            ),
                        )

                        return ChatResponse(
                            message=response_message,
                            model=selected_model.id,
                            tokens=data.get("usage", {}).get(
                                "total_tokens", len(response_content.split())
                            ),
                            finish_reason=choice.get("finish_reason", "stop"),
                            context={"provider": "openrouter"},
                        )

            except Exception as e:
                print(f"LLM API call failed: {e}")
                # Fall through to mock response

    # Fallback to mock response
    response_content = f"I understand you said: '{last_message}'. This is a response from Open-Deep-Coder. Your Ollama server is at {OLLAMA_BASE_URL} and OpenRouter is {'configured' if OPENROUTER_API_KEY else 'not configured'}. The system is working!"

    response_message = ChatMessage(
        role="assistant",
        content=response_content,
        timestamp=datetime.now(),
        model=request.model or "mock-model",
        tokens=len(response_content.split()),
    )

    return ChatResponse(
        message=response_message,
        model=request.model or "mock-model",
        tokens=len(response_content.split()),
        finish_reason="stop",
        context={"provider": "mock"},
    )


@app.get("/api/files")
async def list_files(path: str = "."):
    try:
        abs_path = os.path.abspath(path)
        if not os.path.exists(abs_path):
            raise HTTPException(status_code=404, detail="Path not found")

        items = []
        for item in os.listdir(abs_path):
            item_path = os.path.join(abs_path, item)
            stat = os.stat(item_path)

            items.append(
                {
                    "path": item_path,
                    "name": item,
                    "size": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime),
                    "is_directory": os.path.isdir(item_path),
                    "permissions": (
                        ["read", "write"] if os.access(item_path, os.W_OK) else ["read"]
                    ),
                }
            )

        return items
    except Exception as e:
        # If an HTTPException was raised intentionally, re-raise it so the
        # correct status code is returned instead of wrapping it as 500.
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/api/files/content")
async def get_file_content(path: str):
    try:
        abs_path = os.path.abspath(path)
        if not os.path.exists(abs_path) or os.path.isdir(abs_path):
            raise HTTPException(status_code=404, detail="File not found")

        with open(abs_path, encoding="utf-8") as f:
            content = f.read()

        stat = os.stat(abs_path)

        return {
            "path": abs_path,
            "content": content,
            "encoding": "utf-8",
            "modified": datetime.fromtimestamp(stat.st_mtime),
        }
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File is not a text file")
    except Exception as e:
        # Preserve deliberately raised HTTPExceptions
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e)) from e


if __name__ == "__main__":
    import atexit

    # Cleanup HTTP client on exit
    def cleanup():
        import asyncio

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(httpx_client.aclose())
            else:
                asyncio.run(httpx_client.aclose())
        except Exception as e:
            # best-effort: log and continue cleanup
            print(f"Error closing httpx client: {e}")

    atexit.register(cleanup)

    uvicorn.run(
        "test_server:app", host="127.0.0.1", port=8000, reload=True, log_level="info"
    )
