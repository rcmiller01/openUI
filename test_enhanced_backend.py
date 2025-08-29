#!/usr/bin/env python3
"""
Test script for Enhanced Open-Deep-Coder Backend

Tests all advanced integrations including LSP, MCP, n8n, debugging,
and tool discovery capabilities.
"""

import asyncio

import httpx


async def test_enhanced_backend():
    """Test all enhanced backend capabilities"""
    base_url = "http://127.0.0.1:8000"

    async with httpx.AsyncClient() as client:
        print("🚀 Testing Enhanced Open-Deep-Coder Backend")
        print("=" * 60)

        # Test health check with enhanced capabilities
        print("\n🔍 Testing Enhanced Health Check...")
        try:
            response = await client.get(f"{base_url}/health")
            if response.status_code == 200:
                health_data = response.json()
                print(f"✅ Backend Status: {health_data['status']}")
                print("📊 Services:")
                for service, status in health_data.get("services", {}).items():
                    status_icon = "✅" if status else "❌"
                    print(f"   {status_icon} {service}: {status}")

                print("🎯 Enhanced Capabilities:")
                for capability, enabled in health_data.get("capabilities", {}).items():
                    cap_icon = "✅" if enabled else "❌"
                    print(f"   {cap_icon} {capability}: {enabled}")
            else:
                print(f"❌ Health check failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Health check error: {e}")

        # Test Integration Status
        print("\n🔍 Testing Integration Status...")
        try:
            response = await client.get(f"{base_url}/api/dev/test-integrations")
            if response.status_code == 200:
                integrations = response.json()
                print("📊 Integration Status:")
                for integration, data in integrations.items():
                    status_icon = "✅" if data.get("status") == "available" else "❌"
                    print(
                        f"   {status_icon} {integration.upper()}: {data.get('status', 'unknown')}"
                    )

                    # Show detailed info for available integrations
                    if data.get("status") == "available":
                        if "servers_count" in data:
                            print(f"      📈 Servers: {data['servers_count']}")
                        if "tools_count" in data:
                            print(f"      🔧 Tools: {data['tools_count']}")
                        if "workflows_count" in data:
                            print(f"      🔄 Workflows: {data['workflows_count']}")
                        if "sessions_count" in data:
                            print(f"      🐛 Debug Sessions: {data['sessions_count']}")
                        if "agents_count" in data:
                            print(f"      🤖 Agents: {data['agents_count']}")
            else:
                print(f"❌ Integration test failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Integration test error: {e}")

        # Test Tool Discovery
        print("\n🔍 Testing Tool Discovery...")
        try:
            response = await client.get(f"{base_url}/api/tools")
            if response.status_code == 200:
                tools = response.json()
                print(f"✅ Found {len(tools)} tools")

                # Group tools by category
                categories = {}
                for tool in tools:
                    tool_type = tool["type"]
                    if tool_type not in categories:
                        categories[tool_type] = []
                    categories[tool_type].append(tool["name"])

                for category, tool_names in categories.items():
                    print(f"   📦 {category.upper()}: {len(tool_names)} tools")
                    for tool_name in tool_names[:3]:  # Show first 3 tools
                        print(f"      - {tool_name}")
                    if len(tool_names) > 3:
                        print(f"      ... and {len(tool_names) - 3} more")

            else:
                print(f"❌ Tool discovery failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Tool discovery error: {e}")

        # Test Tool Analytics
        print("\n🔍 Testing Tool Analytics...")
        try:
            response = await client.get(f"{base_url}/api/tools/analytics")
            if response.status_code == 200:
                analytics = response.json()
                print("✅ Tool Analytics:")
                print(f"   📊 Total Tools: {analytics.get('total_tools', 0)}")
                print(f"   🎯 Total Usages: {analytics.get('total_usages', 0)}")
                print("   📈 By Category:")
                for category, count in analytics.get("by_category", {}).items():
                    print(f"      - {category}: {count}")
            else:
                print(f"❌ Tool analytics failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Tool analytics error: {e}")

        # Test Enhanced Coordination
        print("\n🔍 Testing Enhanced Coordination...")
        try:
            response = await client.get(f"{base_url}/api/coordination/status")
            if response.status_code == 200:
                coordination = response.json()
                agents = coordination.get("agents", [])
                metrics = coordination.get("metrics", {})

                print("✅ Enhanced Coordination Status:")
                print(f"   🤖 Agents: {len(agents)}")
                print("   📊 System Metrics:")
                print(f"      - Total Tasks: {metrics.get('total_tasks', 0)}")
                print(f"      - Completed: {metrics.get('completed_tasks', 0)}")
                print(f"      - Running: {metrics.get('running_tasks', 0)}")
                print(f"      - Success Rate: {metrics.get('success_rate', 0):.2%}")
            else:
                print(f"❌ Coordination test failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Coordination test error: {e}")

        # Test LLM Integration (if available)
        print("\n🔍 Testing LLM Integration...")
        try:
            response = await client.get(f"{base_url}/api/dev/test-llm")
            if response.status_code == 200:
                llm_test = response.json()
                if llm_test.get("status") == "success":
                    print("✅ LLM Test Successful:")
                    print(f"   🤖 Model: {llm_test.get('model_used', 'unknown')}")
                    print(f"   💬 Response: {llm_test.get('response', '')[:100]}...")
                    print(f"   🔢 Tokens: {llm_test.get('tokens', 0)}")
                else:
                    print(f"❌ LLM Test Failed: {llm_test.get('error', 'unknown')}")
            else:
                print(f"❌ LLM test failed: {response.status_code}")
        except Exception as e:
            print(f"❌ LLM test error: {e}")

        # Test Available Models
        print("\n🔍 Testing Available Models...")
        try:
            response = await client.get(f"{base_url}/api/models")
            if response.status_code == 200:
                models = response.json()
                print(f"✅ Found {len(models)} available models")

                # Group by provider
                providers = {}
                for model in models:
                    provider = model.get("provider", "unknown")
                    if provider not in providers:
                        providers[provider] = []
                    providers[provider].append(model["name"])

                for provider, model_names in providers.items():
                    print(f"   🏢 {provider.upper()}: {len(model_names)} models")

            else:
                print(f"❌ Models test failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Models test error: {e}")

        print("\n" + "=" * 60)
        print("🎯 Enhanced Backend Test Complete!")
        print("✨ Open-Deep-Coder is ready with advanced capabilities!")


if __name__ == "__main__":
    print("🚀 Starting Enhanced Open-Deep-Coder Backend Test")
    asyncio.run(test_enhanced_backend())
