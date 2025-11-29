import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Calendar, Clock, MapPin, User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './EventsPage.css';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  allowedRoles: string[];
  organizer: string;
  createdAt: any;
}

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // Проста заявка без orderBy за множество полета - същата като в Home
      const snapshot = await getDocs(collection(db, "events"));
      const eventsData: Event[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));

      // Филтрирай само бъдещи събития и сортирай ръчно
      const today = new Date().toISOString().split('T')[0];
      const futureEvents = eventsData
        .filter(event => event.date && event.date >= today)
        .sort((a, b) => {
          // Първо сортирай по дата
          if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }
          // Ако датата е същата, сортирай по време
          return a.time.localeCompare(b.time);
        });
      
      setEvents(futureEvents);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching events:", error);
      // Fallback данни при грешка
        setEvents([]);
      setLoading(false);
    }
  };

  const getAvailableSpots = (event: Event) => {
    return event.maxParticipants - event.currentParticipants;
  };

  const isEventFull = (event: Event) => {
    return event.currentParticipants >= event.maxParticipants;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
console.log(formatDate);
  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  if (loading) {
    return (
      <div className="events-page">
        <div className="events-container">
          <div className="loading-spinner">Зареждане на събития...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      <div className="events-container">
        {/* Header */}
        <div className="events-header">
          <div className="events-title-section">
            <Calendar className="events-title-icon" />
            <h1>Предстоящи Събития</h1>
          </div>
          <p className="events-subtitle">
            Всички предстоящи събития в библиотеката
          </p>
        </div>

        {/* Events List */}
        <div className="events-content">
  {events.length > 0 ? (
    <>
      <div className="events-stats">
        <span className="events-count">
          Намерени {events.length} събития
        </span>
      </div>

      <table className="events-table">
        <thead className="events-table-header">
          <tr>
            <th>Дата</th>
            <th>Събитие</th>
            <th>Детайли</th>
            <th>Участници</th>
            <th>Статус</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              className={`event-table-row ${isEventFull(event) ? 'event-full' : ''}`}
              onClick={() => handleEventClick(event.id)}
            >
              {/* Date Column */}
              <td className="event-table-cell">
                <div className="event-date">
                  <div className="event-day">
                    {new Date(event.date).getDate()}
                  </div>
                  <div className="event-month">
                    {new Date(event.date).toLocaleDateString('bg-BG', { month: 'short' })}
                  </div>
                  <div className="event-weekday">
                    {new Date(event.date).toLocaleDateString('bg-BG', { weekday: 'short' })}
                  </div>
                </div>
              </td>

              {/* Title Column */}
              <td className="event-table-cell">
                <div className="event-title-section">
                  <h3 className="event-title">{event.title}</h3>
                  <p className="event-description">{event.description}</p>
                </div>
              </td>

              {/* Details Column */}
              <td className="event-table-cell">
                <div className="event-details">
                  <div className="event-detail">
                    <Clock className="detail-icon" />
                    <span>{event.time} - {event.endTime}</span>
                  </div>
                  <div className="event-detail">
                    <MapPin className="detail-icon" />
                    <span>{event.location}</span>
                  </div>
                  <div className="event-detail">
                    <User className="detail-icon" />
                    <span>{event.organizer || "Учебна библиотека"}</span>
                  </div>
                </div>
              </td>

              {/* Participants Column */}
              <td className="event-table-cell">
                <div className="event-participants">
                  <div className="participants-info">
                    <Users className="participants-icon" />
                    <span>{event.currentParticipants} / {event.maxParticipants}</span>
                  </div>
                  <div className="participants-progress">
                    <div 
                      className="participants-progress-bar"
                      style={{ 
                        width: `${(event.currentParticipants / event.maxParticipants) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </td>

              {/* Status Column */}
              <td className="event-table-cell">
                <div className="event-status">
                  {isEventFull(event) ? (
                    <span className="status-badge full-badge">Пълно</span>
                  ) : (
                    <span className="status-badge available-badge">Свободни места</span>
                  )}
                  <span className="spots-count">
                    {getAvailableSpots(event)} свободни
                  </span>
                </div>
              </td>

              {/* Action Column */}
              <td className="event-table-cell">
                <div className="event-action">
                  <button className="view-details-btn">
                    Виж повече
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  ) : (
    <div className="no-events">
      <Calendar size={64} className="no-events-icon" />
      <h3>Няма предстоящи събития</h3>
      <p>
        В момента няма предстоящи събития. Проверете отново по-късно за нови събития в учебната библиотека.
      </p>
    </div>
  )}
</div>
        </div>
        </div>
  );
};

export default EventsPage;