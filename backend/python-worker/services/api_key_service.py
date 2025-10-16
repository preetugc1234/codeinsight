"""
API Key Service
Handles API key generation, validation, and storage
"""
import secrets
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any
from services.supabase_service import supabase_service


class ApiKeyService:
    """
    Manage API keys for users
    - Generate secure API keys
    - Store hashed keys in Supabase
    - Validate API keys
    """

    def __init__(self):
        self.prefix = "sk_ci_"  # Code Insight API key prefix

    def generate_api_key(self, user_id: str) -> str:
        """
        Generate a new API key for a user

        Format: sk_ci_{random_32_chars}

        Args:
            user_id: User ID from Supabase auth

        Returns:
            Plain text API key (only shown once!)
        """
        # Generate cryptographically secure random key
        random_bytes = secrets.token_bytes(24)  # 24 bytes = 32 chars base64
        random_part = secrets.token_urlsafe(24)[:32]  # URL-safe base64

        # Create API key
        api_key = f"{self.prefix}{random_part}"

        return api_key

    def hash_api_key(self, api_key: str) -> str:
        """
        Hash API key for secure storage

        Args:
            api_key: Plain text API key

        Returns:
            SHA256 hash of the key
        """
        return hashlib.sha256(api_key.encode()).hexdigest()

    async def create_api_key(self, user_id: str) -> Dict[str, Any]:
        """
        Create and store a new API key for user

        Args:
            user_id: User ID

        Returns:
            {
                "api_key": "sk_ci_...",  # Plain text (only returned once!)
                "key_id": "uuid",
                "created_at": "timestamp"
            }
        """
        # Generate new API key
        api_key = self.generate_api_key(user_id)
        key_hash = self.hash_api_key(api_key)

        # Store hashed key in Supabase
        try:
            # Check if user already has an API key
            existing = supabase_service.client.table('api_keys').select('*').eq('user_id', user_id).execute()

            if existing.data:
                # Update existing key
                result = supabase_service.client.table('api_keys').update({
                    'key_hash': key_hash,
                    'updated_at': datetime.utcnow().isoformat(),
                    'is_active': True
                }).eq('user_id', user_id).execute()
            else:
                # Insert new key
                result = supabase_service.client.table('api_keys').insert({
                    'user_id': user_id,
                    'key_hash': key_hash,
                    'is_active': True,
                    'created_at': datetime.utcnow().isoformat()
                }).execute()

            return {
                "api_key": api_key,  # Return plain text ONLY ONCE
                "key_id": result.data[0]['id'] if result.data else None,
                "created_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"❌ Error creating API key: {e}")
            raise Exception(f"Failed to create API key: {str(e)}")

    async def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """
        Validate an API key and return user info

        Args:
            api_key: Plain text API key from request

        Returns:
            {
                "user_id": "uuid",
                "is_active": True,
                "created_at": "timestamp"
            }
            or None if invalid
        """
        try:
            # Hash the provided key
            key_hash = self.hash_api_key(api_key)

            # Look up in database
            result = supabase_service.client.table('api_keys').select('*').eq('key_hash', key_hash).eq('is_active', True).execute()

            if result.data:
                key_data = result.data[0]
                return {
                    "user_id": key_data['user_id'],
                    "is_active": key_data['is_active'],
                    "created_at": key_data['created_at']
                }

            return None

        except Exception as e:
            print(f"❌ Error validating API key: {e}")
            return None

    async def revoke_api_key(self, user_id: str) -> bool:
        """
        Revoke (deactivate) a user's API key

        Args:
            user_id: User ID

        Returns:
            True if successful
        """
        try:
            supabase_service.client.table('api_keys').update({
                'is_active': False,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('user_id', user_id).execute()

            return True

        except Exception as e:
            print(f"❌ Error revoking API key: {e}")
            return False

    async def get_user_api_key_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get API key info for a user (without revealing the key)

        Args:
            user_id: User ID

        Returns:
            {
                "has_key": True,
                "is_active": True,
                "created_at": "timestamp",
                "preview": "sk_ci_abc123..."  # First 10 chars
            }
        """
        try:
            result = supabase_service.client.table('api_keys').select('*').eq('user_id', user_id).execute()

            if result.data:
                key_data = result.data[0]
                # Generate preview (not real key, just for display)
                preview = f"{self.prefix}{key_data['id'][:8]}{'•' * 24}"

                return {
                    "has_key": True,
                    "is_active": key_data['is_active'],
                    "created_at": key_data['created_at'],
                    "preview": preview
                }

            return {
                "has_key": False,
                "is_active": False,
                "created_at": None,
                "preview": None
            }

        except Exception as e:
            print(f"❌ Error getting API key info: {e}")
            return None


# Singleton instance
api_key_service = ApiKeyService()
