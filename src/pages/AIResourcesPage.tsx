import React, { useState } from "react";
import { 
  BookOpen, 
  Zap, 
  Sparkles, 
  Users, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Bookmark, 
  Share2,
  Tag,
  Eye,
  Heart,
  Search,
  Filter
} from "lucide-react";
import './AIResourcesPage.css';

interface AIResource {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  link: string;
  type: 'tool' | 'article' | 'course' | 'community';
  tags: string[];
  author: string;
  date: string;
  views: number;
  likes: number;
  isFree: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const AIResourcesPage: React.FC = () => {
  const [resources] = useState<AIResource[]>([
    {
      id: "1",
      title: "MagicSchool AI - Платформа за учители",
      description: "Най-популярната AI платформа за училища, предлагаща над 80 инструмента за планиране на уроци, обратна връзка и диференцирано обучение.",
      category: "Образователна платформа",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
      link: "https://www.magicschool.ai",
      type: 'tool',
      tags: ["платформа", "урокоплан", "автоматизация"],
      author: "MagicSchool Team",
      date: "2025-09-15",
      views: 2450,
      likes: 189,
      isFree: true,
      difficulty: 'beginner'
    },
    {
      id: "2",
      title: "Google Gemini за Образование",
      description: "Мощен AI асистент на Google, специално създаден за училища с вградени защити за поверителност и интеграция с Google Workspace.",
      category: "AI асистент",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
      link: "https://workspace.google.com/solutions/ai-for-education/",
      type: 'tool',
      tags: ["google", "асистент", "интеграция"],
      author: "Google for Education",
      date: "2025-08-20",
      views: 3120,
      likes: 256,
      isFree: true,
      difficulty: 'beginner'
    },
    {
      id: "3",
      title: "Adobe Express с Firefly AI",
      description: "Създавайте уникални визуални материали за уроци с генеративен AI. Перфектно за дидактически материали и презентации.",
      category: "Дизайн и визуализация",
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
      link: "https://www.adobe.com/express/",
      type: 'tool',
      tags: ["дизайн", "визуализация", "креативност"],
      author: "Adobe",
      date: "2025-10-05",
      views: 1870,
      likes: 145,
      isFree: true,
      difficulty: 'intermediate'
    },
    {
      id: "4",
      title: "ChatPDF - Разговор с учебни материали",
      description: "Качете PDF документ и разговаряйте с него. Идеален за анализ на учебници и научни статии.",
      category: "Анализ на документи",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      link: "https://www.chatpdf.com",
      type: 'tool',
      tags: ["pdf", "анализ", "изследване"],
      author: "Mathis Lichtenberger",
      date: "2025-07-30",
      views: 2890,
      likes: 210,
      isFree: true,
      difficulty: 'beginner'
    },
    {
      id: "5",
      title: "Genially - Интерактивни обучения",
      description: "Създавайте интерактивни и геймифицирани учебни преживявания без нужда от програмиране.",
      category: "Интерактивно съдържание",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
      link: "https://genially.com",
      type: 'tool',
      tags: ["интерактивност", "геймификация", "презентации"],
      author: "Genially",
      date: "2025-09-10",
      views: 1650,
      likes: 132,
      isFree: true,
      difficulty: 'intermediate'
    },
    {
      id: "6",
      title: "Ръководство за AI в класната стая",
      description: "Изчерпателно ръководство за внедряване на изкуствен интелект в ежедневното преподаване.",
      category: "Образователни материали",
      image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80",
      link: "#",
      type: 'article',
      tags: ["ръководство", "методика", "въведение"],
      author: "Д-р Иванова",
      date: "2025-11-01",
      views: 3210,
      likes: 278,
      isFree: true,
      difficulty: 'beginner'
    },
    {
      id: "7",
      title: "Курс: AI за преподаватели - напреднали техники",
      description: "Онлайн курс с практически упражнения за напреднали AI инструменти в образованието.",
      category: "Онлайн обучение",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
      link: "#",
      type: 'course',
      tags: ["курс", "обучение", "сертификат"],
      author: "Образователен институт",
      date: "2025-10-25",
      views: 1980,
      likes: 167,
      isFree: false,
      difficulty: 'advanced'
    },
    {
      id: "8",
      title: "AI училищна общност",
      description: "Форум за учители, споделящи опит и най-добри практики за използване на AI в обучението.",
      category: "Общност и форум",
      image: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=800&q=80",
      link: "#",
      type: 'community',
      tags: ["форум", "общност", "споделяне"],
      author: "AI Teachers Network",
      date: "2025-11-15",
      views: 2750,
      likes: 221,
      isFree: true,
      difficulty: 'beginner'
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>("всички");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("всички");
  const [showFreeOnly, setShowFreeOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showAllResources, setShowAllResources] = useState<boolean>(false);

  const categories = ["всички", "Образователна платформа", "AI асистент", "Дизайн и визуализация", "Анализ на документи", "Интерактивно съдържание", "Образователни материали", "Онлайн обучение", "Общност и форум"];
  const difficulties = ["всички", "beginner", "intermediate", "advanced"];
  
  const typeIcons = {
    tool: Zap,
    article: BookOpen,
    course: Sparkles,
    community: Users
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === "всички" || resource.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "всички" || resource.difficulty === selectedDifficulty;
    const matchesFree = !showFreeOnly || resource.isFree;
    const matchesSearch = searchTerm === "" || 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesDifficulty && matchesFree && matchesSearch;
  });

  const displayedResources = showAllResources ? filteredResources : filteredResources.slice(0, 4);

  const getCategoryColor = (category: string) => {
    const colors: {[key: string]: string} = {
      "Образователна платформа": "resource-category-platform",
      "AI асистент": "resource-category-assistant",
      "Дизайн и визуализация": "resource-category-design",
      "Анализ на документи": "resource-category-analysis",
      "Интерактивно съдържание": "resource-category-interactive",
      "Образователни материали": "resource-category-materials",
      "Онлайн обучение": "resource-category-course",
      "Общност и форум": "resource-category-community"
    };
    return colors[category] || "resource-category-default";
  };

  const getDifficultyText = (difficulty: string) => {
    const texts: {[key: string]: string} = {
      "beginner": "Начинаещ",
      "intermediate": "Напреднал",
      "advanced": "Експерт"
    };
    return texts[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: {[key: string]: string} = {
      "beginner": "resource-difficulty-beginner",
      "intermediate": "resource-difficulty-intermediate",
      "advanced": "resource-difficulty-advanced"
    };
    return colors[difficulty] || "resource-difficulty-default";
  };

  return (
    <div className="ai-resources-page">
      {/* Hero Section */}
      <section className="resources-hero">
        <div className="resources-container">
          <div className="resources-hero-content">
            <h1 className="resources-hero-title">
              <Sparkles className="resources-hero-icon" />
              Изкуствен Интелект в Обучението
            </h1>
            <p className="resources-hero-subtitle">
              Ресурси, инструменти и вдъхновение за модерния учител. Открийте силата на AI за вашия клас.
            </p>
            <div className="resources-hero-stats">
              <div className="resources-stat">
                <Zap className="resources-stat-icon" />
                <span className="resources-stat-number">{resources.length}+</span>
                <span className="resources-stat-label">ресурса</span>
              </div>
              <div className="resources-stat">
                <Users className="resources-stat-icon" />
                <span className="resources-stat-number">100%</span>
                <span className="resources-stat-label">практични</span>
              </div>
              <div className="resources-stat">
                <BookOpen className="resources-stat-icon" />
                <span className="resources-stat-number">{resources.filter(r => r.isFree).length}</span>
                <span className="resources-stat-label">безплатни</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="resources-filter-section">
        <div className="resources-container">
          <div className="resources-filter-grid">
            <div className="resources-search-box">
              <Search className="resources-search-icon" />
              <input
                type="text"
                placeholder="Търсене по заглавие, описание или ключови думи..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="resources-search-input"
              />
            </div>
            
            <div className="resources-filter-group">
              <Filter className="resources-filter-icon" />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="resources-filter-select"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === "всички" ? "Всички категории" : category}
                  </option>
                ))}
              </select>
            </div>

            <div className="resources-filter-group">
              <select 
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="resources-filter-select"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === "всички" ? "Всички нива" : getDifficultyText(difficulty)}
                  </option>
                ))}
              </select>
            </div>

            <label className="resources-checkbox-label">
              <input
                type="checkbox"
                checked={showFreeOnly}
                onChange={(e) => setShowFreeOnly(e.target.checked)}
                className="resources-checkbox-input"
              />
              <span className="resources-checkbox-custom"></span>
              <span className="resources-checkbox-text">Само безплатни ресурси</span>
            </label>
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="resources-grid-section">
        <div className="resources-container">
          <div className="resources-section-header">
            <div className="resources-section-header-top">
              <Zap className="resources-section-title-icon" />
              <h2 className="resources-handwritten-title">AI Ресурси за Учители</h2>
            </div>
            <p className="resources-section-subtitle">
              Подбрани инструменти и материали за ефективно интегриране на изкуствен интелект в обучението
            </p>
          </div>

          <div className="resources-grid-stats">
            <div className="resources-grid-stat">
              <span className="resources-stat-value">{filteredResources.length}</span>
              <span className="resources-stat-label-grid">намерени ресурси</span>
            </div>
            <div className="resources-grid-stat">
              <span className="resources-stat-value">{filteredResources.filter(r => r.isFree).length}</span>
              <span className="resources-stat-label-grid">безплатни</span>
            </div>
          </div>

          <div className="resources-grid">
            {displayedResources.map((resource) => {
              const TypeIcon = typeIcons[resource.type];
              return (
                <article key={resource.id} className="resource-card">
                  <div className="resource-image-container">
                    <img 
                      src={resource.image} 
                      alt={resource.title}
                      className="resource-image"
                    />
                    <div className={`resource-category-tag ${getCategoryColor(resource.category)}`}>
                      <Tag className="resource-tag-icon" />
                      <span>{resource.category}</span>
                    </div>
                    <div className="resource-overlay">
                      <button className="resource-action-btn" title="Запази">
                        <Bookmark className="resource-action-icon" />
                      </button>
                      <button className="resource-action-btn" title="Сподели">
                        <Share2 className="resource-action-icon" />
                      </button>
                    </div>
                    {!resource.isFree && (
                      <div className="resource-premium-badge">
                        <span>ПРЕМИУМ</span>
                      </div>
                    )}
                  </div>

                  <div className="resource-content">
                    <div className="resource-header">
                      <div className="resource-type">
                        <TypeIcon className="resource-type-icon" />
                        <span className="resource-type-text">
                          {resource.type === 'tool' && 'Инструмент'}
                          {resource.type === 'article' && 'Статия'}
                          {resource.type === 'course' && 'Курс'}
                          {resource.type === 'community' && 'Общност'}
                        </span>
                      </div>
                      <div className={`resource-difficulty ${getDifficultyColor(resource.difficulty)}`}>
                        {getDifficultyText(resource.difficulty)}
                      </div>
                    </div>

                    <h3 className="resource-title">{resource.title}</h3>
                    <p className="resource-description">{resource.description}</p>

                    <div className="resource-meta">
                      <span className="resource-author">
                        <Users className="resource-meta-icon" />
                        {resource.author}
                      </span>
                      <span className="resource-date">
                        {formatDate(resource.date)}
                      </span>
                    </div>

                    <div className="resource-footer">
                      <div className="resource-stats">
                        <div className="resource-stats-item">
                          <Eye className="resource-stats-icon" />
                          <span>{resource.views}</span>
                        </div>
                        <div className="resource-stats-item">
                          <Heart className="resource-stats-icon" />
                          <span>{resource.likes}</span>
                        </div>
                      </div>

                      <div className="resource-tags">
                        {resource.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="resource-tag">#{tag}</span>
                        ))}
                      </div>
                    </div>

                    <a 
                      href={resource.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="resource-link-btn"
                    >
                      <span>Отвори ресурса</span>
                      <ExternalLink className="resource-link-icon" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredResources.length > 4 && (
            <div className="resources-toggle-container">
              <button 
                className="resources-toggle-btn"
                onClick={() => setShowAllResources(!showAllResources)}
              >
                {showAllResources ? (
                  <>
                    <ChevronUp className="resources-toggle-icon" />
                    <span>Покажи по-малко ресурси</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="resources-toggle-icon" />
                    <span>Покажи всички ресурси ({filteredResources.length})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {filteredResources.length === 0 && (
            <div className="resources-no-results">
              <Search className="resources-no-results-icon" />
              <h3>Няма намерени ресурси</h3>
              <p>Опитайте с други критерии за търсене или филтри</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories Info */}
      <section className="resources-categories-info">
        <div className="resources-container">
          <h3 className="resources-categories-title">Категории ресурси</h3>
          <div className="resources-categories-grid">
            <div className="resources-category-info-card">
              <div className="resources-category-icon resource-category-platform">
                <Zap />
              </div>
              <h4>Образователни платформи</h4>
              <p>Цялостни AI решения за училища и класни стаи</p>
            </div>
            <div className="resources-category-info-card">
              <div className="resources-category-icon resource-category-assistant">
                <Sparkles />
              </div>
              <h4>AI асистенти</h4>
              <p>Интелигентни помощници за ежедневни задачи</p>
            </div>
            <div className="resources-category-info-card">
              <div className="resources-category-icon resource-category-design">
                <BookOpen />
              </div>
              <h4>Дизайн и визуализация</h4>
              <p>Инструменти за създаване на учебни материали</p>
            </div>
            <div className="resources-category-info-card">
              <div className="resources-category-icon resource-category-analysis">
                <Users />
              </div>
              <h4>Анализ и изследване</h4>
              <p>Средства за работа с документи и данни</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AIResourcesPage;