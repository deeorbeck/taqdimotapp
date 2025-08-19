import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { ChevronsRight, FileText, User, Search, Plus, ArrowLeft, RefreshCw, Moon, Sun, X, CheckCircle, Edit2, ChevronDown, Loader, UploadCloud, File as FileIcon, Trash2, Download, Share2, XCircle, Copy } from 'lucide-react';

// --- API Configuration ---
const API_BASE_URL = 'https://api.tm.ismailov.uz';

const enhancedFetch = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'ngrok-skip-browser-warning': 'true', 
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.detail || `Server xatosi: ${response.status}`);
            } catch (e) {
                console.error("Serverdan kutilmagan javob:", errorText);
                throw new Error(`Serverdan kutilmagan javob keldi (status: ${response.status})`);
            }
        }
        const text = await response.text();
        return text ? JSON.parse(text) : {};

    } catch (error) {
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            console.error('Network request failed. This might be a CORS issue or the server is down.', error);
            throw new Error('Serverga ulanib bo\'lmadi. Internet aloqasini yoki server holatini tekshiring.');
        }
        throw error;
    }
};

const api = {
    login: async (code) => {
        return enhancedFetch(`${API_BASE_URL}/login/${code}`);
    },
    getMe: async (token) => {
        return enhancedFetch(`${API_BASE_URL}/get-me?token=${token}`);
    },
    updateName: async (token, new_full_name) => {
        return enhancedFetch(`${API_BASE_URL}/update-name`, {
            method: 'POST',
            body: JSON.stringify({ token, new_full_name }),
        });
    },
    createPaymentLink: async (token, amount, paysystem) => {
        return enhancedFetch(`${API_BASE_URL}/create_payment_link`, {
            method: 'POST',
            body: JSON.stringify({ token, amount, paysystem }),
        });
    },
    checkPaymentStatus: async (payment_id, token) => {
        return enhancedFetch(`${API_BASE_URL}/check_payment_status/${payment_id}?token=${token}`);
    },
    uploadSource: async (file, onProgress) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('file', file);

            xhr.open('POST', `${API_BASE_URL}/upload_source`, true);
            xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                     try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        reject(new Error(errorResponse.detail || 'Could not upload file'));
                    } catch (e) {
                        reject(new Error('Could not upload file'));
                    }
                }
            };
            
            xhr.onerror = () => reject(new Error('Network error during upload'));

            xhr.send(formData);
        });
    },
    generateContent: async (data) => {
        return enhancedFetch(`${API_BASE_URL}/generate_content`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    regenerateSlideContent: async (data) => {
        return enhancedFetch(`${API_BASE_URL}/regenerate_slide_content`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    createFile: async (data) => {
        return enhancedFetch(`${API_BASE_URL}/create_file`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    getFileStatus: async (taskId) => {
        return enhancedFetch(`${API_BASE_URL}/file_status/${taskId}`);
    },
    getImageUrl: async (topic) => {
        return enhancedFetch(`${API_BASE_URL}/get_image_url?topic=${topic}`);
    },
    uploadImage: async (file) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('file', file);
            xhr.open('POST', `${API_BASE_URL}/upload_image`, true);
            xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error('Rasm yuklashda xatolik'));
                }
            };
            xhr.onerror = () => reject(new Error('Tarmoq xatoligi'));
            xhr.send(formData);
        });
    }
};
// --- End API Configuration ---


// --- Notification Context ---
const NotificationContext = createContext(null);
export const useNotification = () => useContext(NotificationContext);

// --- Auth Context ---
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const logout = () => {
        console.log("[LOG: Auth] Tizimdan chiqilmoqda...");
        setUser(null);
        setToken(null);
        setIsLoggedIn(false);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userAvatar');
    };
    
    const refreshUser = async () => {
        const savedToken = localStorage.getItem('authToken');
        if (savedToken) {
            try {
                console.log("[LOG: Auth] Foydalanuvchi ma'lumotlari yangilanmoqda...");
                const userData = await api.getMe(savedToken);
                setUser(userData);
                console.log("[LOG: Auth] Foydalanuvchi ma'lumotlari muvaffaqiyatli yangilandi.");
            } catch (error) {
                 console.error("Foydalanuvchi ma'lumotlarini yangilashda xatolik:", error);
                 logout();
            }
        }
    };

    useEffect(() => {
        const checkToken = async () => {
            console.log("[LOG: Auth] Token tekshirilmoqda...");
            const savedToken = localStorage.getItem('authToken');
            if (savedToken) {
                console.log("[LOG: Auth] Saqlangan token topildi.");
                try {
                    const userData = await api.getMe(savedToken);
                    setUser(userData);
                    setToken(savedToken);
                    setIsLoggedIn(true);
                    console.log("[LOG: Auth] Token yaroqli. Foydalanuvchi tizimga kiritildi:", userData);
                } catch (error) {
                    console.error("[LOG: Auth] Token yaroqsiz, tizimdan chiqarilmoqda.", error);
                    logout();
                }
            } else {
                console.log("[LOG: Auth] Saqlangan token topilmadi.");
            }
            setIsLoading(false);
        };
        checkToken();
    }, []);

    const login = async (code) => {
        console.log(`[LOG: Auth] Tizimga kirishga urinish. Kod: ${code}`);
        const userData = await api.login(code);
        setUser(userData);
        setToken(userData.token);
        setIsLoggedIn(true);
        localStorage.setItem('authToken', userData.token);
        console.log("[LOG: Auth] Muvaffaqiyatli tizimga kirildi:", userData);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, token, isLoggedIn, login, logout, isLoading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
// --- End Auth Context ---


// Ma'lumotlar manbalari
const templateData = {
  'Popular': ['slice', 'circuit', 'droplet', 'littlechild', 'abstract', 'paperplane', 'facet', 'wood', 'lon', 'aesthetic'],
  'Classic': ['dim', 'medison', 'berlin', 'savon', 'ugolki', 'medic', 'damask', 'emblema', 'nature', 'vid'],
  'Education': ['dark', 'pentogram', 'blueprint', 'analyze', 'ribbon', 'pencils', 'green', 'reflection', 'digital', 'cosmic'],
  'Modern': ['dividend', 'pretty', 'sitdolor', 'kids', 'stairs', 'white', 'shell', 'digitalocean', 'book', 'draw']
};
const BASE_TEMPLATE_URL = '/images/templates/';

// Ranglar palitrasi
const colors = {
  light: { bg: '#F8F9FA', card: 'rgba(255, 255, 255, 0.7)', text: '#1A202C', accent: '#4361EE', subtle: '#E9ECEF' },
  dark: { bg: '#0D1B2A', card: 'rgba(27, 38, 59, 0.6)', text: '#F0F4F8', accent: '#3B82F6', subtle: 'rgba(255, 255, 255, 0.1)' }
};

const FullScreenLoader = ({ theme }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{backgroundColor: theme.bg}}>
        <Loader className="animate-spin" size={48} style={{color: theme.accent}}/>
    </div>
);


// Asosiy ilova komponenti
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

