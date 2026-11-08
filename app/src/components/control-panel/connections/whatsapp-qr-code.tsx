"use client";

import { QRCodeSVG } from "qrcode.react";

type WhatsAppQRCodeProps = {
  payload: string;
};

// This component is responsible for rendering the QR code for the WhatsApp pairing process.
// It uses the QRCodeSVG component from the 'qrcode.react' library to generate the QR code based on the provided payload.
export default function WhatsAppQRCode({ payload }: WhatsAppQRCodeProps) {
  return (
    <div className="neon-whatsapp-qr">
      <QRCodeSVG value={payload} size={240} level="M" marginSize={4} />
    </div>
  );
}
