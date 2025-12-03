import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Eye,
  Share2,
  Tag,
  Library
} from 'lucide-react';
import { db } from '../firebase/firebase';
import { collection, getDocs, query, where} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import './BookCatalog.css'; 

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  isbn: string;
  publicationYear: number;
  publisher: string;
  pages: number;
  language: string;
  coverImage: string;
  rating: number;
  totalCopies: number;
  availableCopies: number;
  reservedBy: string[];
  tags: string[];
  featured: boolean;
  createdAt: Date;
}

interface Reservation {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  reservedAt: Date;
  pickupDate: Date;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
}

const BookCatalog: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const { user } = useAuth();

  // Зареждане на книги от Firestore
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "books"));
      const booksData: Book[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: new Date(doc.data().createdAt?.toDate() || new Date())
      } as Book));
      
      // Сортиране по дата на добавяне (най-новите първи)
      booksData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setBooks(booksData);
      setFilteredBooks(booksData);
    } catch (error) {
      console.error("Error fetching books:", error);
      // Fallback данни
      const fallbackBooks: Book[] = [
        {
          id: '1',
          title: 'Под игото',
          author: 'Иван Вазов',
          description: 'Класическа българска творба, която описва борбата на българския народ против османското владичество. Романът представя живота на българите през периода на Възраждането.',
          category: 'Българска класика',
          isbn: '9789540912345',
          publicationYear: 1894,
          publisher: 'Българска книга',
          pages: 480,
          language: 'Български',
          coverImage: 'https://www.ciela.com/media/catalog/product/cache/32bb0748c82325b02c55df3c2a9a9856/p/o/pod-igoto_1.jpg',
          rating: 4.8,
          totalCopies: 5,
          availableCopies: 3,
          reservedBy: [],
          tags: ['класика', 'исторически роман', 'възраждане'],
          featured: true,
          createdAt: new Date('2024-01-15')
        },
        {
          id: '2',
          title: 'Железният светилник',
          author: 'Димитър Талев',
          description: 'Монументален исторически роман, разказващ историята на българския народ през вековете. Част от едноименната тетралогия.',
          category: 'Исторически роман',
          isbn: '9789540912352',
          publicationYear: 1952,
          publisher: 'Народна култура',
          pages: 620,
          language: 'Български',
          coverImage: 'https://hermesbooks.bg/media/catalog/product/cache/e533a3e3438c08fe7c51cedd0cbec189/j/e/jelezniat_svetilnik_hrm_2_20200901160342.jpg',
          rating: 4.7,
          totalCopies: 4,
          availableCopies: 2,
          reservedBy: [],
          tags: ['история', 'тетралогия', 'национална гордост'],
          featured: true,
          createdAt: new Date('2024-02-10')
        },
        {
          id: '3',
          title: 'Време разделно',
          author: 'Антон Дончев',
          description: 'Исторически роман, разказващ историята на насилствената ислямизация на българите в Родопите през XVII век.',
          category: 'Исторически роман',
          isbn: '9789540912369',
          publicationYear: 1964,
          publisher: 'Български писател',
          pages: 420,
          language: 'Български',
          coverImage: 'https://kultura.bg/web/wp-content/uploads/2019/07/vreme-razdelno-2.jpg',
          rating: 4.9,
          totalCopies: 6,
          availableCopies: 4,
          reservedBy: [],
          tags: ['история', 'Родопи', 'ислямизация'],
          featured: true,
          createdAt: new Date('2024-01-20')
        },
        {
          id: '4',
          title: 'Тютюн',
          author: 'Димитър Димов',
          description: 'Социален роман, разказващ историята на тютюневата индустрия в България и влиянието ѝ върху живота на хората.',
          category: 'Роман',
          isbn: '9789540912376',
          publicationYear: 1951,
          publisher: 'Народна култура',
          pages: 550,
          language: 'Български',
          coverImage: 'https://www.elixiria.bg/image/cache/data/d17f7e84adce47498b642ad632e054e9-259x388.jpg',
          rating: 4.6,
          totalCopies: 3,
          availableCopies: 1,
          reservedBy: [],
          tags: ['социален роман', 'тютюн', 'индустрия'],
          featured: false,
          createdAt: new Date('2024-03-05')
        },
        {
          id: '5',
          title: 'Албум за България',
          author: 'Алеко Константинов',
          description: 'Хуморни разкази и пътеписа на известния български писател, описващи живота и нравите на българите.',
          category: 'Хумор',
          isbn: '9789540912383',
          publicationYear: 1895,
          publisher: 'Българска книга',
          pages: 320,
          language: 'Български',
          coverImage: 'https://knigomania.bg/media/catalog/product/cache/a5dadd8e6bf5fa8b8b6d368a6c8b9829/1/1/11993_alekobai.jpg',
          rating: 4.5,
          totalCopies: 4,
          availableCopies: 3,
          reservedBy: [],
          tags: ['хумор', 'пътепис', 'Алеко Константинов'],
          featured: false,
          createdAt: new Date('2024-02-28')
        },
        {
          id: '6',
          title: 'Гераците',
          author: 'Елин Пелин',
          description: 'Сборник с разкази от известния български писател, описващи живота на селското население в България.',
          category: 'Разкази',
          isbn: '9789540912390',
          publicationYear: 1911,
          publisher: 'Български писател',
          pages: 280,
          language: 'Български',
          coverImage: 'https://knizhen-pazar.net/wp-content/uploads/2017/04/geracite-elin-pelin.jpg',
          rating: 4.4,
          totalCopies: 5,
          availableCopies: 4,
          reservedBy: [],
          tags: ['разкази', 'селски живот', 'Елин Пелин'],
          featured: false,
          createdAt: new Date('2024-03-12')
        }
      ];
      setBooks(fallbackBooks);
      setFilteredBooks(fallbackBooks);
    } finally {
      setLoading(false);
    }
  };

  // Зареждане на резервации
  const fetchReservations = async () => {
    try {
      if (!user) return;
      
      const q = query(
        collection(db, "reservations"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const reservationsData: Reservation[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        reservedAt: new Date(doc.data().reservedAt?.toDate() || new Date()),
        pickupDate: new Date(doc.data().pickupDate?.toDate() || new Date())
      } as Reservation));
      
      setReservations(reservationsData);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  // Филтриране на книги
  useEffect(() => {
    let result = books;
    
    // Филтър по търсене
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(book =>
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.description.toLowerCase().includes(term) ||
        book.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    // Филтър по категория
    if (selectedCategory !== 'all') {
      result = result.filter(book => book.category === selectedCategory);
    }
    
    setFilteredBooks(result);
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, books]);

  // Категории от всички книги
  const categories = ['all', ...new Set(books.map(book => book.category))];

  // Пагинация
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBooks = filteredBooks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);

  // Функция за резервация
  const handleReservation = async (book: Book) => {
    if (!user) {
      alert('Моля, влезте в профила си, за да резервирате книга!');
      return;
    }
    
    if (book.availableCopies <= 0) {
      alert('Няма налични копия от тази книга!');
      return;
    }
    
    setSelectedBook(book);
    setShowReservationModal(true);
    
    // Задаваме дата за взимане (след 3 дни)
    const pickup = new Date();
    pickup.setDate(pickup.getDate() + 3);
    setPickupDate(pickup.toISOString().split('T')[0]);
  };

  const confirmReservation = async () => {
    if (!user || !selectedBook || !pickupDate) return;
    
    try {
      // Тук ще добавите логика за запазване във Firestore
      alert(`Успешно резервирахте "${selectedBook.title}"!`);
      setShowReservationModal(false);
      setSelectedBook(null);
      
      // Обновяваме наличните копия
      const updatedBooks = books.map(book =>
        book.id === selectedBook.id
          ? { ...book, availableCopies: book.availableCopies - 1 }
          : book
      );
      setBooks(updatedBooks);
      
      // Обновяваме резервациите
      await fetchReservations();
    } catch (error) {
      console.error("Error creating reservation:", error);
      alert('Възникна грешка при резервацията. Моля, опитайте отново.');
    }
  };

  // Рендиране на звезди за рейтинг
  const renderStars = (rating: number) => {
    return (
      <div className="book-catalog-stars-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`book-catalog-star-icon ${
              star <= rating ? 'book-catalog-star-filled' : 'book-catalog-star-empty'
            }`}
            size={16}
          />
        ))}
        <span className="book-catalog-rating-text">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Статистика
  const stats = {
    totalBooks: books.length,
    availableBooks: books.reduce((sum, book) => sum + book.availableCopies, 0),
    totalReservations: reservations.length,
    featuredBooks: books.filter(book => book.featured).length
  };

  useEffect(() => {
    fetchBooks();
    fetchReservations();
  }, [user]);

  return (
    <div className="book-catalog-container">
      {/* Хедър секция */}
      <div className="book-catalog-header-section">
        <div className="book-catalog-header-content">
          <div className="book-catalog-header-icon-wrapper">
            <Library size={48} />
          </div>
          <div className="book-catalog-header-text">
            <h1 className="book-catalog-title">Каталог с книги</h1>
            <p className="book-catalog-subtitle" style={{ color: 'white' }}>
              Разгледайте нашата богата колекция от книги и резервирайте любимите си заглавия
            </p>
          </div>
        </div>
        
        {/* Статистика */}
        <div className="book-catalog-stats">
          <div className="book-catalog-stat-item">
            <div className="book-catalog-stat-number">{stats.totalBooks}</div>
            <div className="book-catalog-stat-label">Общо книги</div>
          </div>
          <div className="book-catalog-stat-item">
            <div className="book-catalog-stat-number">{stats.availableBooks}</div>
            <div className="book-catalog-stat-label">Налични копия</div>
          </div>
          <div className="book-catalog-stat-item">
            <div className="book-catalog-stat-number">{stats.totalReservations}</div>
            <div className="book-catalog-stat-label">Активни резервации</div>
          </div>
          <div className="book-catalog-stat-item">
            <div className="book-catalog-stat-number">{stats.featuredBooks}</div>
            <div className="book-catalog-stat-label">Препоръчани</div>
          </div>
        </div>
      </div>

      {/* Филтри и търсене */}
      <div className="book-catalog-controls">
        <div className="book-catalog-search-container">
          <Search className="book-catalog-search-icon" />
          <input
            type="text"
            placeholder="Търсете книги, автори или ключови думи..."
            className="book-catalog-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="book-catalog-filter-container">
          <Filter className="book-catalog-filter-icon" />
          <select
            className="book-catalog-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Всички категории' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Основно съдържание */}
      <div className="book-catalog-content">
        {loading ? (
          <div className="book-catalog-loading-container">
            <div className="book-catalog-loading-spinner"></div>
            <p>Зареждане на книги...</p>
          </div>
        ) : currentBooks.length === 0 ? (
          <div className="book-catalog-no-results">
            <BookOpen size={64} />
            <h3>Няма намерени книги</h3>
            <p>Променете критериите за търсене или опитайте отново</p>
          </div>
        ) : (
          <>
            {/* Грид с книги */}
            <div className="book-catalog-grid">
              {currentBooks.map((book) => (
                <div key={book.id} className="book-catalog-card">
                  {/* Badge за featured книги */}
                  {book.featured && (
                    <div className="book-catalog-featured-badge">
                      <Star size={14} />
                      <span>Препоръчано</span>
                    </div>
                  )}
                  
                  {/* Корица на книгата */}
                  <div className="book-catalog-cover-container">
                    <img 
                      src={book.coverImage} 
                      alt={book.title}
                      className="book-catalog-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="book-catalog-cover-fallback hidden">
                      <BookOpen size={48} />
                    </div>
                    
                    {/* Quick actions */}
                    <div className="book-catalog-actions">
                      <button className="book-catalog-action-btn" title="Бърз преглед">
                        <Eye size={18} />
                      </button>
                      <button className="book-catalog-action-btn" title="Запази за по-късно">
                        <Bookmark size={18} />
                      </button>
                      <button className="book-catalog-action-btn" title="Сподели">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Детайли на книгата */}
                  <div className="book-catalog-details">
                    <div className="book-catalog-details-header">
                      <h3 className="book-catalog-item-title">{book.title}</h3>
                      <p className="book-catalog-item-author">{book.author}</p>
                    </div>
                    
                    <div className="book-catalog-item-meta">
                      <span className="book-catalog-item-category">
                        <Tag size={14} />
                        {book.category}
                      </span>
                      <div className="book-catalog-rating">
                        {renderStars(book.rating)}
                      </div>
                    </div>
                    
                    <p className="book-catalog-item-description">
                      {book.description.length > 120 
                        ? `${book.description.substring(0, 120)}...` 
                        : book.description}
                    </p>
                    
                    <div className="book-catalog-item-info">
                      <div className="book-catalog-info-item">
                        <Calendar size={14} />
                        <span>{book.publicationYear}</span>
                      </div>
                      <div className="book-catalog-info-item">
                        <BookOpen size={14} />
                        <span>{book.pages} стр.</span>
                      </div>
                      <div className="book-catalog-info-item">
                        <User size={14} />
                        <span>{book.publisher}</span>
                      </div>
                    </div>
                    
                    <div className="book-catalog-availability-info">
                      <div className="book-catalog-copies-info">
                        <span className={`book-catalog-availability-status ${book.availableCopies > 0 ? 'available' : 'unavailable'}`}>
                          {book.availableCopies > 0 ? (
                            <>
                              <CheckCircle size={16} />
                              <span>{book.availableCopies} от {book.totalCopies} налични</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={16} />
                              <span>Изчерпани</span>
                            </>
                          )}
                        </span>
                      </div>
                      
                      <button
                        className={`book-catalog-reserve-btn ${book.availableCopies > 0 ? '' : 'disabled'}`}
                        onClick={() => handleReservation(book)}
                        disabled={book.availableCopies <= 0}
                      >
                        {book.availableCopies > 0 ? (
                          <>
                            <Clock size={18} />
                            <span>Резервирай</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={18} />
                            <span>Изчерпано</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="book-catalog-pagination">
                <button
                  className="book-catalog-pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} />
                  <span>Предишна</span>
                </button>
                
                <div className="book-catalog-page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`book-catalog-page-number ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  className="book-catalog-pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <span>Следваща</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модален прозорец за резервация */}
      {showReservationModal && selectedBook && (
        <div className="book-catalog-modal-overlay">
          <div className="book-catalog-reservation-modal">
            <div className="book-catalog-modal-header">
              <h2>Резервирайте книга</h2>
              <button 
                className="book-catalog-close-modal"
                onClick={() => setShowReservationModal(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="book-catalog-modal-content">
              <div className="book-catalog-selected-book">
                <img 
                  src={selectedBook.coverImage} 
                  alt={selectedBook.title}
                  className="book-catalog-modal-cover"
                />
                <div className="book-catalog-modal-info">
                  <h3>{selectedBook.title}</h3>
                  <p className="book-catalog-modal-author">{selectedBook.author}</p>
                  <p className="book-catalog-modal-category">{selectedBook.category}</p>
                  <div className="book-catalog-modal-stats">
                    <span>ISBN: {selectedBook.isbn}</span>
                    <span>{selectedBook.pages} страници</span>
                    <span>Издател: {selectedBook.publisher}</span>
                  </div>
                </div>
              </div>
              
              <div className="book-catalog-reservation-form">
                <div className="book-catalog-form-group">
                  <label htmlFor="pickupDate">
                    <Calendar size={18} />
                    <span>Дата за взимане</span>
                  </label>
                  <input
                    type="date"
                    id="pickupDate"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="book-catalog-form-help">
                    * Книгата ще бъде запазена за вас в продължение на 7 дни
                  </p>
                </div>
                
                <div className="book-catalog-reservation-terms">
                  <h4>Условия за резервация:</h4>
                  <ul>
                    <li>Резервацията е валидна за 7 дни</li>
                    <li>Максимален брой активни резервации: 3</li>
                    <li>Задължително лично присъствие при взимане</li>
                    <li>Изисква се валиден читателски билет</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="book-catalog-modal-footer">
              <button
                className="book-catalog-cancel-btn"
                onClick={() => setShowReservationModal(false)}
              >
                Откажи
              </button>
              <button
                className="book-catalog-confirm-btn"
                onClick={confirmReservation}
              >
                <CheckCircle size={20} />
                <span>Потвърди резервацията</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCatalog;