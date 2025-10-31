from fastapi import APIRouter

router = APIRouter(prefix="/session", tags=["Session"])

@router.get("/{session_id}/active")
async def get_session_active(session_id: str):
    return {"session_id": session_id, "active": True}
