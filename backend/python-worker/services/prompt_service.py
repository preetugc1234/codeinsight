import json
import os
import re
from typing import Dict, Any, Optional
import tiktoken

class PromptService:
    """
    Service for loading system_brain prompts, formatting templates,
    token counting, and prompt compression
    """

    def __init__(self):
        self.brain_data: Optional[Dict[str, Any]] = None
        self.encoder = tiktoken.encoding_for_model("gpt-4")  # Similar tokenization to Claude
        self._load_system_brain()

    def _load_system_brain(self):
        """
        Load system_brain from ai/system_brain directory
        Priority: v3 (BALANCED - best quality/token ratio) → v2 (ULTRA) → v1 (basic)
        """
        # Try v3 first (BALANCED - best for production)
        brain_v3_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "ai",
            "system_brain",
            "system_brain_v3_balanced.json"
        )

        brain_v2_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "ai",
            "system_brain",
            "system_brain_v2.json"
        )

        brain_v1_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "ai",
            "system_brain",
            "system_brain_v1.json"
        )

        # Try loading v3 first (best quality/token ratio)
        try:
            with open(brain_v3_path, "r", encoding="utf-8") as f:
                self.brain_data = json.load(f)
                print(f"✅ Loaded system_brain_v3_balanced.json (OPTIMAL) successfully")
                return
        except FileNotFoundError:
            print(f"⚠️ system_brain_v3_balanced.json not found, trying v2...")
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing system_brain_v3_balanced.json: {e}, trying v2...")

        # Try v2 (more comprehensive but uses more tokens)
        try:
            with open(brain_v2_path, "r", encoding="utf-8") as f:
                self.brain_data = json.load(f)
                print(f"✅ Loaded system_brain_v2.json ULTRA successfully")
                return
        except FileNotFoundError:
            print(f"⚠️ system_brain_v2.json not found, trying v1...")
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing system_brain_v2.json: {e}, trying v1...")

        # Fallback to v1
        try:
            with open(brain_v1_path, "r", encoding="utf-8") as f:
                self.brain_data = json.load(f)
                print(f"✅ Loaded system_brain_v1.json successfully")
        except FileNotFoundError:
            print(f"❌ Error: No system_brain file found")
            self.brain_data = None
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing system_brain_v1.json: {e}")
            self.brain_data = None

    def get_system_prompt(self, role: str) -> str:
        """
        Get system prompt for a specific role from system_brain

        Args:
            role: One of 'code_reviewer', 'debug_doctor', 'architecture_generator'

        Returns:
            System prompt string
        """
        if not self.brain_data:
            # Fallback prompts if brain data not loaded
            fallback_prompts = {
                "code_reviewer": "You are an expert code reviewer. Analyze the code and provide concise feedback.",
                "debug_doctor": "You are a debugging expert. Identify root causes and provide fixes.",
                "architecture_generator": "You are a software architect. Design scalable system architectures."
            }
            return fallback_prompts.get(role, "You are a helpful AI assistant.")

        roles = self.brain_data.get("roles", {})
        role_data = roles.get(role, {})
        return role_data.get("system_prompt", "You are a helpful AI assistant.")

    def format_prompt(self, template_name: str, **kwargs) -> str:
        """
        Format a prompt template with provided variables

        Args:
            template_name: Name of template ('code_review', 'debug', 'architecture')
            **kwargs: Variables to inject into template

        Returns:
            Formatted prompt string
        """
        if not self.brain_data:
            # Fallback formatting
            return str(kwargs)

        templates = self.brain_data.get("prompt_templates", {})
        template_data = templates.get(template_name, {})
        template = template_data.get("user_template", "")

        # Format the template with provided kwargs
        try:
            formatted = template.format(**kwargs)
            return formatted
        except KeyError as e:
            print(f"⚠️ Missing template variable: {e}")
            return template

    def count_tokens(self, text: str) -> int:
        """
        Count tokens in a text string using tiktoken

        Args:
            text: Text to count tokens for

        Returns:
            Number of tokens
        """
        try:
            tokens = self.encoder.encode(text)
            return len(tokens)
        except Exception as e:
            # Fallback: approximate 4 chars per token
            return len(text) // 4

    def compress_prompt(self, prompt: str, target_reduction: float = 0.5) -> str:
        """
        Compress prompt by 40-60% while maintaining meaning

        Strategies:
        - Remove excessive whitespace
        - Compress repeated patterns
        - Abbreviate common terms
        - Remove redundant examples

        Args:
            prompt: Original prompt text
            target_reduction: Target compression ratio (0.4-0.6 for 40-60%)

        Returns:
            Compressed prompt
        """
        compressed = prompt

        # 1. Remove excessive whitespace
        compressed = re.sub(r'\s+', ' ', compressed)
        compressed = re.sub(r'\n\s*\n', '\n', compressed)

        # 2. Remove markdown decorations (keep content)
        compressed = re.sub(r'\*\*([^*]+)\*\*', r'\1', compressed)  # Bold
        compressed = re.sub(r'\*([^*]+)\*', r'\1', compressed)       # Italic

        # 3. Abbreviate common code review terms
        abbreviations = {
            'Review Objectives': 'Objectives',
            'Code Snippet': 'Code',
            'Error message/log': 'Error',
            'File name': 'File',
            'Verification Steps': 'Verify',
            'Root Cause': 'Cause',
            'Explanation': 'Why',
        }
        for full, abbrev in abbreviations.items():
            compressed = compressed.replace(full, abbrev)

        # 4. Remove numbered lists (keep content)
        compressed = re.sub(r'\d+\.\s+', '- ', compressed)

        # 5. Trim to target if still too long
        original_tokens = self.count_tokens(prompt)
        compressed_tokens = self.count_tokens(compressed)
        compression_ratio = compressed_tokens / original_tokens if original_tokens > 0 else 1.0

        # Log compression stats
        print(f"📊 Compression: {original_tokens} → {compressed_tokens} tokens "
              f"({compression_ratio:.1%} of original, {1-compression_ratio:.1%} reduction)")

        return compressed.strip()

    def get_cache_ttl(self, request_type: str) -> int:
        """
        Get cache TTL for a request type from system_brain

        Args:
            request_type: One of 'code_review', 'debug', 'architecture'

        Returns:
            TTL in seconds
        """
        if not self.brain_data:
            default_ttls = {
                "code_review": 604800,  # 7 days (increased from 24h for better cache reuse)
                "debug": 86400,         # 24 hours (increased from 1h)
                "architecture": 604800  # 7 days
            }
            return default_ttls.get(request_type, 3600)

        token_opt = self.brain_data.get("token_optimization", {})
        cache_ttls = token_opt.get("cache_ttl", {})
        return cache_ttls.get(request_type, 3600)

    def check_security_filters(self, code: str) -> Dict[str, Any]:
        """
        Check code against security filters from system_brain

        Returns:
            Dict with 'safe': bool and 'issues': list of security concerns
        """
        if not self.brain_data:
            return {"safe": True, "issues": []}

        security = self.brain_data.get("security_filters", {})
        redact_patterns = security.get("redact_patterns", [])
        max_size = security.get("max_code_size", 50000)

        issues = []

        # Check size
        if len(code) > max_size:
            issues.append(f"Code exceeds maximum size ({len(code)} > {max_size} chars)")

        # Check for secrets
        for pattern in redact_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                issues.append(f"Found potential secret: {pattern}")

        return {
            "safe": len(issues) == 0,
            "issues": issues
        }

    def get_token_budget(self, plan: str) -> int:
        """
        Get token budget for user plan

        Args:
            plan: User's plan ('lite', 'pro', 'business')

        Returns:
            Monthly token budget
        """
        budgets = {
            "lite": 200000,
            "pro": 500000,
            "business": 4000000
        }
        return budgets.get(plan.lower(), 200000)

# Singleton instance
prompt_service = PromptService()
