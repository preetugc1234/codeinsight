import requests
import json
from typing import Dict, Any, List
from config import settings

class ClaudeService:
    """
    Service for interacting with Claude Sonnet 4.5 via OpenRouter
    """

    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.model = settings.claude_model
        self.url = settings.openrouter_url

    async def call_claude(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 4096
    ) -> Dict[str, Any]:
        """
        Make a request to Claude API via OpenRouter
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://codeinsight.ai",
            "X-Title": "Code Insight",
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            "max_tokens": max_tokens,
            "temperature": 0.7
        }

        try:
            response = requests.post(
                self.url,
                headers=headers,
                data=json.dumps(payload),
                timeout=60
            )
            response.raise_for_status()

            result = response.json()
            return {
                "success": True,
                "content": result["choices"][0]["message"]["content"],
                "tokens_used": result.get("usage", {})
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def code_review(self, code: str, language: str, filename: str) -> Dict[str, Any]:
        """
        Perform code review using Claude
        """
        system_prompt = """You are an expert senior software reviewer focused on code correctness, performance, and maintainability.
Analyze only the provided snippet. Avoid reprinting unchanged code. Suggest only critical improvements.

OUTPUT FORMAT (concise):
- ✅ Issues Found:
- ⚙️ Improvements:
- 💡 Example Fix (short patch only if required):"""

        user_message = f"""
Language: {language}
File Name: {filename}
Code Snippet:
```{language}
{code}
```

REVIEW OBJECTIVES:
1. Detect syntax or logical errors.
2. Suggest micro-optimizations.
3. Ensure clean structure and consistent naming.
4. Identify scalability or security risks.
"""

        return await self.call_claude(system_prompt, user_message)

    async def debug_doctor(self, filename: str, code: str, error_log: str) -> Dict[str, Any]:
        """
        Debug Doctor - analyze and fix errors
        """
        system_prompt = """You are "Debug Doctor" — a professional system troubleshooter.
Given a file or error trace, identify the root cause and provide a minimal working fix.
Never rewrite full code unless necessary.

OUTPUT (precise & short):
- 🧩 Root Cause:
- 🔍 Explanation (2 lines max):
- 🧠 Fix (only changed lines or logic summary):
- ✅ Verification Steps:"""

        user_message = f"""
File name: {filename}
Code context:
```
{code}
```

Error message/log:
```
{error_log}
```
"""

        return await self.call_claude(system_prompt, user_message, max_tokens=2048)

claude_service = ClaudeService()
