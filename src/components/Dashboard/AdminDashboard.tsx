import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Users, Calendar, Trash2, Plus, Search, Clock, MapPin, User, Edit, X, Save, Building, Upload } from "lucide-react";
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
  type: 'event';
}

interface ClassSchedule {
  subject: string;
  teacher: string;
  className: string;
}

interface ScheduleBooking {
  id: string;
  room: string;
  dayOfWeek: number;
  period: number;
  startTime: string;
  endTime: string;
  classSchedules: ClassSchedule[];
  semester: string;
  academicYear: string;
  type: 'schedule';
}

type BookingInfo = RoomBooking | ScheduleBooking;

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([]);
  const [scheduleBookings, setScheduleBookings] = useState<ScheduleBooking[]>([]);
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
  const [editingCell, setEditingCell] = useState<{room: string, timeSlot: string, booking: BookingInfo | null} | null>(null);
  const [addingEventFromCell, setAddingEventFromCell] = useState<{room: string, timeSlot: string} | null>(null);
  
  const [isImportingSchedule, setIsImportingSchedule] = useState(false);
  const [importData, setImportData] = useState("");
  const [selectedRoomForImport, setSelectedRoomForImport] = useState("1303");
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [semester, setSemester] = useState<"winter" | "summer">("winter");

  // Форма за добавяне на събитие от клетка
  const [cellEventTitle, setCellEventTitle] = useState<string>("");
  const [cellEventDesc, setCellEventDesc] = useState<string>("");
  const [cellEventStartTime, setCellEventStartTime] = useState<string>("");
  const [cellEventEndTime, setCellEventEndTime] = useState<string>("");
  const [cellEventMaxParticipants, setCellEventMaxParticipants] = useState<number>(20);
  const [cellEventOrganizer, setCellEventOrganizer] = useState<string>("");

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

  const validateTime = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const validateTimeRange = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return true;
    return endTime > startTime;
  };

  // Хелпер функция за конвертиране на време в минути
  const convertToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  // Функция за проверка за припокриване на интервали
  const hasTimeOverlap = (
    slotStart: string, 
    slotEnd: string, 
    eventStart: string, 
    eventEnd: string
  ): boolean => {
    const slotStartMin = convertToMinutes(slotStart);
    const slotEndMin = convertToMinutes(slotEnd);
    const eventStartMin = convertToMinutes(eventStart);
    const eventEndMin = convertToMinutes(eventEnd);
    
    // Припокриване се случва когато:
    // 1. Събитието започва преди края на слота И завършва след началото на слота
    return eventStartMin < slotEndMin && eventEndMin > slotStartMin;
  };

  // Проверка за конфликт с всички резервации (събития + график)
  const hasBookingConflict = (
    room: string, 
    date: string, 
    startTime: string, 
    endTime: string, 
    excludeEventId?: string
  ): boolean => {
    // Проверка за конфликт с резервации за събития
    const eventConflict = roomBookings.some(booking => {
      if (excludeEventId && booking.id === excludeEventId) return false;
      
      if (booking.room !== room || booking.date !== date) return false;
      
      const newStart = startTime;
      const newEnd = endTime;
      const existingStart = booking.time;
      const existingEnd = booking.endTime;
      
      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });
    
    if (eventConflict) return true;
    
    // Проверка за конфликт с графични занятия
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const scheduleConflicts = scheduleBookings.filter(
        schedule => schedule.room === room && schedule.dayOfWeek === dayOfWeek
      );
      
      const hasScheduleConflict = scheduleConflicts.some(schedule => {
        const eventStart = startTime;
        const eventEnd = endTime;
        const scheduleStart = schedule.startTime;
        const scheduleEnd = schedule.endTime;
        
        return (
          (eventStart >= scheduleStart && eventStart < scheduleEnd) ||
          (eventEnd > scheduleStart && eventEnd <= scheduleEnd) ||
          (eventStart <= scheduleStart && eventEnd >= scheduleEnd)
        );
      });
      
      return hasScheduleConflict;
    }
    
    return false;
  };

  const getTimeSlotsInRange = (startTime: string, endTime: string): string[] => {
    const slots: string[] = [];
    
    // Конвертираме в минути от началото на деня
    const startMinutes = convertToMinutes(startTime);
    const endMinutes = convertToMinutes(endTime);
    
    // Взимаме началния час (без минути)
    const startHour = Math.floor(startMinutes / 60);
    const endHour = Math.ceil(endMinutes / 60);
    
    // Генерираме часове между началния и крайния час
    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(timeString);
    }
    
    return slots;
  };
console.log(getTimeSlotsInRange);
  const parseScheduleText = (text: string): { dayOfWeek: number, period: number, startTime: string, endTime: string, classSchedules: ClassSchedule[] }[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    const dayMap: { [key: string]: number } = {
      'Понеделник': 1,
      'Вторник': 2,
      'Сряда': 3,
      'Четвъртък': 4,
      'Петък': 5
    };
    
    const scheduleSlots: { dayOfWeek: number, period: number, startTime: string, endTime: string, classSchedules: ClassSchedule[] }[] = [];
    
    let currentDay: number = 0;
    let periodCounter: number = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (dayMap[line] !== undefined) {
        currentDay = dayMap[line];
        periodCounter = 1;
        continue;
      }
      
      if (currentDay > 0 && line.includes('–')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const timeRange = parts[0];
          const [startTime, endTime] = timeRange.split('–').map(t => t.trim() + ':00');
          
          const scheduleText = parts.slice(1).join(' ');
          let classSchedules: ClassSchedule[] = [];
          
          if (scheduleText !== '—' && scheduleText.trim() !== '') {
            const classParts = scheduleText.split(',').map(part => part.trim()).filter(part => part !== '');
            
            classSchedules = classParts.map(part => {
              const classMatch = part.match(/(\d+[а-яд\.]+)$/);
              let className = '';
              let subjectTeacher = part;
              
              if (classMatch) {
                className = classMatch[1];
                subjectTeacher = part.substring(0, part.length - className.length).trim();
              }
              
              let subject = subjectTeacher;
              let teacher = '';
              
              const teacherMatch = subjectTeacher.match(/\((.+?)\)/);
              if (teacherMatch) {
                teacher = teacherMatch[1];
                subject = subjectTeacher.replace(`(${teacher})`, '').trim();
              } else {
                const nameParts = subjectTeacher.split(' ');
                if (nameParts.length > 1) {
                  const lastWord = nameParts[nameParts.length - 1];
                  if (lastWord.match(/^[А-Я][а-я]+$/)) {
                    teacher = lastWord;
                    subject = nameParts.slice(0, -1).join(' ');
                  }
                }
              }
              
              return {
                subject: subject || 'Неизвестен предмет',
                teacher,
                className: className || 'Неизвестен клас'
              };
            });
          }
          
          if (classSchedules.length > 0) {
            scheduleSlots.push({
              dayOfWeek: currentDay,
              period: periodCounter,
              startTime,
              endTime,
              classSchedules
            });
          }
          
          periodCounter++;
        }
      }
    }
    
    return scheduleSlots;
  };

  const importScheduleToFirebase = async () => {
    if (!importData.trim() || !selectedRoomForImport) {
      alert("Моля, въведете данни за графика и изберете стая!");
      return;
    }
    
    try {
      const scheduleSlots = parseScheduleText(importData);
      
      if (scheduleSlots.length === 0) {
        alert("Не можахме да разчетем графика. Проверете формата на данните!");
        return;
      }
      
      const existingSchedules = await getDocs(collection(db, "scheduleBookings"));
      const deletePromises: Promise<void>[] = [];
      
      existingSchedules.docs.forEach(doc => {
        if (doc.data().room === selectedRoomForImport) {
          deletePromises.push(deleteDoc(doc.ref));
        }
      });
      
      await Promise.all(deletePromises);
      
      const addPromises: Promise<any>[] = [];
      
      scheduleSlots.forEach(slot => {
        const scheduleBooking: Omit<ScheduleBooking, 'id'> = {
          room: selectedRoomForImport,
          dayOfWeek: slot.dayOfWeek,
          period: slot.period,
          startTime: slot.startTime,
          endTime: slot.endTime,
          classSchedules: slot.classSchedules,
          semester,
          academicYear,
          type: 'schedule'
        };
        
        addPromises.push(addDoc(collection(db, "scheduleBookings"), scheduleBooking));
      });
      
      await Promise.all(addPromises);
      alert(`Графикът за стая ${selectedRoomForImport} е импортиран успешно! Добавени са ${scheduleSlots.length} часа.`);
      setIsImportingSchedule(false);
      setImportData("");
      fetchScheduleBookings();
      
    } catch (error) {
      console.error("Грешка при импортиране:", error);
      alert("Грешка при импортиране на графика!");
    }
  };

  // Проверка дали стаята е заета от събитие за конкретен час
  const isRoomBookedByEvent = (room: string, date: string, timeSlotHour: string): boolean => {
    // timeSlotHour е "13" за 13:00-14:00
    const slotStart = timeSlotHour + ':00';
    const slotEnd = (parseInt(timeSlotHour) + 1) + ':00';
    
    return roomBookings.some(booking => {
      if (booking.room !== room || booking.date !== date) return false;
      
      // Проверяваме за припокриване на интервали
      return hasTimeOverlap(slotStart, slotEnd, booking.time, booking.endTime);
    });
  };

  // Вземане на информация за събитие
  const getEventInfo = (room: string, date: string, timeSlotHour: string): RoomBooking | null => {
    const slotStart = timeSlotHour + ':00';
    const slotEnd = (parseInt(timeSlotHour) + 1) + ':00';
    
    const booking = roomBookings.find(booking => {
      if (booking.room !== room || booking.date !== date) return false;
      
      return hasTimeOverlap(slotStart, slotEnd, booking.time, booking.endTime);
    });
    
    return booking || null;
  };

  // Проверка дали стаята е заета в графика за конкретен час
  const isRoomBookedInSchedule = (room: string, date: string, timeSlotHour: string): boolean => {
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek < 1 || dayOfWeek > 5) return false;
    
    const slotStart = timeSlotHour + ':00';
    const slotEnd = (parseInt(timeSlotHour) + 1) + ':00';
    
    return scheduleBookings.some(
      schedule => 
        schedule.room === room && 
        schedule.dayOfWeek === dayOfWeek &&
        hasTimeOverlap(slotStart, slotEnd, schedule.startTime, schedule.endTime)
    );
  };

  // Вземане на информация за графично занятие
  const getScheduleInfo = (room: string, date: string, timeSlotHour: string): ScheduleBooking | null => {
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek < 1 || dayOfWeek > 5) return null;
    
    const slotStart = timeSlotHour + ':00';
    const slotEnd = (parseInt(timeSlotHour) + 1) + ':00';
    
    const schedule = scheduleBookings.find(
      schedule => 
        schedule.room === room && 
        schedule.dayOfWeek === dayOfWeek &&
        hasTimeOverlap(slotStart, slotEnd, schedule.startTime, schedule.endTime)
    );
    
    return schedule || null;
  };

  // Проверка дали стаята е заета (събития + график)
  const isRoomBooked = (room: string, date: string, timeSlotHour: string): boolean => {
    return isRoomBookedByEvent(room, date, timeSlotHour) || 
           isRoomBookedInSchedule(room, date, timeSlotHour);
  };
console.log(isRoomBooked);
  // Вземане на информация за резервацията (събитие или график)
  const getBookingInfo = (room: string, date: string, timeSlotHour: string): BookingInfo | null => {
    // Първо проверяваме за събития
    const eventInfo = getEventInfo(room, date, timeSlotHour);
    if (eventInfo) {
      return eventInfo;
    }
    
    // След това проверяваме за график
    const scheduleInfo = getScheduleInfo(room, date, timeSlotHour);
    if (scheduleInfo) {
      return scheduleInfo;
    }
    
    return null;
  };

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const usersData: User[] = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as User));
    setUsers(usersData);
  };

  const fetchEvents = async () => {
    const snapshot = await getDocs(collection(db, "events"));
    const eventsData: Event[] = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Event));
    setEvents(eventsData);
    updateRoomBookings(eventsData);
  };

  const fetchScheduleBookings = async () => {
    const snapshot = await getDocs(collection(db, "scheduleBookings"));
    const schedulesData: ScheduleBooking[] = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as ScheduleBooking));
    setScheduleBookings(schedulesData);
  };

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
          eventTitle: event.title,
          type: 'event'
        });
      }
    });
    setRoomBookings(bookings);
  };

  useEffect(() => {
    fetchUsers();
    fetchEvents();
    fetchScheduleBookings();
  }, []);

  const changeUserRole = async (userId: string, newRole: string) => {
    await updateDoc(doc(db, "users", userId), { 
      role: newRole,
      updatedAt: new Date()
    });
    fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете потребителя?")) return;
    await deleteDoc(doc(db, "users", userId));
    fetchUsers();
  };

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

  // Създаване на събитие от клетка
  const createEventFromCell = async () => {
    if (!addingEventFromCell || !cellEventTitle.trim() || !selectedDate || !cellEventStartTime || !cellEventEndTime) return;
    
    if (!validateTime(cellEventStartTime) || !validateTime(cellEventEndTime)) {
      alert("Моля, въведете валиден час във формат HH:MM (например 14:30)");
      return;
    }

    if (!validateTimeRange(cellEventStartTime, cellEventEndTime)) {
      alert("Крайният час трябва да е след началния час!");
      return;
    }
    
    if (hasBookingConflict(addingEventFromCell.room, selectedDate, cellEventStartTime, cellEventEndTime)) {
      alert("Стаята е вече резервирана за избрания времеви интервал! Моля, изберете друго време или място.");
      return;
    }
    
    const eventData = {
      title: cellEventTitle,
      description: cellEventDesc,
      date: selectedDate,
      time: cellEventStartTime,
      endTime: cellEventEndTime,
      location: addingEventFromCell.room,
      maxParticipants: cellEventMaxParticipants,
      currentParticipants: 0,
      allowedRoles: ["reader", "librarian"],
      organizer: cellEventOrganizer,
      createdAt: new Date(),
      registrations: []
    };

    await addDoc(collection(db, "events"), eventData);
    
    // Reset form
    setCellEventTitle("");
    setCellEventDesc("");
    setCellEventStartTime("");
    setCellEventEndTime("");
    setCellEventMaxParticipants(20);
    setCellEventOrganizer("");
    setAddingEventFromCell(null);
    
    fetchEvents();
  };

  const deleteEvent = async (eventId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете събитието?")) return;
    await deleteDoc(doc(db, "events", eventId));
    fetchEvents();
  };

  // Функция за изтриване на резервация от клетка
  const deleteBookingFromCell = async (booking: BookingInfo) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете тази резервация?")) return;
    
    try {
      if (booking.type === 'event') {
        // Изтриване на събитие
        await deleteDoc(doc(db, "events", booking.eventId));
        fetchEvents();
      } else if (booking.type === 'schedule') {
        // Изтриване на графично занятие
        await deleteDoc(doc(db, "scheduleBookings", booking.id));
        fetchScheduleBookings();
      }
      
      setEditingCell(null);
      alert("Резервацията е изтрита успешно!");
    } catch (error) {
      console.error("Грешка при изтриване:", error);
      alert("Грешка при изтриване на резервацията!");
    }
  };

  // Функция за стартиране на добавяне на събитие от клетка
  const startAddingEventFromCell = (room: string, timeSlot: string) => {
    const [slotStart] = timeSlot.split('-');
    const startHour = parseInt(slotStart);
    
    // Автоматично попълване на начален и краен час
    setCellEventStartTime(`${slotStart}:00`);
    setCellEventEndTime(`${(startHour + 1).toString().padStart(2, '0')}:00`);
    
    setAddingEventFromCell({
      room,
      timeSlot
    });
  };

  // Функция за редактиране на резервация в клетка
  const startEditingCell = (room: string, timeSlot: string) => {
    const [slotStart] = timeSlot.split('-');
    const bookingInfo = getBookingInfo(room, selectedDate, slotStart);
    
    // Ако има резервация, показваме редактора
    if (bookingInfo) {
      setEditingCell({
        room,
        timeSlot,
        booking: bookingInfo
      });
    } else {
      // Ако няма резервация, предлагаме да добавим нова
      startAddingEventFromCell(room, timeSlot);
    }
  };

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

  const updateMaxParticipants = async (eventId: string, maxParticipants: number) => {
    if (maxParticipants < 1) return;
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    if (maxParticipants < event.currentParticipants) {
      alert("Не можете да зададете по-малко места от текущо записаните участници!");
      return;
    }
console.log(updateMaxParticipants);
    await updateDoc(doc(db, "events", eventId), { 
      maxParticipants: maxParticipants,
      updatedAt: new Date()
    });
    fetchEvents();
  };

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

  const cancelEditing = () => {
    setEditingEvent(null);
    setEditFormData({});
  };

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

  const handleEditFormChange = (field: keyof Event, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

  const getLocationConflictStatus = (location: string, date: string, time: string, endTime: string, excludeEventId?: string) => {
    if (!date || !time || !endTime) return false;
    return hasBookingConflict(location, date, time, endTime, excludeEventId);
  };
console.log(getLocationConflictStatus);
  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Административен Панел</h1>
          <p>Управление на потребители и събития</p>
        </div>

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

        {activeTab === "events" && (
          <div className="content-section">
            <h2>Управление на Събития</h2>
            
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
                      rows={5}
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
                                rows={4}
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

        {activeTab === "rooms" && (
          <div className="content-section">
            <div className="rooms-header">
              <h2>Заетост на Стаи</h2>
              <button 
                onClick={() => setIsImportingSchedule(true)}
                className="import-btn primary-btn"
              >
                <Upload size={16} />
                Импортирай седмичен график
              </button>
            </div>
            
            {isImportingSchedule && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3>Импортиране на седмичен график</h3>
                    <button 
                      onClick={() => setIsImportingSchedule(false)}
                      className="close-btn"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Стая</label>
                      <select
                        value={selectedRoomForImport}
                        onChange={(e) => setSelectedRoomForImport(e.target.value)}
                        className="form-input"
                      >
                        {locationOptions.map(room => (
                          <option key={room} value={room}>{room}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Учебна година</label>
                      <input
                        type="text"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        placeholder="2024-2025"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Семестър</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value as "winter" | "summer")}
                        className="form-input"
                      >
                        <option value="winter">Зимен</option>
                        <option value="summer">Летен</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Данни за график (по денове)</label>
                      <textarea
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        placeholder="Понеделник&#10;07:30–08:10 Пре 8д&#10;08:20–09:00 ГА 8д&#10;...&#10;Вторник&#10;07:30–08:10 Мат 8д&#10;..."
                        className="form-input textarea"
                        rows={15}
                      />
                      <small className="help-text">
                        Формат: Име на ден, след това всеки ред: времеви интервал предмет клас (може да има повече от един предмет разделени със запетая)
                      </small>
                    </div>
                    
                    <div className="modal-actions">
                      <button 
                        onClick={importScheduleToFirebase}
                        disabled={!importData.trim()}
                        className="primary-btn"
                      >
                        Импортирай
                      </button>
                      <button 
                        onClick={() => setIsImportingSchedule(false)}
                        className="secondary-btn"
                      >
                        Отказ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Модал за добавяне на събитие от клетка */}
            {addingEventFromCell && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3>Добавяне на събитие</h3>
                    <button 
                      onClick={() => setAddingEventFromCell(null)}
                      className="close-btn"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="modal-body">
                    <div className="cell-info">
                      <p><strong>Стая:</strong> {addingEventFromCell.room}</p>
                      <p><strong>Дата:</strong> {new Date(selectedDate).toLocaleDateString('bg-BG')}</p>
                      <p><strong>Час:</strong> {addingEventFromCell.timeSlot}</p>
                    </div>
                    
                    <div className="event-form-grid">
                      <div className="form-group">
                        <label>Заглавие на събитието *</label>
                        <input
                          type="text"
                          placeholder="Напр. Среща с писател"
                          value={cellEventTitle}
                          onChange={(e) => setCellEventTitle(e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Описание</label>
                        <textarea
                          placeholder="Кратко описание на събитието"
                          value={cellEventDesc}
                          onChange={(e) => setCellEventDesc(e.target.value)}
                          className="form-input textarea"
                          rows={5}
                        />
                      </div>
                      <div className="form-group">
                        <label>Начален час *</label>
                        <select
                          value={cellEventStartTime}
                          onChange={(e) => setCellEventStartTime(e.target.value)}
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
                          value={cellEventEndTime}
                          onChange={(e) => setCellEventEndTime(e.target.value)}
                          className="form-input"
                        >
                          <option value="">Изберете краен час</option>
                          {timeOptionsWithMinutes.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        {cellEventStartTime && cellEventEndTime && !validateTimeRange(cellEventStartTime, cellEventEndTime) && (
                          <div className="validation-error">
                            Крайният час трябва да е след началния!
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Брой места</label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={cellEventMaxParticipants}
                          onChange={(e) => setCellEventMaxParticipants(parseInt(e.target.value) || 1)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Организатор</label>
                        <input
                          type="text"
                          placeholder="Име на организатора"
                          value={cellEventOrganizer}
                          onChange={(e) => setCellEventOrganizer(e.target.value)}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="modal-actions">
                        <button 
                          onClick={createEventFromCell}
                          disabled={
                            !cellEventTitle.trim() || 
                            !cellEventStartTime || 
                            !cellEventEndTime || 
                            !validateTimeRange(cellEventStartTime, cellEventEndTime) ||
                            hasBookingConflict(addingEventFromCell.room, selectedDate, cellEventStartTime, cellEventEndTime)
                          }
                          className="primary-btn"
                        >
                          <Plus size={16} />
                          Създай Събитие
                        </button>
                        <button 
                          onClick={() => setAddingEventFromCell(null)}
                          className="secondary-btn"
                        >
                          Отказ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Модал за редактиране на клетка */}
            {editingCell && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3>Резервация</h3>
                    <button 
                      onClick={() => setEditingCell(null)}
                      className="close-btn"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="modal-body">
                    <div className="cell-info">
                      <p><strong>Стая:</strong> {editingCell.room}</p>
                      <p><strong>Дата:</strong> {new Date(selectedDate).toLocaleDateString('bg-BG')}</p>
                      <p><strong>Час:</strong> {editingCell.timeSlot}</p>
                      
                      {editingCell.booking ? (
                        <div className="booking-details">
                          <h4>Резервация:</h4>
                          {editingCell.booking.type === 'event' ? (
                            <div className="event-booking">
                              <p><strong>Събитие:</strong> {editingCell.booking.eventTitle}</p>
                              <p><strong>Време:</strong> {editingCell.booking.time} - {editingCell.booking.endTime}</p>
                              <p><strong>Тип:</strong> Събитие</p>
                            </div>
                          ) : (
                            <div className="schedule-booking">
                              <p><strong>Учебни занятия:</strong></p>
                              {editingCell.booking.classSchedules.map((schedule, index) => (
                                <div key={index} className="class-item">
                                  <p><strong>Предмет:</strong> {schedule.subject}</p>
                                  <p><strong>Клас:</strong> {schedule.className}</p>
                                  {schedule.teacher && <p><strong>Учител:</strong> {schedule.teacher}</p>}
                                </div>
                              ))}
                              <p><strong>Тип:</strong> Учебно занятие</p>
                            </div>
                          )}
                          
                          <div className="modal-actions">
                            <button 
                              onClick={() => deleteBookingFromCell(editingCell.booking!)}
                              className="delete-btn"
                            >
                              <Trash2 size={16} />
                              Изтрий резервация
                            </button>
                            <button 
                              onClick={() => setEditingCell(null)}
                              className="secondary-btn"
                            >
                              Затвори
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="no-booking">
                          <p>Няма резервация за този час и стая.</p>
                          <div className="modal-actions">
                            <button 
                              onClick={() => startAddingEventFromCell(editingCell.room, editingCell.timeSlot)}
                              className="primary-btn"
                            >
                              <Plus size={16} />
                              Добави събитие
                            </button>
                            <button 
                              onClick={() => setEditingCell(null)}
                              className="secondary-btn"
                            >
                              Затвори
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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

            <div className="rooms-grid-container">
              <div className="rooms-timetable">
                <div className="table-header-row">
                  <div className="corner-cell">Стая/Час</div>
                  {timeSlots.map(time => (
                    <div key={time} className="time-header-cell">
                      {time.split('-')[0]}
                    </div>
                  ))}
                </div>

                {locationOptions.map(room => (
                  <div key={room} className="table-row">
                    <div className="room-name-cell">
                      <Building size={16} />
                      <span>{room}</span>
                    </div>
                    {timeSlots.map(timeSlot => {
                      const [slotStart] = timeSlot.split('-');
                      const isEventBooked = isRoomBookedByEvent(room, selectedDate, slotStart);
                      const isScheduleBooked = isRoomBookedInSchedule(room, selectedDate, slotStart);
                      const bookingInfo = getBookingInfo(room, selectedDate, slotStart);
                      
                      return (
                        <div
                          key={`${room}-${timeSlot}`}
                          className={`time-slot-cell ${
                            isScheduleBooked ? 'scheduled' : 
                            isEventBooked ? 'booked' : 'available'
                          } ${editingCell?.room === room && editingCell?.timeSlot === timeSlot ? 'editing' : ''}`}
                          onClick={() => startEditingCell(room, timeSlot)}
                          title={
                            isScheduleBooked ? 
                            `Учебни занятия: ${bookingInfo && bookingInfo.type === 'schedule' ? 
                              bookingInfo.classSchedules.map(s => `${s.subject} (${s.className})${s.teacher ? ` - ${s.teacher}` : ''}`).join(', ') : 
                              ''}` : 
                            isEventBooked ? 
                            `Събитие: ${bookingInfo && bookingInfo.type === 'event' ? 
                              `${bookingInfo.eventTitle} (${bookingInfo.time} - ${bookingInfo.endTime})` : 
                              ''}` : 
                            `Свободно: ${timeSlot} - кликнете за добавяне на събитие`
                          }
                        >
                          {isScheduleBooked && (
                            <div className="schedule-indicator">
                              <div className="schedule-dot"></div>
                              <div className="event-tooltip">
                                {bookingInfo && bookingInfo.type === 'schedule' && (
                                  <>
                                    <strong>Учебни занятия:</strong>
                                    {bookingInfo.classSchedules.map((schedule, index) => (
                                      <div key={index}>
                                        {schedule.subject} {schedule.className}
                                        {schedule.teacher && ` (${schedule.teacher})`}
                                      </div>
                                    ))}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          {isEventBooked && !isScheduleBooked && (
                            <div className="booking-indicator">
                              <div className="event-dot"></div>
                              <div className="event-tooltip">
                                {bookingInfo && bookingInfo.type === 'event' && (
                                  <>
                                    <strong>{bookingInfo.eventTitle}</strong>
                                    <br />
                                    {bookingInfo.time} - {bookingInfo.endTime}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          {isScheduleBooked && bookingInfo && bookingInfo.type === 'schedule' && (
                            <div className="class-count">
                              {bookingInfo.classSchedules.length}
                            </div>
                          )}
                          {!isScheduleBooked && !isEventBooked && (
                            <div className="available-text">+</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="rooms-legend">
              <div className="legend-item">
                <div className="legend-color available"></div>
                <span>Свободна стая (кликнете за добавяне)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color scheduled"></div>
                <span>Учебно занятие</span>
              </div>
              <div className="legend-item">
                <div className="legend-color booked"></div>
                <span>Резервация за събитие</span>
              </div>
            </div>

            <div className="bookings-list">
              <h3>Резервации за {new Date(selectedDate).toLocaleDateString('bg-BG')}</h3>
              
              {(() => {
                const dayOfWeek = new Date(selectedDate).getDay();
                const dayBookings = roomBookings.filter(booking => booking.date === selectedDate);
                const daySchedules = scheduleBookings.filter(schedule => 
                  schedule.dayOfWeek === dayOfWeek && schedule.classSchedules.length > 0
                );
                
                const totalBookings = dayBookings.length + daySchedules.length;
                
                if (totalBookings > 0) {
                  return (
                    <div className="bookings-grid">
                      {dayBookings.map(booking => (
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
                          <div className="booking-type">Събитие</div>
                        </div>
                      ))}
                      {daySchedules.map(schedule => (
                        <div key={schedule.id} className="booking-card scheduled">
                          <div className="booking-room">
                            <Building size={16} />
                            {schedule.room}
                          </div>
                          <div className="booking-time">
                            <Clock size={16} />
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                          <div className="booking-classes">
                            {schedule.classSchedules.map((classSchedule, index) => (
                              <div key={index} className="class-item">
                                <div className="class-subject">{classSchedule.subject}</div>
                                <div className="class-details">
                                  {classSchedule.className}
                                  {classSchedule.teacher && ` | ${classSchedule.teacher}`}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="booking-type">Учебно занятие</div>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div className="no-bookings">
                      <Calendar size={32} />
                      <p>Няма резервации за избраната дата</p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;