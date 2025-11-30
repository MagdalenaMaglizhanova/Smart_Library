import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowRight, 
  ChevronUp, 
  ChevronDown, 
  Users, 
  BookOpen, 
  Star, 
  User, 
  Search, 
  Quote,
  Newspaper,
  Eye,
  Share2,
  Heart,
  Bookmark,
  Tag,
  ExternalLink
} from 'lucide-react';
import { db } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import './Home.css';
import libraryImage from '../assets/images/2.jpg';
import library from '../assets/images/library.png';

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
  timestamp?: Date;
}

interface News {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  views: number;
  likes: number;
}

const Home: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllNews, setShowAllNews] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Нова функция за парсване на дати - поддържа и ISO и български формат
  const parseEventDate = (dateString: string, timeString: string = "00:00"): Date => {
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-').map(Number);
      const [hours, minutes] = timeString.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    }
    
    const months: { [key: string]: number } = {
      'януари': 0, 'февруари': 1, 'март': 2, 'април': 3,
      'май': 4, 'юни': 5, 'юли': 6, 'август': 7,
      'септември': 8, 'октомври': 9, 'ноември': 10, 'декември': 11
    };
    
    const parts = dateString.split(' ');
    if (parts.length === 2) {
      const day = parseInt(parts[0]);
      const month = months[parts[1].toLowerCase()];
      if (day && month !== undefined) {
        const currentYear = new Date().getFullYear();
        const [hours, minutes] = timeString.split(':').map(Number);
        return new Date(currentYear, month, day, hours, minutes);
      }
    }
    
    return new Date();
  };

  // Функция за форматиране на датата за показване в български стил
  const formatDateForDisplay = (dateString: string): string => {
    if (dateString.includes('-')) {
      const [_year, month, day] = dateString.split('-').map(Number);
      const monthsBg = [
        'януари', 'февруари', 'март', 'април', 'май', 'юни',
        'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'
      ];
      return `${day} ${monthsBg[month - 1]}`;
    }
    return dateString;
  };
