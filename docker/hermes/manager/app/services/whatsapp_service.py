# We use it to work with folders and files.
from pathlib import Path

# This imports Hermes' own function for finding the correct folder.
from hermes_constants import get_hermes_dir

import json
from urllib.request import Request, urlopen

from app.core.config import (
    HERMES_BASE_URL,
    HERMES_SESSION_HEADER,
    HERMES_SESSION_TOKEN,
)

import time
import shutil

import fcntl
from contextlib import contextmanager

import re
import subprocess
from urllib.error import URLError

import os

"""
Instead of us saying: "/opt/data/whatsapp/session"

we ask Hermes: "Which WhatsApp session folder are you actually using?"

Hermes currently resolves between: /opt/data/platforms/whatsapp/session and the older: /opt/data/whatsapp/session"""


"""
This is below the class that represents our WhatsApp service: 
Its responsibility is to manage: 
- the WhatsApp session folder
- Checking if a WhatsApp session already exists
- Stop Gateway when reconnecting WhatsApp
- clean up old WhatsApp session if it exists
- start the Hermes pairing process for WhatsApp
- poll pairing status and return the result to the frontend
- start the Gateway when pairing is successful
"""


class WhatsAppService:
    # This method is responsible for finding and returning the correct path to the WhatsApp session directory.
    # It checks for the existence of the session directory in two possible locations: "platforms/whatsapp/session" and "whatsapp/session".
    # This method returns the correct path based on the environment in which the application is running.
    def get_session_path(self) -> Path:
        return get_hermes_dir(
            # we are giving Hermes two possible locations the first is the newer location and the second is the older location.
            # Hermes decides which one to be used
            "platforms/whatsapp/session",
            "whatsapp/session",
        )

    # This method checks if a WhatsApp session already exists by looking for the presence of the "creds.json" file in the session directory.
    # If the file exists, it indicates that a session is already established, and the method returns True. Otherwise, it returns False, indicating that no session is currently active.
    def has_existing_session(self) -> bool:
        # We first get the correct session folder. For example, Hermes might return: /opt/data/platforms/whatsapp/session and We store it inside: session_path
        session_path = self.get_session_path()
        # This creates a path such as: /opt/data/platforms/whatsapp/session/creds.json and asks: Does this file exist?
        # Note: Hermes itself uses the existence of creds.json to decide whether onboarding considers the WhatsApp session already paired.
        # has_existing_session() ==> Where is the WhatsApp session folder? ==> Is creds.json inside it? ==> YES → True or NO  → False
        return (session_path / "creds.json").exists()

    # start_pairing() ==> POST Hermes /whatsapp/onboarding/start ==> Hermes starts normal WhatsApp pairing ==> Hermes returns pairing_id + status + QR information
    def start_pairing(self) -> dict:

        if not HERMES_SESSION_TOKEN:
            raise RuntimeError("Hermes session token is not configured")

        url = f"{HERMES_BASE_URL}/api/messaging/whatsapp/onboarding/start"

        body = {
            "mode": "self-chat",
            "allowed_users": "",
        }

        request = Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            method="POST",
            headers={
                "Content-Type": "application/json",
                HERMES_SESSION_HEADER: HERMES_SESSION_TOKEN,
            },
        )

        with urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))

    """
    Starting WhatsApp pairing does not immediately return a QR code.
    Hermes first starts the pairing process and usually returns a pairing_id.

    The polling service uses that pairing_id to repeatedly ask Hermes
    for the latest state of the same pairing process.

    Through polling we can detect:
    - when Hermes is still installing or preparing
    - when the QR code becomes available
    - when the QR code changes or refreshes
    - when the user successfully scans the QR
    - when pairing fails or expires
    """

    def poll_pairing(self, pairing_id: str) -> dict:

        if not pairing_id:
            raise ValueError("pairing_id is required")

        if not HERMES_SESSION_TOKEN:
            raise RuntimeError("Hermes session token is not configured")

        url = (
            f"{HERMES_BASE_URL}"
            f"/api/messaging/whatsapp/onboarding/{pairing_id}"
        )

        request = Request(
            url,
            method="GET",
            headers={
                HERMES_SESSION_HEADER: HERMES_SESSION_TOKEN,
            },
        )

        with urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))

    """
The connect() method is the main entry point for both
the initial WhatsApp connection and reconnection.

The API route always calls connect(), while this service
decides which process to execute.

Expected flow:

connect()
   |
   v
Does creds.json exist?
   |
   +-- No (First Connection)
   |     |
   |     --> start_pairing()
   |     --> return pairing_id
   |
   +-- Yes (Reconnect)
         |
         --> stop_gateway()
         --> wait_for_gateway_stop()
         --> verify WhatsApp bridge shutdown
         --> clear_session()
         --> start_pairing()
         --> return new pairing_id

First Connection:
- Check whether WhatsApp credentials already exist.
- If no credentials exist, start normal Hermes pairing.

Reconnect:
- Detect an existing WhatsApp session.
- Request a safe Gateway shutdown.
- Wait until Gateway shutdown is complete.
- Verify that the WhatsApp bridge is no longer running.
- Remove the old session using Hermes' session path resolver.
- Start a fresh WhatsApp pairing process.

Important:
- Never delete WhatsApp credentials while the Gateway
  or WhatsApp bridge is still using them.
- The reconnect flow is not fully implemented yet.
- The frontend handles user confirmation before calling connect().
- Both connection types reuse the existing polling and apply steps.

This design keeps the API route simple and places all
connection and reconnection logic inside WhatsAppService.
"""

    def stop_gateway(self) -> dict:
        if not HERMES_SESSION_TOKEN:
            raise RuntimeError("Hermes session token is not configured")

        request = Request(
            f"{HERMES_BASE_URL}/api/gateway/stop",
            method="POST",
            headers={
                HERMES_SESSION_HEADER: HERMES_SESSION_TOKEN,
            },
        )

        with urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))

        if result.get("ok") is not True:
            raise RuntimeError("Hermes failed to initiate Gateway shutdown")

        return result

    def get_gateway_status(self) -> dict:
        request = Request(
            f"{HERMES_BASE_URL}/api/status",
            method="GET",
            headers={
                HERMES_SESSION_HEADER: HERMES_SESSION_TOKEN,
            },
        )

        with urlopen(request, timeout=5) as response:
            return json.loads(response.read().decode("utf-8"))

    def gateway_is_stopped(self) -> bool:
        status = self.get_gateway_status()

        return (
            status.get("gateway_running") is False
            and status.get("gateway_pid") is None
            and status.get("gateway_state") == "stopped"
        )

    def wait_for_gateway_stop(self, timeout: int = 45) -> None:
        deadline = time.monotonic() + timeout

        while time.monotonic() < deadline:
            try:
                if self.gateway_is_stopped():
                    return
            except (TimeoutError, URLError):
                # Hermes may temporarily stop responding during shutdown.
                pass

            time.sleep(1)

        raise TimeoutError(
            "Gateway shutdown could not be verified within 45 seconds"
        )

    def get_bridge_identity(self) -> tuple[int, int] | None:
        pid_file = self.get_session_path() / "bridge.pid"

        if not pid_file.is_file():
            return None

        try:
            lines = pid_file.read_text().splitlines()
            pid = int(lines[0])
            start_time = int(lines[1])

            if pid <= 0 or start_time <= 0:
                raise ValueError("Invalid bridge identity")

            return pid, start_time

        except (ValueError, IndexError) as exc:
            raise RuntimeError(
                "Invalid WhatsApp bridge PID file"
            ) from exc

    def bridge_is_running(
        self, bridge_pid: int, start_time: int
    ) -> bool:

        stat_file = Path(f"/proc/{bridge_pid}/stat")

        try:
            content = stat_file.read_bytes()

        except FileNotFoundError:
            return False

        except OSError as exc:
            raise RuntimeError(
                "Cannot verify WhatsApp bridge process"
            ) from exc

        try:
            fields = content.rsplit(b")", 1)[1].split()

            state = fields[0].decode("ascii")
            actual_start_time = int(fields[19])

        except (IndexError, ValueError, UnicodeDecodeError) as exc:
            raise RuntimeError(
                "Invalid WhatsApp bridge process information"
            ) from exc

        # PID exists but belongs to a different process.
        if actual_start_time != start_time:
            return False

        # Zombie processes have already exited.
        return state not in ("Z", "X", "x")

    def verify_bridge_shutdown(
        self,
        bridge_pid: int,
        start_time: int,
        timeout: int = 10,
    ) -> None:
        deadline = time.monotonic() + timeout
        pid_file = self.get_session_path() / "bridge.pid"

        while time.monotonic() < deadline:
            process_running = self.bridge_is_running(
                bridge_pid, start_time
            )

            if not process_running and not pid_file.exists():
                return

            time.sleep(0.5)

        raise RuntimeError(
            "WhatsApp bridge shutdown could not be verified. "
            "Session credentials were preserved."
        )

    def clear_session(self) -> None:
        session_path = self.get_session_path()

        if session_path.is_symlink():
            raise RuntimeError(
                "Refusing to delete a symlinked WhatsApp session"
            )

        if not session_path.exists():
            return

        if not session_path.is_dir():
            raise RuntimeError(
                "WhatsApp session path is not a directory"
            )

        # Final Gateway check before deleting credentials.
        if not self.gateway_is_stopped():
            raise RuntimeError(
                "Gateway is running. Refusing to clear session."
            )

        shutil.rmtree(session_path)

    @contextmanager
    def connection_lock(self):
        lock_path = self.get_session_path().parent / ".manager-connect.lock"
        lock_path.parent.mkdir(parents=True, exist_ok=True)

        with lock_path.open("a+") as lock_file:
            try:
                fcntl.flock(
                    lock_file.fileno(),
                    fcntl.LOCK_EX | fcntl.LOCK_NB,
                )
            except BlockingIOError as exc:
                raise RuntimeError(
                    "A WhatsApp connection operation is already running"
                ) from exc

            try:
                yield
            finally:
                fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)

    def configure_self_chat_home_channel(
        self, expected_account_id: str | None = None
    ) -> str:
        session = self.get_session_path()
        creds = json.loads(
            (session / "creds.json").read_text(encoding="utf-8")
        )

        me = creds.get("me") or {}
        account_id = me.get("id", "")

        phone_match = re.fullmatch(
            r"(\d+)(?::\d+)?@s\.whatsapp\.net",
            account_id,
        )
        if not phone_match:
            raise RuntimeError("WhatsApp account ID is missing or invalid")

        phone = phone_match.group(1)

        # Prevent accidentally targeting another account.
        if expected_account_id:
            expected = re.fullmatch(
                r"(\d+)(?::\d+)?@s\.whatsapp\.net",
                expected_account_id,
            )
            if not expected or expected.group(1) != phone:
                raise RuntimeError("WhatsApp pairing account mismatch")

        # Prefer the account's Linked Identity (LID).
        lid = me.get("lid")

        # Baileys may also store the phone-to-LID mapping separately.
        if not lid:
            mapping_file = session / f"lid-mapping-{phone}.json"
            if mapping_file.is_file():
                lid = json.loads(mapping_file.read_text(encoding="utf-8"))

        lid_match = re.fullmatch(
            r"(\d+)(?::\d+)?(?:@lid)?",
            str(lid or ""),
        )

        # Fall back to the authenticated account's phone JID.
        home_channel = (
            f"{lid_match.group(1)}@lid"
            if lid_match
            else f"{phone}@s.whatsapp.net"
        )

        subprocess.run(
            [
                "/opt/hermes/.venv/bin/hermes",
                "config",
                "set",
                "WHATSAPP_HOME_CHANNEL",
                home_channel,
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=15,
        )

        return home_channel

    def reconnect(self) -> dict:
        bridge_identity = self.get_bridge_identity()

        self.stop_gateway()
        self.wait_for_gateway_stop()

        if bridge_identity is not None:
            self.verify_bridge_shutdown(*bridge_identity)

        # Never delete credentials if a bridge is still running.
        for process in Path("/proc").iterdir():
            if not process.name.isdigit():
                continue

            try:
                args = (process / "cmdline").read_bytes().split(b"\x00")
            except (FileNotFoundError, ProcessLookupError):
                continue

            if any(
                arg.endswith(b"/bridge.js") or arg == b"bridge.js"
                for arg in args
            ):
                raise RuntimeError(
                    "WhatsApp bridge is still running. "
                    "Session credentials were preserved."
                )

        if (self.get_session_path() / "bridge.pid").exists():
            raise RuntimeError(
                "WhatsApp bridge PID file still exists."
            )

        self.clear_session()
        return self.start_pairing()

    def connect(self) -> dict:
        with self.connection_lock():
            if self.has_existing_session():
                return self.reconnect()

            return self.start_pairing()

    """
    One Question is: What happens when the user scans the QR code
    ==> Hermes requires an apply step: 
    → polling eventually says connected
    → apply pairing
    → Hermes saves WhatsApp configuration
    → Hermes enables WhatsApp
    → Hermes restarts Gateway
    """

    def apply_pairing(self, pairing_id: str) -> dict:
        if not pairing_id:
            raise ValueError("pairing_id is required")

        if not HERMES_SESSION_TOKEN:
            raise RuntimeError("Hermes session token is not configured")

        # 1. Verify that the user successfully scanned the QR code.
        pairing = self.poll_pairing(pairing_id)

        if pairing.get("status") != "connected":
            raise RuntimeError(
                "WhatsApp pairing is not connected"
            )

        # 2. Apply the WhatsApp configuration through Hermes.
        url = (
            f"{HERMES_BASE_URL}"
            f"/api/messaging/whatsapp/onboarding/{pairing_id}/apply"
        )

        body = {
            "mode": "self-chat",
            "allowed_users": "",
        }

        request = Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            method="POST",
            headers={
                "Content-Type": "application/json",
                HERMES_SESSION_HEADER: HERMES_SESSION_TOKEN,
            },
        )

        with urlopen(request, timeout=20) as response:
            result = json.loads(
                response.read().decode("utf-8")
            )

        if result.get("ok") is not True:
            raise RuntimeError(
                "WhatsApp pairing could not be applied"
            )

        # 3. Allow Hermes to complete its automatic Gateway restart.
        deadline = time.monotonic() + 45
        start_after = time.monotonic() + 4
        start_requested = False

        while time.monotonic() < deadline:
            status = self.get_gateway_status()

            whatsapp = (
                status.get("gateway_platforms") or {}
            ).get("whatsapp") or {}

            # 4. Check that the Gateway and WhatsApp are healthy.
            if (
                status.get("gateway_running") is True
                and whatsapp.get("state") == "connected"
                and status.get("overall") == "ok"
            ):
                # 5. Automatically configure this account's self-chat
                # as the default WhatsApp messaging destination.
                home_channel = (
                    self.configure_self_chat_home_channel(
                        pairing.get("account_id")
                    )
                )

                return {
                    **result,
                    "gateway_ready": True,
                    "whatsapp_connected": True,
                    "home_channel": home_channel,
                    "home_channel_configured": True,
                }

            # 6. Start the Gateway if Hermes left it stopped.
            if (
                not start_requested
                and time.monotonic() >= start_after
                and status.get("gateway_running") is False
                and status.get("gateway_state") == "stopped"
                and status.get("gateway_pid") is None
            ):
                start_request = Request(
                    f"{HERMES_BASE_URL}/api/gateway/start",
                    method="POST",
                    headers={
                        HERMES_SESSION_HEADER: HERMES_SESSION_TOKEN,
                    },
                )

                with urlopen(
                    start_request, timeout=10
                ) as response:
                    start_result = json.loads(
                        response.read().decode("utf-8")
                    )

                if start_result.get("ok") is not True:
                    raise RuntimeError(
                        "Gateway startup failed"
                    )

                start_requested = True

            time.sleep(1)

        raise TimeoutError(
            "WhatsApp pairing was applied, but the Gateway "
            "and WhatsApp did not become healthy within 45 seconds"
        )
