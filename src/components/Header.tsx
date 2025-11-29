import React, { useState, useEffect } from 'react';
import { Menu, X, BookOpen, User, ChevronDown, Home, Calendar, Info, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import './Header.css';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Проверка за логнат потребител
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Вземаме допълнителни данни от Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const navigation = [
  { name: 'Начало', href: '/', icon: Home },
  { name: 'Каталог', href: '#каталог', icon: BookOpen },
  { name: 'Събития', href: '/events', icon: Calendar }, 
  { name: 'За нас', href: '#за-нас', icon: Info },
];

  const quickLinks = [
    { name: 'Електронни книги', href: '#' },
    { name: 'Учебни помагала', href: '#' },
    { name: 'Читателски клуб', href: '#' },
    { name: 'Работно време', href: '#' },
  ];

  const handleLoginClick = () => {
    setIsMenuOpen(false);
    navigate('/login');
  };

  const handleRegisterClick = () => {
    setIsMenuOpen(false);
    navigate('/register');
  };

  const handleLogoutClick = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserData(null);
      setIsMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (href.startsWith('/')) {
      e.preventDefault();
      navigate(href);
      setIsMenuOpen(false);
    }
    // Ако е anchor link (#каталог и др.), оставяме default behavior
  };

  const handleDashboardClick = () => {
    if (userData?.role === 'admin') {
      navigate('/admin');
    } else if (userData?.role === 'librarian') {
      navigate('/librarian');
    } else {
      navigate('/dashboard');
    }
    setIsMenuOpen(false);
  };

  const getUserDisplayName = () => {
    if (userData?.profile?.displayName) {
      return userData.profile.displayName;
    }
    return currentUser?.email?.split('@')[0] || 'Потребител';
  };

  const getUserRoleText = () => {
    switch (userData?.role) {
      case 'admin':
        return 'Администратор';
      case 'librarian':
        return 'Библиотекар';
      case 'reader':
        return 'Читател';
      default:
        return 'Потребител';
    }
  };

  return (
    <>
      <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
        <div className="header-container">
          {/* Logo - най-вляво */}
          <div className="logo-section">
            <div className="logo-wrapper" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
              <div className="logo-icon-wrapper">
                <BookOpen className="logo-icon" />
              </div>
              <div className="logo-text-container">
                <span className="logo-text">Smart School Library</span>
                <span className="logo-subtitle">Място за знания и вдъхновение</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation - в центъра */}
          <nav className="desktop-nav">
            <div className="nav-links">
              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="nav-link"
                    onClick={(e) => handleNavClick(item.href, e)}
                  >
                    <IconComponent className="nav-link-icon" />
                    {item.name}
                  </a>
                );
              })}
              
              {/* Dropdown for Quick Links */}
              <div className="dropdown">
                <button className="dropdown-btn">
                  <span>Бързи връзки</span>
                  <ChevronDown className="dropdown-icon" />
                </button>
                <div className="dropdown-content">
                  {quickLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      className="dropdown-link"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Auth Buttons - най-вдясно */}
          <div className="header-actions">
            {!loading && (
              <div className="auth-section">
                {currentUser ? (
                  <div className="user-menu">
                    <div className="user-info">
                      <div className="user-avatar">
                        <User className="user-avatar-icon" />
                      </div>
                      <div className="user-details">
                        <span className="user-name">{getUserDisplayName()}</span>
                        <span className="user-role">{getUserRoleText()}</span>
                      </div>
                    </div>
                    <div className="user-actions">
                      <button 
                        className="dashboard-btn"
                        onClick={handleDashboardClick}
                        title="Моят профил"
                      >
                        Моят профил
                      </button>
                      <button 
                        className="logout-btn"
                        onClick={handleLogoutClick}
                        title="Изход"
                      >
                        <LogOut className="logout-icon" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button 
                      className="auth-btn login-btn"
                      onClick={handleLoginClick}
                    >
                      <User className="user-icon" />
                      <span>Вход</span>
                    </button>
                    <button 
                      className="auth-btn register-btn"
                      onClick={handleRegisterClick}
                    >
                      <span>Стани читател</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="menu-icon" /> : <Menu className="menu-icon" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-menu ${isMenuOpen ? 'mobile-menu-open' : ''}`}>
          <div className="mobile-nav">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="mobile-nav-link"
                  onClick={(e) => handleNavClick(item.href, e)}
                >
                  <IconComponent className="mobile-nav-icon" />
                  {item.name}
                </a>
              );
            })}
            
            <div className="mobile-quick-links">
              <h4 className="quick-links-title">Бързи връзки</h4>
              {quickLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="mobile-quick-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
            </div>

            <div className="mobile-auth-section">
              {currentUser ? (
                <div className="mobile-user-info">
                  <div className="mobile-user-details">
                    <div className="mobile-user-avatar">
                      <User className="mobile-user-avatar-icon" />
                    </div>
                    <div>
                      <div className="mobile-user-name">{getUserDisplayName()}</div>
                      <div className="mobile-user-role">{getUserRoleText()}</div>
                    </div>
                  </div>
                  <div className="mobile-user-actions">
                    <button 
                      className="mobile-dashboard-btn"
                      onClick={handleDashboardClick}
                    >
                      Моят профил
                    </button>
                    <button 
                      className="mobile-logout-btn"
                      onClick={handleLogoutClick}
                    >
                      <LogOut className="mobile-logout-icon" />
                      Изход
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button 
                    className="mobile-auth-btn mobile-login-btn"
                    onClick={handleLoginClick}
                  >
                    <User className="user-icon" />
                    <span>Вход в профил</span>
                  </button>
                  <button 
                    className="mobile-auth-btn mobile-register-btn"
                    onClick={handleRegisterClick}
                  >
                    <span>Регистрация</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;