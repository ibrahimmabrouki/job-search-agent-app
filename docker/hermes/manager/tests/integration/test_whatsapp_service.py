# Run from Windows:
# docker exec -e PYTHONPATH=/opt/hermes-manager -w /opt/hermes-manager job-search-agent /opt/hermes/.venv/bin/python tests/integration/test_whatsapp_service.py

import time

from app.services.whatsapp_service import WhatsAppService


service = WhatsAppService()


# Test 1: Session path
session_path = service.get_session_path()

print("Session path:")
print(session_path)


# Test 2: Existing session
has_session = service.has_existing_session()

print("\nExisting WhatsApp session:")
print(has_session)


# Test 3: Start pairing
print("\nStarting WhatsApp pairing...")

pairing_result = service.connect()

print("\nPairing result:")
print(pairing_result)

pairing_id = pairing_result["pairing_id"]


# Test 4: Keep polling and detect QR refreshes

pairing_id = pairing_result["pairing_id"]
last_qr = None

print("\nPolling WhatsApp pairing...")

for attempt in range(30):

    result = service.poll_pairing(pairing_id)

    print(f"\nPoll {attempt + 1}")
    print("Status:", result["status"])

    current_qr = result["qr_payload"]

    if current_qr and current_qr != last_qr:
        print("New QR payload received:")
        print(current_qr)

        last_qr = current_qr

    if result["status"] == "connected":
        print("\nWhatsApp pairing connected!")
        break

    time.sleep(1)
