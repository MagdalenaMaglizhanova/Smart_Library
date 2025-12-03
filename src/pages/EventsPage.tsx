import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Calendar, Clock, MapPin, User, Users, ArrowRight, BookOpen, Search } from 'lucide-react';
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
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'full'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, statusFilter]);

  const fetchEvents = async () => {
    try {
      const snapshot = await getDocs(collection(db, "events"));
      const eventsData: Event[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));

      const today = new Date().toISOString().split('T')[0];
      const futureEvents = eventsData
        .filter(event => event.date && event.date >= today)
        .sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }
          return a.time.localeCompare(b.time);
        });
      
      setEvents(futureEvents);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === 'available') {
      filtered = filtered.filter(event => event.currentParticipants < event.maxParticipants);
    } else if (statusFilter === 'full') {
      filtered = filtered.filter(event => event.currentParticipants >= event.maxParticipants);
    }

    setFilteredEvents(filtered);
  };

  const getAvailableSpots = (event: Event) => {
    return event.maxParticipants - event.currentParticipants;
  };

  const isEventFull = (event: Event) => {
    return event.currentParticipants >= event.maxParticipants;
  };

  const formatCalendarDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('bg-BG', { month: 'short' }),
      weekday: date.toLocaleDateString('bg-BG', { weekday: 'short' })
    };
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  if (loading) {
    return (
      <div className="events-page">
        <div className="events-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Зареждане на събития...</span>
          </div>
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
            <div className="title-icon-wrapper">
              <Calendar className="events-title-icon" />
            </div>
            <div className="title-content">
              <h1 className="handwritten-title">Предстоящи Събития</h1>
              <p className="events-subtitle">
                Всички предстоящи събития в библиотеката
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="events-filters">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Търсете събития по име, описание, място..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Всички
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'available' ? 'active' : ''}`}
              onClick={() => setStatusFilter('available')}
            >
              Свободни места
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'full' ? 'active' : ''}`}
              onClick={() => setStatusFilter('full')}
            >
              Пълни
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="events-content">
          {filteredEvents.length > 0 ? (
            <>
              <div className="events-stats">
                <BookOpen className="stats-icon" />
                <span className="events-count">
                  {filteredEvents.length} от {events.length} събития
                </span>
                {searchTerm && (
                  <span className="search-results">
                    Резултати за "{searchTerm}"
                  </span>
                )}
              </div>

              <div className="events-table-container">
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
                    {filteredEvents.map((event, index) => {
                      const calendarDate = formatCalendarDate(event.date);
                      const colorVariants = ['event-green', 'event-yellow', 'event-red', 'event-blue'];
                      const colorClass = colorVariants[index % colorVariants.length];
                      
                      return (
                        <tr
                          key={event.id}
                          className={`event-table-row ${colorClass} ${isEventFull(event) ? 'event-full' : ''}`}
                          onClick={() => handleEventClick(event.id)}
                        >
                          {/* Date Column */}
                          <td className="event-table-cell">
                            <div className="event-date">
                              <div className="calendar-date">
                                <div className="calendar-day">{calendarDate.day}</div>
                                <div className="calendar-month">{calendarDate.month}</div>
                                <div className="calendar-weekday">{calendarDate.weekday}</div>
                              </div>
                            </div>
                          </td>

                          {/* Title Column */}
                          <td className="event-table-cell">
                            <div className="event-title-section">
                              <h3 className="event-title">{event.title}</h3>
                              <div 
      className="event-description"
      dangerouslySetInnerHTML={{ __html: event.description }}
    />
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
                                <span>Виж повече</span>
                                <ArrowRight className="btn-icon" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="no-events">
              <Calendar size={80} className="no-events-icon" />
              <h3 className="handwritten-title-small">
                {searchTerm || statusFilter !== 'all' ? 'Няма намерени събития' : 'Няма предстоящи събития'}
              </h3>
              <p>
                {searchTerm 
                  ? `Няма резултати за "${searchTerm}". Опитайте с различна ключова дума.`
                  : statusFilter !== 'all'
                  ? 'Няма събития, отговарящи на избрания филтър.'
                  : 'В момента няма предстоящи събития. Проверете отново по-късно за нови събития в учебната библиотека.'
                }
              </p>
              {(searchTerm || statusFilter !== 'all') && (
                <button 
                  className="clear-filters-btn"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Изчисти филтрите
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsPage;