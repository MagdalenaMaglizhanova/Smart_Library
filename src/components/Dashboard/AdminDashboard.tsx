import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Users, Calendar, Trash2, Plus, Search, Clock, MapPin, User, Edit, X, Save, Building, Upload, Bold, Italic, List, Type, Heading, AlignLeft } from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './AdminDashboard.css';

interface UserEvent {
  eventId: string;
  registrationDate: any;
  status?: string;
}

interface User {
  uid: string; // добавено
  id: string;
  email: string;
  role: string;
  events?: UserEvent[];
  books?: any[];
  createdAt?: any;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  profile?: {
    displayName?: string;
    firstName?: string;
    grade?: string;
    lastName?: string;
    phone?: string;
  };
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
  participants: string[];     
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

// Компонент за Toolbar на редактора
const EditorToolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="editor-toolbar">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
        title="Удебелен"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
        title="Курсив"
      >
        <Italic size={16} />
      </button>
      <div className="toolbar-divider"></div>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
        title="Заглавие 1"
      >
        <Heading size={16} />
        <span>1</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
        title="Заглавие 2"
      >
        <Heading size={16} />
        <span>2</span>
      </button>
      <div className="toolbar-divider"></div>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
        title="Списък с точки"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
        title="Номериран списък"
      >
        <List size={16} />
        <span>1.</span>
      </button>
      <div className="toolbar-divider"></div>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`toolbar-btn ${editor.isActive('paragraph') ? 'active' : ''}`}
        title="Нормален текст"
      >
        <AlignLeft size={16} />
      </button>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  // Оригинални state променливи
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([]);
  const [scheduleBookings, setScheduleBookings] = useState<ScheduleBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"users" | "events" | "rooms">("users");
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

  // Нови state за модали
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalEventData, setModalEventData] = useState<Partial<Event>>({
    title: "",
    description: "",
    date: "",
    time: "",
    endTime: "",
    location: "",
    maxParticipants: 20,
    organizer: "",
    allowedRoles: ["reader", "librarian"]
  });

  // TipTap редактор
  const editor = useEditor({
    extensions: [StarterKit],
    content: modalEventData.description || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setModalEventData(prev => ({
        ...prev,
        description: html
      }));
    },
  });

  // Обновяване на редактора при промяна на modalEventData
  useEffect(() => {
    if (editor && modalEventData.description !== editor.getHTML()) {
      editor.commands.setContent(modalEventData.description || "");
    }
  }, [modalEventData.description, editor]);

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

  // Оригинални функции
  const validateTime = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const validateTimeRange = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return true;
    return endTime > startTime;
  };

  const convertToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

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
    
    return eventStartMin < slotEndMin && eventEndMin > slotStartMin;
  };

  const hasBookingConflict = (
    room: string, 
    date: string, 
    startTime: string, 
    endTime: string, 
    excludeEventId?: string
  ): boolean => {
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

  const isRoomBookedByEvent = (room: string, date: string, timeSlotHour: string): boolean => {
    const slotStart = timeSlotHour + ':00';
    const slotEnd = (parseInt(timeSlotHour) + 1) + ':00';
    
    return roomBookings.some(booking => {
      if (booking.room !== room || booking.date !== date) return false;
      
      return hasTimeOverlap(slotStart, slotEnd, booking.time, booking.endTime);
    });
  };

  const getEventInfo = (room: string, date: string, timeSlotHour: string): RoomBooking | null => {
    const slotStart = timeSlotHour + ':00';
    const slotEnd = (parseInt(timeSlotHour) + 1) + ':00';
    
    const booking = roomBookings.find(booking => {
      if (booking.room !== room || booking.date !== date) return false;
      
      return hasTimeOverlap(slotStart, slotEnd, booking.time, booking.endTime);
    });
    
    return booking || null;
  };

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

  const getBookingInfo = (room: string, date: string, timeSlotHour: string): BookingInfo | null => {
    const eventInfo = getEventInfo(room, date, timeSlotHour);
    if (eventInfo) {
      return eventInfo;
    }
    
    const scheduleInfo = getScheduleInfo(room, date, timeSlotHour);
    if (scheduleInfo) {
      return scheduleInfo;
    }
    
    return null;
  };

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const usersData: User[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        role: data.role || 'reader',
        events: data.events || [], // Взимаме events от базата данни
        books: data.books || [],
        createdAt: data.createdAt || null,
        displayName: data.displayName || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        profile: data.profile || {}
      } as User;
    });
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

  const deleteEvent = async (eventId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете събитието?")) return;
    await deleteDoc(doc(db, "events", eventId));
    fetchEvents();
  };

  const startAddingEventFromCell = (room: string, timeSlot: string) => {
    const [slotStart] = timeSlot.split('-');
    const startHour = parseInt(slotStart);
    
    setCellEventStartTime(`${slotStart}:00`);
    setCellEventEndTime(`${(startHour + 1).toString().padStart(2, '0')}:00`);
    
    setAddingEventFromCell({
      room,
      timeSlot
    });
  };

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
    
    setCellEventTitle("");
    setCellEventDesc("");
    setCellEventStartTime("");
    setCellEventEndTime("");
    setCellEventMaxParticipants(20);
    setCellEventOrganizer("");
    setAddingEventFromCell(null);
    
    fetchEvents();
  };

  const deleteBookingFromCell = async (booking: BookingInfo) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете тази резервация?")) return;
    
    try {
      if (booking.type === 'event') {
        await deleteDoc(doc(db, "events", booking.eventId));
        fetchEvents();
      } else if (booking.type === 'schedule') {
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

  const startEditingCell = (room: string, timeSlot: string) => {
    const [slotStart] = timeSlot.split('-');
    const bookingInfo = getBookingInfo(room, selectedDate, slotStart);
    
    if (bookingInfo) {
      setEditingCell({
        room,
        timeSlot,
        booking: bookingInfo
      });
    } else {
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
console.log(toggleEventRole);
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
console.log(updateMaxParticipants);
  // Функции за управление на модала
  const openCreateEventModal = () => {
    setModalMode('create');
    setModalEventData({
      title: "",
      description: "",
      date: "",
      time: "",
      endTime: "",
      location: "",
      maxParticipants: 20,
      organizer: "",
      allowedRoles: ["reader", "librarian"]
    });
    setShowEventModal(true);
  };

  const openEditEventModal = (event: Event) => {
    setModalMode('edit');
    setModalEventData({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      endTime: event.endTime,
      location: event.location,
      maxParticipants: event.maxParticipants,
      organizer: event.organizer,
      allowedRoles: event.allowedRoles,
      currentParticipants: event.currentParticipants
    });
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setModalEventData({});
  };

  const handleModalInputChange = (field: keyof Event, value: any) => {
    setModalEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateEvent = async () => {
    if (!modalEventData.title?.trim() || !modalEventData.date || 
        !modalEventData.time || !modalEventData.endTime || !modalEventData.location) {
      alert("Моля, попълнете всички задължителни полета!");
      return;
    }
    
    if (!validateTime(modalEventData.time) || !validateTime(modalEventData.endTime)) {
      alert("Моля, въведете валиден час във формат HH:MM (например 14:30)");
      return;
    }

    if (!validateTimeRange(modalEventData.time, modalEventData.endTime)) {
      alert("Крайният час трябва да е след началния час!");
      return;
    }
    
    if (hasBookingConflict(
      modalEventData.location, 
      modalEventData.date, 
      modalEventData.time, 
      modalEventData.endTime
    )) {
      alert("Стаята е вече резервирана за избрания времеви интервал! Моля, изберете друго време или място.");
      return;
    }
    
    try {
      const eventData = {
        title: modalEventData.title,
        description: modalEventData.description || "",
        date: modalEventData.date,
        time: modalEventData.time,
        endTime: modalEventData.endTime,
        location: modalEventData.location,
        maxParticipants: modalEventData.maxParticipants || 20,
        currentParticipants: 0,
        allowedRoles: modalEventData.allowedRoles || ["reader", "librarian"],
        organizer: modalEventData.organizer || "",
        createdAt: new Date(),
        registrations: []
      };

      await addDoc(collection(db, "events"), eventData);
      
      closeEventModal();
      fetchEvents();
      alert("Събитието е създадено успешно!");
      
    } catch (error) {
      console.error("Грешка при създаване на събитие:", error);
      alert("Грешка при създаване на събитие!");
    }
  };

  const handleUpdateEvent = async () => {
    if (!modalEventData.id) return;
    
    if (!modalEventData.title?.trim() || !modalEventData.date || 
        !modalEventData.time || !modalEventData.endTime || !modalEventData.location) {
      alert("Моля, попълнете всички задължителни полета!");
      return;
    }
    
    if (!validateTime(modalEventData.time) || !validateTime(modalEventData.endTime)) {
      alert("Моля, въведете валиден час във формат HH:MM (например 14:30)");
      return;
    }

    if (!validateTimeRange(modalEventData.time, modalEventData.endTime)) {
      alert("Крайният час трябва да е след началния час!");
      return;
    }

    if (modalEventData.maxParticipants && modalEventData.currentParticipants && 
        modalEventData.maxParticipants < modalEventData.currentParticipants) {
      alert("Не можете да зададете по-малко места от текущо записаните участници!");
      return;
    }

    if (hasBookingConflict(
      modalEventData.location, 
      modalEventData.date, 
      modalEventData.time, 
      modalEventData.endTime, 
      modalEventData.id
    )) {
      alert("Стаята е вече резервирана за избрания времеви интервал! Моля, изберете друго време или място.");
      return;
    }

    try {
      await updateDoc(doc(db, "events", modalEventData.id), {
        title: modalEventData.title,
        description: modalEventData.description || "",
        date: modalEventData.date,
        time: modalEventData.time,
        endTime: modalEventData.endTime,
        location: modalEventData.location,
        maxParticipants: modalEventData.maxParticipants || 20,
        organizer: modalEventData.organizer || "",
        allowedRoles: modalEventData.allowedRoles || ["reader", "librarian"],
        updatedAt: new Date()
      });
      
      closeEventModal();
      fetchEvents();
      alert("Събитието е обновено успешно!");
      
    } catch (error) {
      console.error("Грешка при обновяване на събитие:", error);
      alert("Грешка при обновяване на събитие!");
    }
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

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Административен Панел</h1>
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

        {/* Модал за създаване/редактиране на събитие */}
        {showEventModal && (
          <div className="modal-overlay">
            <div className="modal-content large-modal">
              <div className="modal-header">
                <h3>
                  {modalMode === 'create' ? 'Създаване на ново събитие' : 'Редактиране на събитие'}
                </h3>
                <button 
                  onClick={closeEventModal}
                  className="close-btn"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="modal-body event-modal-body">
                <div className="event-modal-grid">
                  <div className="modal-form-group">
                    <label className="required">Заглавие на събитието</label>
                    <input
                      type="text"
                      placeholder="Напр. Среща с писател"
                      value={modalEventData.title || ""}
                      onChange={(e) => handleModalInputChange('title', e.target.value)}
                      className="modal-form-input"
                    />
                  </div>
                  
                  <div className="modal-form-group">
                    <label>Описание (поддържа форматиране)</label>
                    <div className="editor-container">
                      <EditorToolbar editor={editor} />
                      <div className="editor-content">
                        <EditorContent editor={editor} />
                      </div>
                      <div className="formatting-tips">
                        <Type size={14} />
                        <span>Можете да форматирате текста: <strong>удебеляване</strong>, <em>курсив</em>, заглавия и списъци.</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="modal-form-group">
                    <label className="required">Дата</label>
                    <input
                      type="date"
                      value={modalEventData.date || ""}
                      onChange={(e) => handleModalInputChange('date', e.target.value)}
                      className="modal-form-input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="time-range-group">
                    <div className="modal-form-group">
                      <label className="required">Начален час</label>
                      <select
                        value={modalEventData.time || ""}
                        onChange={(e) => handleModalInputChange('time', e.target.value)}
                        className="modal-form-input"
                      >
                        <option value="">Изберете начален час</option>
                        {timeOptionsWithMinutes.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="modal-form-group">
                      <label className="required">Краен час</label>
                      <select
                        value={modalEventData.endTime || ""}
                        onChange={(e) => handleModalInputChange('endTime', e.target.value)}
                        className="modal-form-input"
                      >
                        <option value="">Изберете краен час</option>
                        {timeOptionsWithMinutes.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {modalEventData.time && modalEventData.endTime && 
                   !validateTimeRange(modalEventData.time, modalEventData.endTime) && (
                    <div className="validation-error">
                      Крайният час трябва да е след началния час!
                    </div>
                  )}
                  
                  <div className="modal-form-group">
                    <label className="required">Място</label>
                    <select
                      value={modalEventData.location || ""}
                      onChange={(e) => handleModalInputChange('location', e.target.value)}
                      className={`modal-form-input ${
                        modalEventData.location && modalEventData.date && 
                        modalEventData.time && modalEventData.endTime && 
                        hasBookingConflict(
                          modalEventData.location, 
                          modalEventData.date, 
                          modalEventData.time, 
                          modalEventData.endTime,
                          modalEventData.id
                        ) 
                          ? 'booking-conflict' 
                          : ''
                      }`}
                    >
                      <option value="">Изберете място</option>
                      {locationOptions.map(location => {
                        const hasConflict = modalEventData.date && modalEventData.time && modalEventData.endTime && 
                          hasBookingConflict(
                            location, 
                            modalEventData.date, 
                            modalEventData.time, 
                            modalEventData.endTime,
                            modalEventData.id
                          );
                        
                        return (
                          <option 
                            key={location} 
                            value={location}
                            disabled={hasConflict || false}
                            className={hasConflict ? 'conflict-option' : ''}
                          >
                            {location} {hasConflict ? '(Заето)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    
                    {modalEventData.location && modalEventData.date && 
                     modalEventData.time && modalEventData.endTime && 
                     hasBookingConflict(
                       modalEventData.location, 
                       modalEventData.date, 
                       modalEventData.time, 
                       modalEventData.endTime,
                       modalEventData.id
                     ) && (
                      <div className="validation-error">
                        Стаята е вече резервирана за избрания интервал!
                      </div>
                    )}
                  </div>
                  
                  <div className="modal-form-group">
                    <label>Брой места</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={modalEventData.maxParticipants || 20}
                      onChange={(e) => handleModalInputChange('maxParticipants', parseInt(e.target.value) || 20)}
                      className="modal-form-input"
                    />
                    {modalMode === 'edit' && modalEventData.currentParticipants && (
                      <small className="help-text">
                        Текущо записани: {modalEventData.currentParticipants} участника
                      </small>
                    )}
                  </div>
                  
                  <div className="modal-form-group">
                    <label>Организатор</label>
                    <input
                      type="text"
                      placeholder="Име на организатора"
                      value={modalEventData.organizer || ""}
                      onChange={(e) => handleModalInputChange('organizer', e.target.value)}
                      className="modal-form-input"
                    />
                  </div>
                  
                  <div className="modal-form-group">
                    <label>Разрешени роли</label>
                    <div className="roles-checkbox-group">
                      {["reader", "librarian", "admin"].map(role => (
                        <label key={role} className="role-checkbox-label">
                          <input
                            type="checkbox"
                            checked={(modalEventData.allowedRoles || []).includes(role)}
                            onChange={(e) => {
                              const currentRoles = modalEventData.allowedRoles || [];
                              const newRoles = e.target.checked
                                ? [...currentRoles, role]
                                : currentRoles.filter(r => r !== role);
                              handleModalInputChange('allowedRoles', newRoles);
                            }}
                            className="role-checkbox-input"
                          />
                          <span className={`role-badge role-${role}`}>
                            {role === 'reader' ? 'Читатели' : 
                             role === 'librarian' ? 'Библиотекари' : 'Администратори'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    onClick={modalMode === 'create' ? handleCreateEvent : handleUpdateEvent}
                    disabled={
                      !modalEventData.title?.trim() || 
                      !modalEventData.date || 
                      !modalEventData.time || 
                      !modalEventData.endTime || 
                      !modalEventData.location || 
                      !validateTimeRange(modalEventData.time, modalEventData.endTime) ||
                      hasBookingConflict(
                        modalEventData.location, 
                        modalEventData.date, 
                        modalEventData.time, 
                        modalEventData.endTime,
                        modalEventData.id
                      )
                    }
                    className="primary-btn modal-save-btn"
                  >
                    <Save size={16} />
                    {modalMode === 'create' ? 'Създай Събитие' : 'Запази Промените'}
                  </button>
                  
                  <button 
                    onClick={closeEventModal}
                    className="secondary-btn"
                  >
                    Отказ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="content-section">
            <h2>Управление на Потребители</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Имейл</th>
                    <th>Роля</th>
                    <th>Записани събития</th>
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
  <div className="user-events-section">
    {(() => {
      // Филтрираме само събитията, в които е записан потребителят
      const userEvents = events.filter(e => e.participants?.includes(user.id));

      if (userEvents.length === 0) {
        return <span className="no-events">Няма записани събития</span>;
      }

      return (
        <div className="user-events-list">
          {userEvents.slice(0, 3).map((eventObj, index) => (
            <div key={index} className="user-event-item">
              <span className="event-title">{eventObj.title}</span>
              <span className="event-date">
                {new Date(eventObj.date).toLocaleDateString('bg-BG')}
              </span>
            </div>
          ))}
          {userEvents.length > 3 && (
            <div className="more-events">
              + още {userEvents.length - 3} събития
            </div>
          )}
        </div>
      );
    })()}
  </div>
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
            <div className="events-header">
              <h2>Управление на Събития</h2>
              <button 
                onClick={openCreateEventModal}
                className="create-event-btn primary-btn"
              >
                <Plus size={16} />
                Създай Ново Събитие
              </button>
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
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map(event => (
                      <tr key={event.id} className={isEventFull(event) ? 'event-full' : ''}>
                        <td className="event-info-cell">
                          <div className="event-title-section">
                            <div className="event-title">{event.title}</div>
                            {event.description && (
                              <div 
                                className="event-desc-html"
                                dangerouslySetInnerHTML={{ __html: event.description }}
                              />
                            )}
                          </div>
                        </td>
                        <td className="event-time-cell">
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
                        </td>
                        <td>
                          <div className="event-location">
                            <MapPin size={14} />
                            {event.location}
                          </div>
                        </td>
                        <td>
                          <div className="event-organizer">
                            {event.organizer || "Не е посочен"}
                          </div>
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
                            <button
                              onClick={() => openEditEventModal(event)}
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