import React from 'react';
import { Search, ArrowRight, BookOpen, Users, Clock, Star, Calendar, MapPin, Quote } from 'lucide-react';
import './Home.css';
import libraryImage from '../assets/images/1.jpg';

const Home: React.FC = () => {
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

  // Events Data
  const events = [
    {
      id: 1,
      title: 'Среща с писател',
      date: '15 Декември',
      time: '14:00',
      location: 'Читалня',
      description: 'Среща с известен български автор'
    },
    {
      id: 2,
      title: 'Чета с приятели',
      date: '20 Декември',
      time: '16:00',
      location: 'Детски отдел',
      description: 'Четене на приказки за най-малките'
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
          {/* ДОБАВЕН hero-blur-box */}
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
          </div> {/* край на blur кутията */}
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
<section className="book-animation-section">
  <div className="book3d-container">
      <div className="bg"></div>
      <div className="container">
        <div className="box-holder" style={{ animationPlayState: 'running !important' }}>
          <div className="box--front"></div>
          <div className="box--side-left"></div>
          <div className="box--side-right"></div>
          <div className="box--top"></div>
          <div className="box--bottom"></div>
          <div className="box--back"></div>
        </div>
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

          <div className="events-grid">
            {events.map((event, index) => {
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
                <div key={event.id} className={`event-card ${colorClass}`}>
                  <div className="event-header">
                    <div className="event-badge">
                      <Calendar className="event-badge-icon" />
                      <span>Събитие</span>
                    </div>
                    <div className="event-icon">
                      <EventIcon className="event-icon-svg" />
                    </div>
                  </div>
                  
                  <div className="event-content">
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-description">{event.description}</p>
                    
                    <div className="event-details">
                      <div className="event-detail">
                        <div className="detail-icon-wrapper">
                          <Calendar className="detail-icon" />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Дата</span>
                          <span className="detail-value">{event.date}</span>
                        </div>
                      </div>
                      <div className="event-detail">
                        <div className="detail-icon-wrapper">
                          <Clock className="detail-icon" />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Час</span>
                          <span className="detail-value">{event.time}</span>
                        </div>
                      </div>
                      <div className="event-detail">
                        <div className="detail-icon-wrapper">
                          <MapPin className="detail-icon" />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Място</span>
                          <span className="detail-value">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="event-footer">
                    <button className="event-btn">
                      <span>Запиши се</span>
                      <ArrowRight className="btn-icon" />
                    </button>
                    <div className="event-spots">
                      <span className="spots-text">Оставащи места: {12 - index * 3}</span>
                    </div>
                  </div>
                  
                  <div className="event-gradient"></div>
                </div>
              );
            })}
          </div>
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