import requests
import json
import time
import hashlib
from typing import Dict, Any, List, Optional
from config import settings
import asyncio
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)

class ClaudeService:
    """
    Service for interacting with Claude Sonnet 4.5 via OpenRouter
    With retry logic, timeout handling, and error management
    """

    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.model = settings.claude_model
        self.url = settings.openrouter_url
        self.timeout = 30  # 30 seconds timeout as per requirements
        self.max_retries = 3

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((requests.exceptions.Timeout, requests.exceptions.ConnectionError))
    )
    async def call_claude(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 4096,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Make a request to Claude API via OpenRouter with retry logic

        Args:
            system_prompt: System instructions for Claude
            user_message: User's message/code to analyze
            max_tokens: Maximum tokens in response
            temperature: Creativity level (0.0-1.0)

        Returns:
            Dict with success status, content, and token usage
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://codeinsight4.vercel.app",
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
            "temperature": temperature
        }

        start_time = time.time()

        try:
            # Use asyncio to run in thread pool for async compatibility
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: requests.post(
                    self.url,
                    headers=headers,
                    json=payload,
                    timeout=self.timeout
                )
            )

            elapsed_time = time.time() - start_time
            response.raise_for_status()

            result = response.json()

            # Extract content and usage
            content = result["choices"][0]["message"]["content"]
            usage = result.get("usage", {})

            return {
                "success": True,
                "content": content,
                "tokens_used": {
                    "prompt_tokens": usage.get("prompt_tokens", 0),
                    "completion_tokens": usage.get("completion_tokens", 0),
                    "total_tokens": usage.get("total_tokens", 0)
                },
                "model": self.model,
                "elapsed_time": round(elapsed_time, 2)
            }

        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Request timed out after 30 seconds",
                "error_type": "timeout"
            }

        except requests.exceptions.ConnectionError as e:
            return {
                "success": False,
                "error": f"Connection error: {str(e)}",
                "error_type": "connection_error"
            }

        except requests.exceptions.HTTPError as e:
            error_message = str(e)
            try:
                error_data = e.response.json()
                error_message = error_data.get("error", {}).get("message", str(e))
            except:
                pass

            return {
                "success": False,
                "error": error_message,
                "error_type": "http_error",
                "status_code": e.response.status_code if e.response else None
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "error_type": "unexpected_error"
            }

    def generate_cache_key(self, system_prompt: str, user_message: str) -> str:
        """
        Generate cache key from prompt + context hash
        """
        combined = f"{system_prompt}||{user_message}"
        return hashlib.sha256(combined.encode()).hexdigest()

    async def code_review(self, code: str, language: str, filename: str) -> Dict[str, Any]:
        """
        Perform code review using Claude
        Uses system_brain prompts for consistency
        """
        from services.prompt_service import prompt_service

        system_prompt = prompt_service.get_system_prompt("code_reviewer")
        user_message = prompt_service.format_prompt(
            "code_review",
            language=language,
            filename=filename,
            code=code
        )

        return await self.call_claude(
            system_prompt,
            user_message,
            max_tokens=2048,
            temperature=0.7
        )

    async def debug_doctor(self, filename: str, code: str, error_log: str) -> Dict[str, Any]:
        """
        Debug Doctor - analyze and fix errors
        Uses system_brain prompts for consistency
        """
        from services.prompt_service import prompt_service

        system_prompt = prompt_service.get_system_prompt("debug_doctor")
        user_message = prompt_service.format_prompt(
            "debug",
            filename=filename,
            code=code,
            error_log=error_log
        )

        return await self.call_claude(
            system_prompt,
            user_message,
            max_tokens=2048,
            temperature=0.5
        )

    async def generate_architecture(
        self,
        user_request: str,
        stack: str,
        scale: str,
        database: str
    ) -> Dict[str, Any]:
        """
        Generate system architecture design
        Uses system_brain prompts for consistency
        """
        from services.prompt_service import prompt_service

        system_prompt = prompt_service.get_system_prompt("architecture_generator")
        user_message = prompt_service.format_prompt(
            "architecture",
            user_request=user_request,
            stack=stack,
            scale=scale,
            database=database
        )

        return await self.call_claude(
            system_prompt,
            user_message,
            max_tokens=4096,
            temperature=0.8
        )

claude_service = ClaudeService()
