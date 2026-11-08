"""
This is the file which is responsible for defining a router that is responsible for collecting all API routes in one place.
This router will be included in the main FastAPI app in the main.py file. The main.py file will then be responsible for starting the FastAPI app and serving the API endpoints.

Later we will we will have files like: 
app/api/routes/health.py
app/api/routes/whatsapp.py

Instead of importing both directly inside main.py, we will connect them through: api/router.py

==> instead of: 
main.py
├── health
├── whatsapp
├── scheduler
├── gateway
└── ...

we will have:
main.py
   ↓
api_router
   ├── health
   └── whatsapp
   
"""
from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.whatsapp import router as whatsapp_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(whatsapp_router)

"""
api_router ==> include health_router ==> GET /health becomes registered
"""
api_router.include_router(health_router)

"""
The logic below is related to the WhatsApp onboarding flow.

The frontend first checks the WhatsApp connection status using the existing Hermes status API.

Based on the status:

```text
WhatsApp disconnected
→ Button text = "Connect"

WhatsApp connected
→ Button text = "Reconnect"
```

If the user clicks **Connect**, the frontend directly starts the WhatsApp connection process.

If the user clicks **Reconnect**, the frontend first asks for confirmation:

```text
User clicks "Reconnect"
        ↓
Frontend asks:
"Are you sure you want to reconnect WhatsApp?"
        ↓
        ├── No
        │   → Stop
        │
        └── Yes
            → Call POST /whatsapp/connect
```

The confirmation is handled completely by the frontend.

The Hermes Manager does not ask the user for confirmation.

---

The main Manager endpoint responsible for starting the WhatsApp connection flow is:

```text
POST /whatsapp/connect
```

We will not have separate endpoints such as:

```text
POST /whatsapp/connect
POST /whatsapp/reconnect
```

The same `/whatsapp/connect` endpoint handles the technical work for both cases.

Its internal flow is:

```text
POST /whatsapp/connect
        ↓
Manager checks the existing WhatsApp session/state
        ↓
        ├── No previous session/state that needs cleanup
        │       ↓
        │   Start normal Hermes pairing
        │
        └── Previous/stale session exists
                ↓
            Safely reset the old WhatsApp session
                ↓
            Start the SAME normal Hermes pairing process
```

This means the frontend decides whether the user is performing a normal **Connect** or a **Reconnect**, while the Manager safely prepares the Hermes environment before starting the pairing process.

---

One important part of the WhatsApp connection flow is QR-code refreshing.

Hermes already handles this behavior:

```text
Pairing started
      ↓
QR #1
      ↓
Not scanned before expiry
      ↓
Hermes generates QR #2
      ↓
Not scanned
      ↓
Hermes generates QR #3
      ↓
...
      ↓
User scans QR
      ↓
Connected
```

We should not generate or refresh QR codes ourselves.

The Manager should reuse Hermes' existing WhatsApp pairing mechanism.

Therefore the architecture is:

```text
Frontend
│
├── checks WhatsApp status through Hermes
│
├── shows "Connect" or "Reconnect"
│
└── handles reconnect confirmation
        ↓
Manager
│
├── receives POST /whatsapp/connect
│
├── checks whether old WhatsApp state needs cleanup
│
├── safely cleans old state when necessary
│
└── starts the normal Hermes pairing process
        ↓
Hermes
│
├── starts pairing
├── generates QR codes
├── refreshes expired QR codes
└── detects successful connection
```

For the WhatsApp connection flow, we may therefore use two Manager endpoints:

```text
POST /whatsapp/connect
→ Starts the WhatsApp pairing process.
→ Handles both a fresh connection and the technical reset required before a reconnection.
→ Returns the pairing ID.
```

```text
GET /whatsapp/poll/{pairingId}
→ Checks the active pairing process.
→ Returns the latest/current QR code when Hermes generates a new one.
→ Reports when the WhatsApp connection succeeds or fails.
```

The responsibility is therefore clearly separated:

```text
Frontend
→ Status
→ Connect/Reconnect button
→ Reconnect confirmation

Hermes Manager
→ Safe preparation/reset
→ Start and monitor pairing

Hermes
→ Actual WhatsApp pairing
→ QR generation and refreshing
→ Connection detection
```
"""
