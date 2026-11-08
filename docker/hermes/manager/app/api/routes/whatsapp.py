from fastapi import APIRouter

from app.services.whatsapp_service import WhatsAppService

from app.schemas.whatsapp import WhatsAppPairingResponse, WhatsAppApplyResponse, WhatsAppPollResponse


router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

service = WhatsAppService()


@router.post("/connect", response_model=WhatsAppPairingResponse)
async def connect_whatsapp():
    return service.connect()


@router.get("/poll/{pairing_id}", response_model=WhatsAppPollResponse)
async def poll_whatsapp(pairing_id: str):
    return service.poll_pairing(pairing_id)

@router.post("/apply/{pairing_id}", response_model=WhatsAppApplyResponse)
async def apply_whatsapp(pairing_id: str):
    return service.apply_pairing(pairing_id)

"""
The full flow until now is as follows:
connect
→ pairing_id
→ poll
→ waiting + QR
→ user scans QR
→ poll says connected
→ apply
→ Hermes saves config
→ enables WhatsApp
→ restarts Gateway
"""
