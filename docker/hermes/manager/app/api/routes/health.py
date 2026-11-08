# Its purpose is simple: Allow us to verify that the Manager API is running correctly.
from fastapi import APIRouter

# creates a small router dedicated to health-related endpoints.
router = APIRouter()

# Why do we need a health endpoint?
# Docker and s6 can eventually use it to determine whether our service is alive.

@router.get("/health")
async def health():
    return {
        "ok": True,
        "service": "hermes-manager",
    }
