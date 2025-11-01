from fastapi import APIRouter

router = APIRouter(prefix="/session", tags=["Session"])

@router.get("/{session_id}/active")
async def get_session_active(session_id: str):
<<<<<<< HEAD
    # 프론트엔드의 세션 상태 확인 요청을 단순히 성공 응답으로 처리
=======
>>>>>>> origin/main
    return {"session_id": session_id, "active": True}
