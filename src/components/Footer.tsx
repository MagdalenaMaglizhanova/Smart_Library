import React from 'react';
import { BookOpen, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Heart} from 'lucide-react';
import './Footer.css';

const Footer: React.FC = () => {
  const quickLinks = [
    { name: 'Начало', href: '#начало' },
    { name: 'Каталог', href: '#каталог' },
    { name: 'Нови книги', href: '#нови-книги' },
    { name: 'Събития', href: '#събития' },
    { name: 'За нас', href: '#за-нас' },
  ];

  const resources = [
    { name: 'Електронни книги', href: '#' },
    { name: 'Учебни помагала', href: '#' },
    { name: 'Резервация на книги', href: '#' },
    { name: 'Читателски клуб', href: '#' },
    
  ];

  const services = [
    { name: 'Онлайн ресурси', href: '#' },
    { name: 'Междубиблиотечен заем', href: '#' },
    { name: 'Копирни услуги', href: '#' },
    { name: 'Компютърна зала', href: '#' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
  ];

  return (
    <footer className="footer">
      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="footer-container">
          
          {/* Brand Section */}
          <div className="brand-section">
            <div className="brand-logo">
              <BookOpen className="logo-icon" />
              <span className="logo-text">Smart School Library</span>
            </div>
            <p className="brand-description">
              Училищната библиотека е посветена на обогатяването на образованието чрез силата на знанието. Създаваме вдъхновяваща среда за ученици и учители.
            </p>
            
            {/* Social Links */}
            <div className="social-links">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="social-link"
                    aria-label={social.name}
                  >
                    <IconComponent className="social-icon" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <ul className="footer-links">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="footer-link">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-section">
            <ul className="footer-links">
              {resources.map((resource) => (
                <li key={resource.name}>
                  <a href={resource.href} className="footer-link">
                    {resource.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="footer-section">
            <ul className="footer-links">
              {services.map((service) => (
                <li key={service.name}>
                  <a href={service.href} className="footer-link">
                    {service.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <div className="contact-info">
              <div className="contact-item">
                <MapPin className="contact-icon" />
                <div>
                  <p className="contact-text">ул. "Примерна" №123</p>
                  <p className="contact-text">София, България</p>
                </div>
              </div>
              
              <div className="contact-item">
                <Phone className="contact-icon" />
                <div>
                  <p className="contact-text">(02) 123 4567</p>
                  <p className="contact-text">Пон-Пет: 8:00 - 17:00</p>
                </div>
              </div>
              
              <div className="contact-item">
                <Mail className="contact-icon" />
                <div>
                  <p className="contact-text">biblioteka@uchilishte.bg</p>
                  <p className="contact-text">Отговоряме в рамките на 24ч</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="newsletter-section">
        <div className="newsletter-container">
          <div className="newsletter-content">
            <h3 className="newsletter-title">Абонирай се за нашия бюлетин</h3>
            <p className="newsletter-description">
              Получавайте информация за нови книги, събития и специални предложения
            </p>
          </div>
          <div className="newsletter-form">
            <input
              type="email"
              placeholder="Вашият имейл адрес"
              className="newsletter-input"
            />
            <button className="newsletter-btn">
              Абонирай се
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <div className="copyright">
            <p>
              © 2024 Smart School Library. Всички права запазени. 
              Създадено с <Heart className="heart-icon" /> към образованието
            </p>
          </div>
          
          <div className="footer-bottom-links">
            <a href="#" className="bottom-link">Политика за поверителност</a>
            <a href="#" className="bottom-link">Условия за ползване</a>
            <a href="#" className="bottom-link">Карта на сайта</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;