function MainApp() {
  const { isLoggedIn, logout, isLoading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeScreen, setActiveScreen] = useState('hujjatlarim');
  const [presentationSettings, setPresentationSettings] = useState(null);
  const [generationTask, setGenerationTask] = useState(null);
  const [allDocs, setAllDocs] = useState(() => {
    try {
        const savedDocs = localStorage.getItem('userDocuments');
        return savedDocs ? JSON.parse(savedDocs) : [];
    } catch (error) {
        console.error("localStorage'dan hujjatlarni o'qishda xatolik:", error);
        return [];
    }
  });
  const [notification, setNotification] = useState({ message: '', type: '', key: 0 });

  const theme = isDarkMode ? colors.dark : colors.light;

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
  }, [isDarkMode, theme.bg]);
  
  useEffect(() => {
    try {
        localStorage.setItem('userDocuments', JSON.stringify(allDocs));
    } catch (error) {
        console.error("localStorage'ga hujjatlarni saqlashda xatolik:", error);
    }
  }, [allDocs]);

  useEffect(() => {
    if (isLoggedIn && (activeScreen === 'muharrir' || activeScreen === 'status') && !presentationSettings && !generationTask) {
        console.warn("[LOG: MainApp] Muharrir/Status sahifasiga to'g'ridan-to'g'ri kirishga urinish. Hujjatlarim sahifasiga yo'naltirilmoqda.");
        setActiveScreen('hujjatlarim');
    }
  }, [activeScreen, presentationSettings, generationTask, isLoggedIn]);
  
  useEffect(() => {
    if (notification.message) {
        const timer = setTimeout(() => {
            setNotification({ message: '', type: '', key: 0 });
        }, 3000); // 3 soniyadan keyin yo'qoladi
        return () => clearTimeout(timer);
    }
  }, [notification.key]);

  const showNotification = (message, type = 'info') => {
      setNotification({ message, type, key: new Date().getTime() });
  };

  const handleGenerationSuccess = (newDoc) => {
      console.log("[LOG: MainApp] Generatsiya muvaffaqiyatli yakunlandi. Hujjatlar ro'yxati yangilanmoqda va sahifa o'zgartirilmoqda:", newDoc);
      setAllDocs(prevDocs => [newDoc, ...prevDocs]);
      setActiveScreen('hujjatlarim');
  };
  
  const handleDeleteDocument = (docIndexToDelete) => {
    console.log(`[LOG: MainApp] ${docIndexToDelete}-indeksdagi hujjat o'chirilmoqda.`);
    setAllDocs(prevDocs => prevDocs.filter((_, index) => index !== docIndexToDelete));
    showNotification("Hujjat muvaffaqiyatli o'chirildi", 'info');
  };

  const navigateTo = (screen, settings = null) => {
    console.log(`[LOG: MainApp] Sahifaga o'tilmoqda: ${screen}`, settings || '');
    if (screen === 'muharrir') {
      setPresentationSettings(settings);
    }
    if (screen === 'status') {
      setGenerationTask(settings);
    }
    setActiveScreen(screen);
  };
  
  const renderScreen = () => {
    console.log(`[LOG: MainApp] Sahifa chizilmoqda: ${activeScreen}, Tizimga kirganmi: ${isLoggedIn}`);
    switch (activeScreen) {
      case 'hujjatlarim':
        return <HujjatlarimScreen navigateTo={navigateTo} theme={theme} allDocs={allDocs} onDelete={handleDeleteDocument} />;
      case 'yaratish':
        return <YaratishScreen navigateTo={navigateTo} theme={theme} />;
      case 'muharrir':
        if (!presentationSettings) return null;
        return <TaqdimotMuharririScreen navigateTo={navigateTo} theme={theme} settings={presentationSettings} />;
      case 'status':
        if (!generationTask) return null;
        return <GenerationStatusScreen onGenerationSuccess={handleGenerationSuccess} theme={theme} taskInfo={generationTask} navigateTo={navigateTo} />;
      case 'profil':
        return <ProfilScreen navigateTo={navigateTo} theme={theme} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} handleLogout={logout} />;
      case 'support':
        return <SupportScreen navigateTo={navigateTo} theme={theme} />;
      case 'faq':
        return <FaqScreen navigateTo={navigateTo} theme={theme} />;
      default:
        setActiveScreen('hujjatlarim');
        return null;
    }
  };
  
  if (isLoading) {
      return <FullScreenLoader theme={theme} />;
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
        <div className={`min-h-screen font-sans transition-colors duration-500 ${isDarkMode ? 'dark' : ''}`} style={{ color: theme.text }}>
            <AuroraBackground />
            {notification.message && (
                <div 
                    key={notification.key}
                    className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-lg shadow-lg text-white animate-fade-in`}
                    style={{ 
                        backgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    {notification.message}
                </div>
            )}
            <div className="relative z-10 h-full flex flex-col">
                {!isLoggedIn ? (
                <LoginScreen theme={theme} />
                ) : (
                <>
                    <main className="flex-grow p-4 pb-24">
                    {renderScreen()}
                    </main>
                    {activeScreen !== 'support' && activeScreen !== 'faq' && activeScreen !== 'status' && <BottomNav activeScreen={activeScreen} navigateTo={navigateTo} theme={theme} />}
                </>
                )}
            </div>
        </div>
    </NotificationContext.Provider>
  );
}

// Login ekrani
const LoginScreen = ({ theme }) => {
    const { login } = useAuth();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (code.length !== 6) {
            setError('Kod 6 xonali bo\'lishi kerak.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await login(code);
        } catch (err) {
            setError(err.message || 'Kod xato yoki foydalanuvchi topilmadi.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center p-4 animate-fade-in">
            <GlassCard theme={theme} className="w-full max-w-sm text-center">
                <img src="/images/avatar.jpg" alt="App Logo" className="w-24 h-24 rounded-full mx-auto mb-4 border-4" style={{borderColor: theme.accent}}/>
                <h1 className="text-2xl font-bold mb-2" style={{color: theme.accent}}>Taqdimot App</h1>
                <p className="mb-6 opacity-80">Maxsus kod olib ilovaga kirishingiz mumkin.</p>
                <a href="https://t.me/taqdimot_robot?start=code" target="_blank" rel="noopener noreferrer" className="text-lg font-semibold" style={{color: theme.accent}}>Kodni olish</a>
                <input type="text" placeholder="Maxsus kodni kiriting" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} className="w-full p-3 mt-6 rounded-lg border bg-transparent text-center" style={{borderColor: error ? '#EF4444' : theme.subtle}}/>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <button onClick={handleLogin} disabled={isLoading} className="w-full mt-4 py-3 rounded-xl text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-98 disabled:opacity-50" style={{backgroundColor: theme.accent}}>
                    {isLoading ? <Loader className="animate-spin mx-auto"/> : 'Kirish'}
                </button>
            </GlassCard>
        </div>
    );
};

const AuroraBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden">
    <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-purple-600/30 rounded-full filter blur-3xl animate-blob"></div>
    <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/30 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
    <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-cyan-400/30 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
    <div className="absolute bottom-[-10%] right-[-20%] w-[60vw] h-[60vw] bg-pink-500/30 rounded-full filter blur-3xl animate-blob animation-delay-6000"></div>
  </div>
);

// Pastki navigatsiya paneli
const BottomNav = ({ activeScreen, navigateTo, theme }) => {
  const navItems = [{ id: 'hujjatlarim', icon: FileText, label: 'Hujjatlarim' },{ id: 'yaratish', icon: Plus, label: 'Yaratish' },{ id: 'profil', icon: User, label: 'Profil' },];
  return (<nav className="fixed bottom-0 left-0 right-0 h-20 backdrop-blur-xl border-t" style={{ backgroundColor: theme.card, borderColor: theme.subtle }}><div className="flex justify-around items-center h-full max-w-md mx-auto">{navItems.map((item) => { const isActive = activeScreen === item.id; if (item.id === 'yaratish') { return (<button key={item.id} onClick={() => navigateTo(item.id)} className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transform transition-transform hover:scale-105 active:scale-95" style={{ backgroundColor: theme.accent, color: 'white' }}><item.icon size={28} /></button>); } return (<button key={item.id} onClick={() => navigateTo(item.id)} className={`flex flex-col items-center justify-center transition-all duration-300 transform w-20 ${isActive ? 'scale-110' : 'opacity-60'}`} style={{ color: isActive ? theme.accent : theme.text }}><item.icon size={24} /><span className="text-xs mt-1">{item.label}</span></button>); })}</div></nav>);
};

// "Hujjatlarim" ekrani
const HujjatlarimScreen = ({ navigateTo, theme, allDocs, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [shareModalData, setShareModalData] = useState(null);
  
  const filteredDocs = allDocs.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-center mb-6 h-10">{!isSearching ? (<h1 className="text-3xl font-bold animate-fade-in-fast">Hujjatlarim</h1>) : (<input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Qidirish..." className="w-full bg-transparent border-b-2 p-1 focus:outline-none animate-fade-in-fast" style={{borderColor: theme.accent}} autoFocus/>)}
        <button onClick={() => setIsSearching(!isSearching)} className="p-2 rounded-full" style={{backgroundColor: theme.subtle}}>{isSearching ? <X size={20} /> : <Search size={20} />}</button>
      </header>
      <div className="space-y-4">
        {allDocs.length > 0 ? allDocs.map((doc, index) => (
            <GlassCard key={index} theme={theme}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-lg">{doc.title}</h3>
                        <p className="text-sm opacity-70">{doc.date}</p>
                    </div>
                    {doc.downloadUrl && (
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            <a href={doc.downloadUrl} download target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-white/20" style={{backgroundColor: theme.subtle}}>
                                <Download size={18} />
                            </a>
                            <button onClick={() => setShareModalData({ url: doc.downloadUrl, title: doc.title })} className="p-2 rounded-full hover:bg-white/20" style={{backgroundColor: theme.subtle}}>
                                <Share2 size={18} />
                            </button>
                            <button onClick={() => onDelete(index)} className="p-2 rounded-full hover:bg-red-500/20" style={{backgroundColor: theme.subtle}}>
                                <Trash2 size={18} className="text-red-500" />
                            </button>
                        </div>
                    )}
                </div>
            </GlassCard>
        )) : (<div className="text-center opacity-60 mt-20">
                <FileText size={48} className="mx-auto mb-4" />
                <p>Hali hech qanday hujjat yaratmadingiz.</p>
                <button onClick={() => navigateTo('yaratish')} className="mt-4 px-4 py-2 rounded-lg text-white" style={{backgroundColor: theme.accent}}>
                    Birinchisini yaratish
                </button>
            </div>)}
      </div>
      {shareModalData && <ShareModal theme={theme} data={shareModalData} onClose={() => setShareModalData(null)} />}
    </div>
  );
};

// "Yangi Hujjat Yaratish" ekrani
const YaratishScreen = ({ navigateTo, theme }) => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [docType, setDocType] = useState('Taqdimot');
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [topic, setTopic] = useState('');
    const [lang, setLang] = useState('uz');
    const [university, setUniversity] = useState('');
    const [faculty, setFaculty] = useState('');
    const [direction, setDirection] = useState('');
    const [group, setGroup] = useState('');
    const [withImages, setWithImages] = useState(true);
    const [slideCount, setSlideCount] = useState(8);
    const [templateCategory, setTemplateCategory] = useState('Popular');
    const [selectedTemplate, setSelectedTemplate] = useState('slice');
    const [errors, setErrors] = useState({});
    const [sourceFile, setSourceFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [sourceFilePath, setSourceFilePath] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const fullNameRef = useRef(null);
    const topicRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => { setSelectedTemplate(templateData[templateCategory][0]); }, [templateCategory]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            showNotification("Xatolik: Faqat PDF (.pdf) formatidagi fayllarni yuklash mumkin.", 'error');
            fileInputRef.current.value = "";
            return;
        }

        const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSizeInBytes) {
            showNotification(`Xatolik: Fayl hajmi 10MB dan katta bo'lmasligi kerak.`, 'error');
            fileInputRef.current.value = "";
            return;
        }

        setSourceFile(file);
        setIsUploading(true);
        try {
            const response = await api.uploadSource(file, (progress) => {
                setUploadProgress(progress);
            });
            setSourceFilePath(response.file_path);
        } catch (error) {
            console.error("File upload failed:", error);
            showNotification("Fayl yuklashda xatolik yuz berdi.", 'error');
            setSourceFile(null);
        } finally {
            setIsUploading(false);
        }
    };

    const validateAndSetErrors = () => {
        const newErrors = {};
        if (!fullName.trim()) newErrors.fullName = true;
        if (!topic.trim()) newErrors.topic = true;
        
        if (docType === 'Taqdimot' && (!slideCount || slideCount < 6 || slideCount > 20)) {
            newErrors.slideCount = "Slaydlar soni 6 va 20 orasida bo'lishi kerak.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreate = () => {
        if (!validateAndSetErrors()) {
            showNotification("Iltimos, barcha xatoliklarni to'g'rilang.", 'error');
            return;
        }

        let finalWithImages = withImages;
        let finalSlideCount = slideCount;
        let requiredBalance;

        if (docType === 'Referat') {
            finalWithImages = false;
            finalSlideCount = 20; // Yangi hujjatga ko'ra 20
            requiredBalance = user.price_abstract;
        } else {
            requiredBalance = withImages ? user.price_presentation_with_images : user.price_presentation;
        }
        
        if (user.balance < requiredBalance) {
            showNotification(`Balans yetarli emas! Kerakli summa: ${requiredBalance} so'm.`, 'error');
            setIsPaymentModalOpen(true);
            return;
        }

        navigateTo('muharrir', { fullName, topic, docType, lang, withImages: finalWithImages, slideCount: finalSlideCount, selectedTemplate, templateCategory, university, faculty, direction, group, sourceFilePath });
    };
    
    const handleSlideCountChange = (e) => {
        const value = e.target.value;
        setSlideCount(value ? parseInt(value) : '');
        
        if (value && (parseInt(value) < 6 || parseInt(value) > 20)) {
            setErrors(prev => ({...prev, slideCount: "Slaydlar soni 6 va 20 orasida bo'lishi kerak."}));
        } else {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.slideCount;
                return newErrors;
            });
        }
    };

    return (
        <>
        <div className="animate-slide-in-right max-w-2xl mx-auto">
            <header className="flex items-center mb-6"><button onClick={() => navigateTo('hujjatlarim')} className="p-2 mr-4 rounded-full" style={{backgroundColor: theme.subtle}}><ArrowLeft size={20} /></button><h1 className="text-2xl font-bold">Yangi Hujjat Yaratish</h1></header>
            <div className="space-y-6 pb-8">
                <GlassCard theme={theme}><label className="font-semibold mb-3 block">Hujjat Turi</label><div className="flex rounded-lg p-1" style={{backgroundColor: theme.subtle}}>{['Taqdimot', 'Referat'].map(type => (<button key={type} onClick={() => setDocType(type)} className={`w-1/2 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${docType === type ? 'text-white shadow-md' : 'opacity-70'}`} style={{backgroundColor: docType === type ? theme.accent : 'transparent'}}>{type}</button>))}</div></GlassCard>
                <GlassCard theme={theme}>
                    <label className="font-semibold mb-2 block">Asosiy Ma'lumotlar</label>
                    <input ref={fullNameRef} type="text" placeholder="To'liq ism-familiya" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-3 rounded-lg border bg-transparent mb-3 transition-colors" style={{borderColor: errors.fullName ? '#EF4444' : theme.subtle}}/>
                    <input ref={topicRef} type="text" placeholder="Mavzu" value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-3 rounded-lg border bg-transparent transition-colors" style={{borderColor: errors.topic ? '#EF4444' : theme.subtle}}/>
                </GlassCard>
                <GlassCard theme={theme}>
                    <label className="font-semibold mb-3 block">Hujjat Tili</label>
                    <select value={lang} onChange={e => setLang(e.target.value)} className="w-full p-3 rounded-lg border bg-transparent" style={{borderColor: theme.subtle, color: theme.text, backgroundColor: theme.bg}}>
                        <option value="uz">🇺🇿 O'zbekcha</option>
                        <option value="kq">🇺🇿 Qoraqalpoqcha</option>
                        <option value="ru">🇷🇺 Русский</option>
                        <option value="en">🇬🇧 English</option>
                        <option value="de">🇩🇪 Deutsch (German)</option>
                        <option value="fr">🇫🇷 Français (French)</option>
                        <option value="tr">🇹🇷 Türkçe (Turkish)</option>
                    </select>
                </GlassCard>
                <GlassCard theme={theme}>
                    <label className="font-semibold mb-2 block">Manba Fayl (Ixtiyoriy)</label>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden"/>
                    {!sourceFile ? (
                        <button onClick={() => fileInputRef.current.click()} className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg" style={{borderColor: theme.subtle}}>
                            <UploadCloud size={32} className="mb-2 opacity-60" />
                            <span className="opacity-80">PDF fayl yuklash</span>
                            <span className="text-xs opacity-50 mt-1">Fayl hajmi 10MB gacha</span>
                        </button>
                    ) : (
                        <div className="w-full">
                            <div className="flex items-center justify-between p-3 rounded-lg" style={{backgroundColor: theme.subtle}}>
                                <div className="flex items-center overflow-hidden">
                                    <FileIcon size={24} className="mr-3 flex-shrink-0" style={{color: theme.accent}}/>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-medium truncate">{sourceFile.name}</span>
                                        <span className="text-xs opacity-70">{(sourceFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                </div>
                                <button onClick={() => {setSourceFile(null); setSourceFilePath(null);}} className="p-2 rounded-full hover:bg-red-500/20"><Trash2 size={18} className="text-red-500"/></button>
                            </div>
                            {isUploading && (
                                <div className="w-full h-2 rounded-full mt-2" style={{backgroundColor: theme.subtle}}>
                                    <div className="h-2 rounded-full transition-all duration-300" style={{width: `${uploadProgress}%`, backgroundColor: theme.accent}}></div>
                                </div>
                            )}
                        </div>
                    )}
                </GlassCard>
                {docType === 'Taqdimot' &&
                <GlassCard theme={theme}>
                    <label className="font-semibold mb-2 block">Ta'lim muassasasi (Ixtiyoriy)</label>
                    <input type="text" placeholder="Universitet nomi" value={university} onChange={e => setUniversity(e.target.value)} className="w-full p-3 rounded-lg border bg-transparent mb-3" style={{borderColor: theme.subtle}}/>
                    <input type="text" placeholder="Fakulteti" value={faculty} onChange={e => setFaculty(e.target.value)} className="w-full p-3 rounded-lg border bg-transparent mb-3" style={{borderColor: theme.subtle}}/>
                    <input type="text" placeholder="Yo'nalishi" value={direction} onChange={e => setDirection(e.target.value)} className="w-full p-3 rounded-lg border bg-transparent mb-3" style={{borderColor: theme.subtle}}/>
                    <input type="text" placeholder="Guruhi" value={group} onChange={e => setGroup(e.target.value)} className="w-full p-3 rounded-lg border bg-transparent" style={{borderColor: theme.subtle}}/>
                </GlassCard>
                }
                {docType === 'Taqdimot' && (<div className="space-y-6">
                    <GlassCard theme={theme}>
                        <div className="flex justify-between items-center"><label className="font-semibold">Rasmli / Rasmsiz</label><div onClick={() => setWithImages(!withImages)} className={`w-14 h-8 rounded-full p-1 flex items-center cursor-pointer transition-colors duration-300 ${withImages ? '' : 'bg-gray-500'}`} style={{backgroundColor: withImages ? theme.accent : theme.subtle}}><div className={`w-6 h-6 bg-white rounded-full transform transition-transform duration-300 ${withImages ? 'translate-x-6' : ''}`}></div></div></div>
                    </GlassCard>
                    <GlassCard theme={theme}>
                        <label className="font-semibold mb-2 block">Slaydlar Soni (6-20)</label>
                        <input 
                            type="number" 
                            value={slideCount} 
                            onChange={handleSlideCountChange}
                            className="w-full p-3 rounded-lg border bg-transparent transition-colors"
                            style={{borderColor: errors.slideCount ? '#EF4444' : theme.subtle}}
                        />
                        {errors.slideCount && <p className="text-red-500 text-sm mt-2">{errors.slideCount}</p>}
                    </GlassCard>
                    <GlassCard theme={theme}>
                        <label className="font-semibold mb-3 block">Shablon Kategoriyasi</label>
                        <select value={templateCategory} onChange={e => setTemplateCategory(e.target.value)} className="w-full p-3 rounded-lg border bg-transparent" style={{borderColor: theme.subtle, color: theme.text, backgroundColor: theme.bg}}>
                            {Object.keys(templateData).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </GlassCard>
                    <GlassCard theme={theme}>
                        <label className="font-semibold mb-3 block">Shablon Prevyusi</label>
                        <div className="w-full aspect-video bg-black/20 rounded-lg overflow-hidden">
                            <img src={`${BASE_TEMPLATE_URL}${templateCategory.toLowerCase()}/${selectedTemplate}.png`} alt={`${selectedTemplate} preview`} className="w-full h-full object-contain transition-all duration-300"/>
                        </div>
                    </GlassCard>
                    <GlassCard theme={theme} className="overflow-hidden min-w-0">
                        <label className="font-semibold mb-3 block px-4">Shablonni tanlang</label>
                        <div className="flex overflow-x-auto space-x-3 pb-2 px-4">
                            {templateData[templateCategory].map(templateName => (
                                <div key={templateName} className="relative cursor-pointer flex-shrink-0" onClick={() => setSelectedTemplate(templateName)}>
                                    <img src={`${BASE_TEMPLATE_URL}${templateCategory.toLowerCase()}/${templateName}.png`} alt={templateName} className={`w-32 h-20 object-cover rounded-lg transition-all duration-300 border-4 ${selectedTemplate === templateName ? 'border-opacity-100 scale-105' : 'border-opacity-0'}`} style={{borderColor: theme.accent}}/>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>)} 
                <button onClick={handleCreate} className="w-full py-4 rounded-xl text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-98 flex items-center justify-center" style={{backgroundColor: theme.accent}}>Tayyorlash <ChevronsRight className="ml-2" /></button>
            </div>
        </div>
        {isPaymentModalOpen && <PaymentFlowModal theme={theme} onClose={() => setIsPaymentModalOpen(false)} />}
        </>
    );
};

const GlassCard = ({ children, theme, className = '' }) => (<div className={`p-4 rounded-2xl backdrop-blur-lg border ${className}`} style={{ backgroundColor: theme.card, borderColor: theme.subtle }}>{children}</div>);

// "Taqdimot Muharriri" ekrani
const TaqdimotMuharririScreen = ({ navigateTo, theme, settings }) => {
    const { user, token } = useAuth();
    const { showNotification } = useNotification();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editableSlides, setEditableSlides] = useState([]);
    const [generatedContentData, setGeneratedContentData] = useState(null);
    const [regenerating, setRegenerating] = useState({ slide: null, item: null, type: null });
    const localImageInputRef = useRef(null);
    const [currentSlideForImageUpload, setCurrentSlideForImageUpload] = useState(null);


    useEffect(() => {
        const generate = async () => {
            setIsLoading(true);
            try {
                const requestData = {
                    token: token,
                    topic: settings.topic,
                    lang: settings.lang || 'uz',
                    slides_count: settings.slideCount,
                    with_image: settings.withImages,
                    sources: settings.sourceFilePath ? [settings.sourceFilePath] : []
                };
                const response = await api.generateContent(requestData);
                setGeneratedContentData(response); 
                
                const slidesForEditing = response.slides.map(slide => ({
                    ...slide,
                    content: [...slide.content] 
                }));
                
                const finalSlides = [
                    { type: 'title', content: { title: settings.topic, author: settings.fullName, institution: [settings.university, settings.faculty, settings.direction, settings.group].filter(Boolean).join(', ') } },
                    { type: 'plan', content: { title: 'Reja:', items: response.plans } },
                    ...slidesForEditing.map(s => ({ type: 'content', content: s })),
                ];

                setEditableSlides(finalSlides);

            } catch (error) {
                console.error("Content generation failed:", error);
                showNotification(`Kontent yaratishda xatolik: ${error.message}`, 'error');
                navigateTo('yaratish');
            } finally {
                setIsLoading(false);
            }
        };
        generate();
    }, [settings, user, token, navigateTo, showNotification]);

    const handleTextChange = (slideIndex, field, value) => {
        const newSlides = [...editableSlides];
        newSlides[slideIndex].content[field] = value;
        setEditableSlides(newSlides);
    };
    
    const handlePlanItemChange = (slideIndex, itemIndex, value) => {
        const newSlides = [...editableSlides];
        newSlides[slideIndex].content.items[itemIndex] = value;
        setEditableSlides(newSlides);
    };

    const handleSlideContentItemChange = (contentSlideIndex, contentItemIndex, value) => {
        const newSlides = [...editableSlides];
        const absoluteSlideIndex = editableSlides.findIndex(s => s.type === 'content') + contentSlideIndex;
        newSlides[absoluteSlideIndex].content.content[contentItemIndex] = value;
        setEditableSlides(newSlides);
    };

    const handleSlideImageChange = (contentSlideIndex, newImageUrl) => {
        const newSlides = [...editableSlides];
        const absoluteSlideIndex = editableSlides.findIndex(s => s.type === 'content') + contentSlideIndex;
        newSlides[absoluteSlideIndex].content.image_url = newImageUrl;
        setEditableSlides(newSlides);
    };

    const regenerateText = async (slideIndex, contentIndex) => {
        const contentSlide = editableSlides.filter(s => s.type === 'content')[slideIndex];
        setRegenerating({ slide: slideIndex, item: contentIndex, type: 'text' });
        try {
            const response = await api.regenerateSlideContent({
                token: token,
                main_topic: settings.topic,
                slide_topic: contentSlide.content.title,
                lang: settings.lang || 'uz',
                sources: settings.sourceFilePath ? [settings.sourceFilePath] : []
            });
            handleSlideContentItemChange(slideIndex, contentIndex, response.new_content);
        } catch (error) {
            console.error("Regeneration failed:", error);
            showNotification(`Qayta yaratishda xatolik: ${error.message}`, 'error');
        } finally {
            setRegenerating({ slide: null, item: null, type: null });
        }
    };

    const regenerateImage = async (slideIndex) => {
        setRegenerating({ slide: slideIndex, item: null, type: 'image' });
        try {
            const response = await api.getImageUrl(settings.topic);
            if (response.image_url) {
                handleSlideImageChange(slideIndex, response.image_url);
            } else {
                showNotification("Yangi rasm topilmadi.", 'info');
            }
        } catch (error) {
            console.error("Image regeneration failed:", error);
            showNotification(`Rasm yangilashda xatolik: ${error.message}`, 'error');
        } finally {
            setRegenerating({ slide: null, item: null, type: null });
        }
    };
    
    const handleLocalImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || !currentSlideForImageUpload) return;

        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSizeInBytes) {
            showNotification(`Xatolik: Rasm hajmi 5MB dan katta bo'lmasligi kerak.`, 'error');
            localImageInputRef.current.value = ""; // Clear the input
            return;
        }
        
        const slideIndex = currentSlideForImageUpload.slideIndex;
        setRegenerating({ slide: slideIndex, item: null, type: 'image' });
        try {
            const response = await api.uploadImage(file);
            handleSlideImageChange(slideIndex, response.image_url);
        } catch (error) {
            showNotification(`Rasm yuklashda xatolik: ${error.message}`, 'error');
        } finally {
            setRegenerating({ slide: null, item: null, type: null });
            setCurrentSlideForImageUpload(null);
            localImageInputRef.current.value = "";
        }
    };

    const triggerImageUpload = (slideIndex) => {
        setCurrentSlideForImageUpload({ slideIndex });
        localImageInputRef.current.click();
    };

    const doSave = async () => {
        setIsSaving(true);
        console.log("[LOG: Muharrir] Saqlash tugmasi bosildi. API so'rovi yuborilmoqda...");
        try {
            const planSlide = editableSlides.find(s => s.type === 'plan');
            const planItems = planSlide ? planSlide.content.items : [];

            const editedContentSlides = editableSlides
                .filter(s => s.type === 'content')
                .map(s => s.content);
            
            const finalContentData = { 
                ...generatedContentData, 
                slides: editedContentSlides,
                plans: planItems
            };

            const requestData = {
                token: token,
                generated_content_data: finalContentData,
                full_name: settings.fullName,
                topic: settings.topic,
                doc_lang: settings.lang || 'uz',
                institution_info: {
                    university: settings.university,
                    faculty: settings.faculty,
                    direction: settings.direction,
                    group: settings.group
                },
                template_name: settings.docType === 'Taqdimot' ? `${settings.templateCategory.toLowerCase()}/${settings.selectedTemplate}` : 'template',
                file_type: settings.docType === 'Taqdimot' ? 'pptx' : 'docx',
                sources: settings.sourceFilePath ? [settings.sourceFilePath] : []
            };
            
            const creationResponse = await api.createFile(requestData);

            if (!creationResponse.task_id) {
                throw new Error("Serverdan vazifa ID (task_id) kelmadi.");
            }
            
            navigateTo('status', {
                taskId: creationResponse.task_id,
                docTitle: settings.topic,
                docType: settings.docType
            });

        } catch (error) {
            console.error("Saqlashda xatolik:", error);
            showNotification(`Faylni saqlashda kutilmagan xatolik yuz berdi: ${error.message}`, 'error');
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] animate-fade-in">
                <Loader className="animate-spin mb-4" size={48} style={{color: theme.accent}}/>
                <p className="text-lg opacity-80">{settings.docType} yaratilmoqda, iltimos kuting...</p>
                <p className="text-sm opacity-60 mt-2">Bu jarayon bir daqiqagacha vaqt olishi mumkin.</p>
            </div>
        );
    }

    const renderSlide = (s, i) => { 
        const c = s.content; 
        switch (s.type) { 
            case 'title': return (<div className="h-full flex flex-col justify-center items-center p-4 text-center"><EditableText value={c.institution} onChange={e => handleTextChange(i, 'institution', e.target.value)} theme={theme} className="text-lg opacity-80" /><EditableText value={c.title} onChange={e => handleTextChange(i, 'title', e.target.value)} theme={theme} className="text-4xl font-bold my-6" /><EditableText value={c.author} onChange={e => handleTextChange(i, 'author', e.target.value)} theme={theme} className="text-xl" /></div>); 
            case 'plan': return (<div className="h-full p-6"><EditableText value={c.title} onChange={e => handleTextChange(i, 'title', e.target.value)} theme={theme} className="text-2xl font-bold mb-4" /><ul className="space-y-3">{c.items.map((it, iI) => (<li key={iI} className="flex items-start"><span className="mr-2 mt-1" style={{color: theme.accent}}>●</span><EditableText value={it} onChange={e => handlePlanItemChange(i, iI, e.target.value)} theme={theme} className="flex-grow" /></li>))}</ul></div>); 
            case 'content': 
                const slideIndex = editableSlides.filter(sl => sl.type === 'content').indexOf(s);
                return (
                    <div className="h-full p-4 flex flex-col">
                        <EditableText value={c.title} onChange={e => handleTextChange(i, 'title', e.target.value)} theme={theme} className="text-2xl font-bold mb-4 text-center break-words" />
                        <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
                            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                                {c.content.map((text, contentIdx) => (
                                     <EditableBlock key={contentIdx} value={text} onChange={e => handleSlideContentItemChange(slideIndex, contentIdx, e.target.value)} onRegenerate={() => regenerateText(slideIndex, contentIdx)} theme={theme} isRegenerating={regenerating.slide === slideIndex && regenerating.item === contentIdx && regenerating.type === 'text'}/>
                                ))}
                            </div>
                            {c.image_url && (<div className="md:w-1/3 relative"><img src={c.image_url} alt="Slide content" className="w-full h-full object-cover rounded-lg cursor-pointer" onClick={() => triggerImageUpload(slideIndex)}/><button onClick={() => regenerateImage(slideIndex)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white transition-opacity">
                                    {regenerating.slide === slideIndex && regenerating.type === 'image' ? <Loader size={16} className="animate-spin"/> : <RefreshCw size={16} />}
                                </button>
                                </div>)}
                        </div>
                    </div>
                );
            default: return null; 
        }
    };
    return (<div className="animate-fade-in"><input type="file" ref={localImageInputRef} onChange={handleLocalImageUpload} accept="image/png, image/jpeg" className="hidden" /><header className="flex items-center mb-6"><button onClick={() => navigateTo('yaratish')} className="p-2 mr-4 rounded-full" style={{backgroundColor: theme.subtle}}><ArrowLeft size={20} /></button><h1 className="text-2xl font-bold truncate">Muharrir</h1></header><div className="space-y-6 pb-4">{editableSlides.map((s, i) => (<GlassCard key={i} theme={theme} className="w-full min-h-[24rem]">{renderSlide(s, i)}</GlassCard>))}</div><button onClick={doSave} disabled={isSaving} className="w-full mt-6 py-4 rounded-xl text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-98 relative z-20 flex items-center justify-center disabled:opacity-70" style={{backgroundColor: theme.accent}}>{isSaving ? <><Loader className="animate-spin mr-2" /> Saqlanmoqda...</> : `${settings.docType}ni Saqlash`}</button></div>);
};

const EditableText = ({ value, onChange, theme, className }) => (<textarea value={value} onChange={onChange} className={`bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[${theme.accent}] rounded p-1 w-full resize-none ${className}`} style={{ color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit', textAlign: 'inherit' }} rows={Math.max(1, Math.ceil((value || '').length / 40))}/>);

const EditableBlock = ({ value, onChange, onRegenerate, theme, isRegenerating }) => (
    <div className="relative group">
        <textarea 
            value={value} 
            onChange={onChange} 
            className="bg-transparent border rounded-lg p-2 pr-10 w-full resize-y focus:outline-none focus:ring-1" 
            style={{ borderColor: theme.subtle, 'focus': {ringColor: theme.accent} }}
            rows={4}
        />
        <button 
            onClick={onRegenerate} 
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white transition-opacity"
        >
            {isRegenerating ? <Loader size={14} className="animate-spin"/> : <RefreshCw size={14} />}
        </button>
    </div>
);


// Fayl generatsiya qilish holati ekrani
const GenerationStatusScreen = ({ navigateTo, theme, taskInfo, onGenerationSuccess }) => {
    const { taskId, docTitle, docType } = taskInfo;
    const [status, setStatus] = useState('pending');
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState(`So'rov yuborildi, ${docType} yaratish boshlanmoqda...`);

    useEffect(() => {
        if (!taskId) {
            setError("Fayl yaratish uchun kerakli ma'lumot (task_id) topilmadi.");
            return;
        }
        console.log(`[LOG] Statusni tekshirish boshlandi. Task ID: ${taskId}`);

        const pollInterval = setInterval(async () => {
            try {
                const statusResponse = await api.getFileStatus(taskId);
                console.log("[LOG] Olingan status:", statusResponse);
                setStatus(statusResponse.status);

                if (statusResponse.status === 'completed') {
                    clearInterval(pollInterval);
                    setStatusMessage('Fayl muvaffaqiyatli yaratildi!');
                    const downloadUrl = `${API_BASE_URL}/download_file/${statusResponse.file_path}`;
                    
                    const newDoc = { title: docTitle, date: new Date().toISOString().split('T')[0], downloadUrl: downloadUrl };
                    
                    window.open(downloadUrl, '_blank');
                    
                    console.log("[LOG] Fayl tayyor. Hujjatlar sahifasiga o'tilmoqda.");
                    setTimeout(() => onGenerationSuccess(newDoc), 500);

                } else if (statusResponse.status === 'failed') {
                    clearInterval(pollInterval);
                    setError("Fayl yaratishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring yoki administrator bilan bog'laning.");
                } else {
                     setStatusMessage('Generatsiya qilinmoqda, iltimos kuting...');
                }
            } catch (pollError) {
                clearInterval(pollInterval);
                setError(`Fayl holatini tekshirishda xatolik: ${pollError.message}`);
            }
        }, 4000); // 4 soniyada bir tekshirish

        return () => clearInterval(pollInterval); 

    }, [taskId, docTitle, docType, navigateTo, onGenerationSuccess]);
    
    return (
        <div className="flex flex-col items-center justify-center h-screen animate-fade-in p-4">
            <GlassCard theme={theme} className="w-full max-w-sm text-center">
                {error ? (
                    <>
                        <XCircle size={48} className="mx-auto mb-4 text-red-500" />
                        <h2 className="text-xl font-bold mb-2">Xatolik</h2>
                        <p className="opacity-80 mb-6">{error}</p>
                        <button onClick={() => navigateTo('yaratish')} className="w-full py-3 rounded-xl text-white font-bold" style={{backgroundColor: theme.accent}}>
                            Orqaga
                        </button>
                    </>
                ) : (
                    <>
                        <Loader className="animate-spin mx-auto mb-4" size={48} style={{color: theme.accent}}/>
                        <h2 className="text-xl font-bold mb-2">Jarayonda...</h2>
                        <p className="opacity-80">{statusMessage}</p>
                        <div className="w-full h-2 rounded-full mt-4 overflow-hidden" style={{backgroundColor: theme.subtle}}>
                           <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse-fast"></div>
                        </div>
                    </>
                )}
            </GlassCard>
        </div>
    );
};


// "Profil" ekrani
const ProfilScreen = ({ navigateTo, theme, isDarkMode, setIsDarkMode, handleLogout }) => {
  const { user, token, setUser } = useAuth();
  const { showNotification } = useNotification();
  const [name, setName] = useState(user?.full_name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [avatar, setAvatar] = useState(localStorage.getItem('userAvatar') || "/images/avatar.jpg");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const fileInputRef = React.useRef(null);
  
  useEffect(() => {
    setName(user?.full_name || '');
  }, [user]);

  const handleAvatarChange = (e) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const base64String = event.target.result;
              setAvatar(base64String);
              localStorage.setItem('userAvatar', base64String);
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };
  
  const handleNameBlur = async () => { 
      setIsEditingName(false); 
      if(!name || name === user.full_name) {
          setName(user.full_name);
          return;
      }

      try {
          await api.updateName(token, name);
          setUser(prevUser => ({ ...prevUser, full_name: name }));
          showNotification("Ism muvaffaqiyatli yangilandi!", 'info');
      } catch (error) {
          console.error("Ismni yangilashda xatolik:", error);
          showNotification(`Ismni yangilashda xatolik: ${error.message}`, 'error');
          setName(user.full_name);
      }
  };

  const copyToClipboard = () => {
      const textToCopy = user?.chat_id.toString();
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      try {
          document.execCommand('copy');
          showNotification('ID nusxalandi!', 'info');
      } catch (err) {
          showNotification('Nusxalashda xatolik!', 'error');
      }
      document.body.removeChild(textArea);
  };

  return (
    <>
      <div className="animate-fade-in">
        <header className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer" onClick={() => fileInputRef.current.click()}><img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4" style={{borderColor: theme.accent}}/><div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={24} className="text-white"/></div><input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden"/></div>
          <div className="relative">{isEditingName ? (<input type="text" value={name} onChange={(e) => setName(e.target.value)} onBlur={handleNameBlur} onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()} className="text-2xl font-bold bg-transparent text-center border-b-2 w-3/4 focus:outline-none" style={{borderColor: theme.accent, color: theme.text}} autoFocus/>) : (<h1 onClick={() => setIsEditingName(true)} className="text-2xl font-bold cursor-pointer inline-flex items-center">{name} <Edit2 size={16} className="ml-2 opacity-50"/></h1>)}
          </div>
          <div className="opacity-70 mt-1 flex items-center justify-center space-x-2">
            <span>ID: {user?.chat_id}</span>
            <button onClick={copyToClipboard} className="p-1 rounded-md hover:bg-white/10">
                <Copy size={14} />
            </button>
          </div>
        </header>
        <div className="space-y-4">
          <GlassCard theme={theme}><div className="flex justify-between items-center"><label className="font-semibold">Tungi Rejim</label><button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full" style={{backgroundColor: theme.subtle}}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button></div></GlassCard>
          <GlassCard theme={theme}><div className="flex justify-between items-center"><span className="font-semibold">Balans</span><span className="font-bold" style={{color: theme.accent}}>{user?.balance.toLocaleString() || 0} so'm</span></div><button onClick={() => setIsPaymentModalOpen(true)} className="w-full mt-3 py-2 rounded-lg text-white text-sm" style={{backgroundColor: theme.accent}}>Hisobni to'ldirish</button></GlassCard>
          <GlassCard theme={theme}><ul className="space-y-2"><li onClick={() => navigateTo('support')} className="flex justify-between items-center cursor-pointer p-2 rounded-lg hover:bg-white/10"><span>Qo'llab-quvvatlash</span> <ChevronsRight size={18} /></li><li onClick={() => navigateTo('faq')} className="flex justify-between items-center cursor-pointer p-2 rounded-lg hover:bg-white/10"><span>FAQ</span> <ChevronsRight size={18} /></li></ul></GlassCard>
          <button onClick={handleLogout} className="w-full py-3 rounded-lg text-red-500 font-semibold" style={{backgroundColor: theme.card}}>Chiqish</button>
        </div>
      </div>
      {isPaymentModalOpen && <PaymentFlowModal theme={theme} onClose={() => setIsPaymentModalOpen(false)} />}
    </>
  );
};

// Qo'llab-quvvatlash ekrani
const SupportScreen = ({ navigateTo, theme }) => {
    return (
        <div className="animate-fade-in">
            <header className="flex items-center mb-6"><button onClick={() => navigateTo('profil')} className="p-2 mr-4 rounded-full" style={{backgroundColor: theme.subtle}}><ArrowLeft size={20} /></button><h1 className="text-2xl font-bold">Qo'llab-quvvatlash</h1></header>
            <div className="space-y-6">
                <GlassCard theme={theme}><h2 className="text-xl font-semibold mb-3" style={{color: theme.accent}}>Biz bilan aloqa</h2><p className="opacity-80 mb-4">Ilova bo'yicha savollar, takliflar yoki muammolar yuzasidan biz bilan bog'lanishingiz mumkin. Biz sizga yordam berishdan doim mamnunmiz.</p></GlassCard>
                <GlassCard theme={theme}><h3 className="text-lg font-semibold mb-2">Rasmiy yangiliklar kanali</h3><p className="opacity-80 mb-3">Barcha yangiliklar, yangilanishlar va maxsus takliflardan xabardor bo'lish uchun kanalimizga obuna bo'ling.</p><a href="https://t.me/taqdimotnews" target="_blank" rel="noopener noreferrer" className="flex justify-between items-center w-full p-3 rounded-lg transition-colors" style={{backgroundColor: theme.subtle}}><span>Taqdimot Robot | News</span><ChevronsRight size={20} style={{color: theme.accent}}/></a></GlassCard>
                <GlassCard theme={theme}><h3 className="text-lg font-semibold mb-2">Admin & Dasturchi</h3><p className="opacity-80 mb-3">Texnik nosozliklar yoki hamkorlik bo'yicha to'g'ridan-to'g'ri murojaat uchun.</p><a href="https://t.me/webtechgo" target="_blank" rel="noopener noreferrer" className="flex justify-between items-center w-full p-3 rounded-lg transition-colors" style={{backgroundColor: theme.subtle}}><span> @webtechgo</span><ChevronsRight size={20} style={{color: theme.accent}}/></a></GlassCard>
            </div>
        </div>
    );
};

// FAQ ekrani
const FaqScreen = ({ navigateTo, theme }) => {
    const faqData = [{ q: "Ilovadan qanday foydalanish mumkin?", a: "Ilovadan foydalanish juda oson: '+' tugmasini bosing, kerakli hujjat turini tanlang, ma'lumotlarni kiriting va 'Tayyorlash' tugmasini bosing. AI qolganini o'zi bajaradi!" },{ q: "Taqdimot yaratish qancha vaqt oladi?", a: "Odatda, taqdimotni generatsiya qilish 30 soniyadan 1 daqiqagacha vaqt oladi. Bu slaydlardagi ma'lumotlar hajmiga va rasmlar mavjudligiga bog'liq." },{ q: "Generatsiya qilingan matnlarni o'zgartirsam bo'ladimi?", a: "Albatta! 'Taqdimot Muharriri' ekranida har bir matn bloki to'liq tahrirlanadigan. Siz AI taklif qilgan matnni o'zgartirishingiz, to'ldirishingiz yoki butunlay o'chirib, o'zingiznikini yozishingiz mumkin." },{ q: "Balansni qanday to'ldirish mumkin?", a: "'Profil' ekranidagi 'Balans' bo'limida 'Hisobni to'ldirish' tugmasini bosing. U yerda siz uchun qulay bo'lgan to'lov tizimlaridan birini tanlashingiz mumkin." },{ q: "Texnik muammo yuzaga kelsa nima qilishim kerak?", a: "Agar texnik muammoga duch kelsangiz, 'Qo'llab-quvvatlash' sahifasidagi Admin bilan bog'lanish havolasi orqali bizga murojaat qiling. Muammoni iloji boricha tezroq hal qilishga harakat qilamiz." },];
    const [openIndex, setOpenIndex] = useState(null);
    const toggleFaq = (index) => { setOpenIndex(openIndex === index ? null : index); };

    return (
        <div className="animate-fade-in">
            <header className="flex items-center mb-6"><button onClick={() => navigateTo('profil')} className="p-2 mr-4 rounded-full" style={{backgroundColor: theme.subtle}}><ArrowLeft size={20} /></button><h1 className="text-2xl font-bold">Ko'p Beriladigan Savollar</h1></header>
            <div className="space-y-4">{faqData.map((item, index) => (<GlassCard key={index} theme={theme}><div onClick={() => toggleFaq(index)} className="flex justify-between items-center cursor-pointer"><h3 className="text-md font-semibold pr-4">{item.q}</h3><ChevronDown size={20} className={`transform transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} style={{color: theme.accent}}/></div>{openIndex === index && (<p className="opacity-80 mt-3 pt-3 border-t" style={{borderColor: theme.subtle}}>{item.a}</p>)}
            </GlassCard>))}
            </div>
        </div>
    );
};

// Ulashish Modal Oynasi
const ShareModal = ({ theme, data, onClose }) => {
    const { showNotification } = useNotification();
    const { url, title } = data;
    
    const copyToClipboard = () => {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('Havola nusxalandi!', 'info');
            onClose();
        } catch (err) {
            showNotification('Nusxalashda xatolik!', 'error');
        }
        document.body.removeChild(textArea);
    };

    const telegramText = `${title}nn @taqdimot_robot orqali yaratilgan`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(telegramText)}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in-fast backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-11/12 max-w-sm" onClick={e => e.stopPropagation()}> 
                 <GlassCard theme={theme} className="w-full">
                    <button onClick={onClose} className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white" style={{backgroundColor: theme.accent}}><X size={20} /></button>
                    <h2 className="text-xl font-bold mb-4 text-center">Ulashish</h2>
                    <p className="text-sm opacity-80 mb-4 break-all bg-black/20 p-2 rounded-lg">{url}</p>
                    <div className="space-y-3">
                        <button onClick={copyToClipboard} className="w-full py-3 rounded-xl text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-98 flex items-center justify-center" style={{backgroundColor: theme.accent}}>
                            <Copy size={18} className="mr-2"/> Nusxalash
                        </button>
                        <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-xl text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-98 flex items-center justify-center" style={{backgroundColor: '#2AABEE'}}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-1.02.2-1.32l15.6-6.1c.76-.35 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.51.71l-4.84-3.56-2.31 2.2c-.4.4-.74.74-1.28.74s-.98-.34-1.42-.75z"></path></svg>
                            Telegramda ulashish
                        </a>
                    </div>
                 </GlassCard>
            </div>
        </div>
    );
};

// To'lov Modal Oynasi
const PaymentFlowModal = ({ theme, onClose }) => {
    const { token, refreshUser } = useAuth();
    const { showNotification } = useNotification();
    const [step, setStep] = useState('create'); // 'create', 'wait', 'success'
    const [amount, setAmount] = useState('');
    const [provider, setProvider] = useState('payme');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentId, setPaymentId] = useState(null);
    const [statusMessage, setStatusMessage] = useState('To\'lov kutilmoqda...');
    const pollIntervalRef = useRef(null);

    useEffect(() => {
        if (step === 'wait' && paymentId) {
            pollIntervalRef.current = setInterval(async () => {
                try {
                    const res = await api.checkPaymentStatus(paymentId, token);
                    if (res.status === 'succeed') {
                        setStatusMessage(res.message || 'To\'lov muvaffaqiyatli!');
                        setStep('success');
                        clearInterval(pollIntervalRef.current);
                        await refreshUser();
                        setTimeout(onClose, 2500);
                    } else {
                         setStatusMessage('To\'lov hali ham kutilmoqda...');
                    }
                } catch (error) {
                    console.error("To'lov statusini tekshirishda xatolik:", error);
                    setStatusMessage('Statusni tekshirishda xatolik.');
                }
            }, 3000);
        }
        return () => clearInterval(pollIntervalRef.current);
    }, [step, paymentId, token, refreshUser, onClose]);

    const handlePayment = async () => {
        if (!amount || isNaN(amount) || amount <= 0) { 
            showNotification("Iltimos, to'g'ri summa kiriting.", 'error'); 
            return; 
        }
        setIsProcessing(true);
        try {
            const response = await api.createPaymentLink(token, parseInt(amount), provider);
            if (response.checkoutUrl && response.payId) {
                setPaymentId(response.payId);
                window.open(response.checkoutUrl, '_blank');
                setStep('wait');
            } else {
                throw new Error("To'lov havolasi kelmadi.");
            }
        } catch (error) {
            console.error("To'lov havolasini yaratishda xatolik:", error);
            showNotification(`To'lovda xatolik yuz berdi: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const providers = [{ id: 'click', name: 'Click', icon: '/images/click_logo.png' },{ id: 'payme', name: 'Payme', icon: '/images/payme_logo.png' },{ id: 'uzum', name: 'Uzum Bank', icon: '/images/uzum_logo.png' },];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in-fast backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-11/12 max-w-sm" onClick={e => e.stopPropagation()}> 
                 <GlassCard theme={theme} className="w-full text-center">
                    <button onClick={onClose} className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white" style={{backgroundColor: theme.accent}}><X size={20} /></button>
                    {step === 'create' && <>
                        <h2 className="text-xl font-bold mb-4">Hisobni to'ldirish</h2>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Summa, so'm" className="w-full p-3 text-center text-2xl font-bold rounded-lg border bg-transparent mb-4" style={{borderColor: theme.subtle}}/>
                        <p className="text-sm opacity-70 mb-4">To'lov tizimini tanlang</p>
                        <div className="flex justify-center space-x-4 mb-6">{providers.map(p => (<button key={p.id} onClick={() => setProvider(p.id)} className={`p-2 rounded-lg border-2 bg-white transition-all duration-200 ${provider === p.id ? 'scale-110 border-opacity-100' : 'border-opacity-50'}`} style={{borderColor: provider === p.id ? theme.accent : theme.subtle}}>
                                <img src={p.icon} alt={p.name} className="w-16 h-10 object-contain"/>
                            </button>))}
                        </div>
                        <button onClick={handlePayment} disabled={isProcessing} className="w-full py-3 rounded-xl text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-98 disabled:opacity-70 flex items-center justify-center" style={{backgroundColor: theme.accent}}>
                            {isProcessing ? <><Loader className="animate-spin mr-2" /> Jarayonda...</> : "To'ldirish"}
                        </button>
                    </>}
                    {step === 'wait' && <div className="p-4">
                        <Loader className="animate-spin mx-auto mb-4" size={48} style={{color: theme.accent}}/>
                        <h2 className="text-xl font-bold mb-2">To'lov kutilmoqda</h2>
                        <p className="opacity-80">{statusMessage}</p>
                        <p className="text-xs opacity-60 mt-4">To'lovni amalga oshirganingizdan so'ng, ushbu oyna avtomatik yangilanadi.</p>
                    </div>}
                     {step === 'success' && <div className="p-4">
                        <CheckCircle className="mx-auto mb-4" size={48} style={{color: 'rgb(34 197 94)'}}/>
                        <h2 className="text-xl font-bold mb-2">Muvaffaqiyatli!</h2>
                        <p className="opacity-80">{statusMessage}</p>
                    </div>}
                 </GlassCard>
            </div>
        </div>
    );
};


// CSS for animations
const style = document.createElement('style');
style.innerHTML = `
  @keyframes blob {0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); }}
  .animate-blob { animation: blob 10s infinite; }
  .animation-delay-2000 { animation: blob 10s infinite; animation-delay: -2s; }
  .animation-delay-4000 { animation: blob 10s infinite; animation-delay: -4s; }
  .animation-delay-6000 { animation: blob 10s infinite; animation-delay: -6s; }
  @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }}
  .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
  @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; }}
  .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; }
  @keyframes slide-in-right { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); }}
  .animate-slide-in-right { animation: slide-in-right 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
  @keyframes pulse-fast {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
  .animate-pulse-fast { animation: pulse-fast 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
`;
document.head.appendChild(style);
