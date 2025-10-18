



import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { TRANSLATIONS, ACCESS_KEY } from './constants';
import type { HistoryItem, DebateResult, VerificationResult } from './types';
import * as geminiService from './services/geminiService';
import { QuizIcon, PracticeIcon, ReferenceIcon, HelpIcon, LanguageIcon, SunIcon, MoonIcon, ImageUploadIcon, ChatIcon, HistoryIcon, ConstructorIcon, SuggestIcon, InsightsIcon, ContactIcon, FeedbackIcon, PlaceholderIcon, MicrophoneIcon } from './components/Icons';
import IntroSplash from './components/IntroSplash';
import Modal from './components/Modal';
import QuizModal from './components/QuizModal';
import LivePracticeModal from './components/LivePracticeModal';
import InsightsModal from './components/InsightsModal';
import ConstructorModal from './components/ConstructorModal';
import ChatModal from './components/ChatModal';
import SuggestModal from './components/SuggestModal';
import FeedbackModal from './components/FeedbackModal';
import HistoryModal from './components/HistoryModal';
import ResultsDisplay from './components/ResultsDisplay';


// Fix: Add type definition for the Web Speech API to resolve TypeScript error.
interface SpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}


// --- THEME & LANGUAGE CONTEXT ---
type AppContextType = {
  theme: 'light' | 'dark';
  lang: string;
  t: (key: string) => string;
};

const AppContext = createContext<AppContextType>({
  theme: 'light',
  lang: 'en',
  t: (key: string) => key,
});

export const useAppContext = () => useContext(AppContext);

// --- HELPER COMPONENTS (Defined outside main component) ---

