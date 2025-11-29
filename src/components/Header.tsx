import React, { useState, useEffect } from 'react';
import { Menu, X, BookOpen, User, ChevronDown, Home, Calendar, Info } from 'lucide-react';
import './Header.css';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Начало', href: '#начало', icon: Home },
    { name: 'Каталог', href: '#каталог', icon: BookOpen },
    { name: 'Събития', href: '#събития', icon: Calendar },
    { name: 'За нас', href: '#за-нас', icon: Info },
  ];

  const quickLinks = [
    { name: 'Електронни книги', href: '#' },
    { name: 'Учебни помагала', href: '#' },
    { name: 'Читателски клуб', href: '#' },
    { name: 'Работно време', href: '#' },
  ];

  return (
    <>
      <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
        <div className="header-container">
          {/* Logo - най-вляво */}
          <div className="logo-section">
            <div className="logo-wrapper">
              <div className="logo-icon-wrapper">
                <BookOpen className="logo-icon" />
              </div>
              <div className="logo-text-container">
                <span className="logo-text">Училищна Библиотека</span>
                <span className="logo-subtitle">Място за знание и вдъхновение</span>
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

          {/*Auth Buttons - най-вдясно */}
          <div className="header-actions">
            
            
            <div className="auth-section">
              <button className="auth-btn login-btn">
                <User className="user-icon" />
                <span>Вход</span>
              </button>
              <button className="auth-btn register-btn">
                <span>Стани читател</span>
              </button>
            </div>

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
                  onClick={() => setIsMenuOpen(false)}
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
              <button className="mobile-auth-btn mobile-login-btn">
                <User className="user-icon" />
                <span>Вход в профил</span>
              </button>
              <button className="mobile-auth-btn mobile-register-btn">
                <span>Регистрация</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;