#!/usr/bin/env python3
"""
Test script to verify LLM integration is working
"""

import asyncio

import httpx


async def test_llm_integration():
    async with httpx.AsyncClient() as client:
        # Test health endpoint
        print("🔍 Testing health endpoint...")
        response = await client.get("http://127.0.0.1:8000/health")
        print(f"Health status: {response.status_code}")
        print(f"Response: {response.json()}")
        print()

        # Test models endpoint
        print("🔍 Testing models endpoint...")
        response = await client.get("http://127.0.0.1:8000/api/models")
        print(f"Models status: {response.status_code}")
        models = response.json()
        print(f"Found {len(models)} models:")
        for model in models:
            print(f"  - {model['name']} ({model['provider']})")
        print()

        # Test chat completion with first available model
        if models:
            test_model = models[0]["id"]
            print(f"🔍 Testing chat completion with model: {test_model}")

            chat_request = {
                "messages": [
                    {
                        "role": "user",
                        "content": "Hello! Can you tell me about yourself in one sentence?",
                    }
                ],
                "model": test_model,
            }

            response = await client.post(
                "http://127.0.0.1:8000/api/chat", json=chat_request, timeout=60.0
            )

            print(f"Chat status: {response.status_code}")
            if response.status_code == 200:
                chat_response = response.json()
                print(f"Model used: {chat_response['model']}")
                print(
                    f"Provider: {chat_response.get('context', {}).get('provider', 'unknown')}"
                )
                print(f"Response: {chat_response['message']['content']}")
                print(f"Tokens: {chat_response['tokens']}")
            else:
                print(f"Error: {response.text}")
        else:
            print("❌ No models available to test")


if __name__ == "__main__":
    print("🚀 Testing Open-Deep-Coder LLM Integration")
    print("=" * 50)
    asyncio.run(test_llm_integration())
