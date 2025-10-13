from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # OpenRouter / Claude - MUST be set via environment variables
    openrouter_api_key: str
    claude_model: str = "anthropic/claude-sonnet-4.5"
    openrouter_url: str = "https://openrouter.ai/api/v1/chat/completions"

    # Supabase - MUST be set via environment variables
    supabase_url: str
    supabase_service_key: str

    # MongoDB - MUST be set via environment variables
    mongodb_uri: str
    mongodb_db: str = "codeinsight"

    # Redis - MUST be set via environment variables
    redis_url: str

    # Rate Limiting (defaults, can be overridden)
    token_budget_lite: int = 200000
    token_budget_pro: int = 500000
    token_budget_business: int = 4000000

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
