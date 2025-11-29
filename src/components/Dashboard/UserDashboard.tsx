// src/components/Dashboard/UserDashboard.tsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { BookOpen, Calendar, Search, Trash2, Clock, CheckCircle, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import './UserDashboard.css';

interface Book {
  id: string;
  title: string;
  author: string;
  status: 'active' | 'expiring' | 'returned';
  dueDate?: string;
}

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
  participants: string[];
}

const UserDashboard: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"books" | "events">("books");
  const [loading, setLoading] = useState(true);
  const [processingEvent, setProcessingEvent] = useState<string | null>(null);
  
  const { user } = useAuth();
  const location = useLocation();

  // Зареждане на книги
  const fetchBooks = async () => {
    const booksData: Book[] = [
      {
        id: '1',
        title: 'Името на вятъра',
        author: 'Патрик Ротфус',
        status: 'active',
        dueDate: '2024-03-15'
      },
      {
        id: '2',
        title: 'Хобитът',
        author: 'Дж. Р. Р. Толкин',
        status: 'expiring',
        dueDate: '2024-02-20'
      },
      {
        id: '3',
        title: 'Уловка-22',
        author: 'Джоузеф Хелър',
        status: 'returned'
      }
    ];
    setBooks(booksData);
  };

  // Зареждане на реални събития от Firestore
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "events"));
      const eventsData: Event[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          date: data.date || '',
          time: data.time || '',
          endTime: data.endTime || '',
          location: data.location || '',
          maxParticipants: data.maxParticipants || 0,
          currentParticipants: data.currentParticipants || 0,
          allowedRoles: data.allowedRoles || [],
          organizer: data.organizer || '',
          participants: data.participants || []
        };
      });
      
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Проверка дали потребителят е записан за събитие
  const isUserRegistered = (event: Event): boolean => {
    return user && event.participants ? event.participants.includes(user.uid) : false;
  };

  // Регистриране за събитие
  const registerForEvent = async (eventId: string) => {
    if (!user) {
      alert('Моля, влезте в профила си!');
      return;
    }

    try {
      setProcessingEvent(eventId);
      
      const eventRef = doc(db, "events", eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) {
        alert("Събитието не е намерено!");
        return;
      }

      const eventData = eventSnap.data() as Event;

      // Проверка дали вече е записан
      if (isUserRegistered(eventData)) {
        alert("Вече сте записани за това събитие!");
        return;
      }

      // Проверка за свободни места
      if (eventData.currentParticipants >= eventData.maxParticipants) {
        alert("Събитието е пълно!");
        return;
      }

      // Актуализиране на събитието в Firestore
      await updateDoc(eventRef, {
        currentParticipants: eventData.currentParticipants + 1,
        participants: arrayUnion(user.uid)
      });

      // Актуализиране на локалното състояние
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                currentParticipants: event.currentParticipants + 1,
                participants: [...(event.participants || []), user.uid]
              } 
            : event
        )
      );

      alert(`Успешно се записахте за "${eventData.title}"!`);
      
    } catch (error) {
      console.error("Грешка при записване:", error);
      alert("Възникна грешка при записването. Опитайте отново.");
    } finally {
      setProcessingEvent(null);
    }
  };

  // Отказване от събитие
  const unregisterFromEvent = async (eventId: string) => {
    if (!user) return;

    try {
      setProcessingEvent(eventId);
      
      const eventRef = doc(db, "events", eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) return;

      const eventData = eventSnap.data() as Event;

      // Проверка дали е записан
      if (!isUserRegistered(eventData)) {
        alert("Не сте записани за това събитие!");
        return;
      }

      // Актуализиране на събитието в Firestore
      await updateDoc(eventRef, {
        currentParticipants: Math.max(0, eventData.currentParticipants - 1),
        participants: arrayRemove(user.uid)
      });

      // Актуализиране на локалното състояние
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                currentParticipants: Math.max(0, event.currentParticipants - 1),
                participants: event.participants?.filter(uid => uid !== user.uid) || []
              } 
            : event
        )
      );

      alert(`Успешно се отписахте от "${eventData.title}"!`);
      
    } catch (error) {
      console.error("Грешка при отписване:", error);
      alert("Възникна грешка при отписването. Опитайте отново.");
    } finally {
      setProcessingEvent(null);
    }
  };

  // Автоматично записване при пренасочване от Home страницата
  useEffect(() => {
    const selectedEvent = location.state?.selectedEvent;
    
    if (selectedEvent && user) {
      const autoRegister = async () => {
        const eventId = selectedEvent.id;
        
        // Проверка дали вече е записан
        const eventToRegister = events.find(event => event.id === eventId);
        if (eventToRegister && !isUserRegistered(eventToRegister)) {
          await registerForEvent(eventId);
        }
        
        // Премахване на selectedEvent от state
        window.history.replaceState({}, document.title);
      };

      autoRegister();
    }
  }, [location.state, user, events]);

  useEffect(() => {
    fetchBooks();
    fetchEvents();
  }, []);

  // Връщане на книга
  const returnBook = async (bookId: string) => {
    const updatedBooks = books.map(book => 
      book.id === bookId ? { ...book, status: 'returned' as const, dueDate: undefined } : book
    );
    setBooks(updatedBooks);
  };

  // Филтрирани данни
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'expiring': return 'status-expiring';
      case 'returned': return 'status-returned';
      default: return 'status-default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активна';
      case 'expiring': return 'Изтича скоро';
      case 'returned': return 'Върната';
      default: return 'Неизвестен';
    }
  };

  // Функция за налични места
  const getAvailableSpots = (event: Event) => {
    return Math.max(0, event.maxParticipants - event.currentParticipants);
  };

  // Функция за проверка дали събитието е пълно
  const isEventFull = (event: Event) => {
    return getAvailableSpots(event) <= 0;
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Моят Профил</h1>
          <p>Управление на вашите книги и събития</p>
        </div>

        {/* Search */}
        <div className="search-section">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Търсене по заглавие, автор или събитие..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-section">
          <button 
            className={`tab-button ${activeTab === "books" ? "active" : ""}`}
            onClick={() => setActiveTab("books")}
          >
            <BookOpen size={18} />
            Моите Книги ({books.length})
          </button>
          <button 
            className={`tab-button ${activeTab === "events" ? "active" : ""}`}
            onClick={() => setActiveTab("events")}
          >
            <Calendar size={18} />
            Събития ({events.length})
          </button>
        </div>

        {/* Books Tab */}
        {activeTab === "books" && (
          <div className="content-section">
            <h2>Моите Книги</h2>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Заглавие</th>
                    <th>Автор</th>
                    <th>Статус</th>
                    <th>Краен срок</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map(book => (
                    <tr key={book.id}>
                      <td className="book-title">
                        <BookOpen className="book-icon" />
                        {book.title}
                      </td>
                      <td className="book-author">{book.author}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(book.status)}`}>
                          {getStatusText(book.status)}
                        </span>
                      </td>
                      <td className="due-date">
                        {book.dueDate || 'Няма'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {book.status !== 'returned' && (
                            <button
                              onClick={() => returnBook(book.id)}
                              className="return-btn"
                              title="Върни книга"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button
                            className="delete-btn"
                            title="Преглед"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBooks.length === 0 && (
                <div className="empty-state">
                  <BookOpen size={32} />
                  <p>Няма намерени книги</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="content-section">
            <h2>Библиотечни Събития</h2>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Заглавие</th>
                    <th>Описание</th>
                    <th>Дата и час</th>
                    <th>Място</th>
                    <th>Места</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="loading-cell">
                        Зареждане на събития...
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map(event => {
                      const userRegistered = isUserRegistered(event);
                      const availableSpots = getAvailableSpots(event);
                      const isFull = isEventFull(event);
                      const isProcessing = processingEvent === event.id;
                      
                      return (
                        <tr key={event.id}>
                          <td className="event-title">{event.title}</td>
                          <td className="event-desc">{event.description}</td>
                          <td className="event-date">
                            <div>
                              <Clock className="date-icon" />
                              {event.date}
                            </div>
                            <div className="event-time">
                              {event.time} - {event.endTime}
                            </div>
                          </td>
                          <td className="event-location">
                            <User className="location-icon" />
                            {event.location}
                          </td>
                          <td className="event-spots">
                            <span className={`spots-count ${isFull ? 'spots-full' : ''}`}>
                              {availableSpots} / {event.maxParticipants}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${userRegistered ? 'status-active' : isFull ? 'status-expiring' : 'status-default'}`}>
                              {userRegistered ? 'Записан' : isFull ? 'Пълно' : 'Свободно'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              {userRegistered ? (
                                <button
                                  onClick={() => unregisterFromEvent(event.id)}
                                  className="unregister-btn"
                                  disabled={isProcessing}
                                  title="Откажи записването"
                                >
                                  {isProcessing ? '...' : 'Откажи'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => registerForEvent(event.id)}
                                  className="register-btn"
                                  disabled={isFull || isProcessing}
                                  title={isFull ? 'Събитието е пълно' : 'Запиши се'}
                                >
                                  {isProcessing ? '...' : isFull ? 'Пълно' : 'Запиши се'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {!loading && filteredEvents.length === 0 && (
                <div className="empty-state">
                  <Calendar size={32} />
                  <p>Няма намерени събития</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;