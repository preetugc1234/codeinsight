"""
API Key Management Endpoints
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from services.api_key_service import api_key_service
from services.supabase_service import supabase_service


router = APIRouter(prefix="/api/keys", tags=["API Keys"])


class GenerateKeyRequest(BaseModel):
    user_id: str


class ValidateKeyRequest(BaseModel):
    api_key: str


@router.post("/generate")
async def generate_api_key(
    authorization: Optional[str] = Header(None)
):
    """
    Generate a new API key for the authenticated user

    Returns:
        {
            "api_key": "sk_ci_...",
            "created_at": "timestamp",
            "message": "API key generated successfully. Save it securely!"
        }
    """
    try:
        # Extract user from auth header (Supabase JWT)
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Unauthorized: Missing authorization header")

        token = authorization.replace("Bearer ", "")

        # Verify token with Supabase
        try:
            user_response = supabase_service.client.auth.get_user(token)
            if not user_response or not user_response.user:
                raise HTTPException(status_code=401, detail="Invalid token: User not found")

            user_id = user_response.user.id
        except Exception as auth_error:
            print(f"❌ Supabase auth error: {auth_error}")
            raise HTTPException(
                status_code=401,
                detail=f"Invalid or expired Supabase JWT token. Please login again. Error: {str(auth_error)}"
            )

        # Generate new API key
        result = await api_key_service.create_api_key(user_id)

        return {
            "success": True,
            "api_key": result["api_key"],
            "created_at": result["created_at"],
            "message": "⚠️ API key generated successfully! Save it securely - you won't see it again."
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating API key: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate")
async def validate_api_key(request: ValidateKeyRequest):
    """
    Validate an API key

    Args:
        api_key: The API key to validate

    Returns:
        {
            "valid": true,
            "user_id": "uuid"
        }
    """
    try:
        result = await api_key_service.validate_api_key(request.api_key)

        if result:
            # Update usage stats
            await supabase_service.client.rpc('update_api_key_usage', {
                'p_key_hash': api_key_service.hash_api_key(request.api_key)
            }).execute()

            return {
                "valid": True,
                "user_id": result["user_id"],
                "is_active": result["is_active"]
            }
        else:
            return {
                "valid": False,
                "error": "Invalid or inactive API key"
            }

    except Exception as e:
        print(f"❌ Error validating API key: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info")
async def get_api_key_info(
    authorization: Optional[str] = Header(None)
):
    """
    Get API key info for the authenticated user (without revealing the key)

    Returns:
        {
            "has_key": true,
            "is_active": true,
            "created_at": "timestamp",
            "preview": "sk_ci_abc123..."
        }
    """
    try:
        # Extract user from auth header
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Unauthorized: Missing authorization header")

        token = authorization.replace("Bearer ", "")

        # Verify token with Supabase
        try:
            user_response = supabase_service.client.auth.get_user(token)
            if not user_response or not user_response.user:
                raise HTTPException(status_code=401, detail="Invalid token: User not found")

            user_id = user_response.user.id
        except Exception as auth_error:
            print(f"❌ Supabase auth error: {auth_error}")
            raise HTTPException(
                status_code=401,
                detail=f"Invalid or expired Supabase JWT token. Please login again."
            )

        # Get key info
        result = await api_key_service.get_user_api_key_info(user_id)

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting API key info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/revoke")
async def revoke_api_key(
    authorization: Optional[str] = Header(None)
):
    """
    Revoke the user's API key

    Returns:
        {
            "success": true,
            "message": "API key revoked successfully"
        }
    """
    try:
        # Extract user from auth header
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Unauthorized: Missing authorization header")

        token = authorization.replace("Bearer ", "")

        # Verify token with Supabase
        try:
            user_response = supabase_service.client.auth.get_user(token)
            if not user_response or not user_response.user:
                raise HTTPException(status_code=401, detail="Invalid token: User not found")

            user_id = user_response.user.id
        except Exception as auth_error:
            print(f"❌ Supabase auth error: {auth_error}")
            raise HTTPException(
                status_code=401,
                detail=f"Invalid or expired Supabase JWT token. Please login again."
            )

        # Revoke key
        success = await api_key_service.revoke_api_key(user_id)

        if success:
            return {
                "success": True,
                "message": "API key revoked successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to revoke API key")

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error revoking API key: {e}")
        raise HTTPException(status_code=500, detail=str(e))