console.log(formatDateForDisplay("2024-12-25")); // Пример за тестване
  // Функция за форматиране на дата за календар
  const formatDateForCalendar = (dateString: string) => {
    const date = parseEventDate(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('bg-BG', { month: 'short' }),
      weekday: date.toLocaleDateString('bg-BG', { weekday: 'short' })
    };
  };

  // Зареждане на събития от Firestore
  const fetchEvents = async () => {
    try {
      const snapshot = await getDocs(collection(db, "events"));
      const eventsData: Event[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const eventTimestamp = parseEventDate(data.date, data.time);
        
        return { 
          id: doc.id, 
          ...data,
          timestamp: eventTimestamp
        } as Event;
      });
      
      const currentDate = new Date();
      const futureEvents = eventsData.filter(event => {
        if (!event.date || !event.timestamp) return false;
        const eventEndTime = parseEventDate(event.date, event.endTime);
        return eventEndTime >= currentDate;
      });
      
      futureEvents.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      setEvents(futureEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      const currentDate = new Date();
      
      const fallbackEvents = [
        {
          id: '1',
          title: 'Среща с писател',
          date: '2025-12-15',
          time: '14:00',
          endTime: '15:30',
          location: 'Читалня',
          description: 'Среща с известен български автор',
          maxParticipants: 20,
          currentParticipants: 8,
          allowedRoles: ['reader', 'librarian'],
          organizer: 'Мария Иванова',
          timestamp: parseEventDate('2025-12-15', '14:00')
        },
        {
          id: '2',
          title: 'Чета с приятели',
          date: '2025-12-20',
          time: '16:00',
          endTime: '17:30',
          location: 'Детски отдел',
          description: 'Четене на приказки за най-малките',
          maxParticipants: 15,
          currentParticipants: 12,
          allowedRoles: ['reader'],
          organizer: 'Петър Георгиев',
          timestamp: parseEventDate('2025-12-20', '16:00')
        },
        {
          id: '3',
          title: 'Литературен клуб',
          date: '2025-12-22',
          time: '17:00',
          endTime: '18:30',
          location: 'Главна зала',
          description: 'Дискусия за съвременна българска литература',
          maxParticipants: 25,
          currentParticipants: 18,
          allowedRoles: ['reader', 'librarian'],
          organizer: 'Анна Петрова',
          timestamp: parseEventDate('2025-12-22', '17:00')
        },
        {
          id: '4',
          title: 'Творческа работилница',
          date: '2025-12-25',
          time: '10:00',
          endTime: '12:00',
          location: 'Творческа стая',
          description: 'Работилница по писане на разкази',
          maxParticipants: 12,
          currentParticipants: 6,
          allowedRoles: ['reader'],
          organizer: 'Георги Димитров',
          timestamp: parseEventDate('2025-12-25', '10:00')
        }
      ].filter(event => {
        const eventEndTime = parseEventDate(event.date, event.endTime);
        return eventEndTime >= currentDate;
      }).sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
      
      setEvents(fallbackEvents);
    }
  };

  // Зареждане на новини
  const fetchNews = async () => {
    try {
      const snapshot = await getDocs(collection(db, "news"));
      const newsData: News[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as News));
      
      // Сортиране по дата (най-новите първи)
      newsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNews(newsData);
    } catch (error) {
      console.error("Error fetching news:", error);
      // Fallback новини
      const fallbackNews: News[] = [
        {
          id: '1',
          title: 'Нова колекция от детски книги',
          excerpt: 'Разширяваме колекцията си с над 200 нови заглавия за деца и юноши',
          content: 'Библиотеката е обогатила колекцията си с най-новите заглавия в детската и юношеска литература...',
          image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          date: '2024-12-10',
          author: 'Мария Иванова',
          category: 'Нови книги',
          tags: ['книги', 'деца', 'нови заглавия'],
          views: 156,
          likes: 23
        },
        {
          id: '2',
          title: 'Дигитална библиотека - вече достъпна',
          excerpt: 'Започваме с дигитални услуги - книги онлайн за всички читатели',
          content: 'С гордость представяме нашата нова дигитална платформа...',
          image: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcSqSQCwBRu8DVNP62v6c2czLbqmp3RrfIRY5LAT5IITN9mt1XAxjMcfx8kl9LEWVSsIEUsNlJSP',
          date: '2024-12-08',
          author: 'Петър Георгиев',
          category: 'Дигитални услуги',
          tags: ['дигитални', 'онлайн', 'е-книги'],
          views: 203,
          likes: 45
        },
        {
          id: '3',
          title: 'Рекордна посещаемост този месец',
          excerpt: 'Над 500 посетители за месец ноември - нов рекорд за библиотеката',
          content: 'Библиотеката отчете рекордна посещаемост за месец ноември...',
          image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          date: '2024-12-05',
          author: 'Анна Петрова',
          category: 'Новини',
          tags: ['посещаемост', 'рекорд', 'активност'],
          views: 189,
          likes: 34
        },
        {
          id: '4',
          title: 'Състезание за млади поети',
          excerpt: 'Обявяваме национално състезание за млади таланти в поезията',
          content: 'Под патронажа на Министерството на културата, библиотеката организира...',
          image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          date: '2024-12-01',
          author: 'Георги Димитров',
          category: 'Събития',
          tags: ['състезание', 'поезия', 'млади таланти'],
          views: 278,
          likes: 67
        }
      ];
      setNews(fallbackNews);
    }
  };

  const handleEventRegistration = (event: Event) => {
    if (!user) {
      alert('Моля, влезте в профила си, за да се запишете за събитието!');
      return;
    }

    if (isEventFull(event)) {
      alert('Събитието е пълно! Не можете да се запишете.');
      return;
    }

    navigate('/dashboard');
  };

  const toggleShowAllEvents = () => {
    setShowAllEvents(!showAllEvents);
  };

  const toggleShowAllNews = () => {
    setShowAllNews(!showAllNews);
  };

  const displayedEvents = showAllEvents ? events : events.slice(0, 6);
  const displayedNews = showAllNews ? news : news.slice(0, 3);

  useEffect(() => {
    fetchEvents();
    fetchNews();
  }, []);

  // Hero Section Data
  const heroData = {
  title: 'Smart School Library',
  subtitle: 'Училищна библиотека',
  description: 'Място за знания и вдъхновение. Нашата библиотека предлага богата колекция от книги, учебни помагала и ресурси за всички ученици и учители.',
  searchPlaceholder: 'Търсете книги, автори или теми...'
};

  // Features Data
  const features = [
    {
      icon: BookOpen,
      title: 'Богата колекция',
      description: 'Над 10,000 книги и учебници за всички специалности'
    },
    {
      icon: Users,
      title: 'Читателски клубове',
      description: 'Регулярни срещи и дискусии за любители на четенето'
    },
    {
      icon: Clock,
      title: 'Онлайн резервации',
      description: 'Резервирайте книги онлайн и ги вземете в удобно за Вас време'
    },
    {
      icon: Star,
      title: 'Съвременна среда',
      description: 'Модерно обзавеждане и уютна атмосфера за организирани събития'
    }
  ];

  // Books Data with images
  const featuredBooks = [
    {
      id: 1,
      title: 'Под игото',
      author: 'Иван Вазов',
      category: 'Българска класика',
      rating: 4.8,
      available: true,
      image: 'https://www.ciela.com/media/catalog/product/cache/32bb0748c82325b02c55df3c2a9a9856/p/o/pod-igoto_1.jpg'
    },
    {
      id: 2,
      title: 'Железният светилник',
      author: 'Димитър Талев',
      category: 'Исторически роман',
      rating: 4.6,
      available: true,
      image: 'https://hermesbooks.bg/media/catalog/product/cache/e533a3e3438c08fe7c51cedd0cbec189/j/e/jelezniat_svetilnik_hrm_2_20200901160342.jpg'
    },
    {
      id: 3,
      title: 'Тютюн',
      author: 'Димитър Димов',
      category: 'Роман',
      rating: 4.7,
      available: false,
      image: 'https://www.elixiria.bg/image/cache/data/d17f7e84adce47498b642ad632e054e9-259x388.jpg'
    },
    {
      id: 4,
      title: 'Време разделно',
      author: 'Антон Дончев',
      category: 'Исторически роман',
      rating: 4.9,
      available: true,
      image: 'https://kultura.bg/web/wp-content/uploads/2019/07/vreme-razdelno-2.jpg'
    }
  ];

  // Testimonials Data
  const testimonials = [
    {
      name: 'Мария Иванова',
      role: 'Ученичка, 11 клас',
      content: 'Библиотеката е моят втори дом! Намирам всички необходими учебни материали и участвам в читателския клуб.',
      rating: 5
    },
    {
      name: 'Петър Георгиев',
      role: 'Учител по литература',
      content: 'Професионално обслужване и богата колекция. Прекрасно място, където учениците развиват любов към книгата.',
      rating: 5
    },
    {
      name: 'Анна Димитрова',
      role: 'Родител',
      content: 'Дъщеря ми обича да посещава библиотеката. Персоналът е много любезен и винаги помагат с избора на книги.',
      rating: 4
    }
  ];

  // Helper Functions
  const renderStars = (rating: number) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`star-icon ${
              star <= rating ? 'star-filled' : 'star-empty'
            }`}
          />
        ))}
        <span className="rating-text">({rating})</span>
      </div>
    );
  };

  const renderTestimonialStars = (rating: number) => {
    return (
      <div className="testimonial-stars">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`testimonial-star ${
              index < rating 
                ? 'star-filled' 
                : 'star-empty'
            }`}
          />
        ))}
      </div>
    );
  };

  const getAvailableSpots = (event: Event) => {
    return Math.max(0, event.maxParticipants - event.currentParticipants);
  };

  const isEventFull = (event: Event) => {
    return getAvailableSpots(event) <= 0;
  };

  const formatNewsDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="home-container">
      {/* Modern Hero Section with Background Image */}
      <section className="hero-section">
        <div className="hero-background">
          <img 
            src={libraryImage} 
            alt="Училищна библиотека" 
            className="hero-bg-image"
          />
          <div className="hero-overlay"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-blur-box">
            <h1 className="hero-title">
  <span className="handwritten-hero">{heroData.title}</span>
  <p></p>
  <span className="handwritten-hero-sub">{heroData.subtitle}</span>
