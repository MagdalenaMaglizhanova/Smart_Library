// src/components/EventTicketQR.tsx
import React from "react";
import { QRCodeCanvas } from "qrcode.react";

interface EventTicketQRProps {
  ticketId: string;
  eventTitle: string;
  userName: string;
}

const EventTicketQR: React.FC<EventTicketQRProps> = ({ ticketId, eventTitle, userName }) => {
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Билет за събитие</h2>
      <p><strong>Събитие:</strong> {eventTitle}</p>
      <p><strong>Име:</strong> {userName}</p>
      <QRCodeCanvas value={ticketId} size={200} />
      <p>Покажете този QR код при входа на събитието.</p>
    </div>
  );
};

export default EventTicketQR;
