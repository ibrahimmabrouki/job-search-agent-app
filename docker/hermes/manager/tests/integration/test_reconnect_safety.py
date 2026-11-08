
# Run inside Docker:
# docker exec -e PYTHONPATH=/opt/hermes-manager -w /opt/hermes-manager job-search-agent /opt/hermes/.venv/bin/python tests/integration/test_reconnect_safety.py

import unittest
from unittest.mock import patch

from app.services.whatsapp_service import WhatsAppService


class TestReconnectSafety(unittest.TestCase):

    def setUp(self):
        self.service = WhatsAppService()

    def test_gateway_running(self):
        with patch.object(
            self.service,
            "get_gateway_status",
            return_value={
                "gateway_running": True,
                "gateway_pid": 123,
                "gateway_state": "running",
            },
        ):
            self.assertFalse(self.service.gateway_is_stopped())

    def test_gateway_stopped(self):
        with patch.object(
            self.service,
            "get_gateway_status",
            return_value={
                "gateway_running": False,
                "gateway_pid": None,
                "gateway_state": "stopped",
            },
        ):
            self.assertTrue(self.service.gateway_is_stopped())

    def test_gateway_unknown_state(self):
        with patch.object(
            self.service,
            "get_gateway_status",
            return_value={},
        ):
            self.assertFalse(self.service.gateway_is_stopped())

    def test_bridge_process_missing(self):
        with patch(
            "pathlib.Path.read_bytes",
            side_effect=FileNotFoundError,
        ):
            self.assertFalse(
                self.service.bridge_is_running(329, 12345)
            )

    def test_bridge_running(self):
        fields = ["S"] + ["0"] * 18 + ["12345"]
        process_stat = ("329 (node) " + " ".join(fields)).encode()

        with patch(
            "pathlib.Path.read_bytes",
            return_value=process_stat,
        ):
            self.assertTrue(
                self.service.bridge_is_running(329, 12345)
            )

    def test_bridge_zombie(self):
        fields = ["Z"] + ["0"] * 18 + ["12345"]
        process_stat = ("329 (node) " + " ".join(fields)).encode()

        with patch(
            "pathlib.Path.read_bytes",
            return_value=process_stat,
        ):
            self.assertFalse(
                self.service.bridge_is_running(329, 12345)
            )

    def test_bridge_pid_reused(self):
        fields = ["S"] + ["0"] * 18 + ["99999"]
        process_stat = ("329 (node) " + " ".join(fields)).encode()

        with patch(
            "pathlib.Path.read_bytes",
            return_value=process_stat,
        ):
            self.assertFalse(
                self.service.bridge_is_running(329, 12345)
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)
