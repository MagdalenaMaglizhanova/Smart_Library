import React, { useState, useEffect, useCallback } from 'react';
import { 
  Menu, 
  X, 
  BookOpen, 
  User, 
  ChevronDown, 
  Home, 
  Calendar, 
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import './Header.css';

interface UserData {
  role?: 'admin' | 'librarian' | 'reader';
  profile?: {
    displayName?: string;
  };
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Тема
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, [theme]);

  // Скрол
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
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

    return () => unsubscribe();
  }, []);

  const navigation: NavigationItem[] = [
    { name: 'Начало', href: '/', icon: Home },
    { name: 'Каталог', href: '#каталог', icon: BookOpen },
    { name: 'Събития', href: '/events', icon: Calendar }, 
  ];

  const quickLinks = [
    { name: 'Електронни книги', href: '#' },
    { name: 'Учебни помагала', href: '#' },
    { name: 'ИИ ресурси за учители', href: '/ai-resources' }, // Променено тук
    { name: 'Читателски клуб', href: '#' },
    { name: 'Работно време', href: '#' },
    { name: 'За нас', href: '#за-нас' },
  ];

  const handleLoginClick = useCallback(() => {
    setIsMenuOpen(false);
    navigate('/login');
  }, [navigate]);

  const handleRegisterClick = useCallback(() => {
    setIsMenuOpen(false);
    navigate('/register');
  }, [navigate]);

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

  const handleLogoClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleNavClick = useCallback((href: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (href.startsWith('/')) {
      navigate(href);
      setIsMenuOpen(false);
    } else if (href.startsWith('#')) {
      // Обработка на anchor линкове
      window.location.hash = href;
      setIsMenuOpen(false);
    }
  }, [navigate]);

  const handleDashboardClick = useCallback(() => {
    if (userData?.role === 'admin') {
      navigate('/admin');
    } else if (userData?.role === 'librarian') {
      navigate('/librarian');
    } else {
      navigate('/dashboard');
    }
    setIsMenuOpen(false);
  }, [userData?.role, navigate]);

  const getUserDisplayName = useCallback((): string => {
    if (userData?.profile?.displayName) {
      return userData.profile.displayName;
    }
    return currentUser?.email?.split('@')[0] || 'Потребител';
  }, [currentUser, userData]);

  const getUserRoleText = useCallback((): string => {
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
  }, [userData]);

  const isActiveLink = useCallback((href: string): boolean => {
    return location.pathname === href || location.hash === href;
  }, [location]);

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo Section */}
        <div className="logo-section">
          <div 
            className="logo-wrapper" 
            onClick={handleLogoClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
          >
            <div className="logo-icon-wrapper">
              <BookOpen className="logo-icon" />
            </div>
            <div className="logo-text-container">
              <span className="logo-text">Smart School Library</span>
              <span className="logo-subtitle">Място за знания и вдъхновение</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Основна навигация">
          <div className="nav-links">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              const isActive = isActiveLink(item.href);
              
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                  onClick={(e) => handleNavClick(item.href, e)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <IconComponent className="nav-link-icon" />
                  {item.name}
                </a>
              );
            })}
            
            {/* Quick Links Dropdown */}
            <div className="dropdown">
              <button 
                className="dropdown-btn"
                aria-expanded="false"
                aria-haspopup="true"
              >
                <span>Бързи връзки</span>
                <ChevronDown className="dropdown-icon" />
              </button>
              <div className="dropdown-content">
                {quickLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="dropdown-link"
                    onClick={(e) => handleNavClick(link.href, e)}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Превключване към ${theme === 'light' ? 'тъмна' : 'светла'} тема`}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

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
                      className="auth-btn dashboard-btn"
                      onClick={handleDashboardClick}
                      title="Моят профил"
                    >
                      Моят профил
                    </button>
                    <button 
                      className="auth-btn logout-btn"
                      onClick={handleLogoutClick}
                      title="Изход"
                    >
                      <LogOut className="logout-icon" />
                      <span>Изход</span>
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
                    <span className="btn-text">Вход</span>
                  </button>
                  <button 
                    className="auth-btn register-btn"
                    onClick={handleRegisterClick}
                  >
                    <BookOpen className="user-icon" />
                    <span className="btn-text">Стани читател</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Затваряне на менюто" : "Отваряне на менюто"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="menu-icon" /> : <Menu className="menu-icon" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div 
        className={`mobile-menu ${isMenuOpen ? 'mobile-menu-open' : ''}`}
        aria-hidden={!isMenuOpen}
      >
        <div className="mobile-nav">
          {/* Theme Toggle in Mobile */}
          <div className="mobile-theme-section">
            <button
              className="mobile-theme-toggle"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              <span>{theme === 'light' ? 'Тъмна тема' : 'Светла тема'}</span>
            </button>
          </div>

          {/* Navigation Links */}
          {navigation.map((item) => {
            const IconComponent = item.icon;
            const isActive = isActiveLink(item.href);
            
            return (
              <a
                key={item.name}
                href={item.href}
                className={`mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`}
                onClick={(e) => handleNavClick(item.href, e)}
                aria-current={isActive ? 'page' : undefined}
              >
                <IconComponent className="mobile-nav-icon" />
                {item.name}
              </a>
            );
          })}
          
          {/* Quick Links in Mobile */}
          <div className="mobile-quick-links">
            <h4 className="quick-links-title">Бързи връзки</h4>
            {quickLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="mobile-quick-link"
                onClick={(e) => handleNavClick(link.href, e)}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Auth Section in Mobile */}
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
                    className="mobile-auth-btn dashboard-btn"
                    onClick={handleDashboardClick}
                  >
                    Моят профил
                  </button>
                  <button 
                    className="mobile-auth-btn logout-btn"
                    onClick={handleLogoutClick}
                  >
                    <LogOut className="mobile-logout-icon" />
                    Изход
                  </button>
                </div>
              </div>
            ) : (
              <div className="mobile-auth-buttons">
                <button 
                  className="mobile-auth-btn login-btn"
                  onClick={handleLoginClick}
                >
                  <User className="user-icon" />
                  <span>Вход в профил</span>
                </button>
                <button 
                  className="mobile-auth-btn register-btn"
                  onClick={handleRegisterClick}
                >
                  <BookOpen className="user-icon" />
                  <span>Регистрация</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;