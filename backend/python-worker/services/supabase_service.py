"""
Supabase Service
Simple wrapper for Supabase client operations
"""
from supabase import create_client, Client
from config import settings
from typing import Optional, Dict, Any


class SupabaseService:
    """
    Supabase client wrapper
    """

    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_key
        )
        print("✅ Supabase client initialized")

    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user profile from Supabase

        Args:
            user_id: Supabase user ID

        Returns:
            User profile dict or None
        """
        try:
            response = self.client.table('profiles').select('*').eq('id', user_id).execute()

            if response.data and len(response.data) > 0:
                return response.data[0]

            return None

        except Exception as e:
            print(f"❌ Error getting user profile: {e}")
            return None


# Singleton instance
supabase_service = SupabaseService()
