import React, { useEffect, useState } from 'react';
import { Search, ArrowRight, BookOpen, Users, Clock, Star, Calendar, MapPin, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';
import libraryImage from '../assets/images/1.jpg';

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
}

const Home: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Зареждане на събития от Firestore
  const fetchEvents = async () => {
    try {
      const snapshot = await getDocs(collection(db, "events"));
      const eventsData: Event[] = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Event));
      
      // Филтрираме само бъдещите събития
      const currentDate = new Date();
      const futureEvents = eventsData.filter(event => {
        if (!event.date) return false;
        
        const eventDate = parseBulgarianDate(event.date);
        const isFuture = eventDate >= currentDate;

        // ✅ ВСИЧКИ виждат събитията, независимо дали са логнати
        return isFuture;
      });
      
      setEvents(futureEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      // Fallback данни
      setEvents([
        {
          id: '1',
          title: 'Среща с писател',
          date: '15 Декември',
          time: '14:00',
          endTime: '15:30',
          location: 'Читалня',
          description: 'Среща с известен български автор',
          maxParticipants: 20,
          currentParticipants: 8,
          allowedRoles: ['reader', 'librarian'],
          organizer: 'Мария Иванова'
        },
        {
          id: '2',
          title: 'Чета с приятели',
          date: '20 Декември',
          time: '16:00',
          endTime: '17:30',
          location: 'Детски отдел',
          description: 'Четене на приказки за най-малките',
          maxParticipants: 15,
          currentParticipants: 12,
          allowedRoles: ['reader'],
          organizer: 'Петър Георгиев'
        },
        {
          id: '3',
          title: 'Литературен клуб',
          date: '22 Декември',
          time: '17:00',
          endTime: '18:30',
          location: 'Главна зала',
          description: 'Дискусия за съвременна българска литература',
          maxParticipants: 25,
          currentParticipants: 18,
          allowedRoles: ['reader', 'librarian'],
          organizer: 'Анна Петрова'
        },
        {
          id: '4',
          title: 'Творческа работилница',
          date: '25 Декември',
          time: '10:00',
          endTime: '12:00',
          location: 'Творческа стая',
          description: 'Работилница по писане на разкази',
          maxParticipants: 12,
          currentParticipants: 6,
          allowedRoles: ['reader'],
          organizer: 'Георги Димитров'
        }
      ]);
    }
  };

  // Помощна функция за парсване на български дати
  const parseBulgarianDate = (dateString: string): Date => {
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
        return new Date(currentYear, month, day);
      }
    }
    
    return new Date();
  };

  // ✅ ПРОМЕНЕНА ФУНКЦИЯ - само пренасочване, без автоматично записване
  const handleEventRegistration = (event: Event) => {
    if (!user) {
      alert('Моля, влезте в профила си, за да се запишете за събитието!');
      return;
    }

    if (isEventFull(event)) {
      alert('Събитието е пълно! Не можете да се запишете.');
      return;
    }

    // ✅ САМО ПРОНАСОЧВАНЕ към dashboard
    // Записването ще стане ръчно от потребителя в dashboard
    navigate('/dashboard');
  };

  const toggleShowAllEvents = () => {
    setShowAllEvents(!showAllEvents);
  };

  const displayedEvents = showAllEvents ? events : events.slice(0, 6);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Hero Section Data
  const heroData = {
    title: 'Училищна Библиотека',
    subtitle: 'Открий света на знанието',
    description: 'Нашата библиотека предлага богата колекция от книги, учебни помагала и ресурси за всички ученици и учители.',
    searchPlaceholder: 'Търсете книги, автори или теми...'
  };

  // Features Data
  const features = [
    {
      icon: BookOpen,
      title: 'Богата колекция',
      description: 'Над 10,000 книги за всички възрасти и интереси'
    },
    {
      icon: Users,
      title: 'Читателски клубове',
      description: 'Регулярни срещи и дискусии за любители на четенето'
    },
    {
      icon: Clock,
      title: 'Онлайн резервации',
      description: 'Резервирайте книги онлайн и ги вземете когато ви е удобно'
    },
    {
      icon: Star,
      title: 'Съвременна среда',
      description: 'Модерно обзавеждане и уютна атмосфера за четене'
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
      content: 'Библиотеката е моето второ дома! Намирам всички необходими учебни материали и участвам в читателския клуб.',
      rating: 5
    },
    {
      name: 'Петър Георгиев',
      role: 'Учител по литература',
      content: 'Професионално обслужване и богата колекция. Отлично място за учениците да развиват любовта към четенето.',
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
              <span className="hero-main-title">{heroData.title}</span>
              <span className="hero-subtitle-text">{heroData.subtitle}</span>
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
            <h2 className="section-title">Защо да изберете нашата библиотека?</h2>
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
            <h2 className="section-title">Препоръчани книги</h2>
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

      {/* Book Animation Section */}
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

      {/* Events Section */}
      <section className="events-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Предстоящи събития</h2>
            <p className="section-subtitle">
              Участвайте в интересни четения и дискусии
            </p>
          </div>

          <div className="events-grid-compact">
            {displayedEvents.map((event, index) => {
              const colorVariants = [
                'event-card-green',
                'event-card-yellow', 
                'event-card-red',
                'event-card-primary'
              ];
              const colorClass = colorVariants[index % colorVariants.length];
              
              const eventIcons = [Users, BookOpen, Users, Star];
              const EventIcon = eventIcons[index % eventIcons.length];
              
              return (
                <div key={event.id} className={`event-card-compact ${colorClass}`}>
                  <div className="event-header-compact">
                    <div className="event-badge-compact">
                      <Calendar className="event-badge-icon-compact" />
                      <span>Събитие</span>
                    </div>
                    <div className="event-icon-compact">
                      <EventIcon className="event-icon-svg-compact" />
                    </div>
                  </div>
                  
                  <div className="event-content-compact">
                    <h3 className="event-title-compact">{event.title}</h3>
                    <p className="event-description-compact">{event.description}</p>
                    
                    <div className="event-details-compact">
                      <div className="event-detail-compact">
                        <Calendar className="detail-icon-compact" />
                        <span className="detail-value-compact">{event.date}</span>
                      </div>
                      <div className="event-detail-compact">
                        <Clock className="detail-icon-compact" />
                        <span className="detail-value-compact">{event.time}</span>
                      </div>
                      <div className="event-detail-compact">
                        <MapPin className="detail-icon-compact" />
                        <span className="detail-value-compact">{event.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="event-footer-compact">
                    <div className="event-spots-compact">
                      <span className="spots-text-compact">
                        {getAvailableSpots(event)} свободни места
                      </span>
                    </div>
                    <button 
                      className={`event-btn-compact ${!user || isEventFull(event) ? 'event-btn-disabled-compact' : ''}`}
                      disabled={!user || isEventFull(event)}
                      onClick={() => handleEventRegistration(event)}
                    >
                      <span>
                        {!user 
                          ? 'Влезте, за да се запишете' 
                          : isEventFull(event) 
                            ? 'Пълно' 
                            : 'Запиши се'
                        }
                      </span>
                      {!isEventFull(event) && user && <ArrowRight className="btn-icon-compact" />}
                    </button>
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
            <h2 className="section-title">Какво казват нашите читатели?</h2>
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
            <h2 className="section-title">За библиотеката</h2>
            <p className="section-subtitle">
              Нашата мисия е да създадем вдъхновяваща среда за учене и откриване 
              на нови светове чрез четенето.
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
                <p>Това не е просто библиотека, 
                  а малка общност за споделяне на идеи, която активно спомага за подобряване 
                  на училищната среда.</p>
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
                  src={libraryImage} 
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