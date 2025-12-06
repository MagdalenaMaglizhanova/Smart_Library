import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Calendar, Clock, MapPin, User, Users, ArrowRight, BookOpen, Search, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './EventsPage.css';
import { useAuth } from '../contexts/AuthContext'; // Импортирай useAuth

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
  
  // Използвай AuthContext вместо localStorage
  const { user, loading: authLoading } = useAuth();

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

  const handleEventRegistration = (event: Event) => {
    // Навигира към дашборда за записване
    navigate('/dashboard', { 
      state: { 
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location
      }
    });
  };

  const handleLoginRedirect = () => {
    // Навигира към страницата за вход
    navigate('/login', { 
      state: { 
        redirectTo: '/events',
        message: 'Моля, влезте в профила си, за да се запишете за събитие.' 
      }
    });
  };

  const handleParticipantsClick = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    alert(`Информация за участниците:\n\nЗаглавие: ${event.title}\nЗаписани: ${event.currentParticipants}\nМаксимум: ${event.maxParticipants}\nСвободни: ${getAvailableSpots(event)}`);
  };

  const handleStatusClick = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    if (isEventFull(event)) {
      alert(`Заглавие: ${event.title}\nТова събитие е пълно. Можете да се запишете в списъка за изчакване.`);
    } else {
      alert(`Заглавие: ${event.title}\nИма ${getAvailableSpots(event)} свободни места. Можете да се запишете.`);
    }
  };
console.log(handleStatusClick)
  // Ако все още зареждаме
  if (loading || authLoading) {
    return (
      <div className="events-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Зареждане на събития...</span>
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
                {!user && (
                  <div className="login-reminder">
                    <LogIn size={16} />
                    <span>Влезте, за да се запишете за събитие</span>
                  </div>
                )}
              </div>

              <div className="events-table-container">
                <table className="events-table">
                  <thead className="events-table-header">
                    <tr>
                      <th className="date-col">Дата</th>
                      <th className="title-col">Събитие</th>
                      <th className="details-col">Детайли</th>
                      <th className="participants-col">Участници</th>
                      <th className="action-col">Записване</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event, index) => {
                      const calendarDate = formatCalendarDate(event.date);
                      const availableSpots = getAvailableSpots(event);
                      const isFull = isEventFull(event);
                      
                      // Color variants for rows
                      const colorVariants = ['event-green', 'event-yellow', 'event-red', 'event-blue'];
                      const colorClass = colorVariants[index % colorVariants.length];
                      
                      return (
                        <tr
                          key={event.id}
                          className={`event-table-row ${colorClass} ${isFull ? 'event-full' : ''}`}
                        >
                          {/* Date Column */}
                          <td className="event-table-cell date-col">
                            <div className="event-date">
                              <div className="calendar-date">
                                <div className="calendar-day">{calendarDate.day}</div>
                                <div className="calendar-month">{calendarDate.month}</div>
                                <div className="calendar-weekday">{calendarDate.weekday}</div>
                              </div>
                              <div className="time-info">
                                <Clock size={14} />
                                <span>{event.time} - {event.endTime}</span>
                              </div>
                            </div>
                          </td>

                          {/* Title Column */}
                          <td className="event-table-cell title-col">
                            <div className="event-title-section">
                              <h1 className="event-title">{event.title}</h1>
                              <div 
                                className="event-description"
                                dangerouslySetInnerHTML={{ __html: event.description }}
                              />
                            </div>
                          </td>

                          {/* Details Column */}
                          <td className="event-table-cell details-col">
                            <div className="event-details">
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
                          <td className="event-table-cell participants-col">
                            <div 
                              className="event-participants"
                              onClick={(e) => handleParticipantsClick(e, event)}
                              style={{ cursor: 'pointer' }}
                            >
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
                                />
                              </div>
                              <div className="spots-info">
                                {isFull ? (
                                  <span className="full-text">Пълно</span>
                                ) : (
                                  <span className="available-text">{availableSpots} свободни</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Action Column */}
                          <td className="event-table-cell action-col">
                            <button 
                              className={`event-register-btn ${!user || isFull ? 'event-btn-disabled' : ''}`}
                              disabled={isFull}
                              onClick={() => {
                                if (!user) {
                                  handleLoginRedirect();
                                } else if (!isFull) {
                                  handleEventRegistration(event);
                                }
                              }}
                            >
                              {!user ? (
                                <>
                                  <LogIn size={16} />
                                  <span>Вход за записване</span>
                                </>
                              ) : isFull ? (
                                <span>Събитието е пълно</span>
                              ) : (
                                <>
                                  <span>Запиши се</span>
                                  <ArrowRight className="register-icon" />
                                </>
                              )}
                            </button>
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