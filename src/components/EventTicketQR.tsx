// src/components/EventTicketQR.tsx
import React from "react";
import { QRCodeCanvas } from "qrcode.react";

interface EventTicketQRProps {
  ticketId: string;
  eventTitle: string;
  userName: string;
  userEmail?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
}

const EventTicketQR: React.FC<EventTicketQRProps> = ({ 
  ticketId, 
  eventTitle, 
  userName,
}) => {
  // Генерираме QR код САМО с ticketId за лесна обработка
  const qrValue = ticketId; // Тук е само ticketId, без JSON

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Билет за събитие</h2>
      <p><strong>Събитие:</strong> {eventTitle}</p>
      <p><strong>Име:</strong> {userName}</p>
      <p><strong>Номер на билет:</strong> <code>{ticketId}</code></p>
      <div style={{ margin: "20px 0" }}>
        <QRCodeCanvas value={qrValue} size={200} />
      </div>
      <p>Покажете този QR код при входа на събитието.</p>
      <div style={{ 
        fontSize: "12px", 
        color: "#666", 
        marginTop: "10px"
      }}>
        Билет №: {ticketId}
      </div>
    </div>
  );
};

export default EventTicketQR;