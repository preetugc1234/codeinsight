"""
Authentication Endpoints
Validate API keys and user sessions
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from services.supabase_service import supabase_service
from services.api_key_service import api_key_service


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.get("/whoami")
async def whoami(authorization: Optional[str] = Header(None)):
    """
    Validate user authentication and return user info

    Accepts:
    - Bearer {api_key} (future: from api_keys table)
    - Bearer {supabase_jwt} (current: from Supabase auth)
    - Bearer {user_id} (temporary: for testing)

    Returns:
        {
            "user_id": "uuid",
            "email": "user@example.com",
            "plan": "lite",
            "tokens_remaining": 195000,
            "is_authenticated": true
        }
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing authorization header")

        token = authorization.replace("Bearer ", "").strip()

        # Try to validate as Supabase JWT first
        try:
            user_response = supabase_service.client.auth.get_user(token)
            if user_response and user_response.user:
                user_id = user_response.user.id
                email = user_response.user.email

                # Get profile info
                profile = supabase_service.get_user_profile(user_id)

                return {
                    "success": True,
                    "user_id": user_id,
                    "email": email,
                    "plan": profile.get("plan", "trial") if profile else "trial",
                    "tokens_remaining": profile.get("monthly_token_limit", 25000) - profile.get("tokens_used_this_month", 0) if profile else 25000,
                    "is_authenticated": True,
                    "auth_method": "supabase_jwt"
                }
        except:
            pass

        # Try as User ID (temporary fallback for testing)
        # Check if it's a valid UUID format
        if len(token) > 30 and '-' in token:
            try:
                profile = supabase_service.get_user_profile(token)

                if profile:
                    return {
                        "success": True,
                        "user_id": token,
                        "email": profile.get("email", "unknown"),
                        "plan": profile.get("plan", "trial"),
                        "tokens_remaining": profile.get("monthly_token_limit", 25000) - profile.get("tokens_used_this_month", 0),
                        "is_authenticated": True,
                        "auth_method": "user_id_fallback"
                    }
            except:
                pass

        # Try as API key (check api_keys table)
        if token.startswith("sk_"):
            try:
                key_info = await api_key_service.validate_api_key(token)

                if key_info:
                    user_id = key_info["user_id"]
                    profile = supabase_service.get_user_profile(user_id)

                    # Update usage stats
                    await supabase_service.client.rpc('update_api_key_usage', {
                        'p_key_hash': api_key_service.hash_api_key(token)
                    }).execute()

                    return {
                        "success": True,
                        "user_id": user_id,
                        "email": profile.get("email", "unknown") if profile else "unknown",
                        "plan": profile.get("plan", "trial") if profile else "trial",
                        "tokens_remaining": profile.get("monthly_token_limit", 25000) - profile.get("tokens_used_this_month", 0) if profile else 25000,
                        "is_authenticated": True,
                        "auth_method": "api_key"
                    }
            except Exception as e:
                print(f"❌ API key validation error: {e}")
                pass

        # If nothing worked, return 401
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token. Please use a valid API key or JWT."
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in whoami: {e}")
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")


@router.post("/validate-key")
async def validate_key(authorization: Optional[str] = Header(None)):
    """
    Quick validation endpoint for API keys

    Returns:
        {
            "valid": true,
            "user_id": "uuid"
        }
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            return {"valid": False, "error": "Missing authorization header"}

        token = authorization.replace("Bearer ", "").strip()

        # Use whoami logic
        result = await whoami(authorization=authorization)

        if result.get("is_authenticated"):
            return {
                "valid": True,
                "user_id": result.get("user_id"),
                "plan": result.get("plan")
            }
        else:
            return {"valid": False, "error": "Invalid token"}

    except:
        return {"valid": False, "error": "Invalid token"}