</h1>

<p className="hero-description">
  {heroData.description}
</p>

            {/* Search Bar */}
            <div className="search-container">
              <div className="search-bar">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder={heroData.searchPlaceholder}
                  className="search-input"
                />
              </div>
            </div>

            <div className="hero-buttons">
              <button className="btn btn-primary">
                <span>Разгледай каталога</span>
                <ArrowRight className="btn-icon" />
              </button>
              <button className="btn btn-secondary">
                Стани читател
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
  <h2 className="handwritten-title">Защо да изберете нашата библиотека?</h2>
  <p className="section-subtitle">
    Предлагаме модерни услуги и богата колекция, които правят четенето 
    удоволствие за всеки ученик и учител.
  </p>
</div>
          <div className="features-grid">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="feature-card">
                  <div className="feature-icon-wrapper">
                    <IconComponent className="feature-icon-svg" />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <div className="feature-link">Научете повече →</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Book Catalog Section */}
      <section className="catalog-section">
        <div className="container">
          <div className="section-header">
  <h2 className="handwritten-title">Препоръчани книги</h2>
  <p className="section-subtitle">
    Открийте най-популярните заглавия в нашата библиотека
  </p>
</div>

          <div className="books-grid">
            {featuredBooks.map((book) => (
              <div key={book.id} className="book-card">
                <div className="book-content">
                  <div className="book-cover">
                    <img 
                      src={book.image} 
                      alt={book.title}
                      className="book-cover-image"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="book-cover-fallback">
                      <BookOpen className="book-cover-icon" />
                    </div>
                  </div>
                  <div className="book-details">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">{book.author}</p>
                    <p className="book-category">{book.category}</p>
                    
                    <div className="book-meta">
                      {renderStars(book.rating)}
                      <span className={`availability ${book.available ? 'available' : 'unavailable'}`}>
                        {book.available ? 'Налична' : 'Заета'}
                      </span>
                    </div>
                    
                    <button className="reserve-btn">
                      Резервирай
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="catalog-footer">
            <button className="btn btn-outline catalog-btn">
              Виж всички книги
            </button>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="news-section">
        <div className="container">
          <div className="section-header">
  <div className="section-header-top">
    <Newspaper className="section-title-icon" />
    <h2 className="handwritten-title">Новини и Събития</h2>
  </div>
  <p className="section-subtitle">
    Най-новите актуализации и събития от библиотеката
  </p>
</div>

          <div className="news-grid">
            {displayedNews.map((newsItem, _index) => (
              <article key={newsItem.id} className="news-card">
                <div className="news-image-container">
                  <img 
                    src={newsItem.image} 
                    alt={newsItem.title}
                    className="news-image"
                  />
                  <div className="news-category-tag">
                    <Tag className="tag-icon" />
                    <span>{newsItem.category}</span>
                  </div>
                  <div className="news-overlay">
                    <button className="news-action-btn">
                      <Bookmark className="action-icon" />
                    </button>
                    <button className="news-action-btn">
                      <Share2 className="action-icon" />
                    </button>
                  </div>
                </div>

                <div className="news-content">
                  <div className="news-meta">
                    <span className="news-date">{formatNewsDate(newsItem.date)}</span>
                    <span className="news-author">от {newsItem.author}</span>
                  </div>

                  <h3 className="news-title">{newsItem.title}</h3>
                  <p className="news-excerpt">{newsItem.excerpt}</p>

                  <div className="news-footer">
                    <div className="news-stats">
                      <div className="news-stat">
                        <Eye className="stat-icon" />
                        <span>{newsItem.views}</span>
                      </div>
                      <div className="news-stat">
                        <Heart className="stat-icon" />
                        <span>{newsItem.likes}</span>
                      </div>
                    </div>

                    <div className="news-tags">
                      {newsItem.tags.slice(0, 2).map((tag, tagIndex) => (
                        <span key={tagIndex} className="news-tag">#{tag}</span>
                      ))}
                    </div>
                  </div>

                  <button className="news-read-more">
                    <span>Прочети повече</span>
                    <ExternalLink className="read-more-icon" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {news.length > 3 && (
            <div className="news-toggle-container">
              <button 
                className="news-toggle-btn"
                onClick={toggleShowAllNews}
              >
                {showAllNews ? (
                  <>
                    <ChevronUp className="toggle-icon" />
                    <span>Покажи по-малко новини</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="toggle-icon" />
                    <span>Покажи всички новини ({news.length})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Book Animation Section */}
      <section className="book-animation-section">
        <div className="bookshelf">
          <div className="books">
            <div 
              className="book" 
              style={{ '--bg-image': 'url(https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1581128232l/50214741.jpg)' } as any}
            ></div>
            <div 
              className="book" 
              style={{ '--bg-image': 'url(https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1544204706l/42505366.jpg)' } as any}
            ></div>
            <div 
              className="book" 
              style={{ '--bg-image': 'url(https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1541621322l/42201395.jpg)' } as any}
            ></div>
            <div 
              className="book" 
              style={{ '--bg-image': 'url(https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1548518877l/43263520._SY475_.jpg)' } as any}
            ></div>
          </div>
        </div>
      </section>

      {/* Enhanced Events Section with Calendar Design */}
      <section className="events-section">
        <div className="container">
          <div className="section-header">
  <div className="section-header-top">
    <Calendar className="section-title-icon" />
    <h2 className="handwritten-title">Предстоящи Събития</h2>
  </div>
  <p className="section-subtitle">
    Участвайте в интересни четения, дискусии и културни прояви
  </p>
</div>

          <div className="calendar-events-grid">
            {displayedEvents.map((event, index) => {
              const calendarDate = formatDateForCalendar(event.date);
              const colorVariants = ['calendar-green', 'calendar-yellow', 'calendar-red', 'calendar-blue'];
              const colorClass = colorVariants[index % colorVariants.length];
              
              return (
                <div key={event.id} className="calendar-event-card">
                  <div className={`calendar-date ${colorClass}`}>
                    <div className="calendar-day">{calendarDate.day}</div>
                    <div className="calendar-month">{calendarDate.month}</div>
                    <div className="calendar-weekday">{calendarDate.weekday}</div>
                  </div>

                  <div className="calendar-event-content">
                    <div className="event-header-calendar">
                      <h3 className="event-title-calendar">{event.title}</h3>
                      <div className="event-time-badge">
                        <Clock className="time-badge-icon" />
                        <span>{event.time} - {event.endTime}</span>
                      </div>
                    </div>

                    <p className="event-description-calendar">{event.description}</p>

                    <div className="event-details-calendar">
                      <div className="event-detail-row">
                        <MapPin className="detail-icon-calendar" />
                        <span className="detail-text-calendar">{event.location}</span>
                      </div>
                      <div className="event-detail-row">
                        <User className="detail-icon-calendar" />
                        <span className="detail-text-calendar">{event.organizer}</span>
                      </div>
                    </div>

                    <div className="event-footer-calendar">
                      <div className="participants-info">
                        <Users className="participants-icon" />
                        <span className="participants-text">
                          {event.currentParticipants} / {event.maxParticipants} записани
                        </span>
                        {getAvailableSpots(event) > 0 && (
                          <span className="spots-available">
                            {getAvailableSpots(event)} свободни места
                          </span>
                        )}
                      </div>

                      <button 
                        className={`event-register-btn ${colorClass} ${
                          !user || isEventFull(event) ? 'event-btn-disabled' : ''
                        }`}
                        disabled={!user || isEventFull(event)}
                        onClick={() => handleEventRegistration(event)}
                      >
                        <span>
                          {!user 
                            ? 'Влезте, за да се запишете' 
                            : isEventFull(event) 
                              ? 'Събитието е пълно' 
                              : 'Запиши се'
                          }
                        </span>
                        {!isEventFull(event) && user && <ArrowRight className="register-icon" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {events.length === 0 && (
            <div className="no-events">
              <Calendar className="no-events-icon" />
              <p>В момента няма предстоящи събития</p>
            </div>
          )}

          {events.length > 4 && (
            <div className="events-toggle-container">
              <button 
                className="events-toggle-btn"
                onClick={toggleShowAllEvents}
              >
                {showAllEvents ? (
                  <>
                    <ChevronUp className="toggle-icon" />
                    <span>Покажи по-малко събития</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="toggle-icon" />
                    <span>Покажи всички събития ({events.length})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
  <h2 className="handwritten-title">Какво казват нашите читатели?</h2>
  <p className="section-subtitle">
    Отзиви от ученици, учители и родители
  </p>
</div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <Quote className="testimonial-quote" />
                {renderTestimonialStars(testimonial.rating)}
                <p className="testimonial-content">
                  "{testimonial.content}"
                </p>
                <div className="testimonial-author">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-role">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <div className="section-header">
  <h2 className="handwritten-title">За библиотеката</h2>
  <p className="section-subtitle">
    Нашата мисия е да осигурим среда, в която учениците да учат и да откриват нови светове чрез книгите.
  </p>
</div>

          <div className="about-content">
            <div className="about-text">
              <div className="about-header">
                <h3 className="about-subtitle">Нашата история и мисия</h3>
              </div>
              
              <div className="about-description">
                <p>
                  Основана преди 20 години, нашата библиотека се превърна в любимо място 
                  за ученици и учители. Постоянно обогатяваме колекцията си с нови заглавия 
                  и съвременни ресурси.
                </p>
                <p>
                  Организираме редовни събития, четения и работилници, за да насърчим 
                  любовта към книгата и да подкрепим образователния процес.
                </p>
                <p>
                  Вярваме, че всяка книга е врата към нов свят, и нашата цел е да помогнем 
                  на всеки ученик да открие своя път към знанието. 
                </p>
                <p>Това не е просто библиотека, а общност за споделяне на идеи, която активно допринася за подобряване на училищната среда.</p>
              </div>
            
              <div className="about-buttons">
                <button className="btn btn-primary about-btn">
                  <Users className="btn-icon" />
                  <span>Запознай се с екипа</span>
                </button>
                <button className="btn btn-outline about-btn">
                  <MapPin className="btn-icon" />
                  <span>Свържи се с нас</span>
                </button>
              </div>
            </div>
            
            <div className="about-visual">
              <div className="image-container">
                <img 
                  src={library} 
                  alt="Библиотеката" 
                  className="about-image"
                />
                <div className="image-overlay">
                  <div className="overlay-content">
                    <BookOpen className="overlay-icon" />
                    <span>Вашата библиотека</span>
                  </div>
                </div>
              </div>
              <div className="visual-stats">
                <div className="visual-stat">
                  <div className="stat-number">20+</div>
                  <div className="stat-label">Години опит</div>
                </div>
                <div className="visual-stat">
                  <div className="stat-number">10k+</div>
                  <div className="stat-label">Книги</div>
                </div>
                <div className="visual-stat">
                  <div className="stat-number">2.5k+</div>
                  <div className="stat-label">Читатели</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;