const AccessGate: React.FC<{ onAccessGranted: () => void }> = ({ onAccessGranted }) => {
    const [code, setCode] = useState<string[]>(['', '', '', '']);
    const [error, setError] = useState('');
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 1) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newCode.join('').length === 4) {
            validateCode(newCode.join(''));
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };
    
    const validateCode = (fullCode: string) => {
        if (fullCode === ACCESS_KEY) {
            onAccessGranted();
        } else {
            setError('Incorrect code. Please try again.');
            setCode(['', '', '', '']);
            inputRefs.current[0]?.focus();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 space-y-4 bg-[color:var(--panel-light)] dark:bg-[color:var(--panel-dark)] rounded-2xl shadow-2xl border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">🔑 Enter Access Key</h2>
                    <p className="mt-2 text-sm text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">Enter your 4-digit access code to continue.</p>
                </div>
                <div className="flex justify-center gap-3 my-4">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => { inputRefs.current[index] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleInput(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className="w-14 h-16 text-center text-3xl font-semibold bg-gray-100 dark:bg-[color:var(--bg-dark)] border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)]"
                        />
                    ))}
                </div>
                {error && <p className="text-center text-[color:var(--error)] text-sm h-5 mt-4">{error}</p>}
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState('en');
  const [appState, setAppState] = useState<'splash' | 'gate' | 'main'>('splash');
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('ddcHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [suggestedSubject, setSuggestedSubject] = useState('');

  const t = useCallback((key: string): string => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  }, [lang]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

    const savedLang = localStorage.getItem('lang') || 'en';
    setLang(savedLang);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar' || lang === 'ur') ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const addToHistory = (item: Omit<HistoryItem, 'timestamp'>) => {
    const newHistoryItem: HistoryItem = { ...item, timestamp: new Date().toISOString() };
    setHistory(prev => {
      const newHistory = [newHistoryItem, ...prev].slice(0, 10);
      localStorage.setItem('ddcHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ddcHistory');
  };


  const handleSuggestionSelect = (subject: string) => {
    setSuggestedSubject(subject);
    setActiveModal(null);
  };

  const renderModalContent = () => {
    switch(activeModal) {
      case 'quiz': return <QuizModal onClose={() => setActiveModal(null)} />;
      case 'practice': return <LivePracticeModal onClose={() => setActiveModal(null)} />;
      case 'insights': return <InsightsModal history={history} onClose={() => setActiveModal(null)} />;
      case 'constructor': return <ConstructorModal onClose={() => setActiveModal(null)} />;
      case 'chat': return <ChatModal onClose={() => setActiveModal(null)} />;
      case 'suggest': return <SuggestModal onClose={() => setActiveModal(null)} onSuggestionSelect={handleSuggestionSelect} />;
      case 'reference': return <Modal isOpen={true} onClose={() => setActiveModal(null)} title={t('ddcReferenceTitle')}><p>{t('referenceContentPlaceholder')}</p></Modal>;
      case 'help': return <Modal isOpen={true} onClose={() => setActiveModal(null)} title={t('helpTitle')}><p>{t('helpContentPlaceholder')}</p></Modal>;
      case 'history': return <HistoryModal history={history} onClose={() => setActiveModal(null)} onClearHistory={clearHistory} />;
      case 'contact': 
        return (
            <Modal isOpen={true} onClose={() => setActiveModal(null)} title={t('contactTitle')}>
                <div className="space-y-4 p-4">
                    <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-lg">
                        <ContactIcon />
                        <div className="text-left">
                            <p className="font-semibold">{t('phone')}</p>
                            <a href="tel:+923124527520" className="text-[color:var(--secondary)] dark:text-[color:var(--accent)] hover:underline break-all">+92 312 4527520</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-lg">
                        <FeedbackIcon />
                        <div className="text-left">
                            <p className="font-semibold">{t('email')}</p>
                            <a href="mailto:faizanadnan79@gmail.com" className="text-[color:var(--secondary)] dark:text-[color:var(--accent)] hover:underline break-all">faizanadnan79@gmail.com</a>
                        </div>
                    </div>
                </div>
            </Modal>
        );
      case 'feedback': return <FeedbackModal onClose={() => setActiveModal(null)} />;
      default: return null;
    }
  }

  if (appState === 'splash') {
    return <IntroSplash onFinished={() => setAppState('gate')} />;
  }
  
  if (appState === 'gate') {
    return <AccessGate onAccessGranted={() => setAppState('main')} />;
  }
  
  return (
    <AppContext.Provider value={{ theme, lang, t }}>
      <div className="min-h-screen bg-[color:var(--bg-light)] dark:bg-[color:var(--bg-dark)] text-[color:var(--text-light)] dark:text-[color:var(--text-dark)] pt-20 pb-24">
        <Header onThemeToggle={toggleTheme} onLangChange={setLang} onOpenModal={setActiveModal} />
        
        <main className="w-full max-w-4xl mx-auto bg-[color:var(--panel-light)]/80 dark:bg-[color:var(--panel-dark)]/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 my-8 border border-white/50 dark:border-[color:var(--border-dark)]">
          <MainPanel 
            addToHistory={addToHistory} 
            onOpenModal={setActiveModal} 
            suggestedSubject={suggestedSubject}
            onSuggestionUsed={() => setSuggestedSubject('')}
          />
        </main>
        
        <Footer onOpenModal={setActiveModal} />
        
        {renderModalContent()}
      </div>
    </AppContext.Provider>
  );
}


// --- LAYOUT COMPONENTS ---

const Header: React.FC<{ onThemeToggle: () => void; onLangChange: (lang: string) => void; onOpenModal: (modal: string) => void; }> = ({ onThemeToggle, onLangChange, onOpenModal }) => {
    const { theme, t } = useAppContext();
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const langDropdownRef = useRef<HTMLDivElement>(null);

    const HeaderButton: React.FC<{ modal: string; titleKey: string; children: React.ReactNode }> = ({ modal, titleKey, children }) => (
        <button onClick={() => onOpenModal(modal)} title={t(titleKey)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            {children}
        </button>
    );

    const handleLangChange = (newLang: string) => {
        onLangChange(newLang);
        setIsLangDropdownOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
                setIsLangDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[color:var(--panel-light)]/80 dark:bg-[color:var(--panel-dark)]/80 backdrop-blur-lg border-b border-[color:var(--border-light)] dark:border-[color:var(--border-dark)]">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] dark:from-[var(--accent)] dark:to-[var(--secondary)]">{t('deweyBrain')}</span>
                    <div className="flex items-center space-x-1 text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">
                       <HeaderButton modal="quiz" titleKey="quizTitle"><QuizIcon /></HeaderButton>
                       <HeaderButton modal="practice" titleKey="practiceTitle"><PracticeIcon /></HeaderButton>
                       <HeaderButton modal="reference" titleKey="ddcReferenceTitle"><ReferenceIcon /></HeaderButton>
                       <HeaderButton modal="help" titleKey="helpTitle"><HelpIcon /></HeaderButton>
                       
                       <div className="relative" ref={langDropdownRef}>
                           <button onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)} title={t('selectLanguageTitle')} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                               <LanguageIcon />
                           </button>
                           <div className={`language-dropdown absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-[color:var(--panel-light)] dark:bg-[color:var(--panel-dark)] ring-1 ring-black/5 dark:ring-white/10 focus:outline-none ${isLangDropdownOpen ? '' : 'hidden'}`}>
                               <div className="py-1">
                                   <a href="#" onClick={() => handleLangChange('en')} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">🇬🇧 English</a>
                                   <a href="#" onClick={() => handleLangChange('ur')} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">🇵🇰 Urdu</a>
                                   <a href="#" onClick={() => handleLangChange('ar')} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">🇸🇦 Arabic</a>
                                   <a href="#" onClick={() => handleLangChange('fr')} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">🇫🇷 French</a>
                                   <a href="#" onClick={() => handleLangChange('es')} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">🇪🇸 Spanish</a>
                                   <a href="#" onClick={() => handleLangChange('zh')} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">🇨🇳 Chinese</a>
                               </div>
                           </div>
                       </div>
                       
                       <button onClick={onThemeToggle} title={t('toggleThemeTitle')} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                         {theme === 'light' ? <SunIcon /> : <MoonIcon />}
                       </button>
                    </div>
                </div>
            </nav>
        </header>
    );
};

const Footer: React.FC<{ onOpenModal: (modal: string) => void }> = ({ onOpenModal }) => {
    const { t } = useAppContext();
    
    const FooterButton: React.FC<{ icon: React.ReactNode; labelKey: string; modal: string }> = ({ icon, labelKey, modal }) => (
        <button onClick={() => onOpenModal(modal)} title={t(labelKey)} className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-20 text-center hover:bg-black/5 dark:hover:bg-white/10 text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)] hover:text-[color:var(--primary)] dark:hover:text-[color:var(--accent)]">
            {icon}
            <span className="text-xs mt-1">{t(labelKey)}</span>
        </button>
    );

    return (
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[color:var(--footer-bg-light)] dark:bg-[color:var(--footer-bg-dark)] border-t border-[color:var(--border-light)] dark:border-[color:var(--border-dark)]">
            <div className="max-w-3xl mx-auto py-1 px-2 flex justify-around items-center">
                <FooterButton icon={<ChatIcon />} labelKey="aiChatTitle" modal="chat" />
                <FooterButton icon={<HistoryIcon />} labelKey="historyTitle" modal="history" />
                <FooterButton icon={<ConstructorIcon />} labelKey="constructorTitle" modal="constructor" />
                <FooterButton icon={<SuggestIcon />} labelKey="suggestTitle" modal="suggest" />
                <FooterButton icon={<InsightsIcon />} labelKey="insightsTitle" modal="insights" />
                <FooterButton icon={<ContactIcon />} labelKey="contactTitle" modal="contact" />
                <FooterButton icon={<FeedbackIcon />} labelKey="feedbackTitle" modal="feedback" />
            </div>
        </footer>
    );
};


