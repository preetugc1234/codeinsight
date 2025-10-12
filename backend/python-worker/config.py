from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # OpenRouter / Claude
    openrouter_api_key: str = "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"
    claude_model: str = "anthropic/claude-sonnet-4.5"
    openrouter_url: str = "https://openrouter.ai/api/v1/chat/completions"

    # Supabase
    supabase_url: str = "https://cblgjjbpfpimrrpjlkhp.supabase.co"
    supabase_service_key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibGdqamJwZnBpbXJycGpsa2hwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIzODI1MSwiZXhwIjoyMDc1ODE0MjUxfQ.NRyx6fnUD4B3z4hwbVH1AWKGUI5BRld21RS_kawprJ4"

    # MongoDB
    mongodb_uri: str = "mongodb+srv://Preet1234:Preet1246@ugc.qqqbt5d.mongodb.net/?retryWrites=true&w=majority&appName=UGC"
    mongodb_db: str = "codeinsight"

    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_password: Optional[str] = None

    # Rate Limiting
    token_budget_lite: int = 200000
    token_budget_pro: int = 500000
    token_budget_business: int = 4000000

    class Config:
        env_file = ".env"

settings = Settings()
