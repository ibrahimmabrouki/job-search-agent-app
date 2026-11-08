
# Run inside Docker:
# docker exec -e PYTHONPATH=/opt/hermes-manager -w /opt/hermes-manager job-search-agent /opt/hermes/.venv/bin/python tests/integration/test_reconnect_flow.py

import unittest
from unittest.mock import patch, call

from app.services.whatsapp_service import WhatsAppService


class TestReconnectFlow(unittest.TestCase):

    def test_reconnect_order(self):
        service = WhatsAppService()
        operations = []

        def record(name, result=None):
            def action(*args, **kwargs):
                operations.append(name)
                return result
            return action

        pairing_result = {
            "pairing_id": "test-pairing",
            "status": "installing",
        }

        with (
            patch.object(
                service,
                "get_bridge_identity",
                side_effect=record("get_bridge_identity", (329, 12345)),
            ),
            patch.object(
                service,
                "stop_gateway",
                side_effect=record("stop_gateway", {"ok": True}),
            ),
            patch.object(
                service,
                "wait_for_gateway_stop",
                side_effect=record("wait_for_gateway_stop"),
            ),
            patch.object(
                service,
                "verify_bridge_shutdown",
                side_effect=record("verify_bridge_shutdown"),
            ),
            patch.object(
                service,
                "clear_session",
                side_effect=record("clear_session"),
            ),
            patch.object(
                service,
                "start_pairing",
                side_effect=record("start_pairing", pairing_result),
            ),
        ):
            result = service.reconnect()

        self.assertEqual(
            operations,
            [
                "get_bridge_identity",
                "stop_gateway",
                "wait_for_gateway_stop",
                "verify_bridge_shutdown",
                "clear_session",
                "start_pairing",
            ],
        )

        self.assertEqual(result, pairing_result)

    def test_shutdown_failure_preserves_session(self):
        service = WhatsAppService()

        with (
            patch.object(
                service,
                "get_bridge_identity",
                return_value=(329, 12345),
            ),
            patch.object(
                service,
                "stop_gateway",
                return_value={"ok": True},
            ),
            patch.object(
                service,
                "wait_for_gateway_stop",
                side_effect=TimeoutError("Gateway did not stop"),
            ),
            patch.object(service, "verify_bridge_shutdown") as verify,
            patch.object(service, "clear_session") as clear,
            patch.object(service, "start_pairing") as start,
        ):
            with self.assertRaises(TimeoutError):
                service.reconnect()

            verify.assert_not_called()
            clear.assert_not_called()
            start.assert_not_called()

    def test_bridge_failure_preserves_session(self):
        service = WhatsAppService()

        with (
            patch.object(
                service,
                "get_bridge_identity",
                return_value=(329, 12345),
            ),
            patch.object(service, "stop_gateway", return_value={"ok": True}),
            patch.object(service, "wait_for_gateway_stop"),
            patch.object(
                service,
                "verify_bridge_shutdown",
                side_effect=RuntimeError("Bridge still running"),
            ),
            patch.object(service, "clear_session") as clear,
            patch.object(service, "start_pairing") as start,
        ):
            with self.assertRaises(RuntimeError):
                service.reconnect()

            clear.assert_not_called()
            start.assert_not_called()


if __name__ == "__main__":
    unittest.main(verbosity=2)
