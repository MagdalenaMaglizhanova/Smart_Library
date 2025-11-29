import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Users, Calendar, Trash2, Plus, Search, Clock, MapPin, User, Edit, X, Save, Building } from "lucide-react";
import './AdminDashboard.css';

interface User {
  id: string;
  email: string;
  role: string;
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
  createdAt: any;
  organizer: string;
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

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([]);
  const [newEventTitle, setNewEventTitle] = useState<string>("");
  const [newEventDesc, setNewEventDesc] = useState<string>("");
  const [newEventDate, setNewEventDate] = useState<string>("");
  const [newEventTime, setNewEventTime] = useState<string>("");
  const [newEventEndTime, setNewEventEndTime] = useState<string>("");
  const [newEventLocation, setNewEventLocation] = useState<string>("");
  const [newEventMaxParticipants, setNewEventMaxParticipants] = useState<number>(20);
  const [newEventOrganizer, setNewEventOrganizer] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"users" | "events" | "rooms">("users");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Event>>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Опции за падащи менюта
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

  // Валидация на час
  const validateTime = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  // Проверка дали краен час е след начален час
  const validateTimeRange = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return true;
    return endTime > startTime;
  };

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

  // Зареждане на потребители
  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const usersData: User[] = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as User));
    setUsers(usersData);
  };

  // Зареждане на събития
  const fetchEvents = async () => {
    const snapshot = await getDocs(collection(db, "events"));
    const eventsData: Event[] = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Event));
    setEvents(eventsData);
    updateRoomBookings(eventsData);
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
    fetchUsers();
    fetchEvents();
  }, []);

  // Промяна на роля на потребител
  const changeUserRole = async (userId: string, newRole: string) => {
    await updateDoc(doc(db, "users", userId), { 
      role: newRole,
      updatedAt: new Date()
    });
    fetchUsers();
  };

  // Изтриване на потребител
  const deleteUser = async (userId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете потребителя?")) return;
    await deleteDoc(doc(db, "users", userId));
    fetchUsers();
  };

  // Създаване на ново събитие
  const createEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate || !newEventTime || !newEventEndTime || !newEventLocation) return;
    
    if (!validateTime(newEventTime) || !validateTime(newEventEndTime)) {
      alert("Моля, въведете валиден час във формат HH:MM (например 14:30)");
      return;
    }

    if (!validateTimeRange(newEventTime, newEventEndTime)) {
      alert("Крайният час трябва да е след началния час!");
      return;
    }
    
    // Проверка за конфликт
    if (hasBookingConflict(newEventLocation, newEventDate, newEventTime, newEventEndTime)) {
      alert("Стаята е вече резервирана за избрания времеви интервал! Моля, изберете друго време или място.");
      return;
    }
    
    const eventData = {
      title: newEventTitle,
      description: newEventDesc,
      date: newEventDate,
      time: newEventTime,
      endTime: newEventEndTime,
      location: newEventLocation,
      maxParticipants: newEventMaxParticipants,
      currentParticipants: 0,
      allowedRoles: ["reader", "librarian"],
      organizer: newEventOrganizer,
      createdAt: new Date(),
      registrations: []
    };

    await addDoc(collection(db, "events"), eventData);
    
    // Reset form
    setNewEventTitle("");
    setNewEventDesc("");
    setNewEventDate("");
    setNewEventTime("");
    setNewEventEndTime("");
    setNewEventLocation("");
    setNewEventMaxParticipants(20);
    setNewEventOrganizer("");
    
    fetchEvents();
  };

  // Изтриване на събитие
  const deleteEvent = async (eventId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете събитието?")) return;
    await deleteDoc(doc(db, "events", eventId));
    fetchEvents();
  };

  // Промяна на разрешени роли за събитие
  const toggleEventRole = async (eventId: string, role: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const newRoles = event.allowedRoles.includes(role)
      ? event.allowedRoles.filter(r => r !== role)
      : [...event.allowedRoles, role];

    await updateDoc(doc(db, "events", eventId), { 
      allowedRoles: newRoles,
      updatedAt: new Date()
    });
    fetchEvents();
  };

  // Промяна на брой места
  const updateMaxParticipants = async (eventId: string, maxParticipants: number) => {
    if (maxParticipants < 1) return;
    
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    if (maxParticipants < event.currentParticipants) {
      alert("Не можете да зададете по-малко места от текущо записаните участници!");
      return;
    }

    await updateDoc(doc(db, "events", eventId), { 
      maxParticipants: maxParticipants,
      updatedAt: new Date()
    });
    fetchEvents();
  };

  // Започване на редактиране на събитие
  const startEditing = (event: Event) => {
    setEditingEvent(event);
    setEditFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      endTime: event.endTime,
      location: event.location,
      maxParticipants: event.maxParticipants,
      organizer: event.organizer
    });
  };

  // Отказ от редактиране
  const cancelEditing = () => {
    setEditingEvent(null);
    setEditFormData({});
  };

  // Запазване на промените
  const saveEvent = async () => {
    if (!editingEvent || !editFormData.title?.trim() || !editFormData.date || 
        !editFormData.time || !editFormData.endTime || !editFormData.location) return;
    
    if (!validateTime(editFormData.time) || !validateTime(editFormData.endTime)) {
      alert("Моля, въведете валиден час във формат HH:MM (например 14:30)");
      return;
    }

    if (!validateTimeRange(editFormData.time, editFormData.endTime)) {
      alert("Крайният час трябва да е след началния час!");
      return;
    }

    if (editFormData.maxParticipants && editFormData.maxParticipants < editingEvent.currentParticipants) {
      alert("Не можете да зададете по-малко места от текущо записаните участници!");
      return;
    }

    // Проверка за конфликт при редактиране (изключваме текущото събитие)
    if (hasBookingConflict(
      editFormData.location, 
      editFormData.date, 
      editFormData.time, 
      editFormData.endTime, 
      editingEvent.id
    )) {
      alert("Стаята е вече резервирана за избрания времеви интервал! Моля, изберете друго време или място.");
      return;
    }

    try {
      await updateDoc(doc(db, "events", editingEvent.id), {
        ...editFormData,
        updatedAt: new Date()
      });
      
      setEditingEvent(null);
      setEditFormData({});
      fetchEvents();
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Грешка при обновяване на събитието");
    }
  };

  // Промяна на формата за редактиране
  const handleEditFormChange = (field: keyof Event, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Филтрирани данни
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.organizer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvailableSpots = (event: Event) => {
    return event.maxParticipants - event.currentParticipants;
  };

  const isEventFull = (event: Event) => {
    return event.currentParticipants >= event.maxParticipants;
  };

  // Helper function to safely check for conflicts
  const getLocationConflictStatus = (location: string, date: string, time: string, endTime: string, excludeEventId?: string) => {
    if (!date || !time || !endTime) return false;
    return hasBookingConflict(location, date, time, endTime, excludeEventId);
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Административен Панел</h1>
          <p>Управление на потребители и събития</p>
        </div>

        {/* Search */}
        <div className="search-section">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Търсене по имейл, роля или заглавие..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-section">
          <button 
            className={`tab-button ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <Users size={18} />
            Потребители ({users.length})
          </button>
          <button 
            className={`tab-button ${activeTab === "events" ? "active" : ""}`}
            onClick={() => setActiveTab("events")}
          >
            <Calendar size={18} />
            Събития ({events.length})
          </button>
          <button 
            className={`tab-button ${activeTab === "rooms" ? "active" : ""}`}
            onClick={() => setActiveTab("rooms")}
          >
            <Building size={18} />
            Стаи ({locationOptions.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="content-section">
            <h2>Управление на Потребители</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Имейл</th>
                    <th>Роля</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="user-email">{user.email}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => changeUserRole(user.id, e.target.value)}
                          className={`role-select role-${user.role}`}
                        >
                          <option value="reader">Читател</option>
                          <option value="librarian">Библиотекар</option>
                          <option value="admin">Администратор</option>
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="delete-btn"
                          title="Изтрий потребител"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="empty-state">
                  <Users size={32} />
                  <p>Няма намерени потребители</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="content-section">
            <h2>Управление на Събития</h2>
            
            {/* Create Event Form */}
            <div className="create-event-card">
              <div className="card-header">
                <h3>Създай Ново Събитие</h3>
              </div>
              <div className="card-body">
                <div className="event-form-grid">
                  <div className="form-group">
                    <label>Заглавие на събитието *</label>
                    <input
                      type="text"
                      placeholder="Напр. Среща с писател"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Описание</label>
                    <textarea
                      placeholder="Кратко описание на събитието"
                      value={newEventDesc}
                      onChange={(e) => setNewEventDesc(e.target.value)}
                      className="form-input textarea"
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Дата *</label>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="form-input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label>Начален час *</label>
                    <select
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
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
                      value={newEventEndTime}
                      onChange={(e) => setNewEventEndTime(e.target.value)}
                      className="form-input"
                    >
                      <option value="">Изберете краен час</option>
                      {timeOptionsWithMinutes.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    {newEventTime && newEventEndTime && !validateTimeRange(newEventTime, newEventEndTime) && (
                      <div className="validation-error">
                        Крайният час трябва да е след началния!
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Място *</label>
                    <select
                      value={newEventLocation}
                      onChange={(e) => setNewEventLocation(e.target.value)}
                      className={`form-input ${
                        newEventLocation && newEventDate && newEventTime && newEventEndTime && 
                        hasBookingConflict(newEventLocation, newEventDate, newEventTime, newEventEndTime) 
                          ? 'booking-conflict' 
                          : ''
                      }`}
                    >
                      <option value="">Изберете място</option>
                      {locationOptions.map(location => {
                        const hasConflict = newEventDate && newEventTime && newEventEndTime && 
                          hasBookingConflict(location, newEventDate, newEventTime, newEventEndTime);
                        
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
                    {newEventLocation && newEventDate && newEventTime && newEventEndTime && 
                      hasBookingConflict(newEventLocation, newEventDate, newEventTime, newEventEndTime) && (
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
                      max="1000"
                      value={newEventMaxParticipants}
                      onChange={(e) => setNewEventMaxParticipants(parseInt(e.target.value) || 1)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Организатор</label>
                    <input
                      type="text"
                      placeholder="Име на организатора"
                      value={newEventOrganizer}
                      onChange={(e) => setNewEventOrganizer(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group full-width">
                    <button
                      onClick={createEvent}
                      disabled={
                        !newEventTitle.trim() || 
                        !newEventDate || 
                        !newEventTime || 
                        !newEventEndTime || 
                        !newEventLocation || 
                        !validateTimeRange(newEventTime, newEventEndTime) ||
                        hasBookingConflict(newEventLocation, newEventDate, newEventTime, newEventEndTime)
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
            <div className="events-list-section">
              <h3>Всички Събития</h3>
              <div className="table-container">
                <table className="data-table events-table">
                  <thead>
                    <tr>
                      <th>Заглавие</th>
                      <th>Дата и час</th>
                      <th>Място</th>
                      <th>Организатор</th>
                      <th>Участници</th>
                      <th>Разрешени Роли</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map(event => (
                      <tr key={event.id} className={isEventFull(event) ? 'event-full' : ''}>
                        <td className="event-info-cell">
                          {editingEvent?.id === event.id ? (
                            <div className="edit-form">
                              <input
                                type="text"
                                value={editFormData.title || ''}
                                onChange={(e) => handleEditFormChange('title', e.target.value)}
                                className="edit-input"
                                placeholder="Заглавие"
                              />
                              <textarea
                                value={editFormData.description || ''}
                                onChange={(e) => handleEditFormChange('description', e.target.value)}
                                className="edit-input textarea"
                                placeholder="Описание"
                                rows={2}
                              />
                            </div>
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
                                value={editFormData.date || ''}
                                onChange={(e) => handleEditFormChange('date', e.target.value)}
                                className="edit-input"
                                min={new Date().toISOString().split('T')[0]}
                              />
                              <div className="time-range-edit">
                                <select
                                  value={editFormData.time || ''}
                                  onChange={(e) => handleEditFormChange('time', e.target.value)}
                                  className="edit-input"
                                >
                                  <option value="">Начален час</option>
                                  {timeOptionsWithMinutes.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                                <span>до</span>
                                <select
                                  value={editFormData.endTime || ''}
                                  onChange={(e) => handleEditFormChange('endTime', e.target.value)}
                                  className="edit-input"
                                >
                                  <option value="">Краен час</option>
                                  {timeOptionsWithMinutes.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                              </div>
                              {editFormData.time && editFormData.endTime && !validateTimeRange(editFormData.time, editFormData.endTime) && (
                                <div className="validation-error-small">
                                  Невалиден времеви диапазон
                                </div>
                              )}
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
                              value={editFormData.location || ''}
                              onChange={(e) => handleEditFormChange('location', e.target.value)}
                              className={`edit-input ${
                                editFormData.location && editFormData.date && editFormData.time && editFormData.endTime && 
                                hasBookingConflict(
                                  editFormData.location, 
                                  editFormData.date, 
                                  editFormData.time, 
                                  editFormData.endTime, 
                                  event.id
                                ) 
                                  ? 'booking-conflict' 
                                  : ''
                              }`}
                            >
                              <option value="">Изберете място</option>
                              {locationOptions.map(location => {
                                const hasConflict = editFormData.date && editFormData.time && editFormData.endTime && 
                                  hasBookingConflict(location, editFormData.date, editFormData.time, editFormData.endTime, event.id);
                                
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
                          {editingEvent?.id === event.id && editFormData.location && editFormData.date && editFormData.time && editFormData.endTime && 
                            hasBookingConflict(
                              editFormData.location, 
                              editFormData.date, 
                              editFormData.time, 
                              editFormData.endTime, 
                              event.id
                            ) && (
                            <div className="validation-error-small">
                              Стаята е заета за този интервал!
                            </div>
                          )}
                        </td>
                        <td>
                          {editingEvent?.id === event.id ? (
                            <input
                              type="text"
                              value={editFormData.organizer || ''}
                              onChange={(e) => handleEditFormChange('organizer', e.target.value)}
                              className="edit-input"
                              placeholder="Организатор"
                            />
                          ) : (
                            <div className="event-organizer">
                              {event.organizer || "Не е посочен"}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="participants-info">
                            <div className="participants-count">
                              <User size={14} />
                              {event.currentParticipants} / {editingEvent?.id === event.id ? (
                                <input
                                  type="number"
                                  min={event.currentParticipants}
                                  max="1000"
                                  value={editFormData.maxParticipants || event.maxParticipants}
                                  onChange={(e) => handleEditFormChange('maxParticipants', parseInt(e.target.value) || event.currentParticipants)}
                                  className="participant-input"
                                />
                              ) : (
                                event.maxParticipants
                              )}
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
                          <div className="roles-container">
                            {["reader", "librarian", "admin"].map(role => (
                              <label key={role} className="role-checkbox">
                                <input
                                  type="checkbox"
                                  checked={event.allowedRoles.includes(role)}
                                  onChange={() => toggleEventRole(event.id, role)}
                                  disabled={editingEvent?.id === event.id}
                                />
                                <span className={`role-tag role-${role}`}>
                                  {role === 'reader' ? 'Читател' : role === 'librarian' ? 'Библиотекар' : 'Админ'}
                                </span>
                              </label>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {editingEvent?.id === event.id ? (
                              <>
                                <button
                                  onClick={saveEvent}
                                  className="save-btn"
                                  title="Запази промените"
                                  disabled={
                                    !editFormData.title?.trim() || 
                                    !editFormData.date || 
                                    !editFormData.time || 
                                    !editFormData.endTime || 
                                    !editFormData.location || 
                                    !validateTimeRange(editFormData.time, editFormData.endTime) ||
                                    hasBookingConflict(
                                      editFormData.location, 
                                      editFormData.date, 
                                      editFormData.time, 
                                      editFormData.endTime, 
                                      event.id
                                    )
                                  }
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="cancel-btn"
                                  title="Откажи промените"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditing(event)}
                                  className="edit-btn"
                                  title="Редактирай събитие"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => deleteEvent(event.id)}
                                  className="delete-btn"
                                  title="Изтрий събитие"
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

export default AdminDashboard;