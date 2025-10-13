"""
Test script for AI integration
Tests Claude service, prompt service, and cache layer
"""

import asyncio
from services.claude_service import claude_service
from services.prompt_service import prompt_service
from services.cache_service import cache_service

async def test_prompt_service():
    """Test prompt service loading and formatting"""
    print("\n" + "="*60)
    print("🧪 Testing Prompt Service")
    print("="*60)

    # Test system prompt loading
    code_reviewer_prompt = prompt_service.get_system_prompt("code_reviewer")
    print(f"\n✅ Code Reviewer Prompt: {code_reviewer_prompt[:100]}...")

    # Test token counting
    test_text = "Hello world, this is a test"
    token_count = prompt_service.count_tokens(test_text)
    print(f"✅ Token count for '{test_text}': {token_count} tokens")

    # Test prompt formatting
    formatted = prompt_service.format_prompt(
        "code_review",
        language="python",
        filename="test.py",
        code="def hello():\n    print('Hello')"
    )
    print(f"✅ Formatted prompt: {formatted[:150]}...")

    # Test compression
    long_prompt = """
    This is a very long prompt with lots of unnecessary whitespace    and formatting.


    It has multiple blank lines.

    And some **bold** and *italic* text that needs to be cleaned up.

    Review Objectives:
    1. First objective
    2. Second objective
    3. Third objective
    """
    compressed = prompt_service.compress_prompt(long_prompt)
    print(f"\n✅ Compression test:")
    print(f"   Original: {len(long_prompt)} chars, {prompt_service.count_tokens(long_prompt)} tokens")
    print(f"   Compressed: {len(compressed)} chars, {prompt_service.count_tokens(compressed)} tokens")

    # Test security filters
    unsafe_code = "API_KEY = 'sk-1234567890' \nSECRET_TOKEN = 'abc123'"
    security_result = prompt_service.check_security_filters(unsafe_code)
    print(f"\n✅ Security check: {security_result}")

    print("\n✅ Prompt Service tests completed!")

async def test_cache_service():
    """Test Redis cache layer"""
    print("\n" + "="*60)
    print("🧪 Testing Cache Service")
    print("="*60)

    # Connect to Redis
    await cache_service.connect()

    # Test cache set/get
    test_key = cache_service.generate_cache_key("test_prompt", "test_context")
    print(f"\n✅ Generated cache key: {test_key[:32]}...")

    # Set cache
    test_data = {
        "success": True,
        "content": "This is a test response",
        "tokens_used": {"total_tokens": 100}
    }
    await cache_service.set(test_key, test_data, ttl=60)
    print("✅ Data cached successfully")

    # Get from cache (should hit)
    cached = await cache_service.get(test_key)
    print(f"✅ Cache HIT: {cached}")

    # Get non-existent key (should miss)
    await cache_service.get("non_existent_key")

    # Get stats
    stats = await cache_service.get_stats()
    print(f"\n✅ Cache stats: {stats}")

    # Cleanup
    await cache_service.invalidate(test_key)
    await cache_service.disconnect()

    print("\n✅ Cache Service tests completed!")

async def test_claude_service():
    """Test Claude API integration (requires valid API key)"""
    print("\n" + "="*60)
    print("🧪 Testing Claude Service")
    print("="*60)

    # Test simple call (will fail if no API key, that's expected)
    print("\n⚠️ Attempting Claude API call (may fail without API key)...")

    try:
        result = await claude_service.call_claude(
            system_prompt="You are a helpful assistant.",
            user_message="Say 'Hello from Code Insight!' in one sentence.",
            max_tokens=50,
            temperature=0.7
        )

        if result.get("success"):
            print(f"✅ Claude API call successful!")
            print(f"   Response: {result.get('content')[:100]}")
            print(f"   Tokens used: {result.get('tokens_used')}")
            print(f"   Elapsed time: {result.get('elapsed_time')}s")
        else:
            print(f"❌ Claude API call failed: {result.get('error')}")
            print(f"   Error type: {result.get('error_type')}")

    except Exception as e:
        print(f"❌ Exception during Claude call: {e}")

    print("\n✅ Claude Service tests completed!")

async def test_end_to_end():
    """Test complete end-to-end flow"""
    print("\n" + "="*60)
    print("🧪 Testing End-to-End Integration")
    print("="*60)

    # Connect cache
    await cache_service.connect()

    # Sample code for review
    sample_code = """
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total = total + num
    return total
"""

    print("\n📝 Sample code to review:")
    print(sample_code)

    # Generate cache key
    cache_key = cache_service.generate_cache_key(
        prompt="code_review_python",
        context=sample_code
    )

    # Check cache first
    cached_result = await cache_service.get(cache_key)
    if cached_result:
        print("✅ Found in cache!")
    else:
        print("❌ Not in cache, would call Claude API")

    # Get token budget for user
    lite_budget = prompt_service.get_token_budget("lite")
    pro_budget = prompt_service.get_token_budget("pro")
    print(f"\n✅ Token budgets:")
    print(f"   Lite: {lite_budget:,} tokens/month")
    print(f"   Pro: {pro_budget:,} tokens/month")

    # Cleanup
    await cache_service.disconnect()

    print("\n✅ End-to-end integration tests completed!")

async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🚀 Starting AI Integration Tests")
    print("="*60)

    try:
        # Test each component
        await test_prompt_service()
        await test_cache_service()
        await test_claude_service()
        await test_end_to_end()

        print("\n" + "="*60)
        print("✅ All tests completed!")
        print("="*60)

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
