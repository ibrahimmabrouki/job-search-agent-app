"""
This is the Schema file/module that defines the data models and validation
It defines the request and response structure for the whatsapp onboarding endpoints
"""



from pydantic import BaseModel


class WhatsAppPairingResponse(BaseModel):
    pairing_id: str
    status: str
    qr_payload: str | None = None
    expires_at: str | None = None
    mode: str
    allowed_users: str = ""
    account_id: str | None = None
    account_name: str | None = None
    account_phone: str | None = None
    error: str | None = None


class WhatsAppApplyResponse(BaseModel):
    ok: bool
    platform: str
    needs_restart: bool | None = None
    restart_started: bool | None = None
    restart_action: str | None = None
    restart_pid: int | None = None
    gateway_ready: bool = False
    whatsapp_connected: bool = False
    home_channel: str | None = None
    home_channel_configured: bool = False
    
class WhatsAppPollResponse(WhatsAppPairingResponse):
    pass
