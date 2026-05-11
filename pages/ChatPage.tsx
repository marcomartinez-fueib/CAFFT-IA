

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { ai, createChatSession, getAiLastError } from '../utils/gemini';
import { getQPVIIResultsForUser, getAllUserExposureProgress, getUsers, saveAiConsultation } from '../utils/localStorageDB.ts';
import { calculateQPVIIScores } from '../utils/qpviiScoring';
import { THERAPEUTIC_KNOWLEDGE } from '../data/therapeuticKnowledge';
import { ChatVisualizer } from '../components/ChatVisualizer';
import { EvolutionChartDataPoint, UserExposureProgress, StoredUser } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';

// --- Icons ---
const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
  </svg>
);

interface Message {
  role: 'user' | 'model';
  text: string;
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1.5 px-1 py-1">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        className="h-1.5 w-1.5 bg-slate-400 rounded-full"
      ></motion.div>
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        className="h-1.5 w-1.5 bg-slate-400 rounded-full"
      ></motion.div>
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        className="h-1.5 w-1.5 bg-slate-400 rounded-full"
      ></motion.div>
    </div>
);

// This component is now designed to be embedded, e.g., in the Help Modal.
export const ChatInterface: React.FC<{onCloseModal?: () => void; hideHeader?: boolean}> = ({ onCloseModal, hideHeader }) => {
  const { t } = useLanguage();
  const { currentUser, updateUser } = useAuth();
  
  const [isAiReady, setIsAiReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [qpviiData, setQpviiData] = useState<EvolutionChartDataPoint[]>([]);
  const [exposureData, setExposureData] = useState<UserExposureProgress[]>([]);
  const [rciData, setRciData] = useState<{value: number, isSignificant: boolean, improvement: number, improvementPercent: string} | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(currentUser?.assistantName || '');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isInitialMount = useRef(true);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  const scrollToBottom = (instant = false) => {
    if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: instant ? 'auto' : 'smooth'
        });
    }
  };

  useEffect(() => {
    if (isInitialMount.current && messages.length <= 1 && !isLoading) {
        if (messages.length === 1) {
            isInitialMount.current = false;
            scrollToBottom(true);
        }
        return;
    }
    scrollToBottom();
  }, [messages, isLoading, isInitializing]);

  // Handle mobile keyboard and viewport stability
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      setViewportHeight(window.visualViewport?.height || null);
      scrollToBottom(true);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  const initializeChat = useCallback(async () => {
      if (!currentUser) return;
      
      setIsInitializing(true);
      setError(null);
      
      try {
          // --- Compute Therapeutic Context ---
          const results = getQPVIIResultsForUser(currentUser.id);
          const allProgress = getAllUserExposureProgress().filter(p => p.userId === currentUser.id);
          
          // --- Compute Chart Data for Visuals ---
          const sortedHistory = [...results].sort((a, b) => a.timestamp - b.timestamp);
          let evolutionPoints: EvolutionChartDataPoint[] = [];
          if (sortedHistory.length >= 1) {
              evolutionPoints = sortedHistory.map(result => {
                  const scores = calculateQPVIIScores(result.answers);
                  return {
                      dateLabel: new Date(result.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                      total: scores.total,
                      malestarGeneral: scores.malestarGeneral,
                      subPreparatius: scores.subPreparatius,
                      subVicari: scores.subVicari,
                      subVol: scores.subVol,
                  };
              });
          }
          setQpviiData(evolutionPoints);
          setExposureData(allProgress.sort((a, b) => (b.qpviiTimestamp || b.lastUpdated) - (a.qpviiTimestamp || a.lastUpdated)));

          // --- Compute RCI Data ---
          if (sortedHistory.length >= 2) {
              const firstResult = sortedHistory[0];
              const lastResult = sortedHistory[sortedHistory.length - 1];
              const firstTotal = calculateQPVIIScores(firstResult.answers).total;
              const lastTotal = calculateQPVIIScores(lastResult.answers).total;
              const sDiff = 17.6;
              const rciValue = (firstTotal - lastTotal) / sDiff;
              setRciData({
                  value: rciValue,
                  isSignificant: rciValue >= 1.96,
                  improvement: firstTotal - lastTotal,
                  improvementPercent: firstTotal > 0 ? ((firstTotal - lastTotal) / firstTotal * 100).toFixed(1) : '0'
              });
          } else {
              setRciData(null);
          }

          let momentKey = 'pre';
          if (results.some(r => r.evaluationType === 'post')) {
              momentKey = 'post';
          } else if (allProgress.some(p => p.programCompleted)) {
              momentKey = 'maintenance';
          } else if (results.length > 0) {
              momentKey = 'during';
          }
          
          const contextText = t(`aiChat.moment.${momentKey}`);
          
          const isTherapist = currentUser.role === 'therapist';
          
          let therapistContext = '';
          if (isTherapist) {
              const allUsers = getUsers();
              const myPatients = (allUsers as StoredUser[]).filter(u => u.role === 'patient' && u.therapistId === currentUser.id);
              
              if (myPatients.length > 0) {
                  therapistContext = "\n\nDATOS CLÍNICOS DE TUS PACIENTES (Analiza estos datos para asesorar al terapeuta):\n";
                  myPatients.forEach(patient => {
                      const patientResults = getQPVIIResultsForUser(patient.id).sort((a, b) => a.timestamp - b.timestamp);
                      const patientProgress = getAllUserExposureProgress().filter(p => p.userId === patient.id).sort((a, b) => b.lastUpdated - a.lastUpdated);
                      
                      const lastResult = patientResults.length > 0 ? patientResults[patientResults.length - 1] : null;
                      const scores = lastResult?.scores ? 
                        `Total: ${lastResult.scores.total} (Malestar: ${lastResult.scores.malestarGeneral}, Prep: ${lastResult.scores.subPreparatius}, Vic: ${lastResult.scores.subVicari}, Vol: ${lastResult.scores.subVol})` : 
                        "Sin resultados";
                        
                      // Calculate RCI if possible
                      let rciInfo = "RCI: No disponible (falten dades)";
                      if (patientResults.length >= 2) {
                          const firstTotal = calculateQPVIIScores(patientResults[0].answers).total;
                          const lastTotal = calculateQPVIIScores(patientResults[patientResults.length - 1].answers).total;
                          const rciVal = (firstTotal - lastTotal) / 17.6;
                          rciInfo = `RCI: ${rciVal.toFixed(2)} (${rciVal >= 1.96 ? 'Significatiu' : 'No significatiu'})`;
                      }

                      const progressSummary = patientProgress.length > 0 
                          ? `${patientProgress.length} sessions, última: ${new Date(patientProgress[0].lastUpdated).toLocaleDateString()}`
                          : "No hay sesiones.";
                          
                      therapistContext += `- PACIENT: ${patient.username} (ID: ${patient.id})\n  * QPV-II actual: ${scores}\n  * ${rciInfo}\n  * Progrés: ${progressSummary}\n`;
                  });
              } else {
                  therapistContext = "\n\nNo tienes pacientes asignados actualmente.";
              }
          }
          
          // Documentation Knowledge Base
          const docsKnowledge = `
BASE DE CONEXEMENT CLÍNIC (Protocol CAFFT 5.1):
${THERAPEUTIC_KNOWLEDGE.manual}
${isTherapist ? THERAPEUTIC_KNOWLEDGE.therapistGuide : ''}
${THERAPEUTIC_KNOWLEDGE.hierarchyLogic}
${THERAPEUTIC_KNOWLEDGE.patientFlow}
${THERAPEUTIC_KNOWLEDGE.coreFeatures}

DIRETRIUS DE COMPORTAMENT:
- Empatia i Professionalitat: Sigues empàtic però professional (especialment amb terapeutes, on has de ser més tècnic).
- Vocabulari: Utilitza "habituació", "extinció de la resposta de por", "regulació emocional". Evita la paraula "cervell" (inclou termes com "aprenentatge" o "processament emocional").
- Rigor: Les teves pautes han d'estar 100% alineades amb els papers de Bornas et al. i Tortella-Feliu et al. citats.
- Visualitzacions: Pots invocar visualitzacions amb [VISUAL:evolution] o [VISUAL:habituation] si el context ho requereix.
`;

          const systemInstruction = isTherapist 
            ? t('aiChat.therapistSystemInstruction', { username: currentUser.username }) + "\n\n" + docsKnowledge + therapistContext
            : t('aiChat.systemInstruction', { 
                therapeuticContext: contextText,
                assistantName: currentUser.assistantName || 'Bora',
                username: currentUser.username || 'Pacient',
                hasCompletedQPVII: results.length > 0 ? "SÍ" : "NO"
            }) + "\n\n" + docsKnowledge;
          
          const chatSession = createChatSession(systemInstruction);

          if (!chatSession) {
              const lastErr = getAiLastError();
              setError(`Failed to initialize AI assistant. ${lastErr || 'The service may be unavailable.'}`);
              setIsInitializing(false);
              return;
          }

          setIsAiReady(true);
          
          const isQpviiCompleted = qpviiData.length > 0;
          const initialMessageKey = (!isTherapist && isQpviiCompleted) ? 'aiChat.initialMessageCompleted' : 'aiChat.initialMessage';
          
          const initialMessageText = (() => {
            const messagesArray = t(initialMessageKey, { returnObjects: true });
            
            if (Array.isArray(messagesArray)) {
                const selectedIndex = Math.floor(Math.random() * messagesArray.length);
                return t(`${initialMessageKey}.${selectedIndex}`, { 
                    assistantName: currentUser.assistantName || 'Bora',
                    username: currentUser.username || 'Pacient'
                });
            }

            // Fallback for non-array translations (like therapistInitialMessage)
            return isTherapist
              ? t('aiChat.therapistInitialMessage', { username: currentUser.username })
              : t(initialMessageKey, { 
                  assistantName: currentUser.assistantName || 'Bora',
                  username: currentUser.username || 'Pacient'
                });
          })();

          if (messages.length === 0) {
              setMessages([{ role: 'model', text: initialMessageText }]);
          }
      } catch (err) {
          console.error("Initialization error:", err);
          setError("Failed to connect to the AI service.");
      } finally {
          setIsInitializing(false);
      }
  }, [t, currentUser, messages.length]);

  useEffect(() => {
    if (currentUser && !isAiReady && !isInitializing && !error) {
        // Randomly assign a name if it doesn't exist
        if (!currentUser.assistantName) {
            const suggestions = t('aiChat.genderNeutralSuggestions', { returnObjects: true });
            const names = Array.isArray(suggestions) ? suggestions : ["Àlex", "Ari", "Dani"];
            const randomName = names[Math.floor(Math.random() * names.length)];
            updateUser({ assistantName: randomName });
            return; // Effect will re-run after state update
        }
        initializeChat();
    }
  }, [currentUser, isAiReady, isInitializing, error, initializeChat, updateUser, t]);

  const handleSaveAssistantName = async () => {
    if (!newName.trim()) return;
    const success = await updateUser({ assistantName: newName });
    if (success) {
        setIsEditingName(false);
        setIsAiReady(false); // Force re-initialization with new name
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !ai) return;

    const userMessage: Message = { role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
        // Build history in the format required by generateContentStream
        // Filter out initial system messages if any, and map to {role, parts: [{text}]}
        const history = newMessages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        // Get system instruction
        const isTherapist = currentUser.role === 'therapist';
        let therapistContext = '';
        if (isTherapist) {
            const allUsers = getUsers();
            const myPatients = (allUsers as StoredUser[]).filter(u => u.role === 'patient' && u.therapistId === currentUser.id);
            if (myPatients.length > 0) {
                therapistContext = "\n\nDATOS DE TUS PACIENTES:\n";
                myPatients.forEach(patient => {
                    const patientResults = getQPVIIResultsForUser(patient.id);
                    const lastResult = patientResults.length > 0 ? patientResults[0] : null;
                    const scores = lastResult?.scores ? `Total: ${lastResult.scores.total}` : "Sin resultados";
                    therapistContext += `- ${patient.username}: QPV-II: ${scores}\n`;
                });
            }
        }

        const momentKey = qpviiData.length > 0 ? 'during' : 'pre';
        const hasQPVII = qpviiData.length > 0;
        const contextText = t(`aiChat.moment.${momentKey}`);

        // Documentation Knowledge Base
        const docsKnowledge = `
BASE DE CONEXEMENT CLÍNIC (Protocol CAFFT 5.1):
${THERAPEUTIC_KNOWLEDGE.manual}
${isTherapist ? THERAPEUTIC_KNOWLEDGE.therapistGuide : ''}
${THERAPEUTIC_KNOWLEDGE.hierarchyLogic}
${THERAPEUTIC_KNOWLEDGE.patientFlow}
${THERAPEUTIC_KNOWLEDGE.coreFeatures}

DIRETRIUS DE COMPORTAMENT:
- Empatia i Professionalitat: Sigues empàtic però professional.
- Vocabulari: Utilitza "habituació", "extinció de la resposta de por", "regulació emocional".
- Rigor: Les teves pautes han d'estar alineades amb l'evidència científica de la UIB.
`;

        const systemInstruction = isTherapist 
          ? t('aiChat.therapistSystemInstruction', { username: currentUser.username }) + "\n\n" + docsKnowledge + therapistContext
          : t('aiChat.systemInstruction', { 
              therapeuticContext: contextText,
              assistantName: currentUser.assistantName || 'Bora',
              username: currentUser.username || 'Pacient',
              hasCompletedQPVII: hasQPVII ? "SÍ (ja ha realitzat el qüestionari inicial)" : "NO (encara ha de fer el qüestionari)"
          }) + "\n\n" + docsKnowledge;

        const stream = await ai.models.generateContentStream({
            model: "gemini-3-flash-preview",
            contents: history,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        let accumulatedText = '';
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                accumulatedText += chunkText;
                setMessages(prev => {
                    const latestMessages = [...prev];
                    const lastMessage = { ...latestMessages[latestMessages.length - 1] };
                    if (lastMessage.role === 'model') {
                        lastMessage.text = accumulatedText;
                        latestMessages[latestMessages.length - 1] = lastMessage;
                    }
                    return latestMessages;
                });
            }
        }

        // Log consultation
        saveAiConsultation({
            id: `ai_${Date.now()}`,
            userId: currentUser.id,
            userName: currentUser.username,
            userRole: currentUser.role as 'patient' | 'therapist',
            query: input,
            response: accumulatedText,
            timestamp: Date.now()
        });
    } catch (e) {
        console.error("Error sending message:", e);
        setError("Error de connexió amb l'assistent. Torna-ho a provar.");
        setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last.role === 'model' && last.text === '') {
                return prev.slice(0, -1);
            }
            return prev;
        });
    } finally {
        setIsLoading(false);
    }
  }, [input, isLoading, messages, currentUser, qpviiData.length, t]);
  
  if (!currentUser) {
    return (
      <div className="text-center p-8 flex flex-col items-center justify-center h-full">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">{t('aiChat.pageTitle')}</h3>
        <p className="text-slate-600 mb-6 max-w-sm">
          {t('qpvii.loginToSavePrompt')}
        </p>
        <div className="flex gap-4">
          <Link to="/login" onClick={onCloseModal} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
            {t('nav.login')}
          </Link>
          <span className="text-slate-500 self-center">{t('general.or')}</span>
          <Link to="/register" onClick={onCloseModal} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
            {t('nav.register')}
          </Link>
        </div>
      </div>
    );
  }

  // Helper to split message text and identify visual tags
  const renderMessageContent = (text: string, isUser: boolean) => {
      const parts = text.split(/(\[VISUAL:\w+\])/g);
      return parts.map((part, i) => {
          const match = part.match(/\[VISUAL:(\w+)\]/);
          if (match) {
              const visualType = match[1];
              return (
                <div key={i} className="w-full">
                    <ChatVisualizer type={visualType} qpviiData={qpviiData} exposureData={exposureData} rciData={rciData} />
                </div>
              );
          }
          if (!part.trim()) return null;
          return (
            <div key={i} className={`prose prose-sm max-w-none ${isUser ? 'prose-invert prose-p:text-white' : 'prose-slate'} prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5`}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => {
                        const isInternal = props.href?.startsWith('/');
                        if (isInternal) {
                            return (
                                <Link 
                                    to={props.href!} 
                                    onClick={onCloseModal}
                                    className="text-sky-600 font-black hover:text-sky-800 underline decoration-sky-300 decoration-2 underline-offset-2 transition-colors"
                                >
                                    {props.children}
                                </Link>
                            );
                        }
                        return <a target="_blank" rel="noopener noreferrer" {...props} className="text-sky-600 font-black hover:text-sky-800 underline transition-colors" />;
                    }
                  }}
                >
                    {part}
                </ReactMarkdown>
            </div>
          );
      });
  };

  return (
    <div 
        className="h-full flex flex-col bg-[#F8FAFC] overflow-hidden"
        style={viewportHeight ? { height: `${viewportHeight}px` } : {}}
    >
      {!hideHeader && (
          <div className="p-3 sm:p-4 border-b bg-white flex justify-between items-center shadow-sm relative z-20">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                </div>
                <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-800 leading-tight uppercase tracking-tight">
                        {isAiReady ? (currentUser?.assistantName || t('aiChat.assistantNamePlaceholder')) : t('aiChat.connecting')}
                    </h3>
                    <div className="flex items-center space-x-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isAiReady ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('aiChat.disclaimer')}</p>
                    </div>
                </div>
            </div>
            {onCloseModal && (
                <button onClick={onCloseModal} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
          </div>
      )}
      
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth" style={{ background: 'radial-gradient(circle at 50% 50%, #f8faff 0%, #f1f5f9 100%)' }}>
        <AnimatePresence initial={false}>
        {isEditingName ? (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-sky-50/80 backdrop-blur-sm rounded-2xl p-5 border border-sky-100 shadow-sm flex flex-col space-y-4"
            >
                <div className="flex items-center space-x-3">
                    <div className="bg-sky-500 p-2 rounded-xl text-white shadow-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                    <p className="text-xs font-black text-sky-900 uppercase tracking-widest">{t('aiChat.assistantNameTitle')}</p>
                </div>
                
                <div className="flex flex-col space-y-3">
                    <div className="flex space-x-2">
                        <input 
                            type="text" 
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={t('aiChat.assistantNamePlaceholder')}
                            className="flex-1 px-4 py-2 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white shadow-sm font-medium"
                        />
                        <button 
                            onClick={handleSaveAssistantName}
                            disabled={!newName.trim()}
                            className="px-5 py-2 bg-sky-600 text-white rounded-xl text-sm font-black shadow-md hover:bg-sky-700 disabled:bg-slate-300 transition-all active:scale-95"
                        >
                            {t('aiChat.saveName')}
                        </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {Array.isArray(t('aiChat.genderNeutralSuggestions', { returnObjects: true })) && 
                         t('aiChat.genderNeutralSuggestions', { returnObjects: true }).map((suggestion: string, idx: number) => (
                            <button 
                                key={`${suggestion}-${idx}`}
                                onClick={() => setNewName(suggestion)}
                                className="px-3 py-1 bg-white border border-sky-100 text-sky-700 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-sky-50 transition-colors shadow-sm"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        ) : currentUser?.assistantName ? (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center -mt-2 mb-2"
            >
                <button 
                    onClick={() => {
                        setNewName(currentUser.assistantName || '');
                        setIsEditingName(true);
                    }}
                    className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[10px] sm:text-xs text-slate-400 font-black uppercase tracking-widest shadow-sm hover:shadow-md hover:bg-slate-50 transition-all flex items-center space-x-2"
                >
                    <span>{t('aiChat.assistantNamePlaceholder')}: <strong className="text-sky-600">{currentUser.assistantName}</strong></span>
                    <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
            </motion.div>
        ) : null}

        {messages.map((msg, index) => (
          <motion.div 
            key={`msg-${index}-${msg.role}`} 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`group relative max-w-[88%] sm:max-w-xl lg:max-w-2xl px-4 py-3 sm:px-5 sm:py-4 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-sky-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
            }`}>
               {/* Subtle background for model bubbles to make them feel less empty */}
               {msg.role === 'model' && (
                   <div className="absolute inset-0 bg-slate-50/30 rounded-2xl pointer-events-none"></div>
               )}
               
               {renderMessageContent(msg.text, msg.role === 'user')}
            </div>
          </motion.div>
        ))}

        {isLoading && messages.length > 0 && !error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-start"
          >
            <div className="px-4 py-3 rounded-2xl shadow-sm bg-white text-slate-800 rounded-bl-none border border-slate-100">
                <TypingIndicator />
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {error && (
            <div className="flex justify-center flex-col items-center space-y-3 py-4">
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm max-w-xs text-center border border-red-200 shadow-sm">{error}</div>
                <button 
                    onClick={initializeChat}
                    className="px-4 py-2 bg-sky-600 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-sky-700 transition-colors shadow-md"
                >
                    {t('aiChat.reconnectButton')}
                </button>
            </div>
        )}

        {isInitializing && messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center flex-col space-y-4">
                <TypingIndicator />
                <p className="text-sm text-slate-400 animate-pulse">{t('aiChat.connecting')}</p>
            </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 sm:p-5 bg-white border-t border-slate-100 shadow-lg relative z-20 safe-area-bottom">
        <div className="flex items-end space-x-2 sm:space-x-4 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = 'inherit';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                  // Reset height
                  if (inputRef.current) inputRef.current.style.height = 'inherit';
                }
              }}
              placeholder={t('aiChat.inputPlaceholder')}
              className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm sm:text-base resize-none bg-slate-50 text-slate-900 transition-all font-medium"
              rows={1}
              disabled={isLoading || !!error}
            />
          </div>
          <button
            onClick={() => {
                handleSendMessage();
                if (inputRef.current) inputRef.current.style.height = 'inherit';
            }}
            disabled={!input.trim() || isLoading}
            className="inline-flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-sky-600 text-white shadow-md hover:bg-sky-700 active:scale-95 transition-all disabled:bg-slate-200 disabled:shadow-none mb-0.5"
            aria-label={t('aiChat.sendButton')}
          >
            <SendIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