// --- MAIN PANEL COMPONENT ---

interface MainPanelProps {
  addToHistory: (item: Omit<HistoryItem, 'timestamp'>) => void;
  onOpenModal: (modal: string) => void;
  suggestedSubject: string;
  onSuggestionUsed: () => void;
}

const MainPanel: React.FC<MainPanelProps> = ({ addToHistory, suggestedSubject, onSuggestionUsed }) => {
    const { t, lang } = useAppContext();
    const [mode, setMode] = useState<'generate' | 'verify'>('generate');
    const [edition, setEdition] = useState('23rd');
    const [title, setTitle] = useState('');
    const [ddc, setDdc] = useState('');
    const [hint, setHint] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<DebateResult | VerificationResult | null>(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const imageInputRef = React.useRef<HTMLInputElement>(null);
    // Fix: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
    const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (suggestedSubject) {
            setTitle(suggestedSubject);
            onSuggestionUsed();
        }
    }, [suggestedSubject, onSuggestionUsed]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        
        const langMap: { [key: string]: string } = {
            en: 'en-US', ur: 'ur-PK', ar: 'ar-SA', fr: 'fr-FR', es: 'es-ES', zh: 'zh-CN',
        };

        recognition.lang = langMap[lang] || 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            setTitle(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech Recognition Error", event.error);
            setIsListening(false);
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        
        return () => {
            recognitionRef.current?.stop();
        };
    }, [lang]);
    
    useEffect(() => {
      // Cleanup interval on component unmount
      return () => {
        if (loadingIntervalRef.current) {
          clearInterval(loadingIntervalRef.current);
        }
      };
    }, []);

    const handleToggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const handleImageUpload = async (file: File | null) => {
        if (!file) return;
        setIsLoading(true);
        setLoadingText("Analyzing image...");
        setError(null);
        setResult(null);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Image = (reader.result as string).split(',')[1];
            const textResult = await geminiService.extractTextFromImage(base64Image, file.type);
            if (textResult) {
                const fullText = `${textResult.title} ${textResult.subtitle}`.trim();
                setTitle(fullText);
            } else {
                setError("Could not extract text from image.");
            }
            setIsLoading(false);
        };
    };

    const handleSubmit = async () => {
        if (!title) {
            setError('Please enter a Title or Subject.');
            return;
        }
        if (mode === 'verify' && !ddc) {
            setError('Please enter a DDC number to verify.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);
        
        const loadingMessages = [t('analyzing'), t('fetchingLOD'), t('debating')];
        let messageIndex = 0;
        setLoadingText(loadingMessages[0]);

        if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
        
        loadingIntervalRef.current = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingText(loadingMessages[messageIndex]);
        }, 2000);

        try {
            if (mode === 'generate') {
                const res = await geminiService.getDebateClassification(title, hint, edition, 'en');
                if (res) {
                    setResult(res);
                    addToHistory({ title, hint, mode: 'debate', resultData: res, edition });
                } else {
                    setError('Failed to get a response from the AI.');
                }
            } else {
                const res = await geminiService.verifyDDCClassification(title, hint, ddc, edition, 'en');
                if (res) {
                    setResult(res);
                    addToHistory({ title, hint, mode, resultData: res, edition, ddcNumberToVerify: ddc });
                } else {
                    setError('Failed to get a response from the AI.');
                }
            }
        } catch (e) {
            console.error(e);
            setError('An unexpected error occurred during the API call.');
        } finally {
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
            }
            setIsLoading(false);
        }
    };

    const clearForm = () => {
        setTitle('');
        setDdc('');
        setHint('');
        setError(null);
        setResult(null);
    };


    const TabButton = ({ currentMode, targetMode, label }: { currentMode: string, targetMode: string, label: string }) => (
        <button onClick={() => setMode(targetMode as 'generate' | 'verify')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors duration-300 ${currentMode === targetMode ? 'bg-[color:var(--primary)] text-white' : 'text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]'}`}>
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold text-center">{t('appTitle')}</h1>
            <div className="flex justify-center bg-black/5 dark:bg-white/5 rounded-lg p-1">
                <TabButton currentMode={mode} targetMode="generate" label={t('tabGenerate')} />
                <TabButton currentMode={mode} targetMode="verify" label={t('tabVerify')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Panel */}
                <div className="space-y-4">
                    <button onClick={() => imageInputRef.current?.click()} className="w-full flex items-center justify-center p-4 rounded-lg text-center cursor-pointer bg-black/5 dark:bg-white/5 border-2 border-dashed border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] hover:border-[color:var(--accent)]">
                        <ImageUploadIcon />
                        <div className="ml-4 text-left">
                            <p className="font-semibold">{t('analyzeBookCover')}</p>
                            <p className="text-xs text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">{t('analyzeBookCoverDesc')}</p>
                        </div>
                    </button>
                    <input type="file" ref={imageInputRef} onChange={(e) => handleImageUpload(e.target.files ? e.target.files[0] : null)} className="hidden" accept="image/png, image/jpeg" />

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('ddcEdition')}</label>
                        <select value={edition} onChange={(e) => setEdition(e.target.value)} className="block w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)]">
                            <option value="23rd">23rd Edition (Latest)</option>
                            <option value="22nd">22nd Edition</option>
                            <option value="21st">21st Edition</option>
                            <option value="20th">20th Edition</option>
                            <option value="19th">19th Edition</option>
                            <option value="auto">{t('autoDetect')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('titleSubject')}</label>
                        <div className="relative">
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="block w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] pr-12" placeholder={t('titlePlaceholder')} />
                             <button 
                                type="button" 
                                onClick={handleToggleListening} 
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)] hover:text-[color:var(--primary)] dark:hover:text-[color:var(--accent)] transition-colors disabled:opacity-50"
                                title="Start voice input"
                                disabled={!recognitionRef.current}
                            >
                                <MicrophoneIcon className={isListening ? 'text-[color:var(--error)] animate-pulse' : ''} />
                            </button>
                        </div>
                    </div>
                    
                    {mode === 'verify' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('ddcNumberToVerify')}</label>
                            <input type="text" value={ddc} onChange={(e) => setDdc(e.target.value)} className="block w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)]" placeholder={t('ddcPlaceholder')} />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('instructionHint')}</label>
                        <input type="text" value={hint} onChange={(e) => setHint(e.target.value)} className="block w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)]" placeholder={t('hintPlaceholder')} />
                    </div>

                    <div className="flex space-x-3 pt-2">
                        <button onClick={handleSubmit} disabled={isLoading} className="w-full text-white font-semibold py-3 px-4 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] dark:from-[var(--secondary)] dark:to-[var(--accent)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {mode === 'generate' ? t('generateDDCNumber') : t('verifyDDCNumber')}
                        </button>
                        <button onClick={clearForm} className="w-1/3 font-semibold py-3 px-4 rounded-lg border-2 border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] hover:border-[color:var(--secondary)] dark:hover:border-[color:var(--accent)] transition">
                            {t('clear')}
                        </button>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="bg-black/5 dark:bg-white/5 p-6 rounded-lg border border-[color:var(--border-light)] dark:border-[color:var(--border-dark)] min-h-[300px] flex flex-col justify-center">
                    {isLoading && (
                        <div className="text-center">
                            <div className="loader mx-auto"></div>
                            <p className="mt-4 text-[color:var(--text-light-muted)] dark:text-[color:var(--text-dark-muted)]">{loadingText}</p>
                        </div>
                    )}
                    {!isLoading && error && (
                        <p className="text-center text-[color:var(--error)] font-medium">{error}</p>
                    )}
                    {!isLoading && !error && !result && (
                        <div className="text-center text-gray-400 dark:text-gray-500">
                            <PlaceholderIcon />
                            <p>{t('resultsAppearHere')}</p>
                        </div>
                    )}
                    {!isLoading && !error && result && (
                        <ResultsDisplay result={result} />
                    )}
                </div>
            </div>
        </div>
    );
};