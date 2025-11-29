// src/components/Dashboard/LibrarianDashboard.tsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { 
  Calendar, Trash2, Plus, Search, Clock, 
  MapPin, User, Edit, X, Save, Building, Book, UserCheck, 
  Bookmark,
} from "lucide-react";
import './LibrarianDashboard.css';

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

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  publishedYear: number;
  publisher: string;
  language: string;
  imageUrl: string;
  createdAt: any;
  tags: string[];
  rating: number;
}

interface Reservation {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  userEmail: string;
  reservedAt: any;
  status: 'active' | 'completed' | 'cancelled';
  pickupDate?: string;
  returnDate?: string;
}

interface RoomBooking {
  id: string;
  room: string;
  date: string;
  time: string;
  endTime: string;
  eventId: string;
  eventTitle: string;
}

const LibrarianDashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([]);
  const [activeTab, setActiveTab] = useState<"books" | "events" | "reservations" | "rooms">("books");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Book Form State
  const [newBook, setNewBook] = useState<Omit<Book, 'id' | 'createdAt'>>({
    title: "",
    author: "",
    isbn: "",
    category: "",
    description: "",
    totalCopies: 1,
    availableCopies: 1,
    publishedYear: new Date().getFullYear(),
    publisher: "",
    language: "български",
    imageUrl: "",
    tags: [],
    rating: 0
  });

  // Event Form State
  const [newEvent, setNewEvent] = useState<Omit<Event, 'id' | 'createdAt' | 'currentParticipants'>>({
    title: "",
    description: "",
    date: "",
    time: "",
    endTime: "",
    location: "",
    maxParticipants: 20,
    allowedRoles: ["reader", "librarian"],
    organizer: ""
  });

  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editBookData, setEditBookData] = useState<Partial<Book>>({});
  const [editEventData, setEditEventData] = useState<Partial<Event>>({});

  // Categories for books
  const bookCategories = [
    "Българска класика", "Световна класика", "Съвременна литература", 
    "Исторически романи", "Фантастика", "Фентъзи", "Трилъри", 
    "Романси", "Биографии", "Наука", "Образование", "Детски книги",
    "Поезия", "Драма", "Пътеписи", "Философия", "Психология"
  ];

  const locationOptions = [
    "1303", "3310", "3301-EOП", "3305-АНП", "библиотека", "Комп.каб.-ТЧ", 
    "Физкултура3", "1201", "1202", "1203", "1206", "1408-КК", "1308-КК", 
    "1101", "1102", "1103", "1104", "1105", "1106", "1204", "1205", "1207", 
    "1209", "1301", "1302", "1304", "1305", "1307", "1309", "1401", "1402", 
    "1403", "1404", "1405", "1406", "1407", "1409", "1306"
  ];

  const timeSlots = [
    "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", 
    "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", 
    "17:00-18:00", "18:00-19:00", "19:00-20:00"
  ];

  // Генериране на часове с минути
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 7; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptionsWithMinutes = generateTimeOptions();

  // Проверка за конфликти на резервации
  const hasBookingConflict = (
    room: string, 
    date: string, 
    startTime: string, 
    endTime: string, 
    excludeEventId?: string
  ): boolean => {
    return roomBookings.some(booking => {
      // Пропускаме събитието, което редактираме
      if (excludeEventId && booking.id === excludeEventId) return false;
      
      // Проверяваме дали е същата стая и дата
      if (booking.room !== room || booking.date !== date) return false;
      
      // Проверяваме за застъпване на времеви интервали
      const newStart = startTime;
      const newEnd = endTime;
      const existingStart = booking.time;
      const existingEnd = booking.endTime;
      
      // Конфликт възниква, ако:
      // - новият начален час е между съществуващия интервал
      // - новият краен час е между съществуващия интервал  
      // - съществуващият интервал е напълно в новия интервал
      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });
  };

  // Закръгляне на начален час надолу и краен час нагоре
  const getRoundedTimeRange = (startTime: string, endTime: string): { roundedStart: string, roundedEnd: string } => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    // Начален час - закръгляме към по-близкия час
    let roundedStartHours = startHours;
    if (startMinutes >= 30) {
      roundedStartHours = startHours + 1;
    }
    const roundedStart = `${roundedStartHours.toString().padStart(2, '0')}:00`;
    
    // Краен час - закръгляме към по-близкия час
    let roundedEndHours = endHours;
    if (endMinutes > 0) {
      roundedEndHours = endHours + 1;
    }
    const roundedEnd = `${roundedEndHours.toString().padStart(2, '0')}:00`;
    
    return { roundedStart, roundedEnd };
  };

  // Генериране на всички часове между закръглените начален и краен час
  const getTimeSlotsInRange = (startTime: string, endTime: string): string[] => {
    const { roundedStart, roundedEnd } = getRoundedTimeRange(startTime, endTime);
    const slots: string[] = [];
    
    // Намираме началния и крайния час като числа
    const startHour = parseInt(roundedStart.split(':')[0]);
    const endHour = parseInt(roundedEnd.split(':')[0]);
    
    // Генерираме часовете между началния и крайния час
    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(timeString);
    }
    
    return slots;
  };

  // Проверка дали стаята е заета за конкретен ден и час
  const isRoomBooked = (room: string, date: string, timeSlot: string) => {
    return roomBookings.some(booking => 
      booking.room === room && 
      booking.date === date &&
      getTimeSlotsInRange(booking.time, booking.endTime).includes(timeSlot)
    );
  };

  // Вземане на информация за резервацията
  const getBookingInfo = (room: string, date: string, timeSlot: string) => {
    const booking = roomBookings.find(booking => 
      booking.room === room && 
      booking.date === date &&
      getTimeSlotsInRange(booking.time, booking.endTime).includes(timeSlot)
    );
    return booking;
  };

  // Зареждане на данни
  const fetchEvents = async () => {
    const snapshot = await getDocs(collection(db, "events"));
    const eventsData: Event[] = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Event));
    setEvents(eventsData);
    updateRoomBookings(eventsData);
  };

  const fetchBooks = async () => {
    const snapshot = await getDocs(collection(db, "books"));
    const booksData: Book[] = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Book));
    setBooks(booksData);
  };

  const fetchReservations = async () => {
    const snapshot = await getDocs(collection(db, "reservations"));
    const reservationsData: Reservation[] = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Reservation));
    setReservations(reservationsData);
  };

  // Актуализиране на резервациите на стаи
  const updateRoomBookings = (eventsData: Event[]) => {
    const bookings: RoomBooking[] = [];
    eventsData.forEach(event => {
      if (event.date && event.time && event.endTime && event.location) {
        bookings.push({
          id: event.id,
          room: event.location,
          date: event.date,
          time: event.time,
          endTime: event.endTime,
          eventId: event.id,
          eventTitle: event.title
        });
      }
    });
    setRoomBookings(bookings);
  };

  useEffect(() => {
    fetchEvents();
    fetchBooks();
    fetchReservations();
  }, []);

  // Book Management Functions
  const createBook = async () => {
    if (!newBook.title.trim() || !newBook.author.trim() || !newBook.category) return;

    const bookData = {
      ...newBook,
      availableCopies: newBook.totalCopies,
      createdAt: new Date(),
    };

    await addDoc(collection(db, "books"), bookData);
    
    // Reset form
    setNewBook({
      title: "",
      author: "",
      isbn: "",
      category: "",
      description: "",
      totalCopies: 1,
      availableCopies: 1,
      publishedYear: new Date().getFullYear(),
      publisher: "",
      language: "български",
      imageUrl: "",
      tags: [],
      rating: 0
    });
    
    fetchBooks();
  };

  const deleteBook = async (bookId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете книгата?")) return;
    await deleteDoc(doc(db, "books", bookId));
    fetchBooks();
  };

  const startEditingBook = (book: Book) => {
    setEditingBook(book);
    setEditBookData({ ...book });
  };

  const cancelEditingBook = () => {
    setEditingBook(null);
    setEditBookData({});
  };

  const saveBook = async () => {
    if (!editingBook || !editBookData.title?.trim() || !editBookData.author?.trim()) return;

    try {
      await updateDoc(doc(db, "books", editingBook.id), {
        ...editBookData,
        updatedAt: new Date()
      });
      
      setEditingBook(null);
      setEditBookData({});
      fetchBooks();
    } catch (error) {
      console.error("Error updating book:", error);
      alert("Грешка при обновяване на книгата");
    }
  };

  // Event Management Functions
  const createEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date || !newEvent.time || !newEvent.endTime || !newEvent.location) return;

    // Проверка за конфликт
    if (hasBookingConflict(newEvent.location, newEvent.date, newEvent.time, newEvent.endTime)) {
      alert("Стаята е вече резервирана за избрания времеви интервал! Моля, изберете друго време или място.");
      return;
    }

    const eventData = {
      ...newEvent,
      currentParticipants: 0,
      createdAt: new Date(),
    };

    await addDoc(collection(db, "events"), eventData);
    
    // Reset form
    setNewEvent({
      title: "",
      description: "",
      date: "",
      time: "",
      endTime: "",
      location: "",
      maxParticipants: 20,
      allowedRoles: ["reader", "librarian"],
      organizer: ""
    });
    
    fetchEvents();
  };

  const deleteEvent = async (eventId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете събитието?")) return;
    await deleteDoc(doc(db, "events", eventId));
    fetchEvents();
  };

  const startEditingEvent = (event: Event) => {
    setEditingEvent(event);
    setEditEventData({ ...event });
  };

  const cancelEditingEvent = () => {
    setEditingEvent(null);
    setEditEventData({});
  };

  const saveEvent = async () => {
    if (!editingEvent || !editEventData.title?.trim() || !editEventData.date || !editEventData.time) return;

    // Проверка за конфликт при редактиране (изключваме текущото събитие)
    if (hasBookingConflict(
      editEventData.location || '', 
      editEventData.date || '', 
      editEventData.time || '', 
      editEventData.endTime || '', 
      editingEvent.id
    )) {
      alert("Стаята е вече резервирана за избрания времеви интервал! Моля, изберете друго време или място.");
      return;
    }

    try {
      await updateDoc(doc(db, "events", editingEvent.id), {
        ...editEventData,
        updatedAt: new Date()
      });
      
      setEditingEvent(null);
      setEditEventData({});
      fetchEvents();
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Грешка при обновяване на събитието");
    }
  };

  // Reservation Management
  const updateReservationStatus = async (reservationId: string, status: Reservation['status']) => {
    await updateDoc(doc(db, "reservations", reservationId), {
      status,
      updatedAt: new Date()
    });
    fetchReservations();
  };

  // Филтрирани данни
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || book.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReservations = reservations.filter(reservation =>
    reservation.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper functions
  const getAvailableSpots = (event: Event) => {
    return event.maxParticipants - event.currentParticipants;
  };

  const isEventFull = (event: Event) => {
    return event.currentParticipants >= event.maxParticipants;
  };

  const getBookReservations = (bookId: string) => {
    return reservations.filter(r => r.bookId === bookId && r.status === 'active');
  };

  return (
    <div className="librarian-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Библиотекарски Панел</h1>
          <p>Управление на книги, събития и резервации</p>
        </div>

        {/* Search and Filter */}
        <div className="search-section">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Търсене по заглавие, автор, име..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          {activeTab === "books" && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">Всички категории</option>
              {bookCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs-section">
          <button 
            className={`tab-button ${activeTab === "books" ? "active" : ""}`}
            onClick={() => setActiveTab("books")}
          >
            <Book size={18} />
            Книги ({books.length})
          </button>
          <button 
            className={`tab-button ${activeTab === "events" ? "active" : ""}`}
            onClick={() => setActiveTab("events")}
          >
            <Calendar size={18} />
            Събития ({events.length})
          </button>
          <button 
            className={`tab-button ${activeTab === "reservations" ? "active" : ""}`}
            onClick={() => setActiveTab("reservations")}
          >
            <Bookmark size={18} />
            Резервации ({reservations.filter(r => r.status === 'active').length})
          </button>
          <button 
            className={`tab-button ${activeTab === "rooms" ? "active" : ""}`}
            onClick={() => setActiveTab("rooms")}
          >
            <Building size={18} />
            Стаи ({locationOptions.length})
          </button>
        </div>

        {/* Books Tab */}
        {activeTab === "books" && (
          <div className="content-section">
            <h2>Управление на Книги</h2>
            
            {/* Add Book Form */}
            <div className="create-card">
              <div className="card-header">
                <h3>Добави Нова Книга</h3>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Заглавие *</label>
                    <input
                      type="text"
                      placeholder="Заглавие на книгата"
                      value={newBook.title}
                      onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Автор *</label>
                    <input
                      type="text"
                      placeholder="Име на автора"
                      value={newBook.author}
                      onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Категория *</label>
                    <select
                      value={newBook.category}
                      onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                      className="form-input"
                    >
                      <option value="">Изберете категория</option>
                      {bookCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ISBN</label>
                    <input
                      type="text"
                      placeholder="ISBN номер"
                      value={newBook.isbn}
                      onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Общ брой копия</label>
                    <input
                      type="number"
                      min="1"
                      value={newBook.totalCopies}
                      onChange={(e) => setNewBook({...newBook, totalCopies: parseInt(e.target.value) || 1})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Година на издаване</label>
                    <input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={newBook.publishedYear}
                      onChange={(e) => setNewBook({...newBook, publishedYear: parseInt(e.target.value) || new Date().getFullYear()})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Описание</label>
                    <textarea
                      placeholder="Описание на книгата"
                      value={newBook.description}
                      onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                      className="form-input textarea"
                      rows={3}
                    />
                  </div>
                  <div className="form-group full-width">
                    <button
                      onClick={createBook}
                      disabled={!newBook.title.trim() || !newBook.author.trim() || !newBook.category}
                      className="create-btn primary-btn"
                    >
                      <Plus size={16} />
                      Добави Книга
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Books List */}
            <div className="list-section">
              <h3>Всички Книги ({filteredBooks.length})</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Заглавие</th>
                      <th>Автор</th>
                      <th>Категория</th>
                      <th>Налични</th>
                      <th>Резервации</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map(book => {
                      const bookReservations = getBookReservations(book.id);
                      return (
                        <tr key={book.id} className={book.availableCopies === 0 ? 'book-unavailable' : ''}>
                          <td className="book-info-cell">
                            {editingBook?.id === book.id ? (
                              <input
                                type="text"
                                value={editBookData.title || ''}
                                onChange={(e) => setEditBookData({...editBookData, title: e.target.value})}
                                className="edit-input"
                              />
                            ) : (
                              <div className="book-title-section">
                                <div className="book-title">{book.title}</div>
                                <div className="book-isbn">{book.isbn}</div>
                              </div>
                            )}
                          </td>
                          <td>
                            {editingBook?.id === book.id ? (
                              <input
                                type="text"
                                value={editBookData.author || ''}
                                onChange={(e) => setEditBookData({...editBookData, author: e.target.value})}
                                className="edit-input"
                              />
                            ) : (
                              book.author
                            )}
                          </td>
                          <td>
                            {editingBook?.id === book.id ? (
                              <select
                                value={editBookData.category || ''}
                                onChange={(e) => setEditBookData({...editBookData, category: e.target.value})}
                                className="edit-input"
                              >
                                {bookCategories.map(category => (
                                  <option key={category} value={category}>{category}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="category-tag">{book.category}</span>
                            )}
                          </td>
                          <td>
                            <div className="copies-info">
                              {editingBook?.id === book.id ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={editBookData.availableCopies || 0}
                                  onChange={(e) => setEditBookData({
                                    ...editBookData, 
                                    availableCopies: parseInt(e.target.value) || 0,
                                    totalCopies: Math.max(parseInt(e.target.value) || 0, editBookData.totalCopies || book.totalCopies)
                                  })}
                                  className="edit-input small"
                                />
                              ) : (
                                <>
                                  <span className={`available-copies ${book.availableCopies === 0 ? 'none-available' : ''}`}>
                                    {book.availableCopies}
                                  </span>
                                  <span className="total-copies">/ {book.totalCopies}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="reservations-count">
                              <Bookmark size={14} />
                              {bookReservations.length}
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              {editingBook?.id === book.id ? (
                                <>
                                  <button
                                    onClick={saveBook}
                                    className="save-btn"
                                    title="Запази"
                                    disabled={!editBookData.title?.trim() || !editBookData.author?.trim()}
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button
                                    onClick={cancelEditingBook}
                                    className="cancel-btn"
                                    title="Откажи"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditingBook(book)}
                                    className="edit-btn"
                                    title="Редактирай"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => deleteBook(book.id)}
                                    className="delete-btn"
                                    title="Изтрий"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredBooks.length === 0 && (
                  <div className="empty-state">
                    <Book size={32} />
                    <p>Няма намерени книги</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="content-section">
            <h2>Управление на Събития</h2>
            
            {/* Create Event Form */}
            <div className="create-card">
              <div className="card-header">
                <h3>Създай Ново Събитие</h3>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Заглавие *</label>
                    <input
                      type="text"
                      placeholder="Заглавие на събитието"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Дата *</label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      className="form-input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label>Начален час *</label>
                    <select
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      className="form-input"
                    >
                      <option value="">Изберете начален час</option>
                      {timeOptionsWithMinutes.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Краен час *</label>
                    <select
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                      className="form-input"
                    >
                      <option value="">Изберете краен час</option>
                      {timeOptionsWithMinutes.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Място *</label>
                    <select
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                      className={`form-input ${
                        newEvent.location && newEvent.date && newEvent.time && newEvent.endTime && 
                        hasBookingConflict(newEvent.location, newEvent.date, newEvent.time, newEvent.endTime) 
                          ? 'booking-conflict' 
                          : ''
                      }`}
                    >
                      <option value="">Изберете място</option>
                      {locationOptions.map(location => {
                        const hasConflict = newEvent.date && newEvent.time && newEvent.endTime && 
                          hasBookingConflict(location, newEvent.date, newEvent.time, newEvent.endTime);
                        
                        return (
                          <option 
                            key={location} 
                            value={location}
                            disabled={hasConflict || false}
                            style={{ color: hasConflict ? '#ccc' : '#000' }}
                          >
                            {location} {hasConflict ? '(Заето)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {newEvent.location && newEvent.date && newEvent.time && newEvent.endTime && 
                      hasBookingConflict(newEvent.location, newEvent.date, newEvent.time, newEvent.endTime) && (
                      <div className="validation-error">
                        Стаята е вече резервирана за избрания интервал!
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Брой места</label>
                    <input
                      type="number"
                      min="1"
                      value={newEvent.maxParticipants}
                      onChange={(e) => setNewEvent({...newEvent, maxParticipants: parseInt(e.target.value) || 1})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Описание</label>
                    <textarea
                      placeholder="Описание на събитието"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      className="form-input textarea"
                      rows={3}
                    />
                  </div>
                  <div className="form-group full-width">
                    <button
                      onClick={createEvent}
                      disabled={
                        !newEvent.title.trim() || 
                        !newEvent.date || 
                        !newEvent.time || 
                        !newEvent.endTime || 
                        !newEvent.location ||
                        hasBookingConflict(newEvent.location, newEvent.date, newEvent.time, newEvent.endTime)
                      }
                      className="create-btn primary-btn"
                    >
                      <Plus size={16} />
                      Създай Събитие
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Events List */}
            <div className="list-section">
              <h3>Всички Събития ({filteredEvents.length})</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Заглавие</th>
                      <th>Дата и час</th>
                      <th>Място</th>
                      <th>Участници</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map(event => (
                      <tr key={event.id} className={isEventFull(event) ? 'event-full' : ''}>
                        <td className="event-info-cell">
                          {editingEvent?.id === event.id ? (
                            <input
                              type="text"
                              value={editEventData.title || ''}
                              onChange={(e) => setEditEventData({...editEventData, title: e.target.value})}
                              className="edit-input"
                            />
                          ) : (
                            <div className="event-title-section">
                              <div className="event-title">{event.title}</div>
                              <div className="event-desc">{event.description}</div>
                            </div>
                          )}
                        </td>
                        <td className="event-time-cell">
                          {editingEvent?.id === event.id ? (
                            <div className="edit-form">
                              <input
                                type="date"
                                value={editEventData.date || ''}
                                onChange={(e) => setEditEventData({...editEventData, date: e.target.value})}
                                className="edit-input"
                              />
                              <div className="time-range-edit">
                                <select
                                  value={editEventData.time || ''}
                                  onChange={(e) => setEditEventData({...editEventData, time: e.target.value})}
                                  className="edit-input"
                                >
                                  {timeOptionsWithMinutes.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                                <span>до</span>
                                <select
                                  value={editEventData.endTime || ''}
                                  onChange={(e) => setEditEventData({...editEventData, endTime: e.target.value})}
                                  className="edit-input"
                                >
                                  {timeOptionsWithMinutes.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ) : (
                            <div className="event-time-display">
                              <div className="event-date">
                                <Calendar size={14} />
                                {new Date(event.date).toLocaleDateString('bg-BG')}
                              </div>
                              <div className="event-time-range">
                                <Clock size={14} />
                                {event.time} - {event.endTime}
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          {editingEvent?.id === event.id ? (
                            <select
                              value={editEventData.location || ''}
                              onChange={(e) => setEditEventData({...editEventData, location: e.target.value})}
                              className={`edit-input ${
                                editEventData.location && editEventData.date && editEventData.time && editEventData.endTime && 
                                hasBookingConflict(
                                  editEventData.location, 
                                  editEventData.date, 
                                  editEventData.time, 
                                  editEventData.endTime, 
                                  event.id
                                ) 
                                  ? 'booking-conflict' 
                                  : ''
                              }`}
                            >
                              <option value="">Изберете място</option>
                              {locationOptions.map(location => {
                                const hasConflict = editEventData.date && editEventData.time && editEventData.endTime && 
                                  hasBookingConflict(location, editEventData.date, editEventData.time, editEventData.endTime, event.id);
                                
                                return (
                                  <option 
                                    key={location} 
                                    value={location}
                                    disabled={hasConflict || false}
                                    style={{ color: hasConflict ? '#ccc' : '#000' }}
                                  >
                                    {location} {hasConflict ? '(Заето)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <div className="event-location">
                              <MapPin size={14} />
                              {event.location}
                            </div>
                          )}
                          {editingEvent?.id === event.id && editEventData.location && editEventData.date && editEventData.time && editEventData.endTime && 
                            hasBookingConflict(
                              editEventData.location, 
                              editEventData.date, 
                              editEventData.time, 
                              editEventData.endTime, 
                              event.id
                            ) && (
                            <div className="validation-error-small">
                              Стаята е заета за този интервал!
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="participants-info">
                            <div className="participants-count">
                              <User size={14} />
                              {event.currentParticipants} / {event.maxParticipants}
                            </div>
                            <div className="available-spots">
                              Свободни: {getAvailableSpots(event)}
                            </div>
                            {isEventFull(event) && (
                              <div className="full-badge">Пълно</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {editingEvent?.id === event.id ? (
                              <>
                                <button
                                  onClick={saveEvent}
                                  className="save-btn"
                                  title="Запази"
                                  disabled={
                                    !editEventData.title?.trim() || 
                                    !editEventData.date || 
                                    !editEventData.time || 
                                    !editEventData.endTime || 
                                    !editEventData.location ||
                                    hasBookingConflict(
                                      editEventData.location || '', 
                                      editEventData.date || '', 
                                      editEventData.time || '', 
                                      editEventData.endTime || '', 
                                      event.id
                                    )
                                  }
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={cancelEditingEvent}
                                  className="cancel-btn"
                                  title="Откажи"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditingEvent(event)}
                                  className="edit-btn"
                                  title="Редактирай"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => deleteEvent(event.id)}
                                  className="delete-btn"
                                  title="Изтрий"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredEvents.length === 0 && (
                  <div className="empty-state">
                    <Calendar size={32} />
                    <p>Няма намерени събития</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === "reservations" && (
          <div className="content-section">
            <h2>Управление на Резервации</h2>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon active-reservations">
                  <Bookmark size={24} />
                </div>
                <div className="stat-info">
                  <div className="stat-number">
                    {reservations.filter(r => r.status === 'active').length}
                  </div>
                  <div className="stat-label">Активни резервации</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon completed-reservations">
                  <UserCheck size={24} />
                </div>
                <div className="stat-info">
                  <div className="stat-number">
                    {reservations.filter(r => r.status === 'completed').length}
                  </div>
                  <div className="stat-label">Завършени</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon total-reservations">
                  <Book size={24} />
                </div>
                <div className="stat-info">
                  <div className="stat-number">{reservations.length}</div>
                  <div className="stat-label">Общо резервации</div>
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Книга</th>
                    <th>Потребител</th>
                    <th>Дата на резервация</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map(reservation => {
                    const book = books.find(b => b.id === reservation.bookId);
                    return (
                      <tr key={reservation.id}>
                        <td>
                          <div className="book-info">
                            <div className="book-title">{book?.title || "Неизвестна книга"}</div>
                            <div className="book-author">{book?.author}</div>
                          </div>
                        </td>
                        <td>
                          <div className="user-info">
                            <div className="user-name">{reservation.userName}</div>
                            <div className="user-email">{reservation.userEmail}</div>
                          </div>
                        </td>
                        <td>
                          {new Date(reservation.reservedAt?.toDate()).toLocaleDateString('bg-BG')}
                        </td>
                        <td>
                          <span className={`status-badge status-${reservation.status}`}>
                            {reservation.status === 'active' ? 'Активна' : 
                             reservation.status === 'completed' ? 'Завършена' : 'Отменена'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {reservation.status === 'active' && (
                              <>
                                <button
                                  onClick={() => updateReservationStatus(reservation.id, 'completed')}
                                  className="complete-btn"
                                  title="Маркирай като завършена"
                                >
                                  <UserCheck size={16} />
                                </button>
                                <button
                                  onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                                  className="cancel-btn"
                                  title="Откажи резервация"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredReservations.length === 0 && (
                <div className="empty-state">
                  <Bookmark size={32} />
                  <p>Няма намерени резервации</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === "rooms" && (
          <div className="content-section">
            <h2>Заетост на Стаи</h2>
            
            {/* Date Picker */}
            <div className="date-picker-section">
              <label htmlFor="room-date" className="date-picker-label">
                Изберете дата:
              </label>
              <input
                id="room-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-picker-input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Rooms Grid */}
            <div className="rooms-grid-container">
              <div className="rooms-timetable">
                {/* Header Row - Time Slots */}
                <div className="table-header-row">
                  <div className="corner-cell">Стая/Час</div>
                  {timeSlots.map(time => (
                    <div key={time} className="time-header-cell">
                      {time.split('-')[0]}
                    </div>
                  ))}
                </div>

                {/* Room Rows */}
                {locationOptions.map(room => (
                  <div key={room} className="table-row">
                    <div className="room-name-cell">
                      <Building size={16} />
                      <span>{room}</span>
                    </div>
                    {timeSlots.map(timeSlot => {
                      const [slotStart] = timeSlot.split('-');
                      const isBooked = isRoomBooked(room, selectedDate, slotStart);
                      const bookingInfo = getBookingInfo(room, selectedDate, slotStart);
                      
                      return (
                        <div
                          key={`${room}-${timeSlot}`}
                          className={`time-slot-cell ${isBooked ? 'booked' : 'available'}`}
                          title={
                            isBooked ? 
                            `Заето: ${bookingInfo?.eventTitle} (${bookingInfo?.time} - ${bookingInfo?.endTime})` : 
                            `Свободно: ${timeSlot}`
                          }
                        >
                          {isBooked && (
                            <div className="booking-indicator">
                              <div className="event-dot"></div>
                              <div className="event-tooltip">
                                <strong>{bookingInfo?.eventTitle}</strong>
                                <br />
                                {bookingInfo?.time} - {bookingInfo?.endTime}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="rooms-legend">
              <div className="legend-item">
                <div className="legend-color available"></div>
                <span>Свободна стая</span>
              </div>
              <div className="legend-item">
                <div className="legend-color booked"></div>
                <span>Заета стая</span>
              </div>
            </div>

            {/* Bookings List */}
            <div className="bookings-list">
              <h3>Резервации за {new Date(selectedDate).toLocaleDateString('bg-BG')}</h3>
              {roomBookings.filter(booking => booking.date === selectedDate).length > 0 ? (
                <div className="bookings-grid">
                  {roomBookings
                    .filter(booking => booking.date === selectedDate)
                    .map(booking => (
                      <div key={booking.id} className="booking-card">
                        <div className="booking-room">
                          <Building size={16} />
                          {booking.room}
                        </div>
                        <div className="booking-time">
                          <Clock size={16} />
                          {booking.time} - {booking.endTime}
                        </div>
                        <div className="booking-event">{booking.eventTitle}</div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="no-bookings">
                  <Calendar size={32} />
                  <p>Няма резервации за избраната дата</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibrarianDashboard;