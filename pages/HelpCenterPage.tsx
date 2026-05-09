import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import { helpModalContentStructure, translations } from '../data/translations';
import { HelpModalSection, HelpContentItem, HelpSubtitleItem } from '../types';
import { YOUTUBE_ICON_SVG } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plane, 
  BookOpen, 
  Info, 
  Video, 
  Award, 
  MessageSquare, 
  Search,
  ChevronRight,
  FileText,
  Download,
  AlertCircle,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

export const HelpCenterPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const { openAssistant } = useUI();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('fearOfFlying');
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);

  // Auto-scroll mobile nav to keep active item in view
  useEffect(() => {
    if (mobileNavRef.current) {
      const activeBtn = mobileNavRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeBtn) {
        const container = mobileNavRef.current;
        const scrollLeft = activeBtn.offsetLeft - (container.offsetWidth / 2) + (activeBtn.offsetWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeTab]);

  const sectionOrder = useMemo(() => {
    const base: (HelpModalSection & { icon: React.ReactNode })[] = [
      { id: 'fearOfFlying', titleKey: 'helpModal.fearOfFlying.title', icon: <Plane className="w-5 h-5" /> },
      { id: 'cafftInfo', titleKey: 'helpModal.cafftInfo.title', icon: <Info className="w-5 h-5" /> },
      { id: 'prospectus', titleKey: 'helpModal.prospectus.title', icon: <BookOpen className="w-5 h-5" /> },
      { id: 'helpVideos', titleKey: 'helpVideos.pageTitle', icon: <Video className="w-5 h-5" /> },
      { id: 'postTreatment', titleKey: 'helpModal.postTreatmentSection.title', icon: <Award className="w-5 h-5" /> },
      { id: 'technicalSection', titleKey: 'helpModal.technicalSection.title', icon: <ShieldCheck className="w-5 h-5" /> },
    ];
    
    if (currentUser?.role === 'therapist') {
      base.push({ id: 'therapistInfo' as const, titleKey: 'helpModal.therapistInfo.title', icon: <Stethoscope className="w-5 h-5" /> });
    }
    
    return base;
  }, [currentUser]);

  // Sync scroll with navigation
  useEffect(() => {
    const handleScroll = () => {
      if (isAutoScrolling.current) return;

      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress((winScroll / height) * 100);
      setShowScrollTop(winScroll > 500);

      // Simple implementation: check which section is in view
      const sections = sectionOrder.map(s => document.getElementById(`section-${s.id}`));
      let currentSectionId = activeTab;

      for (const section of sections) {
        if (!section) continue;
        const rect = section.getBoundingClientRect();
        // Check if top of section is near the middle/top of screen
        if (rect.top <= 200 && rect.bottom >= 200) {
          currentSectionId = section.id.replace('section-', '');
          break;
        }
      }

      if (currentSectionId !== activeTab) {
        setActiveTab(currentSectionId);
      }

      // Check subsections
      const sectionStructure = helpModalContentStructure[language][currentSectionId as keyof typeof helpModalContentStructure[typeof language]];
      if (sectionStructure) {
        let currentSubId = null;
        sectionStructure.content.forEach((item, idx) => {
          if (item.type === 'subtitle') {
            const el = document.getElementById(`sub-${currentSectionId}-${idx}`);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= 250) {
                currentSubId = `${currentSectionId}-${idx}`;
              }
            }
          }
        });
        setActiveSubsection(currentSubId);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, sectionOrder, language]);

  const scrollTo = (id: string, offset = 120) => {
    const element = document.getElementById(id);
    if (element) {
      isAutoScrolling.current = true;
      const y = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      // Reset auto-scrolling flag after animation finished
      setTimeout(() => { isAutoScrolling.current = false; }, 1000);
    }
  };

  /* handleDownloadManual removed */

  const renderContentItems = (contentArray: HelpContentItem[], sectionId: string) => {
    // Special rendering for Prospectus or clinical sections to look like a official document
    const isProspectus = sectionId === 'prospectus' || sectionId === 'technicalSection' || sectionId === 'postTreatmentSection';

    return contentArray.map((item, index) => {
      // Basic search filter
      if (searchQuery) {
        const textToSearch = (('textKey' in item && item.textKey) ? String(t(item.textKey)) : '') + 
                           (('itemKeys' in item && item.itemKeys) ? item.itemKeys.flatMap(k => {
                              const val = t(k, { returnObjects: true });
                              return Array.isArray(val) ? val : [t(k)];
                           }).join(' ') : '');
        if (!textToSearch.toLowerCase().includes(searchQuery.toLowerCase())) return null;
      }

      switch (item.type) {
        case 'subtitle':
          return (
            <div key={index} className="mt-12 mb-6 scroll-mt-40">
              <h3 
                id={`sub-${sectionId}-${index}`}
                className="text-xl font-display font-black text-uib-blue uppercase tracking-widest border-b-2 border-uib-accent/20 pb-2 flex items-center gap-3"
              >
                {sectionId === 'technicalSection' && <AlertCircle className="w-5 h-5 text-uib-red" />}
                {t(item.textKey || '')}
              </h3>
            </div>
          );
        case 'paragraph':
          const isWarning = item.textKey?.toLowerCase().includes('contraindication') || item.textKey?.toLowerCase().includes('condicions') || item.textKey?.toLowerCase().includes('adverse');
          return (
            <div 
              key={index} 
              className={`font-body text-slate-600 mb-6 leading-relaxed text-base md:text-lg prose prose-slate max-w-none prose-strong:text-uib-blue prose-strong:font-black ${isProspectus ? 'bg-slate-50 p-6 md:p-8 rounded-[32px] border-l-8 border-uib-blue shadow-sm relative overflow-hidden' : ''} ${isWarning ? 'border-uib-red bg-red-50/30' : ''}`}
            >
              {isProspectus && !isWarning && index === 1 && (
                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                   <ShieldCheck className="w-24 h-24 text-uib-blue" />
                </div>
              )}
              {isProspectus && index === 0 && (
                <div className="flex items-center gap-3 mb-6 text-uib-blue bg-white/50 w-fit px-4 py-1.5 rounded-full border border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-uib-accent" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Protocol Clínic Estàndard CAFFT 5.1</span>
                </div>
              )}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {t(item.textKey || '')}
              </ReactMarkdown>
            </div>
          );
        case 'list':
          return (
            <div key={index} className={`grid grid-cols-1 ${isProspectus ? 'md:grid-cols-2' : ''} gap-4 mb-10`}>
              {item.itemKeys?.flatMap((key) => {
                const val = t(key, { returnObjects: true });
                if (Array.isArray(val)) return val;
                return [t(key)];
              }).map((text, i) => (
                <div key={i} className="flex gap-4 items-start bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]">
                  <div className="w-8 h-8 rounded-lg bg-uib-accent/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-uib-accent" />
                  </div>
                  <span className="text-slate-700 font-body text-sm leading-snug">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(text)}</ReactMarkdown>
                  </span>
                </div>
              ))}
            </div>
          );
        case 'video_list':
          const videos = translations[language].helpVideos.videos;
          return (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {videos?.map((v, i) => (
                <a 
                  key={i} href={v.link} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col p-6 bg-white border border-slate-200 rounded-3xl hover:border-uib-accent transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-xs group-hover:bg-uib-accent">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <Video className="w-6 h-6 text-red-500 opacity-40 group-hover:opacity-100" />
                  </div>
                  <span className="font-display font-bold text-uib-blue group-hover:text-uib-accent">{t(`helpVideos.${v.titleKey}`)}</span>
                </a>
              ))}
            </div>
          );
        case 'ai_chat':
          return (
            <div key={index} className="mt-10">
              <button 
                onClick={openAssistant}
                className="w-full flex items-center gap-6 p-8 bg-uib-blue rounded-[32px] text-white hover:bg-[#003657] transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-uib-accent flex items-center justify-center">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <p className="font-display font-bold text-xl">{t('helpModal.aiChatSection.title')}</p>
                  <p className="text-sky-200 text-sm">{t('onboarding.step6.content')}</p>
                </div>
              </button>
            </div>
          );
        default: return null;
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-slate-100">
        <motion.div 
          className="h-full bg-uib-accent"
          initial={{ width: 0 }}
          animate={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header Section */}
      <header className="bg-uib-blue pt-12 pb-40 md:pt-20 md:pb-48 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="container mx-auto px-6 relative z-10 text-center md:text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-uib-accent text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6 border border-white/10">
               <FileText className="w-3 h-3" />
               Manual Digital 5.1
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-black text-white mb-4 md:mb-6 tracking-tighter">
              {t('helpModal.modalTitle')}
            </h1>
            <p className="text-sky-100/70 text-lg md:text-xl max-w-2xl mb-8 md:mb-12">
              {t('helpModal.heroSubtitle')}
            </p>
            
            <div className="max-w-2xl mx-auto md:mx-0 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-uib-accent w-5 h-5 md:w-6 md:h-6" />
              <input 
                type="text"
                placeholder={t('helpModal.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-4 md:py-5 pl-14 md:pl-16 pr-8 text-white text-sm md:text-base focus:bg-white focus:text-uib-blue transition-all"
              />
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 -mt-24 pb-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sticky Sidebar */}
          <aside className="lg:col-span-4 self-start sticky top-24 lg:top-32 z-30 -mt-20 lg:-mt-0">
            {/* Mobile Navigation (Horizontal Scroll) */}
            <div 
              ref={mobileNavRef}
              className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-4 pt-2 mb-8 bg-uib-blue/5 backdrop-blur-sm p-4 rounded-3xl border border-white/20 shadow-xl scroll-smooth"
            >
              {sectionOrder.map((section) => (
                <button
                  key={section.id}
                  data-active={activeTab === section.id}
                  onClick={() => scrollTo(`section-${section.id}`, 100)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap text-xs font-display font-black tracking-tight transition-all
                    ${activeTab === section.id ? 'bg-uib-blue text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}
                  `}
                >
                  <div className="w-4 h-4">{section.icon}</div>
                  {t(section.titleKey)}
                </button>
              ))}
            </div>

            {/* Desktop View Sidebar */}
            <div className="hidden lg:block bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('helpModal.tocTitle')}</h3>
                  <div className="text-[10px] font-bold text-uib-accent bg-uib-accent/10 px-2 py-1 rounded-md">{Math.round(scrollProgress)}%</div>
                </div>

                <nav className="space-y-1">
                  {sectionOrder.map((section) => {
                    const structure = helpModalContentStructure[language][section.id as keyof typeof helpModalContentStructure[typeof language]];
                    const subsections = (structure?.content || [])
                      .map((item, idx) => ({ item, idx }))
                      .filter(({ item }) => item.type === 'subtitle') as { item: HelpSubtitleItem; idx: number }[];

                    return (
                      <div key={section.id}>
                        <button
                          onClick={() => scrollTo(`section-${section.id}`)}
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group
                            ${activeTab === section.id ? 'bg-uib-accent text-white font-bold shadow-lg shadow-uib-accent/20' : 'text-slate-500 hover:bg-slate-50'}
                          `}
                        >
                          <div className={`shrink-0 transition-transform ${activeTab === section.id ? 'scale-110' : 'group-hover:translate-x-1'}`}>
                            {section.icon}
                          </div>
                          <span className="text-sm uppercase tracking-wide truncate">{t(section.titleKey)}</span>
                        </button>

                        <AnimatePresence>
                          {activeTab === section.id && subsections && subsections.length > 0 && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="ml-10 border-l-2 border-slate-100 py-1 space-y-1 overflow-hidden"
                            >
                              {subsections.map(({ item, idx }) => (
                                <button
                                  key={idx}
                                  onClick={() => scrollTo(`sub-${section.id}-${idx}`, 150)}
                                  className={`w-full text-left py-2 px-4 text-[11px] transition-all hover:text-uib-accent truncate
                                    ${activeSubsection === `${section.id}-${idx}` ? 'text-uib-accent font-bold bg-uib-accent/5 rounded-r-lg' : 'text-slate-400'}
                                  `}
                                >
                                  {t(item.textKey || '')}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </nav>
              </div>

              {/* Download Button Removed */}
            </div>

            <div className="mt-8 p-8 bg-uib-accent/5 border border-uib-accent/20 rounded-[40px]">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-uib-accent" />
                <span className="text-[10px] font-black text-uib-blue uppercase tracking-widest">Aviso Clínico</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed italic">{t('helpModal.disclaimer')}</p>
            </div>
          </aside>

          {/* Content Main Area */}
          <div className="lg:col-span-8 space-y-8 md:space-y-12">
            
            {/* Iteratable Sections */}
            {sectionOrder.filter(s => s.id !== 'fullManual').map((section) => {
              const structure = helpModalContentStructure[language][section.id as keyof typeof helpModalContentStructure[typeof language]];
              if (!structure) return null;
              
              const items = renderContentItems(structure.content, section.id).filter(Boolean);
              if (searchQuery && items.length === 0) return null;

              return (
                <section key={section.id} id={`section-${section.id}`} className="bg-white rounded-[32px] md:rounded-[48px] p-6 sm:p-10 lg:p-16 shadow-lg border border-slate-100 scroll-mt-24 transition-all">
                  <div className="flex items-center gap-4 mb-8 md:mb-12">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-uib-blue text-white flex items-center justify-center shadow-lg shadow-uib-blue/20">
                      {section.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t(section.titleKey)}</span>
                      <h4 className="text-2xl md:text-3xl font-display font-black text-uib-blue leading-none">{t(structure.titleKey)}</h4>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {items}
                  </div>
                  
                  <div className="mt-16 pt-8 border-t border-slate-50 flex items-center justify-between text-slate-200">
                    <div className="flex gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                       <div className="w-1.5 h-1.5 rounded-full bg-uib-accent/20" />
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-uib-accent transition-colors">CAFFT 5.1</span>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Back to Top & Mobile AI Toggle */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3"
          >
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-12 h-12 bg-white text-uib-blue rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-100"
              title="Tornar a dalt"
            >
              <ArrowRight className="w-5 h-5 -rotate-90" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
