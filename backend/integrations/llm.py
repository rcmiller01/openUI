"""
LLM Manager for Open-Deep-Coder

Handles integration with both remote (OpenRouter) and local (Ollama) LLM providers.
Includes intelligent routing based on task type using RouteLLM concepts.
"""

import logging
import os
import re
from datetime import datetime
from typing import Any

import httpx

from ..api.models import ChatMessage, ChatResponse, LLMModel

logger = logging.getLogger(__name__)


class LLMManager:
    """Manages LLM integrations and routing"""

    def __init__(self):
        self.openrouter_client: httpx.AsyncClient | None = None
        self.ollama_client: httpx.AsyncClient | None = None
        self.available_models: list[LLMModel] = []
        self.is_initialized = False

        # API keys and endpoints
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.openrouter_base_url = "https://openrouter.ai/api/v1"
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

        # Model routing configuration
        self.task_model_mapping = {
            "code": ["claude-3-sonnet", "gpt-4", "codellama:34b"],
            "planning": ["gpt-4", "claude-3-opus", "llama2:70b"],
            "documentation": ["gpt-3.5-turbo", "claude-3-haiku", "llama2:13b"],
            "review": ["claude-3-opus", "gpt-4", "mistral:7b"],
            "chat": ["gpt-3.5-turbo", "claude-3-haiku", "llama2:7b"],
        }

    async def initialize(self) -> None:
        """Initialize LLM clients and discover available models"""
        logger.info("Initializing LLM Manager...")

        # Initialize HTTP clients
        self.openrouter_client = httpx.AsyncClient(
            base_url=self.openrouter_base_url,
            headers=(
                {
                    "Authorization": f"Bearer {self.openrouter_api_key}",
                    "HTTP-Referer": "https://github.com/rcmiller01/openUI",
                    "X-Title": "Open-Deep-Coder",
                }
                if self.openrouter_api_key
                else {}
            ),
            timeout=30.0,
        )

        self.ollama_client = httpx.AsyncClient(
            base_url=self.ollama_base_url, timeout=30.0
        )

        # Discover available models
        await self._discover_models()

        self.is_initialized = True
        logger.info(f"LLM Manager initialized with {len(self.available_models)} models")

    def _parse_size_to_int(self, value: Any, default: int = 4096) -> int:
        """Robustly parse numeric or suffixed sizes like '8.0B', '13B', '4096'.

        Returns an integer. Falls back to `default` on failure.
        """
        if value is None:
            return default
        # If it's already an int, return it
        if isinstance(value, int):
            return value
        # If it's a float-like number, cast to int
        if isinstance(value, float):
            try:
                return int(value)
            except Exception:
                return default

        # Handle strings like '8.0B', '70B', '13B', '8192'
        if isinstance(value, str):
            s = value.strip()
            # plain integer string
            if s.isdigit():
                try:
                    return int(s)
                except Exception:
                    return default

            m = re.match(r"^([\d\.]+)\s*([kKmMbB]?)$", s)
            if m:
                try:
                    num = float(m.group(1))
                except Exception:
                    return default
                suf = m.group(2).upper()
                mult = 1
                if suf == "B":
                    mult = 1_000_000_000
                elif suf == "M":
                    mult = 1_000_000
                elif suf == "K":
                    mult = 1_000
                # Prevent absurdly large values – cap to a reasonable max
                try:
                    val = int(num * mult)
                    return max(1, min(val, 2**31 - 1))
                except Exception:
                    return default

        # Last resort: try converting directly
        try:
            return int(value)
        except Exception:
            return default

    async def cleanup(self) -> None:
        """Cleanup HTTP clients"""
        if self.openrouter_client:
            await self.openrouter_client.aclose()
        if self.ollama_client:
            await self.ollama_client.aclose()

    def is_ready(self) -> bool:
        """Check if the manager is ready to handle requests"""
        return self.is_initialized and len(self.available_models) > 0

    async def _discover_models(self) -> None:
        """Discover available models from all providers"""
        models = []

        # Discover OpenRouter models
        if self.openrouter_api_key:
            try:
                openrouter_models = await self._get_openrouter_models()
                models.extend(openrouter_models)
                logger.info(f"Found {len(openrouter_models)} OpenRouter models")
            except Exception as e:
                logger.warning(f"Failed to fetch OpenRouter models: {e}")

        # Discover Ollama models
        try:
            ollama_models = await self._get_ollama_models()
            models.extend(ollama_models)
            logger.info(f"Found {len(ollama_models)} Ollama models")
        except Exception as e:
            logger.warning(f"Failed to fetch Ollama models: {e}")

        self.available_models = models

    async def _get_openrouter_models(self) -> list[LLMModel]:
        """Get available models from OpenRouter"""
        if not self.openrouter_client or not self.openrouter_api_key:
            return []

        try:
            response = await self.openrouter_client.get("/models")
            response.raise_for_status()
            data = response.json()

            models = []
            for model_data in data.get("data", []):
                model = LLMModel(
                    id=model_data["id"],
                    name=model_data.get("name", model_data["id"]),
                    provider="openrouter",
                    capabilities=["chat", "completion"],
                    context_length=model_data.get("context_length", 4096),
                    is_available=True,
                    description=model_data.get("description"),
                    pricing=model_data.get("pricing"),
                )
                models.append(model)

            return models
        except Exception as e:
            logger.error(f"Error fetching OpenRouter models: {e}")
            return []

    async def _get_ollama_models(self) -> list[LLMModel]:
        """Get available models from Ollama"""
        if not self.ollama_client:
            return []

        try:
            response = await self.ollama_client.get("/api/tags")
            if response.status_code != 200:
                return []

            data = response.json()
            models = []

            for model_data in data.get("models", []):
                raw_ctx = (
                    model_data.get("details", {}).get("parameter_size")
                    or model_data.get("context_length")
                    or 4096
                )
                context_length = self._parse_size_to_int(raw_ctx, default=4096)

                model = LLMModel(
                    id=model_data["name"],
                    name=model_data["name"],
                    provider="ollama",
                    capabilities=["chat", "completion"],
                    context_length=context_length,
                    is_available=True,
                    description=f"Local model: {model_data['name']}",
                )
                models.append(model)

            return models
        except Exception as e:
            logger.error(f"Error fetching Ollama models: {e}")
            return []

    async def get_available_models(self) -> list[LLMModel]:
        """Get all available models"""
        return self.available_models

    def classify_request(
        self, messages: list[Any], context: dict[str, Any] | None = None
    ) -> str:
        """Classify the request type for optimal model routing

        Accepts ChatMessage objects or plain dicts and falls back to stringifying
        unknown formats.
        """
        if not messages:
            return "chat"

        last = messages[-1]
        if isinstance(last, ChatMessage):
            last_message = last.content.lower()
        elif isinstance(last, dict):
            last_message = str(last.get("content", "")).lower()
        else:
            last_message = str(last).lower()

        # Simple keyword-based classification (can be enhanced with ML)
        if any(
            keyword in last_message
            for keyword in ["code", "function", "class", "debug", "implement"]
        ):
            return "code"
        elif any(
            keyword in last_message
            for keyword in ["plan", "design", "architecture", "strategy"]
        ):
            return "planning"
        elif any(
            keyword in last_message
            for keyword in ["document", "explain", "describe", "write"]
        ):
            return "documentation"
        elif any(
            keyword in last_message
            for keyword in ["review", "check", "analyze", "security"]
        ):
            return "review"
        else:
            return "chat"

    def select_optimal_model(
        self, task_type: str, prefer_local: bool = False
    ) -> str | None:
        """Select the optimal model for a given task type"""
        preferred_models = self.task_model_mapping.get(task_type, ["gpt-3.5-turbo"])

        # Filter available models
        available_model_ids = [m.id for m in self.available_models if m.is_available]

        # Prefer local models if requested
        if prefer_local:
            local_models = [
                m.id
                for m in self.available_models
                if m.provider == "ollama" and m.is_available
            ]
            for model_id in preferred_models:
                if any(model_id in local_id for local_id in local_models):
                    return next(
                        local_id for local_id in local_models if model_id in local_id
                    )

        # Fallback to any available model from preferred list
        for model_id in preferred_models:
            if model_id in available_model_ids:
                return model_id
            # Partial matching for model families
            for available_id in available_model_ids:
                if model_id.split(":")[0] in available_id:
                    return available_id

        # Last resort: return first available model
        return available_model_ids[0] if available_model_ids else None

    async def chat_completion(
        self,
        messages: list[Any],
        model: str | None = None,
        stream: bool = False,
        context: dict[str, Any] | None = None,
        **kwargs,
    ) -> ChatResponse:
        """Handle chat completion request with automatic model routing"""

        # Normalize messages: accept either ChatMessage objects or plain dicts
        normalized_messages: list[ChatMessage] = []
        for msg in messages:
            if isinstance(msg, ChatMessage):
                normalized_messages.append(msg)
            elif isinstance(msg, dict):
                normalized_messages.append(
                    ChatMessage(
                        role=msg.get("role", "user"),
                        content=msg.get("content", ""),
                        timestamp=datetime.now(),
                        model=msg.get("model"),
                    )
                )
            else:
                normalized_messages.append(
                    ChatMessage(role="user", content=str(msg), timestamp=datetime.now())
                )

        # Auto-select model if not specified
        if not model:
            task_type = self.classify_request(normalized_messages, context)
            prefer_local = context.get("prefer_local", False) if context else False
            model = self.select_optimal_model(task_type, prefer_local)

        if not model:
            raise ValueError("No suitable model available")

        # Find model info
        model_info = next((m for m in self.available_models if m.id == model), None)
        if not model_info:
            raise ValueError(f"Model {model} not available")

        # Route to appropriate provider
        if model_info.provider == "openrouter":
            return await self._openrouter_chat_completion(
                normalized_messages, model, stream, **kwargs
            )
        elif model_info.provider == "ollama":
            return await self._ollama_chat_completion(
                normalized_messages, model, stream, **kwargs
            )
        else:
            raise ValueError(f"Unsupported provider: {model_info.provider}")

    async def _openrouter_chat_completion(
        self,
        messages: list[ChatMessage],
        model: str,
        stream: bool = False,
        **kwargs: dict[str, Any],
    ) -> ChatResponse:
        """Handle OpenRouter chat completion"""
        if not self.openrouter_client:
            raise ValueError("OpenRouter client not initialized")

        if not self.openrouter_api_key:
            raise ValueError("OpenRouter API key not provided")

        # Convert messages to OpenAI format
        openai_messages = [
            {"role": msg.role, "content": msg.content} for msg in messages
        ]

        payload = {
            "model": model,
            "messages": openai_messages,
            "stream": stream,
            "max_tokens": kwargs.get("max_tokens", 2000),
            "temperature": kwargs.get("temperature", 0.7),
        }

        try:
            response = await self.openrouter_client.post(
                "/chat/completions", json=payload
            )
            response.raise_for_status()
            data = response.json()

            if "error" in data:
                err_msg = data["error"].get("message", "unknown error")
                raise Exception(f"OpenRouter API error: {err_msg}")

            choice = data["choices"][0]
            message_data = choice["message"]

            response_message = ChatMessage(
                role=message_data["role"],
                content=message_data["content"],
                timestamp=datetime.now(),
                model=model,
            )

            return ChatResponse(
                message=response_message,
                model=model,
                tokens=data.get("usage", {}).get("total_tokens", 0),
                finish_reason=choice.get("finish_reason", "stop"),
                context={"provider": "openrouter"},
            )

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise Exception("Invalid OpenRouter API key") from e
            elif e.response.status_code == 429:
                raise Exception("OpenRouter rate limit exceeded") from e
            elif e.response.status_code == 400:
                error_data = e.response.json()
                err_obj = error_data.get("error", {})
                invalid_msg = err_obj.get("message", str(e))
                raise Exception(f"Invalid request: {invalid_msg}") from e
            else:
                msg = f"OpenRouter API error ({e.response.status_code}): {e}"
                raise Exception(msg) from e
        except Exception as e:
            logger.error(f"OpenRouter chat completion error: {e}")
            raise

    async def _ollama_chat_completion(
        self,
        messages: list[ChatMessage],
        model: str,
        stream: bool = False,
        **kwargs: dict[str, Any],
    ) -> ChatResponse:
        """Handle Ollama chat completion"""
        if not self.ollama_client:
            raise ValueError("Ollama client not initialized")

        # Convert messages to Ollama format
        ollama_messages = [
            {"role": msg.role, "content": msg.content} for msg in messages
        ]

        payload = {
            "model": model,
            "messages": ollama_messages,
            "stream": stream,
            **kwargs,
        }

        try:
            response = await self.ollama_client.post("/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()

            message_data = data["message"]

            response_message = ChatMessage(
                role=message_data["role"],
                content=message_data["content"],
                timestamp=datetime.now(),
                model=model,
            )

            return ChatResponse(
                message=response_message,
                model=model,
                tokens=0,  # Ollama doesn't provide token counts
                finish_reason="stop",
            )

        except Exception as e:
            logger.error(f"Ollama chat completion error: {e}")
            raise
