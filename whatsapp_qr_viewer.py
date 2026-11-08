"""Live WhatsApp pairing QR viewer for the local Job Search Agent Manager.

Setup on Windows: py -m pip install "qrcode[pil]"
Run: py whatsapp_qr_viewer.py 4WFSuVQDR1zos0XfplvtDQ
"""

import argparse
import io
import json
import threading
import tkinter as tk
from tkinter import ttk
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import urlopen

import qrcode
from PIL import Image, ImageTk


class QRViewer:
    def __init__(self, root, pairing_id, manager_url):
        self.root = root
        self.pairing_id = pairing_id
        self.url = f"{manager_url.rstrip('/')}/whatsapp/poll/{quote(pairing_id, safe='')}"
        self.current_payload = None
        self.polling = False
        self.stopped = False
        self.photo = None

        root.title("WhatsApp — Live QR Pairing")
        root.geometry("530x610")
        root.resizable(False, False)
        root.configure(padx=24, pady=22)

        ttk.Label(root, text="WhatsApp pairing", font=("Segoe UI", 18, "bold")).pack(pady=(0, 6))
        ttk.Label(root, text="WhatsApp → Settings → Linked Devices → Link a Device").pack(pady=(0, 16))
        self.qr_label = ttk.Label(root, text="Fetching the current QR code…", anchor="center")
        self.qr_label.pack(expand=True)
        self.status = tk.StringVar(value="Checking pairing status…")
        ttk.Label(root, textvariable=self.status, font=("Segoe UI", 11)).pack(pady=(12, 8))
        ttk.Label(root, text="Refreshes automatically. Keep this window open while scanning.",
                  foreground="gray").pack()

        self.root.protocol("WM_DELETE_WINDOW", self.close)
        self.root.after(50, self.tick)

    def tick(self):
        if self.stopped:
            return
        if not self.polling:
            self.polling = True
            threading.Thread(target=self.fetch, daemon=True).start()
        self.root.after(1000, self.tick)

    def fetch(self):
        try:
            with urlopen(self.url, timeout=5) as response:
                result = json.load(response)
            self.root.after(0, lambda: self.show_result(result))
        except (HTTPError, URLError, TimeoutError, ValueError, OSError) as exc:
            message = str(exc)
            self.root.after(0, lambda: self.status.set(f"Cannot poll Manager: {message}"))
        finally:
            self.root.after(0, self.done_poll)

    def done_poll(self):
        self.polling = False

    def show_result(self, result):
        state = str(result.get("status", "unknown")).lower()
        payload = result.get("qr_payload")

        if state == "connected":
            self.status.set("Connected! Pairing succeeded. You can apply it now.")
            self.stopped = True
            return
        if state in ("expired", "failed", "error", "cancelled", "canceled", "applied"):
            self.status.set(f"Pairing {state}: {result.get('error') or 'Start a new pairing if needed.'}")
            self.stopped = True
            return

        self.status.set(f"Pairing status: {state} — QR refreshes automatically")
        if payload and payload != self.current_payload:
            # Encode the complete qr_payload exactly as the Manager returns it.
            # Do not strip the wa.me prefix or reformat the data.
            image = qrcode.make(payload, box_size=7, border=3).convert("RGB")
            image.thumbnail((445, 445), Image.Resampling.LANCZOS)
            self.photo = ImageTk.PhotoImage(image)
            self.qr_label.configure(image=self.photo, text="")
            self.current_payload = payload

    def close(self):
        self.stopped = True
        self.root.destroy()


def main():
    parser = argparse.ArgumentParser(description="Auto-refreshing WhatsApp pairing QR viewer")
    parser.add_argument("pairing_id", help="Pairing ID returned by POST /whatsapp/connect")
    parser.add_argument("--manager-url", default="http://127.0.0.1:9200")
    args = parser.parse_args()
    root = tk.Tk()
    QRViewer(root, args.pairing_id, args.manager_url)
    root.mainloop()


if __name__ == "__main__":
    main()
