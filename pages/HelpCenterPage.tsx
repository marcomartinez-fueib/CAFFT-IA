
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import { helpModalContentStructure, translations } from '../data/translations';
import { HelpModalSection, HelpContentItem } from '../types';
import { YOUTUBE_ICON_SVG } from '../constants';
import { SectionCard } from '../components/SectionCard';
import { PageTitle } from '../components/PageTitle';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plane, 
  BookOpen, 
  Info, 
  Video, 
  Award, 
  MessageSquare, 
  Search,
  ChevronRight
} from 'lucide-react';

export const HelpCenterPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const { openAssistant } = useUI();
  const [searchQuery, setSearchQuery] = useState('');

  const sectionOrder: (HelpModalSection & { icon: React.ReactNode })[] = [
    { id: 'fearOfFlying', titleKey: 'helpModal.fearOfFlying.title', icon: <Plane className="w-5 h-5" /> },
    { id: 'cafftInfo', titleKey: 'helpModal.cafftInfo.title', icon: <Info className="w-5 h-5" /> },
    { id: 'prospectus', titleKey: 'helpModal.prospectus.title', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'helpVideos', titleKey: 'helpVideos.pageTitle', icon: <Video className="w-5 h-5" /> },
    { id: 'postTreatment', titleKey: 'helpModal.postTreatmentSection.title', icon: <Award className="w-5 h-5" /> },
    ...(currentUser?.role === 'therapist' ? [
      { id: 'therapistInfo' as const, titleKey: 'helpModal.therapistInfo.title', icon: <MessageSquare className="w-5 h-5" /> }
    ] : []),
  ];

  const [activeTab, setActiveTab] = useState<HelpModalSection['id']>(sectionOrder[0].id);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);

  // Sync active section with scroll using IntersectionObserver
  useEffect(() => {
    const sectionElements = sectionOrder.map(section => document.getElementById(`help-section-${section.id}`)).filter(Boolean);
    
    const handleGlobalScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleGlobalScroll);

    observer.current = new IntersectionObserver((entries) => {
      if (isAutoScrolling.current) return;

      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        const sorted = [...visibleEntries].sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
        const sectionId = sorted[0].target.id.replace('help-section-', '');
        setActiveTab(sectionId as HelpModalSection['id']);
      }
    }, {
      rootMargin: '-20% 0px -50% 0px',
      threshold: [0, 0.1, 0.5]
    });

    sectionElements.forEach(el => el && observer.current?.observe(el));

    return () => {
      observer.current?.disconnect();
      window.removeEventListener('scroll', handleGlobalScroll);
    };
  }, [language, currentUser, searchQuery]);

  // Auto-scroll mobile menu when active tab changes
  useEffect(() => {
    if (activeTab && scrollRef.current) {
        const activeBtn = scrollRef.current.querySelector(`[data-section="${activeTab}"]`);
        if (activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [activeTab]);

  const handleTocClick = (sectionId: HelpModalSection['id']) => {
    if (isAutoScrolling.current) return;
    
    setActiveTab(sectionId);
    const element = document.getElementById(`help-section-${sectionId}`);
    if (element) {
        isAutoScrolling.current = true;
        // Accurate offset calculation relative to viewport
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const headerOffset = window.innerWidth >= 1024 ? 100 : 150;
        const targetY = rect.top + scrollTop - headerOffset;

        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });
        
        // Duration should match or slightly exceed the smooth scroll duration
        setTimeout(() => {
          isAutoScrolling.current = false;
        }, 1200);
    }
  };

  const renderContentItems = (contentArray: HelpContentItem[]) => {
    return contentArray.map((item, index) => {
      // Basic search filter logic
      if (searchQuery) {
        let matches = false;
        if ('textKey' in item && item.textKey && t(item.textKey).toLowerCase().includes(searchQuery.toLowerCase())) {
          matches = true;
        } else if ('itemKeys' in item && item.itemKeys?.some(k => t(k).toLowerCase().includes(searchQuery.toLowerCase()))) {
          matches = true;
        }
        if (!matches) return null;
      }

      switch (item.type) {
        case 'subtitle':
          return <h3 key={index} className="text-xl font-bold text-sky-800 mt-10 mb-5">{t(item.textKey || '')}</h3>;
        case 'paragraph':
          return <p key={index} className="text-slate-600 mb-6 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: t(item.textKey || '') }} />;
        case 'list':
          return (
            <ul key={index} className="space-y-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              {item.itemKeys?.map((listItemKey, liIndex) => (
                <li key={liIndex} className="flex items-start gap-3 text-slate-700 text-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-3 shrink-0" />
                    <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: t(listItemKey) }} />
                </li>
              ))}
            </ul>
          );
        case 'video_list':
          const videos = translations[language].helpVideos.videos;
          if (!videos || videos.length === 0) {
              return <p key={index} className="text-slate-500 italic py-4">{t('helpVideos.noVideos')}</p>;
          }
          return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 mb-8">
              {videos.map((video, vIndex) => (
                  <a 
                      href={video.link} 
                      key={vIndex} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group flex items-center justify-between p-5 bg-white hover:bg-sky-50 border border-slate-200 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                      <div className="flex items-center space-x-4">
                        <div className="bg-sky-100 p-2.5 rounded-xl text-sky-600 font-bold text-sm">
                            {(vIndex + 1).toString().padStart(2, '0')}
                        </div>
                        <span className="text-base font-bold text-slate-700 group-hover:text-sky-600">
                            {t(`helpVideos.${video.titleKey}`)}
                        </span>
                      </div>
                      <div
                          className="w-7 h-7 text-red-600 opacity-60 group-hover:opacity-100 transition-opacity"
                          dangerouslySetInnerHTML={{ __html: YOUTUBE_ICON_SVG }}
                      />
                  </a>
              ))}
              </div>
          );
        default:
          return null;
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Search Header */}
      <div className="bg-sky-600 pt-8 pb-32">
          <div className="container mx-auto px-4">
              <PageTitle title={t('helpModal.modalTitle')} className="text-white border-white/20 mb-8" />
              
              <div className="relative max-w-2xl">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder={t('helpModal.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 px-14 py-5 rounded-3xl backdrop-blur-md focus:outline-none focus:border-white/50 transition-all text-lg shadow-2xl"
                  />
              </div>
          </div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Sidebar/Navigation */}
              <aside className="w-full lg:w-80 shrink-0">
                  <div className="lg:sticky lg:top-24 space-y-6">
                      
                      {/* Desktop Navigation Portal */}
                      <div className="hidden lg:block bg-white rounded-[32px] p-2 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                          <div className="relative pt-6 px-4">
                              <h3 className="px-3 pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('helpModal.tocTitle')}</h3>
                              
                              {/* Progress Line */}
                              <div className="absolute left-6 top-16 bottom-8 w-px bg-slate-100" />
                              <motion.div 
                                className="absolute left-6 top-16 w-px bg-sky-500 origin-top"
                                style={{ height: `calc(100% - 64px)`, scaleY: scrollProgress / 100 }}
                              />

                              <div className="space-y-1 relative">
                                  {sectionOrder.map((section) => (
                                      <button
                                        key={`desktop-nav-${section.id}`}
                                        onClick={() => handleTocClick(section.id)}
                                        className={`w-full group flex items-center gap-4 px-3 py-3 rounded-2xl transition-all duration-300 relative
                                          ${activeTab === section.id 
                                            ? 'text-sky-600' 
                                            : 'text-slate-500 hover:text-sky-600'
                                          }`}
                                      >
                                          <div className={`z-10 w-2 h-2 rounded-full border-2 transition-all duration-500 shrink-0
                                            ${activeTab === section.id 
                                              ? 'bg-sky-500 border-sky-500 scale-125' 
                                              : 'bg-white border-slate-300 group-hover:border-sky-400'
                                            }`} 
                                          />
                                          <span className={`text-sm font-bold tracking-tight transition-all duration-300 ${activeTab === section.id ? 'translate-x-1' : ''}`}>
                                              {t(section.titleKey)}
                                          </span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                          
                          {/* Assistant shortcut in menu */}
                          <div className="mt-4 p-4 lg:block hidden">
                              <button 
                                onClick={openAssistant}
                                className="w-full group flex flex-col gap-3 p-5 rounded-[24px] bg-slate-900 text-white transition-all duration-300 hover:bg-sky-600 shadow-lg shadow-slate-200"
                              >
                                  <div className="flex items-center justify-between w-full">
                                      <div className="bg-white/10 p-2 rounded-xl text-white">
                                          <MessageSquare className="w-4 h-4" />
                                      </div>
                                      <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                  </div>
                                  <div className="text-left">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white/80">{t('helpModal.needMoreHelp')}</p>
                                      <p className="text-xs font-bold">{t('onboarding.step6.title')}</p>
                                  </div>
                              </button>
                          </div>
                      </div>

      {/* Mobile Slider / Navigation */}
                      <div className="lg:hidden sticky top-[72px] z-[50] -mx-4 px-4 bg-white/95 backdrop-blur-md py-4 mb-8 border-b border-slate-200 overflow-x-auto no-scrollbar shadow-sm">
                          <div ref={scrollRef} className="flex gap-2 min-w-max">
                              {sectionOrder.map((section) => (
                                  <button
                                    key={`mobile-nav-${section.id}`}
                                    data-section={section.id}
                                    data-active={activeTab === section.id}
                                    onClick={() => handleTocClick(section.id)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full whitespace-nowrap font-bold text-xs transition-all duration-300
                                      ${activeTab === section.id 
                                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-200' 
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                      }`}
                                  >
                                      {t(section.titleKey)}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Disclaimer Card */}
                      <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-6 lg:p-8">
                          <div className="flex items-center gap-3 mb-3">
                              <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                                  <Info className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">Avis Important</span>
                          </div>
                          <p className="text-xs text-amber-900/70 font-medium leading-relaxed italic">
                              {t('helpModal.disclaimer')}
                          </p>
                      </div>
                  </div>
              </aside>

      {/* Content Main Area */}
              <main className="flex-1 min-w-0">
                  <div className="space-y-12">
                      {sectionOrder.map((section) => {
                          const structure = helpModalContentStructure[language][section.id as keyof typeof helpModalContentStructure[typeof language]];
                          if (!structure) return null;

                          const renderedItems = renderContentItems(structure.content).filter(Boolean);
                          if (searchQuery && renderedItems.length === 0) return null;

                          return (
                              <motion.section 
                                key={`content-section-${section.id}`}
                                id={`help-section-${section.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                className="bg-white rounded-[32px] p-8 lg:p-12 shadow-sm border border-slate-200 relative overflow-hidden"
                              >
                                  {/* Section Badge */}
                                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
                                      {section.icon}
                                      {t(section.titleKey)}
                                  </div>

                                  <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-8 tracking-tight">
                                      {t(structure.titleKey)}
                                  </h2>

                                  <div className="prose prose-slate prose-lg max-w-none">
                                      {renderContentItems(structure.content)}
                                  </div>

                                  {/* Watermark Icon */}
                                  <div className="absolute right-[-20px] top-[-20px] opacity-[0.02] text-slate-900 pointer-events-none transform scale-[4]">
                                      {section.icon}
                                  </div>
                              </motion.section>
                          );
                      })}

                      {searchQuery && sectionOrder.every(s => {
                          const struct = helpModalContentStructure[language][s.id as keyof typeof helpModalContentStructure[typeof language]];
                          return !struct || renderContentItems(struct.content).filter(Boolean).length === 0;
                      }) && (
                          <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-200">
                              <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                  <Search className="w-10 h-10 text-slate-300" />
                              </div>
                              <h3 className="text-2xl font-black text-slate-900 mb-2">{t('helpModal.noResultsTitle')}</h3>
                              <p className="text-slate-500 font-medium max-w-sm mx-auto">{t('helpModal.noResultsText')}</p>
                          </div>
                      )}
                  </div>

                  {/* Feedback Section */}
                  <div className="mt-12 p-8 lg:p-12 bg-slate-900 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8">
                      <div>
                          <h3 className="text-2xl font-black mb-2">{t('helpModal.needMoreHelp')}</h3>
                          <p className="text-slate-400 font-medium">{t('onboarding.step6.content')}</p>
                      </div>
                      <button 
                        onClick={openAssistant}
                        className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-sky-100 transition-colors flex items-center gap-3"
                      >
                          <MessageSquare className="w-5 h-5 text-sky-500" />
                          {t('onboarding.step6.title')}
                      </button>
                  </div>
              </main>

          </div>
      </div>
    </div>
  );
};

