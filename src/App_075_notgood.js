/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Search, X, Check, Tag, Palette, Settings, Image as ImageIcon,
  Upload, Trash2, Edit2, RefreshCw, Cloud, CloudOff, Lock, Unlock,
  Database, Info, ArrowUpDown, ListFilter, Menu, History,
  Copy, ChevronRight, ChevronDown, ChevronUp, ChevronLeft, Activity, ShieldAlert, FileJson, Calendar,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Layers, Star,
  Trophy, Heart, Link as LinkIcon, Paperclip, PieChart, Clock,
  Share2, Download, Maximize2, LayoutGrid, Zap, GripHorizontal, ImageIcon as ImgIcon,
  ChevronsUp, Camera, ImagePlus, Sofa, Briefcase, Users, Home as HomeIcon, MapPin,
  Edit3, Grid, MoreVertical, MousePointer2, CheckSquare, XCircle, Printer, List, Eye,
  PlayCircle, BarChart3, CornerUpLeft, Grid3X3, Droplet, Coffee, GraduationCap, ShoppingBag, FileDown, FileUp,
  ArrowLeftRight, SlidersHorizontal, Move, Monitor, Maximize, EyeOff, Type, FolderOpen
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, addDoc, query, orderBy, limit, getDoc, writeBatch, getDocs 
} from 'firebase/firestore';

// ----------------------------------------------------------------------
// 1. Firebase Configuration & Initialization
// ----------------------------------------------------------------------
const YOUR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyA79MW_m_bNDq3c9LXdL_wVefa6ZGCEXmQ",
  authDomain: "patra-db.firebaseapp.com",
  projectId: "patra-db",
  storageBucket: "patra-db.firebasestorage.app",
  messagingSenderId: "602422986176",
  appId: "1:602422986176:web:0170f7b5f9cd99e4c1f425",
  measurementId: "G-33FMQD1WVS"
};

// 앱 버전 및 빌드 정보
const APP_VERSION = "v0.7.5"; 
const BUILD_DATE = "2026.01.24";
const ADMIN_PASSWORD = "adminlcg1"; 

// Firebase 인스턴스 초기화
let db = null;
let auth = null;
let isFirebaseAvailable = false;
let appId = 'default-app-id';

try {
  if (typeof __firebase_config !== 'undefined') {
    const firebaseConfig = JSON.parse(__firebase_config);
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    isFirebaseAvailable = true;
  } 
  else if (YOUR_FIREBASE_CONFIG.apiKey) {
    const app = initializeApp(YOUR_FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = 'patra-production';
    isFirebaseAvailable = true;
  }
} catch (e) {
  console.warn("Firebase Init Failed. Falling back to Local Storage.", e);
}

// ----------------------------------------------------------------------
// 2. Constants (Categories, Spaces, Swatches)
// ----------------------------------------------------------------------

// 제품 카테고리 (V0.7.5: TOTAL_VIEW를 Master View로 정의)
const CATEGORIES = [
  { id: 'TOTAL_VIEW', label: 'Master View', isSpecial: true, color: '#18181b' }, 
  { id: 'EXECUTIVE', label: 'Executive', color: '#2563eb' },
  { id: 'TASK', label: 'Task', color: '#0891b2' },
  { id: 'CONFERENCE', label: 'Conference', color: '#7c3aed' },
  { id: 'GUEST', label: 'Guest', color: '#db2777' },
  { id: 'STOOL', label: 'Stool', color: '#059669' },
  { id: 'LOUNGE', label: 'Lounge', color: '#d97706' },
  { id: 'HOME', label: 'Home', color: '#ea580c' },
  { id: 'TABLE', label: 'Table', color: '#475569' },
  { id: 'ETC', label: 'Etc', color: '#9ca3af' }
];

// 공간 정의
const SPACES = [
  { id: 'OFFICE', label: 'Office', icon: Briefcase, defaultTags: ['Task', 'Executive', 'Meeting', 'Office Lounge'] },
  { id: 'TRAINING', label: 'Training', icon: GraduationCap, defaultTags: ['Education', 'Library', 'Public'] },
  { id: 'LIFESTYLE', label: 'Lifestyle', icon: Sofa, defaultTags: ['Dining', 'Study', 'Living', 'Outdoor'] },
  { id: 'COMMERCIAL', label: 'Commercial', icon: ShoppingBag, defaultTags: ['Cafe', 'Restaurant', 'Store', 'Outdoor'] },
];

// 소재 카테고리 정의
const SWATCH_CATEGORIES = [
  { id: 'MESH', label: 'Mesh', color: '#a1a1aa' },
  { id: 'FABRIC', label: 'Fabric', color: '#a1a1aa' },
  { id: 'LEATHER', label: 'Leather', color: '#78350f' },
  { id: 'RESIN', label: 'Resin', color: '#27272a' },
  { id: 'METAL', label: 'Metal', color: '#64748b' },
  { id: 'WOOD', label: 'Wood', color: '#92400e' },
  { id: 'ETC', label: 'Etc', color: '#9ca3af' },
];

// ----------------------------------------------------------------------
// 3. Main Application Component
// ----------------------------------------------------------------------
export default function App() {
  // --- State Management ---
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [swatches, setSwatches] = useState([]); 
  
  // Navigation & Routing
  // V0.7.5: activeCategory can be DASHBOARD, TOTAL_VIEW, SPACES_ROOT, etc.
  const [activeCategory, setActiveCategory] = useState('DASHBOARD'); 
  const [activeSpaceTag, setActiveSpaceTag] = useState('ALL'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtering & Sorting
  const [sortOption, setSortOption] = useState('manual'); 
  const [sortDirection, setSortDirection] = useState('desc'); 
  const [filters, setFilters] = useState({ year: '', color: '', isNew: false });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // V0.7.5 New Feature: Modal Stack System
  // Stores objects: { type: 'product'|'swatch'|'scene'|'form'|'admin'..., data: any, id: number }
  const [modalStack, setModalStack] = useState([]); 

  // UI Utilities
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [toast, setToast] = useState(null);
  const [favorites, setFavorites] = useState([]);
  
  // Sidebar Expansion State
  const [sidebarState, setSidebarState] = useState({ spaces: true, collections: true, materials: true });
  
  // Persistent Settings
  const [bannerData, setBannerData] = useState({ url: null, logoUrl: null, title: 'Design Lab DB', subtitle: 'Integrated Product Database & Archives' });
  const [appSettings, setAppSettings] = useState({ logo: null, title: 'PATRA', subtitle: 'Design Lab DB' });
  const [spaceContents, setSpaceContents] = useState({}); 

  // Refs
  const mainContentRef = useRef(null);
  const sidebarLogoInputRef = useRef(null);

  // --- Modal Stack Helpers ---
  const pushModal = (type, data) => {
    // Add new modal to the top of the stack
    setModalStack(prev => [...prev, { type, data, id: Date.now() + Math.random() }]);
  };
  
  const popModal = () => {
    // Remove the top modal (Go back)
    setModalStack(prev => prev.slice(0, -1));
  };
  
  const closeModalAll = () => {
    // Clear all modals
    setModalStack([]);
  };

  // --- Effects ---
  
  // 1. Scroll Locking: Lock body scroll when any modal is open
  useEffect(() => {
    if (modalStack.length > 0 || showAdminDashboard) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [modalStack.length, showAdminDashboard]);

  // 2. Handle Escape Key to close top modal
  useEffect(() => {
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            if (modalStack.length > 0) popModal();
            else if (showAdminDashboard) setShowAdminDashboard(false);
            else if (isFilterOpen) setIsFilterOpen(false);
        }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [modalStack, showAdminDashboard, isFilterOpen]);

  // 3. Scroll Top Button Visibility
  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current && mainContentRef.current.scrollTop > 300) setShowScrollTop(true);
      else setShowScrollTop(false);
    };
    const div = mainContentRef.current;
    if (div) div.addEventListener('scroll', handleScroll);
    return () => div && div.removeEventListener('scroll', handleScroll);
  }, []);

  // 4. Deep Linking (Shared URLs)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('id');
    const sharedSpace = params.get('space');
    
    // If ID exists, push product modal
    if (sharedId && products.length > 0 && modalStack.length === 0) {
      const found = products.find(p => String(p.id) === sharedId);
      if (found) pushModal('product', found);
    }
    // If Space exists, switch category
    if (sharedSpace && SPACES.find(s => s.id === sharedSpace)) {
       setActiveCategory(sharedSpace);
    }
  }, [products]);

  // 5. Auto Switch to Master View on Search
  useEffect(() => {
      // If user types in dashboard, switch to Total View to show results
      if (activeCategory === 'DASHBOARD') {
          if (searchTerm || filters.year || filters.color || filters.isNew) {
              setActiveCategory('TOTAL_VIEW');
          }
      }
  }, [searchTerm, filters]);

  // 6. Data Initialization (Firebase or Local)
  useEffect(() => {
    const initApp = async () => {
      if (isFirebaseAvailable && auth) {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
          else await signInAnonymously(auth);
          onAuthStateChanged(auth, setUser);
        } catch (error) { loadFromLocalStorage(); }
      } else {
        loadFromLocalStorage();
        setUser({ uid: 'local-user', isAnonymous: true });
      }
    };
    initApp();
    const savedFavs = localStorage.getItem('patra_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    
    if (!isFirebaseAvailable) {
       const localSwatches = localStorage.getItem('patra_swatches');
       setSwatches(localSwatches ? JSON.parse(localSwatches) : []);
    }
  }, []);

  // 7. Firebase Realtime Listeners
  useEffect(() => {
    if (isFirebaseAvailable && user && db) {
      const qProducts = collection(db, 'artifacts', appId, 'public', 'data', 'products');
      const unsubProducts = onSnapshot(qProducts, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setIsLoading(false);
      });
      const qSwatches = collection(db, 'artifacts', appId, 'public', 'data', 'swatches');
      const unsubSwatches = onSnapshot(qSwatches, (snapshot) => {
        setSwatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      // Listen for Banner & Settings
      onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'banner'), (d) => { if (d.exists()) setBannerData(prev => ({ ...prev, ...d.data() })); });
      onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'app'), (d) => { if(d.exists()) setAppSettings(prev => ({...prev, ...d.data()})); });

      // Listen for Space Contents
      SPACES.forEach(space => {
         onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', space.id), (docSnapshot) => {
            if(docSnapshot.exists()) setSpaceContents(prev => ({ ...prev, [space.id]: docSnapshot.data() }));
         });
      });
      return () => { unsubProducts(); unsubSwatches(); };
    }
  }, [user]);

  // --- Handlers ---

  const handleHomeClick = () => {
    // V0.7.5: Dashboard home reset
    setActiveCategory('DASHBOARD');
    setSearchTerm('');
    setFilters({ year: '', color: '', isNew: false });
    setIsMobileMenuOpen(false);
    window.history.pushState({}, '', window.location.pathname);
  };

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('patra_products');
    setProducts(saved ? JSON.parse(saved) : []);
    setIsLoading(false);
    const localBanner = localStorage.getItem('patra_banner_data');
    if (localBanner) setBannerData(JSON.parse(localBanner));
    const localAppSettings = localStorage.getItem('patra_app_settings');
    if(localAppSettings) setAppSettings(JSON.parse(localAppSettings));
  };

  const saveToLocalStorage = (newProducts) => {
    localStorage.setItem('patra_products', JSON.stringify(newProducts));
    setProducts(newProducts);
  };

  const saveSwatchesToLocal = (newSwatches) => {
      localStorage.setItem('patra_swatches', JSON.stringify(newSwatches));
      setSwatches(newSwatches);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const processImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
           const canvas = document.createElement('canvas'); const MAX_WIDTH = 1200; let width = img.width; let height = img.height;
           if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } canvas.width = width; canvas.height = height;
           const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Admin Actions (Create/Update/Delete)
  const handleAdminAction = async (actionType, payload) => {
      if(actionType === 'SAVE_PRODUCT') {
          const productData = payload;
          const docId = productData.id ? String(productData.id) : String(Date.now());
          const isEdit = products.some(p => String(p.id) === docId);
          const newPayload = { 
            ...productData, 
            id: docId, 
            updatedAt: Date.now(), 
            createdAt: isEdit ? productData.createdAt : Date.now(),
            orderIndex: isEdit ? productData.orderIndex : Date.now() 
          };
          
          if(isFirebaseAvailable && db) {
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', docId), newPayload, { merge: true });
          } else {
              const idx = products.findIndex(p => String(p.id) === docId);
              let newProds = [...products];
              if(idx>=0) newProds[idx] = newPayload; else newProds = [newPayload, ...products];
              saveToLocalStorage(newProds);
          }
          popModal(); // Close form
          showToast("Product Saved Successfully.");
      }
      else if (actionType === 'DELETE_PRODUCT') {
          // FIX: window.confirm
          if(!window.confirm("Delete this product?")) return;
          if(isFirebaseAvailable && db) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', String(payload)));
          else { saveToLocalStorage(products.filter(p => p.id !== payload)); }
          closeModalAll();
          showToast("Product Deleted.");
      }
      else if (actionType === 'SAVE_SWATCH') {
          const sData = payload;
          const docId = sData.id ? String(sData.id) : String(Date.now());
          const newPayload = { ...sData, id: docId, updatedAt: Date.now() };
          if(isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'swatches', docId), newPayload, { merge: true });
          else {
              const idx = swatches.findIndex(s => s.id === docId);
              let newS = [...swatches];
              if(idx>=0) newS[idx] = newPayload; else newS = [newPayload, ...swatches];
              saveSwatchesToLocal(newS);
          }
          popModal();
          showToast("Material Saved.");
      }
      else if (actionType === 'DELETE_SWATCH') {
          // FIX: window.confirm
          if(!window.confirm("Delete this material?")) return;
          if(isFirebaseAvailable && db) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'swatches', String(payload)));
          else { saveSwatchesToLocal(swatches.filter(s => s.id !== payload)); }
          popModal();
          showToast("Material Deleted.");
      }
  };

  const handleSidebarLogoUpload = async (e) => {
      if(!isAdmin) return;
      const file = e.target.files[0]; if(!file) return;
      try {
          const resized = await processImage(file);
          const newData = { ...appSettings, logo: resized };
          if(isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'app'), newData, {merge: true});
          else { localStorage.setItem('patra_app_settings', JSON.stringify(newData)); setAppSettings(newData); }
          showToast("Header logo updated.");
      } catch(e) { showToast("Image error", "error"); }
  };
  
  const handleEditTitle = (key) => {
      if(!isAdmin) return;
      const val = prompt(`Enter new ${key}:`, appSettings[key]);
      if(val !== null) {
          const newData = { ...appSettings, [key]: val };
          if(isFirebaseAvailable && db) setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'app'), newData, {merge: true});
          else { localStorage.setItem('patra_app_settings', JSON.stringify(newData)); setAppSettings(newData); }
      }
  };

  const handleNavClick = (categoryId) => {
      setActiveCategory(categoryId);
      setSearchTerm(''); // Clear search on nav
      setFilters({ year: '', color: '', isNew: false });
      setIsMobileMenuOpen(false);
  };

  const toggleSidebarSection = (section) => {
      setSidebarState(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFavorite = (e, productId) => {
    if(e) e.stopPropagation();
    let newFavs;
    if (favorites.includes(productId)) { newFavs = favorites.filter(id => id !== productId); showToast("Removed from My Pick", "info"); } 
    else { newFavs = [...favorites, productId]; showToast("Added to My Pick"); }
    setFavorites(newFavs);
    localStorage.setItem('patra_favorites', JSON.stringify(newFavs));
  };

  // --- Rendering ---
  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 overflow-hidden relative selection:bg-black selection:text-white print:overflow-visible print:h-auto print:bg-white">
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .slide-in-animation { animation: slideIn 0.3s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        /* Custom Scrollbar for better UI */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e4e4e7; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #d4d4d8; }
      `}</style>
      
      {/* Sidebar & Mobile Menu Overlay */}
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-md border-r border-zinc-200 flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 md:relative md:translate-x-0 print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between cursor-pointer group relative" onClick={handleHomeClick}>
          <div className="flex flex-col group/header">
             <div className="flex items-center space-x-2">
                 {appSettings.logo ? (
                     <img src={appSettings.logo} alt="Logo" className="h-8 object-contain" />
                 ) : (
                     <span className="text-2xl font-black tracking-tighter text-zinc-900">{appSettings.title}</span>
                 )}
                 {isAdmin && (
                     <div className="opacity-0 group-hover/header:opacity-100 transition-opacity flex space-x-1 absolute left-32 top-6 bg-white shadow-sm p-1 rounded">
                         <button onClick={(e)=>{e.stopPropagation(); sidebarLogoInputRef.current.click()}} className="p-1 hover:bg-zinc-100 rounded"><ImageIcon className="w-3 h-3"/></button>
                         <button onClick={(e)=>{e.stopPropagation(); handleEditTitle('title')}} className="p-1 hover:bg-zinc-100 rounded"><Type className="w-3 h-3"/></button>
                         <input type="file" ref={sidebarLogoInputRef} className="hidden" accept="image/*" onChange={handleSidebarLogoUpload}/>
                     </div>
                 )}
             </div>
             <div className="group/sub relative">
                 <span className="text-[10px] font-medium text-zinc-500 tracking-[0.2em] uppercase mt-0.5 block">{appSettings.subtitle}</span>
                 {isAdmin && <button onClick={(e)=>{e.stopPropagation(); handleEditTitle('subtitle')}} className="absolute -right-4 top-0 opacity-0 group-hover/sub:opacity-100 p-1"><Edit2 className="w-3 h-3 text-zinc-400"/></button>}
             </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }} className="md:hidden text-zinc-400 hover:text-zinc-600"><X className="w-6 h-6" /></button>
        </div>
        
        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-3 custom-scrollbar">
          {/* Master View */}
          <button onClick={() => handleNavClick('TOTAL_VIEW')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group border ${activeCategory === 'TOTAL_VIEW' ? 'bg-zinc-900 text-white shadow-lg border-zinc-900' : 'bg-white text-zinc-600 border-zinc-100 hover:bg-zinc-50 hover:border-zinc-300'}`}>
              <div className="flex items-center"><LayoutGrid className="w-4 h-4 mr-3 opacity-70" /><span className="font-bold tracking-tight">Master View</span></div>
          </button>

          {/* SPACES ROOT */}
          <div className="py-1">
             <div className={`w-full flex items-center justify-between rounded-xl border bg-white border-zinc-100 shadow-sm mb-1 overflow-hidden transition-all ${activeCategory === 'SPACES_ROOT' ? 'ring-2 ring-zinc-900' : ''}`}>
                <button onClick={() => handleNavClick('SPACES_ROOT')} className="flex-1 text-left px-4 py-3 text-sm font-bold tracking-tight text-zinc-600 hover:bg-zinc-50 transition-colors">SPACES</button>
                <button onClick={() => toggleSidebarSection('spaces')} className="px-3 py-3 border-l border-zinc-100 hover:bg-zinc-50 text-zinc-400">
                    {sidebarState.spaces ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
             </div>
             {sidebarState.spaces && (
                 <div className="space-y-1 mt-1 pl-2 animate-in slide-in-from-top-2 duration-200">
                     {SPACES.map((space) => (
                         <button key={space.id} onClick={() => handleNavClick(space.id)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === space.id ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                             <div className="flex items-center"><space.icon className={`w-3.5 h-3.5 mr-3 ${activeCategory === space.id ? 'text-white' : 'text-zinc-400'}`} />{space.label}</div>
                             {activeCategory === space.id && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
                         </button>
                     ))}
                 </div>
             )}
          </div>

          {/* COLLECTIONS ROOT */}
          <div className="py-1">
             <div className={`w-full flex items-center justify-between rounded-xl border bg-white border-zinc-100 shadow-sm mb-1 overflow-hidden transition-all ${activeCategory === 'COLLECTIONS_ROOT' ? 'ring-2 ring-zinc-900' : ''}`}>
                <button onClick={() => handleNavClick('COLLECTIONS_ROOT')} className="flex-1 text-left px-4 py-3 text-sm font-bold tracking-tight text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center">COLLECTIONS {isFirebaseAvailable ? <Cloud className="w-3 h-3 ml-2 text-green-500"/> : <CloudOff className="w-3 h-3 ml-2 text-zinc-300"/>}</button>
                <button onClick={() => toggleSidebarSection('collections')} className="px-3 py-3 border-l border-zinc-100 hover:bg-zinc-50 text-zinc-400">
                    {sidebarState.collections ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
             </div>
             {sidebarState.collections && (
                 <div className="space-y-0.5 mt-1 pl-2 animate-in slide-in-from-top-2 duration-200">
                     {CATEGORIES.filter(c => !c.isSpecial).map((cat) => (
                         <button key={cat.id} onClick={() => handleNavClick(cat.id)} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === cat.id ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}>{cat.label}</button>
                     ))}
                 </div>
             )}
          </div>

          {/* MATERIALS ROOT */}
          <div className="py-1">
             <div className={`w-full flex items-center justify-between rounded-xl border bg-white border-zinc-100 shadow-sm mb-1 overflow-hidden transition-all ${activeCategory === 'MATERIALS_ROOT' ? 'ring-2 ring-zinc-900' : ''}`}>
                <button onClick={() => handleNavClick('MATERIALS_ROOT')} className="flex-1 text-left px-4 py-3 text-sm font-bold tracking-tight text-zinc-600 hover:bg-zinc-50 transition-colors">MATERIALS</button>
                <button onClick={() => toggleSidebarSection('materials')} className="px-3 py-3 border-l border-zinc-100 hover:bg-zinc-50 text-zinc-400">
                    {sidebarState.materials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
             </div>
             {sidebarState.materials && (
                 <div className="space-y-0.5 mt-1 pl-2 animate-in slide-in-from-top-2 duration-200">
                     {SWATCH_CATEGORIES.map((cat) => (
                         <button key={cat.id} onClick={() => handleNavClick(cat.id)} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === cat.id ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}>{cat.label}</button>
                     ))}
                 </div>
             )}
          </div>

          <div className="pt-2">
             <button onClick={() => handleNavClick('MY_PICK')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center space-x-3 group border ${activeCategory === 'MY_PICK' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'text-zinc-400 border-transparent hover:bg-zinc-50 hover:text-zinc-600'}`}>
                <Heart className={`w-4 h-4 ${activeCategory === 'MY_PICK' ? 'fill-yellow-500 text-yellow-500' : ''}`} /><span>My Pick ({favorites.length})</span>
             </button>
          </div>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 space-y-3">
           {isAdmin && (<button onClick={() => { setShowAdminDashboard(true); }} className="w-full text-[10px] text-blue-600 hover:text-blue-800 flex items-center justify-center font-bold py-1 mb-2 bg-blue-50 rounded border border-blue-100"><Settings className="w-3 h-3 mr-1" /> Dashboard</button>)}
           <button onClick={() => { if(isAdmin) { setIsAdmin(false); showToast("Viewer Mode"); } else { const p = prompt("Admin Password:"); if(p===ADMIN_PASSWORD) { setIsAdmin(true); showToast("Admin Mode"); } else if(p) showToast("Wrong Password", "error"); } }} className={`w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isAdmin ? 'bg-zinc-900 text-white shadow-md' : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100'}`}>
              {isAdmin ? <Unlock className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2" />}{isAdmin ? "ADMIN MODE" : "VIEWER MODE"}
           </button>
           <div className="flex justify-between items-center px-1"><span className="text-[10px] text-zinc-400">{APP_VERSION}</span><span className="text-[10px] text-zinc-300">{BUILD_DATE}</span></div>
        </div>
      </aside>
<main className="flex-1 flex flex-col h-screen overflow-hidden relative print:overflow-visible print:h-auto">
        {/* ----------------------------------------------------------------------
            Top Header (Search, Filter, Sort)
            ---------------------------------------------------------------------- */}
        <header className="h-14 md:h-16 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex items-center justify-between px-4 md:px-8 z-30 flex-shrink-0 sticky top-0 transition-all print:hidden">
          <div className="flex items-center space-x-3 w-full md:w-auto flex-1 mr-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-lg active:scale-95 transition-transform">
                <Menu className="w-6 h-6" />
            </button>
            
            <div className="relative w-full max-w-md group">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4 group-focus-within:text-zinc-800 transition-colors" />
               <input 
                  type="text" 
                  placeholder="Search products, spaces, materials..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50/50 border border-transparent focus:bg-white focus:border-zinc-200 focus:ring-4 focus:ring-zinc-50 rounded-full text-sm transition-all outline-none" 
               />
            </div>
          </div>

          <div className="flex items-center space-x-2">
             <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)} 
                className={`p-2 rounded-full transition-all ${isFilterOpen ? 'bg-zinc-200 text-black' : 'hover:bg-zinc-100 text-zinc-500'}`} 
                title="Filters"
             >
                <SlidersHorizontal className="w-5 h-5" />
             </button>

             <div className="flex items-center bg-zinc-100 rounded-lg p-1">
                <select 
                    value={sortOption} 
                    onChange={(e) => setSortOption(e.target.value)} 
                    className="bg-transparent text-xs font-bold text-zinc-600 outline-none px-2 py-1 max-w-[80px] md:max-w-none cursor-pointer"
                >
                    <option value="manual">Manual</option>
                    <option value="launchDate">Launch</option>
                    <option value="createdAt">Added</option>
                    <option value="name">Name</option>
                </select>
                <button 
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')} 
                    className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-zinc-500" 
                    title="Sort Direction"
                >
                    {sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                </button>
             </div>

            {isAdmin && (
                <button 
                    onClick={() => pushModal('form', null)} 
                    className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 bg-zinc-900 text-white rounded-full hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95 flex-shrink-0"
                >
                    <Plus className="w-4 h-4 md:mr-1.5" />
                    <span className="hidden md:inline text-sm font-bold">New</span>
                </button>
            )}
          </div>
        </header>

        {/* ----------------------------------------------------------------------
            Filter Panel
            ---------------------------------------------------------------------- */}
        {isFilterOpen && (
           <div className="bg-zinc-50 border-b border-zinc-200 p-4 flex gap-4 overflow-x-auto items-center animate-in slide-in-from-top-5">
              <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-zinc-500">Year:</span>
                  <input type="number" placeholder="YYYY" className="px-2 py-1 rounded border text-xs w-20" value={filters.year} onChange={e=>setFilters({...filters, year: e.target.value})} />
              </div>
              <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-zinc-500">Color:</span>
                  <input type="text" placeholder="Red, Blue..." className="px-2 py-1 rounded border text-xs w-24" value={filters.color} onChange={e=>setFilters({...filters, color: e.target.value})} />
              </div>
              <label className="flex items-center space-x-2 text-xs font-bold text-zinc-600 cursor-pointer hover:bg-zinc-200 px-2 py-1 rounded transition-colors">
                  <input type="checkbox" checked={filters.isNew} onChange={e=>setFilters({...filters, isNew: e.target.checked})} className="rounded text-black focus:ring-black"/> 
                  <span>New Only</span>
              </label>
              <button onClick={() => setFilters({year:'', color:'', isNew:false})} className="text-xs text-red-500 hover:underline ml-auto font-bold">Reset Filters</button>
           </div>
        )}

        {/* ----------------------------------------------------------------------
            Main Scrollable Content Area
            ---------------------------------------------------------------------- */}
        <div ref={mainContentRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative print:overflow-visible print:p-0">
          
          {/* ROUTING LOGIC */}
          {activeCategory === 'DASHBOARD' ? (
              <DashboardView 
                 products={products} 
                 favorites={favorites} 
                 setActiveCategory={setActiveCategory} 
                 onProductClick={(p) => pushModal('product', p)}
                 isAdmin={isAdmin} 
                 bannerData={bannerData}
                 onBannerUpload={async (e) => { const f=e.target.files[0]; if(f) { const u = await processImage(f); setBannerData(p=>({...p, url:u})); if(isFirebaseAvailable && db) setDoc(doc(db,'artifacts',appId,'public','data','settings','banner'),{...bannerData, url:u},{merge:true}); else localStorage.setItem('patra_banner_data', JSON.stringify({...bannerData, url:u})); } }}
                 onLogoUpload={handleSidebarLogoUpload} 
                 onBannerTextChange={(k,v) => setBannerData(p=>({...p, [k]:v}))}
                 onSaveBannerText={() => { if(isFirebaseAvailable && db) setDoc(doc(db,'artifacts',appId,'public','data','settings','banner'), bannerData, {merge:true}); showToast("Banner Saved"); }}
              />
          ) : activeCategory === 'TOTAL_VIEW' ? (
              <MasterView 
                 products={products} 
                 swatches={swatches}
                 spaceContents={spaceContents}
                 onProductClick={(p) => pushModal('product', p)}
                 onSwatchClick={(s) => pushModal('swatch', s)}
                 onSceneClick={(s, spaceId) => pushModal('scene', { ...s, spaceId })}
                 activeCategory={activeCategory}
                 onNavClick={setActiveCategory}
                 isAdmin={isAdmin}
                 searchTerm={searchTerm}
                 filters={filters}
                 sortOption={sortOption}
                 sortDirection={sortDirection}
                 activeSpaceTag={activeSpaceTag}
                 setActiveSpaceTag={setActiveSpaceTag}
                 favorites={favorites}
                 toggleFavorite={toggleFavorite} // Fix: Passing prop
                 handleAdminAction={handleAdminAction}
              />
          ) : activeCategory === 'SPACES_ROOT' ? (
             <SpacesRootView 
                 spaceContents={spaceContents}
                 allProducts={products}
                 searchTerm={searchTerm}
                 onSceneClick={(s, spaceId) => pushModal('scene', { ...s, spaceId })}
                 onNavClick={handleNavClick}
             />
          ) : activeCategory === 'MATERIALS_ROOT' ? (
             <MaterialsRootView 
                 swatches={swatches}
                 searchTerm={searchTerm}
                 onSwatchClick={(s) => pushModal('swatch', s)}
                 onNavClick={handleNavClick}
             />
          ) : activeCategory === 'COLLECTIONS_ROOT' ? (
             <CollectionsRootView 
                 categories={CATEGORIES.filter(c => !c.isSpecial)}
                 products={products}
                 onProductClick={(p) => pushModal('product', p)}
                 onNavClick={handleNavClick}
                 favorites={favorites}
                 toggleFavorite={toggleFavorite}
                 isAdmin={isAdmin}
                 handleAdminAction={handleAdminAction}
             />
          ) : (
             /* Sub-Level Views */
             <>
               {SPACES.find(s => s.id === activeCategory) && (
                 <SpaceDetailView 
                    space={SPACES.find(s => s.id === activeCategory)} 
                    spaceContent={spaceContents[activeCategory] || {}} 
                    isAdmin={isAdmin} 
                    activeTag={activeSpaceTag} 
                    setActiveTag={setActiveSpaceTag} 
                    onBannerUpload={async (e) => { const f=e.target.files[0]; if(f) { const u=await processImage(f); const nc={...(spaceContents[activeCategory]||{}), banner:u}; if(isFirebaseAvailable && db) setDoc(doc(db,'artifacts',appId,'public','data','space_contents',activeCategory), nc, {merge:true}); showToast("Space Banner Updated"); } }}
                    onEditInfo={() => pushModal('spaceInfo', { spaceId: activeCategory })} 
                    onManageProducts={() => pushModal('spaceProducts', { spaceId: activeCategory })} 
                    onAddScene={() => pushModal('sceneForm', { isNew: true, spaceId: activeCategory })} 
                    onViewScene={(scene) => pushModal('scene', { ...scene, spaceId: activeCategory })} 
                    productCount={products.filter(p=>p.spaces&&p.spaces.includes(activeCategory)).length} 
                 />
               )}

               {SWATCH_CATEGORIES.find(s => s.id === activeCategory) && (
                 <SwatchManager 
                    category={SWATCH_CATEGORIES.find(s => s.id === activeCategory)} 
                    swatches={swatches.filter(s => s.category === activeCategory)} 
                    isAdmin={isAdmin} 
                    onSave={(d) => handleAdminAction('SAVE_SWATCH', d)} 
                    onDelete={(id) => handleAdminAction('DELETE_SWATCH', id)} 
                    onSelect={(swatch) => pushModal('swatch', swatch)} 
                    onDuplicate={(s) => handleAdminAction('SAVE_SWATCH', { ...s, id: Date.now(), name: `${s.name} (Copy)` })} 
                 />
               )}
               
               {/* Fallback / Standard Product Grid */}
               {!SPACES.find(s => s.id === activeCategory) && !SWATCH_CATEGORIES.find(s => s.id === activeCategory) && (
                   <MasterView 
                        products={products}
                        swatches={swatches}
                        spaceContents={spaceContents}
                        onProductClick={(p) => pushModal('product', p)}
                        onSwatchClick={(s) => pushModal('swatch', s)}
                        onSceneClick={(s, spaceId) => pushModal('scene', { ...s, spaceId })}
                        activeCategory={activeCategory}
                        onNavClick={setActiveCategory}
                        isAdmin={isAdmin}
                        searchTerm={searchTerm}
                        filters={filters}
                        sortOption={sortOption}
                        sortDirection={sortDirection}
                        activeSpaceTag={activeSpaceTag}
                        setActiveSpaceTag={setActiveSpaceTag}
                        favorites={favorites}
                        toggleFavorite={toggleFavorite} // Fix: Passing prop
                        handleAdminAction={handleAdminAction}
                   />
               )}
             </>
          )}

          {showScrollTop && (
              <button 
                onClick={() => mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} 
                className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-10 h-10 md:w-12 md:h-12 bg-black/80 backdrop-blur-md text-white rounded-full shadow-lg flex items-center justify-center hover:bg-black hover:scale-110 transition-all z-40 animate-in fade-in slide-in-from-bottom-4 print:hidden"
              >
                  <ChevronsUp className="w-6 h-6" />
              </button>
          )}
        </div>
      </main>

      {/* ----------------------------------------------------------------------
          Modal Stack Renderer
          ---------------------------------------------------------------------- */}
      {modalStack.map((modal, index) => {
         const zIndex = 100 + index * 10;
         
         return (
             <div key={modal.id} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200" style={{ zIndex }}>
                 <div className="absolute inset-0" onClick={() => index === modalStack.length - 1 && popModal()}></div>
                 
                 <div className="relative w-full h-full md:h-auto pointer-events-none flex items-center justify-center">
                    <div className="pointer-events-auto w-full flex justify-center">
                       {/* Render specific modal based on type */}
                       {modal.type === 'product' && (
                           <ProductDetailModal 
                               product={modal.data} 
                               allProducts={products}
                               swatches={swatches}
                               spaceContents={spaceContents}
                               onClose={popModal}
                               onEdit={() => pushModal('form', modal.data)} 
                               isAdmin={isAdmin}
                               showToast={showToast}
                               isFavorite={favorites.includes(modal.data.id)}
                               onToggleFavorite={(e) => toggleFavorite(e, modal.data.id)}
                               onNavigateProduct={(p) => pushModal('product', p)}
                               onNavigateSwatch={(s) => pushModal('swatch', s)}
                               onNavigateScene={(s) => pushModal('scene', s)}
                               onNavigateSpace={(sid) => { closeModalAll(); setActiveCategory(sid); }}
                           />
                       )}

                       {modal.type === 'swatch' && (
                           <SwatchDetailModal 
                               swatch={modal.data}
                               allProducts={products}
                               swatches={swatches}
                               onClose={popModal}
                               isAdmin={isAdmin}
                               onEdit={() => pushModal('swatchForm', modal.data)}
                               onNavigateProduct={(p) => pushModal('product', p)}
                           />
                       )}

                       {modal.type === 'form' && (
                           <ProductFormModal 
                               categories={CATEGORIES.filter(c => !c.isSpecial)} 
                               swatches={swatches}
                               allProducts={products}
                               existingData={modal.data}
                               onClose={popModal}
                               onSave={(d) => handleAdminAction('SAVE_PRODUCT', d)}
                               onDelete={(id) => handleAdminAction('DELETE_PRODUCT', id)}
                           />
                       )}

                       {modal.type === 'swatchForm' && (
                           <SwatchFormModal 
                               category={SWATCH_CATEGORIES.find(c => c.id === (modal.data?.category || 'MESH')) || SWATCH_CATEGORIES[0]}
                               existingData={modal.data}
                               onClose={popModal}
                               onSave={(d) => handleAdminAction('SAVE_SWATCH', d)}
                           />
                       )}

                       {modal.type === 'scene' && (
                           <SpaceSceneModal 
                               scene={modal.data}
                               products={products.filter(p => modal.data.productIds?.includes(p.id))}
                               allProducts={products}
                               isAdmin={isAdmin}
                               onClose={popModal}
                               onEdit={() => pushModal('sceneForm', modal.data)}
                               onNavigateProduct={(p) => pushModal('product', p)}
                               onProductToggle={async (pid, add) => {
                                  const scene = modal.data;
                                  const newPids = add ? [...(scene.productIds||[]), pid] : (scene.productIds||[]).filter(id=>id!==pid);
                                  const updated = { ...scene, productIds: newPids };
                                  const spaceId = scene.spaceId;
                                  if(spaceId && spaceContents[spaceId]) {
                                      const newScenes = spaceContents[spaceId].scenes.map(s => s.id === scene.id ? updated : s);
                                      if(isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), { scenes: newScenes }, { merge: true });
                                  }
                               }}
                           />
                       )}

                       {modal.type === 'sceneForm' && (
                           <SceneEditModal 
                              initialData={modal.data}
                              allProducts={products}
                              spaceTags={SPACES.find(s=>s.id===modal.data.spaceId)?.defaultTags || []}
                              onClose={popModal}
                              onSave={async (d) => {
                                  const spaceId = d.spaceId || modal.data.spaceId;
                                  const scenes = spaceContents[spaceId]?.scenes || [];
                                  let newScenes = [];
                                  if(d.id) newScenes = scenes.map(s => s.id === d.id ? d : s);
                                  else newScenes = [...scenes, { ...d, id: Date.now().toString() }];
                                  
                                  if(isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), { scenes: newScenes }, { merge: true });
                                  popModal();
                                  showToast("Scene Saved");
                              }}
                              onDelete={async (id) => {
                                  if(!window.confirm("Delete Scene?")) return; // Fix: window.confirm
                                  const spaceId = modal.data.spaceId;
                                  const newScenes = (spaceContents[spaceId]?.scenes || []).filter(s => s.id !== id);
                                  if(isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), { scenes: newScenes }, { merge: true });
                                  popModal();
                              }}
                           />
                       )}

                       {modal.type === 'spaceInfo' && (
                           <SpaceInfoEditModal 
                               spaceId={modal.data.spaceId}
                               currentData={spaceContents[modal.data.spaceId]}
                               defaultTags={SPACES.find(s=>s.id===modal.data.spaceId)?.defaultTags}
                               onClose={popModal}
                               onSave={async (d) => {
                                   if(isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', modal.data.spaceId), d, { merge: true });
                                   popModal();
                                   showToast("Info Updated");
                               }}
                           />
                       )}

                       {modal.type === 'spaceProducts' && (
                           <SpaceProductManager 
                               spaceId={modal.data.spaceId}
                               products={products}
                               onClose={popModal}
                               onToggle={async (pid, add) => {
                                   const product = products.find(p=>p.id===pid);
                                   let newSpaces = product.spaces || [];
                                   if(add) { if(!newSpaces.includes(modal.data.spaceId)) newSpaces.push(modal.data.spaceId); }
                                   else { newSpaces = newSpaces.filter(s=>s!==modal.data.spaceId); }
                                   handleAdminAction('SAVE_PRODUCT', { ...product, spaces: newSpaces });
                               }}
                           />
                       )}
                    </div>
                 </div>
             </div>
         );
      })}

      {toast && (
          <div className="fixed bottom-8 right-8 bg-zinc-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-bottom-10 fade-in z-[200] print:hidden">
              {toast.type === 'success' ? <Check className="w-5 h-5 text-green-400" /> : <Info className="w-5 h-5 text-red-400" />}
              <span className="text-sm font-bold tracking-wide">{toast.message}</span>
          </div>
      )}
      
      {showAdminDashboard && (
          <AdminDashboardModal 
             isOpen={showAdminDashboard} 
             onClose={()=>setShowAdminDashboard(false)} 
             products={products} 
             swatches={swatches}
             spaceContents={spaceContents}
             onImport={(e) => {
                 const file = e.target.files[0];
                 if (!file) return;
                 const reader = new FileReader();
                 reader.onload = async (event) => {
                     try {
                        const imported = JSON.parse(event.target.result);
                        if (window.confirm(`Import ${imported.products?.length || 0} items?`)) { // Fix: window.confirm
                            if (!isFirebaseAvailable) { 
                                saveToLocalStorage(imported.products||[]); 
                                localStorage.setItem('patra_swatches', JSON.stringify(imported.swatches||[]));
                                window.location.reload(); 
                            } 
                            else { showToast("Import not supported in Firebase mode yet", "error"); }
                        }
                     } catch(e) { showToast("Invalid JSON", "error"); }
                 };
                 reader.readAsText(file);
             }}
             onExport={() => {
                 const dataStr = JSON.stringify({ products, swatches, spaceContents, version: APP_VERSION }, null, 2);
                 const blob = new Blob([dataStr], { type: "application/json" });
                 const url = URL.createObjectURL(blob);
                 const a = document.createElement('a'); a.href = url; a.download = `patra_db_${new Date().toISOString().slice(0,10)}.json`; a.click();
             }}
          />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Part 2: Main Views Components
// ----------------------------------------------------------------------

function MasterView({ products, swatches, spaceContents, activeCategory, onNavClick, onProductClick, onSwatchClick, onSceneClick, isAdmin, searchTerm, filters, sortOption, sortDirection, activeSpaceTag, setActiveSpaceTag, favorites, toggleFavorite, handleAdminAction }) {
    // 1. Data Processing for Filtered View
    const getProcessedProducts = () => {
      let filtered = products.filter(product => {
          if (activeCategory === 'MY_PICK') return favorites.includes(product.id);
          if (activeCategory === 'TOTAL_VIEW' || activeCategory === 'DASHBOARD') return true; 
          if (activeCategory === 'SPACES_ROOT') return product.spaces && product.spaces.length > 0;
          if (activeCategory === 'COLLECTIONS_ROOT') return !product.category.includes('ETC');
          
          // Specific Space
          if (SPACES.find(s => s.id === activeCategory)) {
               let match = product.spaces && product.spaces.includes(activeCategory);
               if (match && activeSpaceTag !== 'ALL') match = product.spaceTags && product.spaceTags.includes(activeSpaceTag);
               return match;
          }
          return product.category === activeCategory;
      });

      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product => {
         const searchFields = [ 
             product.name, product.specs, product.designer, 
             ...(product.features || []), ...(product.options || []), 
             ...(product.bodyColors || []).map(c => typeof c === 'object' ? c.name : c), 
             ...(product.upholsteryColors || []).map(c => typeof c === 'object' ? c.name : c) 
         ];
         const matchesSearch = !searchTerm || searchFields.join(' ').toLowerCase().includes(searchLower);
         let matchesFilter = true;
         if(filters.isNew && !product.isNew) matchesFilter = false;
         if(filters.year && !product.launchDate?.startsWith(filters.year)) matchesFilter = false;
         if(filters.color) {
            const colorMatch = [...(product.bodyColors||[]), ...(product.upholsteryColors||[])].some(c => { 
                const name = typeof c === 'object' ? c.name : c; 
                return name.toLowerCase().includes(filters.color.toLowerCase()); 
            });
            if(!colorMatch) matchesFilter = false;
         }
         return matchesSearch && matchesFilter;
      });

      filtered.sort((a, b) => {
          let comparison = 0;
          if (sortOption === 'name') comparison = a.name.localeCompare(b.name);
          else if (sortOption === 'launchDate') comparison = parseInt(a.launchDate||0) - parseInt(b.launchDate||0);
          else if (sortOption === 'manual') comparison = (a.orderIndex || 0) - (b.orderIndex || 0);
          else comparison = (a.createdAt || 0) - (b.createdAt || 0);
          return sortDirection === 'asc' ? comparison : -comparison;
      });
      return filtered;
    };

    const processedProducts = getProcessedProducts();
    const isSearching = searchTerm || filters.year || filters.color || filters.isNew || (activeCategory !== 'TOTAL_VIEW' && activeCategory !== 'DASHBOARD');

    // 2. Render Search Results
    if (isSearching) {
        return (
            <div className="pb-20 animate-in fade-in">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-black">{activeCategory === 'MY_PICK' ? 'MY PICK' : (CATEGORIES.find(c => c.id === activeCategory)?.label || activeCategory)}</h2>
                        <p className="text-zinc-500 text-sm">{processedProducts.length} items found</p>
                    </div>
                </div>
                {processedProducts.length === 0 ? (
                    <div className="py-20 text-center text-zinc-400">No products found matching your criteria.</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {processedProducts.map(p => (
                            <ProductCard 
                                key={p.id} 
                                product={p} 
                                onClick={() => onProductClick(p)} 
                                isAdmin={isAdmin} 
                                isFavorite={favorites.includes(p.id)} 
                                onToggleFavorite={(e) => toggleFavorite(e, p.id)} 
                                onDuplicate={(e) => { e.stopPropagation(); handleAdminAction('SAVE_PRODUCT', {...p, id: Date.now(), name: `${p.name} (Copy)`}) }}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // 3. Render Master View Hub
    const recentProducts = [...products].sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 8);
    const displayScenes = [];
    Object.keys(spaceContents).forEach(spaceId => {
        (spaceContents[spaceId].scenes || []).forEach(s => displayScenes.push({ ...s, spaceId }));
    });
    const featuredScenes = displayScenes.slice(0, 3); 
    const featuredSwatches = swatches.slice(0, 12);

    return (
        <div className="pb-20 space-y-16 animate-in fade-in">
            <div className="bg-zinc-900 text-white p-8 md:p-12 rounded-3xl relative overflow-hidden flex flex-col justify-end min-h-[300px]">
                <div className="relative z-10 max-w-2xl">
                    <span className="text-zinc-400 font-bold tracking-widest text-xs uppercase mb-2 block">Archive V.0.7.5</span>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">MASTER<br/>ARCHIVE</h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        Patra Design Lab's comprehensive database.<br/>
                        Explore curated spaces, material libraries, and product collections.
                    </p>
                </div>
                <div className="absolute right-[-10%] bottom-[-20%] opacity-10 pointer-events-none rotate-12">
                     <LayoutGrid className="w-96 h-96 text-white"/>
                </div>
            </div>

            <section>
                <div className="flex justify-between items-end mb-6 border-b border-zinc-100 pb-4">
                    <div>
                        <h2 className="text-3xl font-black flex items-center mb-1">SPACES</h2>
                        <p className="text-zinc-500 text-sm">Curated scenes for every environment</p>
                    </div>
                    <button onClick={() => onNavClick('SPACES_ROOT')} className="text-sm font-bold bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-full transition-colors">
                        Explore All Spaces
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {featuredScenes.map(scene => (
                        <div key={scene.id} onClick={() => onSceneClick(scene, scene.spaceId)} className="group cursor-pointer">
                            <div className="aspect-video bg-zinc-100 rounded-2xl overflow-hidden mb-3 relative">
                                <img src={scene.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt=""/>
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase">
                                    {SPACES.find(s=>s.id===scene.spaceId)?.label}
                                </div>
                            </div>
                            <h3 className="font-bold text-lg leading-tight group-hover:text-blue-600 transition-colors">{scene.title}</h3>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <div className="flex justify-between items-end mb-6 border-b border-zinc-100 pb-4">
                    <div>
                        <h2 className="text-3xl font-black flex items-center mb-1">NEW ARRIVALS</h2>
                        <p className="text-zinc-500 text-sm">Latest updates from the design lab</p>
                    </div>
                    <button onClick={() => { onNavClick('DASHBOARD'); }} className="text-sm font-bold bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-full transition-colors">
                        View Dashboard
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {recentProducts.map(p => (
                        <ProductCard 
                            key={p.id} 
                            product={p} 
                            onClick={() => onProductClick(p)} 
                            isAdmin={isAdmin}
                            isFavorite={favorites.includes(p.id)}
                            onToggleFavorite={(e) => toggleFavorite(e, p.id)}
                            onDuplicate={(e) => {e.stopPropagation(); handleAdminAction('SAVE_PRODUCT', {...p, id: Date.now(), name: `${p.name} (Copy)`})}}
                        />
                    ))}
                </div>
            </section>

            <section>
                 <div className="flex justify-between items-end mb-6 border-b border-zinc-100 pb-4">
                    <div>
                        <h2 className="text-3xl font-black flex items-center mb-1">MATERIALS</h2>
                        <p className="text-zinc-500 text-sm">Textures, colors, and finishes</p>
                    </div>
                    <button onClick={() => onNavClick('MATERIALS_ROOT')} className="text-sm font-bold bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-full transition-colors">
                        Browse Library
                    </button>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {featuredSwatches.map(s => (
                        <div key={s.id} onClick={() => onSwatchClick(s)} className="cursor-pointer group flex flex-col items-center">
                            <SwatchDisplay color={s} size="large" className="w-full aspect-square rounded-2xl mb-2 shadow-sm group-hover:shadow-md transition-all"/>
                            <span className="text-[10px] font-bold text-zinc-500 truncate w-full text-center group-hover:text-black">{s.name}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function SpacesRootView({ spaceContents, allProducts, searchTerm, onSceneClick, onNavClick }) {
    const getFilteredScenes = () => {
        if (!searchTerm) return [];
        const results = [];
        Object.keys(spaceContents).forEach(spaceId => {
            (spaceContents[spaceId].scenes || []).forEach(s => {
                if(s.title.toLowerCase().includes(searchTerm.toLowerCase()) || (s.tags||[]).join(' ').toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push({ ...s, spaceId });
                }
            });
        });
        return results;
    };

    const filteredScenes = getFilteredScenes();

    if (searchTerm) {
        return (
            <div className="pb-20 animate-in fade-in">
                <h2 className="text-xl font-bold mb-4">Search Results in Spaces: "{searchTerm}"</h2>
                {filteredScenes.length === 0 ? <p className="text-zinc-400">No scenes found.</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {filteredScenes.map(s => (
                            <div key={s.id} onClick={() => onSceneClick(s, s.spaceId)} className="cursor-pointer group">
                                <div className="aspect-video rounded-xl overflow-hidden mb-2 bg-zinc-100">
                                    <img src={s.image} className="w-full h-full object-cover" />
                                </div>
                                <h4 className="font-bold text-sm">{s.title}</h4>
                                <span className="text-xs text-zinc-500 uppercase">{SPACES.find(sp=>sp.id===s.spaceId)?.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="pb-20 space-y-20 animate-in fade-in">
            <div className="text-center py-10">
                <h1 className="text-4xl font-black mb-2">SPACES</h1>
                <p className="text-zinc-500">Explore our curated environments.</p>
            </div>

            {SPACES.map((space, idx) => {
                const content = spaceContents[space.id] || {};
                const scenes = (content.scenes || []).slice(0, 3); 

                return (
                    <section key={space.id} className="relative">
                        <div className="flex justify-between items-center mb-6">
                             <div className="flex items-center group cursor-pointer" onClick={() => onNavClick(space.id)}>
                                 <div className="p-3 bg-zinc-100 rounded-2xl mr-4 group-hover:bg-zinc-200 transition-colors"><space.icon className="w-6 h-6 text-zinc-700"/></div>
                                 <div>
                                     <h2 className="text-3xl font-black group-hover:text-blue-600 transition-colors">{space.label}</h2>
                                     <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Collection</span>
                                 </div>
                             </div>
                             <button onClick={() => onNavClick(space.id)} className="hidden md:block px-6 py-2 border border-zinc-200 rounded-full text-sm font-bold hover:bg-black hover:text-white transition-all">
                                 View Full Space
                             </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {scenes.map(s => (
                                <div key={s.id} onClick={() => onSceneClick(s, space.id)} className="cursor-pointer group">
                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-zinc-100 relative shadow-sm hover:shadow-xl transition-all">
                                        <img src={s.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                    </div>
                                    <h4 className="font-bold text-lg leading-tight">{s.title}</h4>
                                    <p className="text-sm text-zinc-500 line-clamp-1">{s.description}</p>
                                </div>
                            ))}
                            {scenes.length === 0 && (
                                <div className="col-span-3 h-40 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 font-medium">
                                    Coming Soon
                                </div>
                            )}
                        </div>
                        <button onClick={() => onNavClick(space.id)} className="md:hidden w-full mt-4 py-3 bg-zinc-50 text-zinc-600 font-bold rounded-xl text-sm">
                            View All {space.label}
                        </button>
                    </section>
                );
            })}
        </div>
    );
}

function MaterialsRootView({ swatches, searchTerm, onSwatchClick, onNavClick }) {
    const displaySwatches = searchTerm 
       ? swatches.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.materialCode?.toLowerCase().includes(searchTerm.toLowerCase()))
       : swatches;

    if (searchTerm) {
        return (
            <div className="pb-20 animate-in fade-in">
                <h2 className="text-xl font-bold mb-4">Search Results in Materials: "{searchTerm}"</h2>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {displaySwatches.map(s => (
                        <div key={s.id} onClick={() => onSwatchClick(s)} className="cursor-pointer">
                             <SwatchDisplay color={s} size="large" className="w-full aspect-square rounded-xl overflow-hidden mb-2"/>
                             <div className="text-xs font-bold truncate">{s.name}</div>
                             <div className="text-[10px] text-zinc-400">{s.materialCode}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="pb-20 space-y-12 animate-in fade-in">
            <div className="text-center py-10 bg-zinc-50 rounded-3xl mb-8">
                <h1 className="text-4xl font-black mb-2">MATERIAL LIBRARY</h1>
                <p className="text-zinc-500">The essential palette of Patra.</p>
            </div>

            {SWATCH_CATEGORIES.map(cat => {
                const catSwatches = swatches.filter(s => s.category === cat.id).slice(0, 6);
                if(catSwatches.length === 0) return null;
                return (
                    <section key={cat.id}>
                         <div className="flex justify-between items-center mb-4 border-b border-zinc-100 pb-2">
                             <h2 className="text-2xl font-black cursor-pointer hover:text-blue-600 flex items-center" onClick={() => onNavClick(cat.id)}>
                                <div className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: cat.color}}></div>
                                {cat.label}
                             </h2>
                             <button onClick={() => onNavClick(cat.id)} className="text-xs font-bold text-zinc-400 hover:text-black uppercase tracking-wider">View All</button>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                             {catSwatches.map(s => (
                                 <div key={s.id} onClick={() => onSwatchClick(s)} className="cursor-pointer group">
                                     <SwatchDisplay color={s} size="large" className="w-full aspect-square rounded-2xl overflow-hidden mb-2 shadow-sm group-hover:shadow-md transition-shadow"/>
                                     <div className="text-xs font-bold truncate group-hover:text-blue-600">{s.name}</div>
                                     <div className="text-[10px] text-zinc-400">{s.materialCode}</div>
                                 </div>
                             ))}
                         </div>
                    </section>
                );
            })}
        </div>
    );
}

function CollectionsRootView({ categories, products, onProductClick, onNavClick, favorites, toggleFavorite, isAdmin, handleAdminAction }) {
    return (
        <div className="pb-20 space-y-16 animate-in fade-in">
             <div className="text-center py-10">
                <h1 className="text-4xl font-black mb-2">COLLECTIONS</h1>
                <p className="text-zinc-500">Our complete product lineup.</p>
            </div>

            {categories.map(cat => {
                const catProducts = products.filter(p => p.category === cat.id).slice(0, 4);
                if(catProducts.length === 0) return null;
                return (
                    <section key={cat.id}>
                        <div className="flex justify-between items-center mb-6">
                             <h2 className="text-3xl font-black cursor-pointer hover:text-blue-600" onClick={() => onNavClick(cat.id)}>{cat.label}</h2>
                             <button onClick={() => onNavClick(cat.id)} className="text-sm font-bold bg-zinc-50 px-4 py-2 rounded-full hover:bg-zinc-100">See All {cat.label}</button>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                             {catProducts.map(p => (
                                 <ProductCard 
                                    key={p.id} 
                                    product={p} 
                                    onClick={() => onProductClick(p)} 
                                    isAdmin={isAdmin}
                                    isFavorite={favorites.includes(p.id)}
                                    onToggleFavorite={(e) => toggleFavorite(e, p.id)}
                                    onDuplicate={(e) => {e.stopPropagation(); handleAdminAction('SAVE_PRODUCT', {...p, id: Date.now(), name: `${p.name} (Copy)`})}}
                                 />
                             ))}
                         </div>
                    </section>
                );
            })}
        </div>
    );
}

function DashboardView({ products, favorites, setActiveCategory, onProductClick, isAdmin, bannerData, onBannerUpload, onLogoUpload, onBannerTextChange, onSaveBannerText }) {
  const totalCount = products.length; 
  const newCount = products.filter(p => p.isNew).length; 
  const pickCount = favorites.length;
  
  const categoryCounts = []; 
  let totalStandardProducts = 0;
  CATEGORIES.filter(c => !c.isSpecial).forEach(c => { 
      const count = products.filter(p => p.category === c.id).length; 
      if (count > 0) { 
          categoryCounts.push({ ...c, count }); 
          totalStandardProducts += count; 
      } 
  });
  
  const donutColors = ['#2563eb', '#0891b2', '#7c3aed', '#db2777', '#059669', '#d97706', '#ea580c', '#475569', '#9ca3af'];
  const chartData = categoryCounts.map((item, idx) => ({ ...item, color: donutColors[idx % donutColors.length] }));
  
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null); 

  const getSelectedSliceDetails = () => {
      if(selectedSlice === null) return null;
      const catId = chartData[selectedSlice].id;
      const catProducts = products.filter(p => p.category === catId);
      const years = [...new Set(catProducts.map(p => p.launchDate ? p.launchDate.substring(0,4) : 'Unknown'))].sort().join(', ');
      const awardCount = catProducts.reduce((acc, curr) => acc + (curr.features?.length || 0), 0);
      return { products: catProducts, years, awardCount };
  };
  const sliceDetails = getSelectedSliceDetails();

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in pb-20 print:hidden" onClick={() => setSelectedSlice(null)}>
      <div className="relative w-full h-48 md:h-80 rounded-3xl overflow-hidden shadow-lg border border-zinc-200 group bg-zinc-900">
         <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10"></div>
         {bannerData.url ? <img src={bannerData.url} alt="Banner" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><img src="/api/placeholder/1200/400" className="w-full h-full object-cover grayscale" /></div>}
         <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 z-20 max-w-2xl text-white">
            {isAdmin ? (
                <div className="space-y-4">
                   <div className="flex items-center gap-4">
                      {bannerData.logoUrl && <img src={bannerData.logoUrl} className="h-12 w-auto object-contain bg-white/10 rounded p-1"/>}
                      <input type="text" value={bannerData.title} onChange={(e) => onBannerTextChange('title', e.target.value)} onBlur={onSaveBannerText} className="bg-transparent text-4xl font-black w-full outline-none" placeholder="Title"/>
                   </div>
                   <input type="text" value={bannerData.subtitle} onChange={(e) => onBannerTextChange('subtitle', e.target.value)} onBlur={onSaveBannerText} className="bg-transparent text-xl w-full outline-none" placeholder="Subtitle"/>
                   <div className="flex gap-2">
                       <label className="text-xs bg-white/20 px-2 py-1 rounded cursor-pointer hover:bg-white/30">Change Banner <input type="file" className="hidden" onChange={onBannerUpload}/></label>
                       <label className="text-xs bg-white/20 px-2 py-1 rounded cursor-pointer hover:bg-white/30">Change Logo <input type="file" className="hidden" onChange={onLogoUpload}/></label>
                   </div>
                </div>
            ) : (
                <>
                   {bannerData.logoUrl ? <img src={bannerData.logoUrl} className="h-10 md:h-16 w-auto object-contain mb-4" /> : <h2 className="text-4xl md:text-6xl font-black mb-2">{bannerData.title}</h2>}
                   <p className="text-lg md:text-xl text-zinc-300 font-light">{bannerData.subtitle}</p>
                </>
            )}
         </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
          <div onClick={() => setActiveCategory('TOTAL_VIEW')} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md cursor-pointer group transition-all">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider group-hover:text-black">Total Products</span>
              <div className="text-4xl font-black text-zinc-900 mt-2">{totalCount}</div>
          </div>
          <div onClick={() => setActiveCategory('NEW')} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md cursor-pointer group transition-all">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider group-hover:text-red-600">New Arrivals</span>
              <div className="text-4xl font-black text-zinc-900 mt-2">{newCount}</div>
          </div>
          <div onClick={() => setActiveCategory('MY_PICK')} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md cursor-pointer group transition-all">
              <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider group-hover:text-yellow-600">My Pick</span>
              <div className="text-4xl font-black text-zinc-900 mt-2">{pickCount}</div>
          </div>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-3xl border border-zinc-100 shadow-sm relative overflow-hidden">
          <h3 className="text-xl font-bold mb-8 flex items-center"><PieChart className="w-6 h-6 mr-2 text-zinc-400"/> Category Contribution</h3>
          
          <div className="flex flex-col lg:flex-row gap-12 items-center">
             <div className="relative w-80 h-80 flex-shrink-0">
                 <PieChartComponent data={chartData} total={totalStandardProducts} selectedIndex={selectedSlice} onSelect={setSelectedSlice} />
             </div>

             <div className="flex-1 w-full min-h-[300px] flex flex-col justify-center">
                 {selectedSlice !== null ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                             <div className="w-6 h-6 rounded-full shadow-sm" style={{backgroundColor: chartData[selectedSlice].color}}></div>
                             <div>
                                 <h4 className="text-3xl font-black">{chartData[selectedSlice].label}</h4>
                                 <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Category Overview</p>
                             </div>
                             <button onClick={() => setActiveCategory(chartData[selectedSlice].id)} className="ml-auto px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-full hover:bg-black transition-colors">
                                 View All
                             </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-zinc-50 p-4 rounded-2xl text-center">
                                <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Products</span>
                                <span className="text-2xl font-black text-zinc-900">{chartData[selectedSlice].count}</span>
                            </div>
                            <div className="bg-zinc-50 p-4 rounded-2xl text-center">
                                <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">New</span>
                                <span className="text-2xl font-black text-zinc-900">{sliceDetails.products.filter(p=>p.isNew).length}</span>
                            </div>
                            <div className="bg-zinc-50 p-4 rounded-2xl text-center">
                                <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Features</span>
                                <span className="text-2xl font-black text-zinc-900">{sliceDetails.awardCount}</span>
                            </div>
                        </div>

                        <div className="border border-zinc-200 rounded-xl mb-3 overflow-hidden bg-white">
                            <button onClick={() => setExpandedSection(expandedSection === 'launch' ? null : 'launch')} className="w-full flex justify-between items-center p-4 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold uppercase text-zinc-600 transition-colors">
                                <span>Launching History</span>
                                {expandedSection === 'launch' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                            </button>
                            {expandedSection === 'launch' && (
                                <div className="p-4 bg-white text-sm text-zinc-600 leading-relaxed border-t border-zinc-200 animate-in slide-in-from-top-2">
                                    <div className="flex flex-wrap gap-2">
                                        {sliceDetails.years.split(', ').map(y => (
                                            <span key={y} className="px-2 py-1 bg-zinc-100 rounded text-xs font-bold text-zinc-500">{y}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                            <button onClick={() => setExpandedSection(expandedSection === 'list' ? null : 'list')} className="w-full flex justify-between items-center p-4 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold uppercase text-zinc-600 transition-colors">
                                <span>Product List</span>
                                {expandedSection === 'list' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                            </button>
                            {expandedSection === 'list' && (
                                <div className="p-2 bg-white border-t border-zinc-200 max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-2 gap-1">
                                        {sliceDetails.products.map(p => (
                                            <button key={p.id} onClick={() => onProductClick(p)} className="text-left text-xs font-medium text-zinc-600 hover:bg-blue-50 hover:text-blue-600 p-2 rounded truncate transition-colors flex items-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 mr-2"></div>
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                 ) : (
                     <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-full content-center opacity-50 hover:opacity-100 transition-opacity">
                        {chartData.map(item => (
                            <button key={item.id} onClick={(e) => { e.stopPropagation(); setActiveCategory(item.id); }} className="p-3 rounded-xl hover:bg-zinc-50 text-left group transition-all">
                                <div className="flex items-center mb-2"><div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor:item.color}}></div><span className="font-bold text-xs text-zinc-500 group-hover:text-black uppercase tracking-wide">{item.label}</span></div>
                                <div className="text-xl font-black text-zinc-300 group-hover:text-zinc-900 transition-colors">{item.count}</div>
                            </button>
                        ))}
                     </div>
                 )}
             </div>
          </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onClick, isAdmin, isFavorite, onToggleFavorite, onDuplicate }) {
    return (
        <div onClick={onClick} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border border-zinc-100 relative flex flex-col h-full">
            <div className="relative aspect-[4/3] bg-zinc-50 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-zinc-100/30 mix-blend-multiply pointer-events-none z-10"></div>
                
                <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                   {isAdmin && <button onClick={onDuplicate} className="p-1.5 bg-white/90 backdrop-blur rounded-full text-zinc-400 hover:text-green-600 shadow-sm"><Layers className="w-3.5 h-3.5"/></button>}
                   <button onClick={onToggleFavorite} className="p-1.5 bg-white/90 backdrop-blur rounded-full text-zinc-300 hover:text-yellow-400 shadow-sm"><Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} /></button>
                </div>
                
                {product.isNew && <span className="absolute top-2 left-2 bg-black text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm z-20">NEW</span>}
                
                <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105 p-4">
                    {product.images?.[0] ? <img src={typeof product.images[0] === 'object' ? product.images[0].url : product.images[0]} className="w-full h-full object-contain mix-blend-multiply" /> : <ImageIcon className="w-8 h-8 text-zinc-300"/>}
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col bg-white">
                <h3 className="text-sm font-extrabold text-zinc-900 leading-tight group-hover:text-blue-600 line-clamp-1 mb-1">{product.name}</h3>
                <p className="text-xs text-zinc-400 mb-3">{product.designer || 'Patra Design'}</p>
                
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-zinc-50">
                     <span className="text-[10px] font-bold text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded uppercase">{product.category}</span>
                     {(product.bodyColors?.length > 0 || product.upholsteryColors?.length > 0) && (
                         <div className="flex -space-x-1">
                             {[...(product.bodyColors||[]), ...(product.upholsteryColors||[])].slice(0,3).map((c,i)=>(
                                 <div key={i} className="w-3 h-3 rounded-full border border-white" style={{backgroundColor: typeof c==='object'?c.hex:c}}></div>
                             ))}
                             {([...(product.bodyColors||[]), ...(product.upholsteryColors||[])].length > 3) && <div className="w-3 h-3 rounded-full bg-zinc-100 border border-white flex items-center justify-center text-[6px] text-zinc-400">+</div>}
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
}

function SwatchDisplay({ color, size = 'medium', className = '', onClick }) {
  const isObject = typeof color === 'object' && color !== null;
  const hex = isObject ? color.hex : color;
  const image = isObject ? color.image : null;
  const visualType = isObject ? (color.visualType || 'SOLID') : 'SOLID';
  const gradient = isObject ? color.gradient : null;

  const sizeClass = size === 'large' ? 'w-full h-full' : size === 'small' ? 'w-4 h-4' : 'w-6 h-6';
  const roundedClass = size === 'large' ? '' : 'rounded-full'; 
  
  const baseStyle = image ? { backgroundImage: `url(${image})`, backgroundSize: 'cover' } : (visualType === 'GRADATION' && gradient) ? { background: gradient } : { backgroundColor: hex };

  return (
    <div className={`group relative inline-block overflow-hidden ${size !== 'large' ? sizeClass : 'w-full h-full'} ${roundedClass} ${className} ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
       <div className={`w-full h-full ${roundedClass} bg-zinc-100 flex items-center justify-center relative shadow-inner`} style={baseStyle}>
       </div>
    </div>
  );
}

function PieChartComponent({ data, total, selectedIndex, onSelect }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  let cumulativePercent = 0;
  const radius = 0.8; 

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="-1.6 -1.6 3.2 3.2" className="w-full h-full transform -rotate-90">
        {data.map((item, idx) => {
           const percent = item.count / total;
           const startAngle = cumulativePercent * 2 * Math.PI;
           cumulativePercent += percent;
           const endAngle = cumulativePercent * 2 * Math.PI;

           const x1 = Math.cos(startAngle) * radius;
           const y1 = Math.sin(startAngle) * radius;
           const x2 = Math.cos(endAngle) * radius;
           const y2 = Math.sin(endAngle) * radius;
           
           const largeArcFlag = percent > 0.5 ? 1 : 0;
           const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

           const isSelected = selectedIndex === idx;
           const isHovered = hoveredIndex === idx;
           
           const midAngle = startAngle + (endAngle - startAngle) / 2;
           const explodeDist = isSelected ? 0.15 : (isHovered ? 0.05 : 0); 
           const tx = Math.cos(midAngle) * explodeDist;
           const ty = Math.sin(midAngle) * explodeDist;

           const strokeWidth = isSelected ? 0.25 : 0.2; 
           const opacity = selectedIndex !== null && !isSelected ? 0.3 : 1;

           return (
             <React.Fragment key={item.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  transform={`translate(${tx}, ${ty})`}
                  className="transition-all duration-500 ease-out cursor-pointer"
                  style={{ opacity }}
                  onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : idx); }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
             </React.Fragment>
           );
        })}
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none transition-all duration-300">
         {selectedIndex !== null ? (
            <div className="animate-in zoom-in-50 duration-300 text-center">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">Selected</span>
                <span className="text-3xl font-black text-zinc-900 leading-none" style={{color: data[selectedIndex].color}}>{data[selectedIndex].count}</span>
            </div>
         ) : (
            <div className="text-center">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">TOTAL</span>
                <span className="text-4xl font-black text-zinc-900 leading-none">{total}</span>
            </div>
         )}
      </div>

      {data.map((item, idx) => {
          let prevP = 0; for(let i=0; i<idx; i++) prevP += data[i].count/total;
          const p = item.count/total;
          const mid = prevP + p/2;
          const angle = (mid * 2 * Math.PI) - (Math.PI/2); 
          
          const isSel = selectedIndex === idx;
          const r = 1.15 + (isSel ? 0.15 : 0); 
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;

          if(selectedIndex !== null && !isSel) return null;
          if(selectedIndex === null && p < 0.08) return null; 

          return (
              <div 
                key={`lbl-${idx}`}
                className="absolute text-[10px] font-bold text-zinc-500 pointer-events-none transition-all duration-500 whitespace-nowrap"
                style={{ 
                    left: '50%', top: '50%',
                    transform: `translate(calc(-50% + ${x * 120}px), calc(-50% + ${y * 120}px))` 
                }}
              >
                  {item.label}
              </div>
          )
      })}
    </div>
  );
}
// ----------------------------------------------------------------------
// Part 3: Detail Modals, Forms & Admin Views
// ----------------------------------------------------------------------

function ProductDetailModal({ product, allProducts, swatches, spaceContents, onClose, onEdit, isAdmin, showToast, isFavorite, onToggleFavorite, onNavigateProduct, onNavigateSwatch, onNavigateSpace, onNavigateScene }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product.images || [];
  const currentEntry = images[currentImageIndex];
  const currentUrl = typeof currentEntry === 'object' ? currentEntry.url : currentEntry;
  const currentCap = typeof currentEntry === 'object' ? currentEntry.caption : '';

  // Find related context (Spaces & Scenes)
  const relatedSpaces = SPACES.filter(s => product.spaces && product.spaces.includes(s.id));
  const relatedScenes = [];
  Object.keys(spaceContents).forEach(sid => {
      (spaceContents[sid]?.scenes||[]).forEach(sc => {
          if(sc.productIds?.includes(product.id)) relatedScenes.push({...sc, spaceId: sid});
      });
  });

  return (
      <div className="bg-white w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
         <div className="absolute top-4 right-4 z-[110] flex gap-2">
            {isAdmin && <button onClick={onEdit} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><Edit3 className="w-5 h-5 text-zinc-900"/></button>}
            <button onClick={onClose} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><X className="w-5 h-5 text-zinc-900"/></button>
         </div>
         
         {/* Left: Image Gallery */}
         <div className="w-full md:w-1/2 bg-zinc-50 p-6 md:p-8 flex flex-col md:sticky md:top-0 h-[40vh] md:h-full border-r border-zinc-100">
             <div className="flex-1 w-full bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 overflow-hidden relative mb-4">
                 {currentUrl ? <img src={currentUrl} className="w-full h-full object-contain mix-blend-multiply"/> : <ImageIcon className="w-20 h-20 text-zinc-200"/>}
                 {currentCap && <div className="absolute bottom-4 left-4 right-4 text-center"><span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur font-medium">{currentCap}</span></div>}
                 <button onClick={onToggleFavorite} className="absolute top-4 left-4 p-2 bg-white rounded-full shadow border hover:scale-110 transition-transform"><Star className={`w-5 h-5 ${isFavorite?'fill-yellow-400 text-yellow-400':'text-zinc-300'}`}/></button>
             </div>
             {images.length > 1 && <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">{images.map((img, i) => (<button key={i} onClick={()=>setCurrentImageIndex(i)} className={`w-14 h-14 rounded-xl border flex-shrink-0 overflow-hidden transition-all ${currentImageIndex===i?'ring-2 ring-black border-transparent':'border-zinc-200 opacity-60 hover:opacity-100'}`}><img src={typeof img==='object'?img.url:img} className="w-full h-full object-cover"/></button>))}</div>}
         </div>
         
         {/* Right: Product Info */}
         <div className="w-full md:w-1/2 p-6 md:p-10 bg-white overflow-y-auto custom-scrollbar">
             <div className="mb-8">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold bg-zinc-900 text-white px-2 py-0.5 rounded uppercase tracking-widest">{product.category}</span>
                    {product.isNew && <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded uppercase tracking-widest">New</span>}
                 </div>
                 <h2 className="text-4xl font-black mb-1">{product.name}</h2>
                 <p className="text-zinc-500 font-medium text-sm">Designed by {product.designer || 'Patra Design'}</p>
             </div>

             <div className="space-y-8">
                 <div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Specs</h3><p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">{product.specs || 'No specifications available.'}</p></div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Body Color</h3>
                        <div className="flex flex-wrap gap-2">
                            {product.bodyColors?.length > 0 ? product.bodyColors.map((c,i)=><SwatchDisplay key={i} color={c} onClick={()=>onNavigateSwatch(c)} className="hover:ring-2 hover:ring-offset-1 hover:ring-black transition-all rounded-full"/>) : <span className="text-xs text-zinc-300">None</span>}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Upholstery</h3>
                        <div className="flex flex-wrap gap-2">
                            {product.upholsteryColors?.length > 0 ? product.upholsteryColors.map((c,i)=><SwatchDisplay key={i} color={c} onClick={()=>onNavigateSwatch(c)} className="hover:ring-2 hover:ring-offset-1 hover:ring-black transition-all rounded-full"/>) : <span className="text-xs text-zinc-300">None</span>}
                        </div>
                    </div>
                 </div>

                 {/* Context Links (Spaces & Scenes) */}
                 <div className="pt-8 border-t border-zinc-100">
                     <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Related Context</h3>
                     <div className="grid grid-cols-1 gap-4">
                         {relatedSpaces.length > 0 && (
                             <div>
                                 <span className="text-[10px] font-bold text-zinc-400 block mb-2">SPACES</span>
                                 <div className="flex flex-wrap gap-2">
                                     {relatedSpaces.map(s => (
                                         <button key={s.id} onClick={()=>onNavigateSpace(s.id)} className="flex items-center space-x-2 px-3 py-2 bg-zinc-50 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-100 hover:text-black transition-colors">
                                             <s.icon className="w-3 h-3"/><span>{s.label}</span>
                                         </button>
                                     ))}
                                 </div>
                             </div>
                         )}
                         {relatedScenes.length > 0 && (
                             <div className="mt-2">
                                 <span className="text-[10px] font-bold text-zinc-400 block mb-2">SCENES</span>
                                 <div className="grid grid-cols-2 gap-2">
                                     {relatedScenes.map(s => (
                                         <button key={s.id} onClick={()=>onNavigateScene(s)} className="flex items-center p-2 bg-white border border-zinc-100 rounded-lg hover:border-zinc-300 hover:shadow-sm transition-all text-left group">
                                             <img src={s.image} className="w-8 h-8 rounded object-cover mr-2 bg-zinc-100"/>
                                             <div className="min-w-0">
                                                 <div className="text-xs font-bold truncate group-hover:text-blue-600">{s.title}</div>
                                             </div>
                                         </button>
                                     ))}
                                 </div>
                             </div>
                         )}
                     </div>
                 </div>
             </div>
         </div>
      </div>
  );
}

function SwatchDetailModal({ swatch, allProducts, swatches, onClose, onNavigateProduct, isAdmin, onEdit }) {
    // Logic: Find products using this swatch
    const relatedProducts = allProducts.filter(p => {
        const inBody = p.bodyColors?.some(c => (typeof c === 'object' ? c.id === swatch.id : false));
        const inUph = p.upholsteryColors?.some(c => (typeof c === 'object' ? c.id === swatch.id : false));
        return inBody || inUph;
    });

    return (
        <div className="bg-white w-full h-full md:h-[80vh] md:max-w-4xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
            <div className="absolute top-4 right-4 z-[100] flex gap-2">
               {isAdmin && <button onClick={onEdit} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><Edit3 className="w-5 h-5 text-zinc-900"/></button>}
               <button onClick={onClose} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><X className="w-5 h-5 text-zinc-900"/></button>
            </div>
            
            {/* Left: Visual (Full fill, no inner circle) */}
            <div className="w-full md:w-5/12 bg-zinc-100 flex items-center justify-center p-8 relative min-h-[30vh]">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full shadow-2xl overflow-hidden ring-4 ring-white flex items-center justify-center bg-white">
                    <SwatchDisplay color={swatch} size="large" className="w-full h-full scale-100 rounded-none"/>
                </div>
            </div>

            {/* Right: Info */}
            <div className="w-full md:w-7/12 bg-white p-8 md:p-10 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="mb-6">
                    <div className="flex gap-2 mb-2">
                        <span className="inline-block px-2.5 py-0.5 bg-zinc-900 text-white text-[10px] font-bold rounded uppercase tracking-widest">{swatch.category}</span>
                        {swatch.tags?.map(t => <span key={t} className="inline-block px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold rounded uppercase tracking-widest">{t}</span>)}
                    </div>
                    <h2 className="text-4xl font-black text-zinc-900 tracking-tight mb-1">{swatch.name}</h2>
                    <span className="text-lg font-bold text-zinc-400 font-mono">{swatch.materialCode || 'NO CODE'}</span>
                </div>

                <div className="space-y-8 flex-1">
                    <div>
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Description</h3>
                        <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                            {swatch.description || "No specific description provided for this material."}
                        </p>
                    </div>
                    
                    <div className="pt-6 border-t border-zinc-100">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Applied Products</h3>
                             <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{relatedProducts.length}</span>
                         </div>
                         <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
                             {relatedProducts.length > 0 ? relatedProducts.map(p => (
                                 <button key={p.id} onClick={() => onNavigateProduct(p)} className="flex items-center p-2 rounded-lg border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all text-left group">
                                     <div className="w-10 h-10 rounded-md bg-zinc-100 overflow-hidden mr-3 flex-shrink-0">
                                        {p.images?.[0] ? <img src={typeof p.images[0] === 'object' ? p.images[0].url : p.images[0]} className="w-full h-full object-cover mix-blend-multiply" /> : <div className="w-full h-full bg-zinc-200"></div>}
                                     </div>
                                     <div className="min-w-0">
                                         <div className="text-xs font-bold text-zinc-900 truncate group-hover:text-blue-600">{p.name}</div>
                                         <div className="text-[10px] text-zinc-500 truncate">{p.category}</div>
                                     </div>
                                 </button>
                             )) : (
                                 <div className="col-span-2 text-center py-6 text-zinc-300 text-xs bg-zinc-50 rounded-lg border border-dashed border-zinc-200">No products currently use this finish.</div>
                             )}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SpaceDetailView({ space, spaceContent, activeTag, setActiveTag, isAdmin, onBannerUpload, onEditInfo, onManageProducts, onAddScene, onViewScene, productCount }) {
  const banner = spaceContent.banner;
  const description = spaceContent.description || "Explore our curated collection of space designs.";
  const trend = spaceContent.trend || "";
  const scenes = spaceContent.scenes || [];
  const tags = spaceContent.tags || space.defaultTags || []; 

  const filteredScenes = activeTag === 'ALL' ? scenes : scenes.filter(s => s.tags && s.tags.includes(activeTag));

  return (
    <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Space Banner */}
      <div className="relative rounded-3xl overflow-hidden h-64 md:h-96 shadow-lg group mb-8 bg-zinc-900 print:hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
        {banner ? <img src={banner} className="w-full h-full object-cover transition-transform duration-1000" alt="Space Banner" /> : <div className="w-full h-full flex items-center justify-center opacity-30"><span className="text-white text-4xl font-bold uppercase">{space.label}</span></div>}
        
        <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 z-20 text-white max-w-3xl">
           <div className="flex items-center space-x-3 mb-3"><div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">{React.createElement(space.icon, { className: "w-6 h-6" })}</div><span className="text-xs font-bold uppercase tracking-widest opacity-80">Space Collection</span></div>
           <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-tight">{space.label}</h2>
           <p className="text-zinc-200 text-sm md:text-lg leading-relaxed font-light line-clamp-2 md:line-clamp-none">{description}</p>
           {trend && (<div className="mt-4 inline-block px-3 py-1 bg-indigo-600/80 backdrop-blur rounded-full text-xs font-bold uppercase tracking-wider">{trend}</div>)}
        </div>
        
        <div className="absolute top-6 right-6 z-30 flex space-x-2">
           {isAdmin && (<><label className="p-2 bg-black/40 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-all cursor-pointer"><Camera className="w-4 h-4" /><input type="file" className="hidden" accept="image/*" onChange={onBannerUpload} /></label><button onClick={onEditInfo} className="p-2 bg-black/40 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-all"><Edit3 className="w-4 h-4" /></button></>)}
        </div>
      </div>

      {/* Tags Filter */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
         <button onClick={() => setActiveTag('ALL')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeTag === 'ALL' ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}>ALL</button>
         {tags.map((tag, idx) => (
            <button key={idx} onClick={() => setActiveTag(tag)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeTag === tag ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}>{tag}</button>
         ))}
      </div>

      {/* Scenes Grid */}
      <div className="mb-12 print:hidden">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-zinc-900 flex items-center">Space Scenes <span className="ml-2 text-sm font-medium text-zinc-400 font-mono">({filteredScenes.length})</span></h3>
            {isAdmin && (<button onClick={onAddScene} className="flex items-center text-xs font-bold bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-black transition-colors shadow-lg"><Plus className="w-4 h-4 mr-2" /> Add Scene</button>)}
        </div>
        
        {filteredScenes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScenes.map((scene) => (
              <div key={scene.id} onClick={() => onViewScene(scene)} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 shadow-md hover:shadow-xl transition-all cursor-pointer">
                <img src={scene.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={scene.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity"></div>
                {scene.productIds && scene.productIds.length > 0 && <div className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center"><Tag className="w-3 h-3 mr-1" /> {scene.productIds.length}</div>}
                <div className="absolute bottom-5 left-5 right-5 text-white transform translate-y-1 group-hover:translate-y-0 transition-transform">
                  <h4 className="text-lg font-bold mb-1 truncate">{scene.title}</h4>
                  <p className="text-xs text-zinc-300 line-clamp-1">{scene.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (<div className="text-center py-16 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-zinc-400">No scenes found for this tag.</div>)}
      </div>

      {/* Products Footer (Managed via Admin) */}
      <div className="flex items-center justify-between mb-6 border-t border-zinc-100 pt-12 print:border-none print:pt-0">
         <h3 className="text-xl font-bold text-zinc-900 flex items-center">Curated Products <span className="ml-2 text-xs font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-full">{productCount}</span></h3>
         {isAdmin && (<button onClick={onManageProducts} className="flex items-center text-xs font-bold text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 px-4 py-2 rounded-full hover:border-zinc-400 transition-colors"><Settings className="w-3.5 h-3.5 mr-2" /> Manage List</button>)}
      </div>
    </div>
  );
}

function SwatchManager({ category, swatches, isAdmin, onSave, onDelete, onSelect, onDuplicate }) {
  const [activeTag, setActiveTag] = useState('ALL');
  const allTags = Array.from(new Set(swatches.flatMap(s => s.tags || []))).sort();
  const filteredSwatches = activeTag === 'ALL' ? swatches : swatches.filter(s => s.tags && s.tags.includes(activeTag));

  return (
    <div className="pb-20 animate-in fade-in">
       <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-zinc-100 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
                <div className="w-4 h-4 rounded-full" style={{backgroundColor: category.color}}></div>
                <h2 className="text-3xl font-black text-zinc-900">{category.label}</h2>
            </div>
            <p className="text-zinc-500 text-sm">{filteredSwatches.length} finishes available</p>
          </div>
          {isAdmin && (
             <button onClick={() => onSave({ category: category.id, visualType: 'SOLID' })} className="px-5 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-full hover:bg-black transition-all flex items-center shadow-lg whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" /> Add Material
             </button>
          )}
       </div>

       {allTags.length > 0 && (
         <div className="mb-8 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <button onClick={() => setActiveTag('ALL')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeTag === 'ALL' ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}>ALL</button>
            {allTags.map(tag => (
               <button key={tag} onClick={() => setActiveTag(tag)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeTag === tag ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}>{tag}</button>
            ))}
         </div>
       )}

       <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {filteredSwatches.map(swatch => (
             <div key={swatch.id} onClick={() => onSelect(swatch)} className="group cursor-pointer">
                <div className="aspect-square relative bg-zinc-100 rounded-2xl overflow-hidden mb-3 shadow-sm hover:shadow-lg transition-all">
                   <SwatchDisplay color={swatch} size="large" className="w-full h-full scale-100 rounded-none"/>
                   {isAdmin && (
                     <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => {e.stopPropagation(); onDuplicate(swatch);}} className="p-1.5 bg-white/80 backdrop-blur rounded-full shadow hover:text-green-600"><Layers className="w-3 h-3"/></button>
                        <button onClick={(e) => {e.stopPropagation(); onDelete(swatch.id);}} className="p-1.5 bg-white/80 backdrop-blur rounded-full shadow hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                     </div>
                   )}
                </div>
                <div>
                   <h4 className="font-bold text-xs truncate mb-1 group-hover:text-blue-600 transition-colors">{swatch.name}</h4>
                   <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded">{swatch.materialCode || '-'}</span>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
}

function SpaceSceneModal({ scene, products, allProducts, isAdmin, onClose, onEdit, onProductToggle, onNavigateProduct }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [filter, setFilter] = useState('');

  return (
    <div className="bg-white w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
         <button onClick={onClose} className="absolute top-4 right-4 z-[110] p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><X className="w-6 h-6 text-zinc-900"/></button>
         {isAdmin && <button onClick={onEdit} className="absolute top-4 right-16 z-[110] p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><Edit3 className="w-6 h-6 text-zinc-900"/></button>}

         {/* Left: Image */}
         <div className="w-full md:w-2/3 bg-black relative flex items-center justify-center h-[40vh] md:h-full group">
            <img src={scene.image} className="max-w-full max-h-full object-contain cursor-zoom-in" onClick={()=>setIsZoomed(true)}/>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Click to Zoom</div>
            
            {isZoomed && <div className="fixed inset-0 z-[150] bg-black flex items-center justify-center cursor-zoom-out" onClick={()=>setIsZoomed(false)}><img src={scene.image} className="max-w-full max-h-full object-contain"/><button className="absolute top-6 right-6 text-white p-2 hover:bg-white/20 rounded-full"><X className="w-8 h-8"/></button></div>}
         </div>

         {/* Right: Info */}
         <div className="w-full md:w-1/3 bg-white flex flex-col h-[60vh] md:h-full pb-0">
             <div className="p-8 border-b border-zinc-100">
                 <h2 className="text-2xl font-black mb-2 leading-tight">{scene.title}</h2>
                 <p className="text-sm text-zinc-500 leading-relaxed">{scene.description || "No description."}</p>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 custom-scrollbar">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tagged Products</h3>
                     {isAdmin && <button onClick={()=>setIsTagging(!isTagging)} className="text-xs font-bold text-blue-600 hover:underline">+ Add Tag</button>}
                 </div>
                 
                 {isAdmin && isTagging && (
                     <div className="mb-4 bg-white p-3 rounded-xl border border-blue-100 shadow-sm animate-in slide-in-from-top-2">
                         <input className="w-full text-xs p-2 border border-zinc-200 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Search product name..." value={filter} onChange={e=>setFilter(e.target.value)}/>
                         <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">{allProducts.filter(p=>p.name.toLowerCase().includes(filter.toLowerCase())).map(p=><div key={p.id} onClick={()=>onProductToggle(p.id, !scene.productIds?.includes(p.id))} className={`text-xs p-2 rounded cursor-pointer flex justify-between items-center ${scene.productIds?.includes(p.id)?'bg-blue-50 text-blue-700 font-bold':'hover:bg-zinc-50'}`}>{p.name} {scene.productIds?.includes(p.id) && <Check className="w-3 h-3"/>}</div>)}</div>
                     </div>
                 )}

                 <div className="space-y-3">
                     {products.map(p => (
                         <div key={p.id} onClick={()=>onNavigateProduct(p)} className="flex items-center p-3 bg-white rounded-xl border border-zinc-100 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer group transition-all">
                             <div className="w-12 h-12 rounded-lg bg-zinc-100 flex-shrink-0 overflow-hidden mr-3 border border-zinc-50">
                                 {p.images?.[0] && <img src={typeof p.images[0]==='object'?p.images[0].url:p.images[0]} className="w-full h-full object-cover mix-blend-multiply"/>}
                             </div>
                             <div className="min-w-0 flex-1">
                                 <h4 className="text-sm font-bold truncate group-hover:text-blue-600 transition-colors">{p.name}</h4>
                                 <p className="text-xs text-zinc-400">{p.category}</p>
                             </div>
                             <ChevronRight className="w-4 h-4 text-zinc-300 ml-2 group-hover:text-blue-500"/>
                         </div>
                     ))}
                     {products.length === 0 && <div className="text-center text-zinc-400 text-xs py-10">No products tagged in this scene.</div>}
                 </div>
             </div>
         </div>
    </div>
  );
}

function ProductFormModal({ categories, swatches, allProducts, existingData, onClose, onSave, onDelete }) {
  const isEditMode = !!existingData;
  const [formData, setFormData] = useState(existingData || { 
      id: null, name: '', category: 'EXECUTIVE', specs: '', designer: '',
      images: [], bodyColors: [], upholsteryColors: [], spaces: [], productLink: '', isNew: false, 
      options: [], features: []
  });

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ url: e.target.result, caption: '' });
        reader.readAsDataURL(file);
      });
    })).then(newImages => {
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    });
  };

  const toggleSwatch = (type, color) => {
      const list = formData[type] || [];
      const exists = list.some(c => (typeof c === 'object' ? c.id === color.id : c === color));
      if(exists) setFormData({ ...formData, [type]: list.filter(c => (typeof c === 'object' ? c.id !== color.id : c !== color)) });
      else setFormData({ ...formData, [type]: [...list, color] });
  };

  return (
      <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b flex justify-between items-center bg-zinc-50">
              <h2 className="font-bold text-lg">{isEditMode ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={onClose}><X size={20}/></button>
          </div>
          <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold mb-1">Name</label><input className="w-full border rounded p-2 text-sm" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div>
                  <div><label className="block text-xs font-bold mb-1">Category</label><select className="w-full border rounded p-2 text-sm" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{categories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
              </div>
              
              <div><label className="block text-xs font-bold mb-1">Specs</label><textarea className="w-full border rounded p-2 text-sm" rows={3} value={formData.specs} onChange={e=>setFormData({...formData, specs:e.target.value})}/></div>
              
              <div>
                  <label className="block text-xs font-bold mb-2">Images</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                      <label className="w-20 h-20 flex-shrink-0 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-zinc-50">
                          <Plus className="text-zinc-400"/>
                          <input type="file" multiple className="hidden" onChange={handleImageUpload}/>
                      </label>
                      {formData.images.map((img, i) => (
                          <div key={i} className="w-20 h-20 flex-shrink-0 relative group">
                              <img src={typeof img === 'object' ? img.url : img} className="w-full h-full object-cover rounded"/>
                              <button onClick={() => setFormData(p => ({...p, images: p.images.filter((_, idx) => idx !== i)}))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100"><X size={12}/></button>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div>
                     <label className="block text-xs font-bold mb-2">Body Colors</label>
                     <div className="h-40 overflow-y-auto border rounded p-2 grid grid-cols-6 gap-2 custom-scrollbar">
                         {swatches.filter(s=>['PLASTIC','METAL','ETC'].includes(s.category) || true).map(s => (
                             <div key={s.id} onClick={()=>toggleSwatch('bodyColors', s)} className={`aspect-square rounded cursor-pointer relative ${formData.bodyColors.some(c=>c.id===s.id) ? 'ring-2 ring-blue-500':''}`}>
                                 <SwatchDisplay color={s} size="large" className="w-full h-full rounded"/>
                             </div>
                         ))}
                     </div>
                 </div>
                 <div>
                     <label className="block text-xs font-bold mb-2">Upholstery Colors</label>
                     <div className="h-40 overflow-y-auto border rounded p-2 grid grid-cols-6 gap-2 custom-scrollbar">
                         {swatches.filter(s=>['FABRIC','LEATHER','MESH'].includes(s.category) || true).map(s => (
                             <div key={s.id} onClick={()=>toggleSwatch('upholsteryColors', s)} className={`aspect-square rounded cursor-pointer relative ${formData.upholsteryColors.some(c=>c.id===s.id) ? 'ring-2 ring-blue-500':''}`}>
                                 <SwatchDisplay color={s} size="large" className="w-full h-full rounded"/>
                             </div>
                         ))}
                     </div>
                 </div>
              </div>

              <div className="flex items-center gap-2">
                  <input type="checkbox" id="isNew" checked={formData.isNew} onChange={e=>setFormData({...formData, isNew:e.target.checked})} className="rounded text-black focus:ring-black"/>
                  <label htmlFor="isNew" className="text-sm font-bold">Mark as New Arrival</label>
              </div>
          </div>
          <div className="p-4 border-t bg-zinc-50 flex justify-between">
              {isEditMode && <button onClick={()=>onDelete(formData.id)} className="text-red-500 text-sm font-bold flex items-center hover:bg-red-50 px-3 py-1 rounded"><Trash2 size={16} className="mr-1"/> Delete</button>}
              <div className="ml-auto flex gap-2">
                  <button onClick={onClose} className="px-4 py-2 border rounded text-sm font-bold hover:bg-zinc-100">Cancel</button>
                  <button onClick={()=>onSave(formData)} className="px-6 py-2 bg-black text-white rounded text-sm font-bold hover:bg-zinc-800 shadow-lg">Save Product</button>
              </div>
          </div>
      </div>
  );
}

function SwatchFormModal({ category, existingData, onClose, onSave }) {
    const [data, setData] = useState(existingData || { id: null, name: '', category: category.id, hex: '#000000', visualType: 'SOLID', materialCode: '' });
    const fileRef = useRef(null);
    const processImage = (file) => { return new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); }); };

    return (
        <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 border-b border-zinc-100 flex justify-between items-center font-bold bg-zinc-50">
                {existingData ? 'Edit Material' : 'New Material'} <button onClick={onClose}><X size={16}/></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
                <div className="flex justify-center">
                    <div onClick={()=>fileRef.current.click()} className="w-24 h-24 rounded-full border-2 border-dashed cursor-pointer relative overflow-hidden bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center group">
                        <SwatchDisplay color={data} size="large" className="w-full h-full rounded-none"/>
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">Change</div>
                    </div>
                    <input type="file" ref={fileRef} className="hidden" onChange={async(e)=>{if(e.target.files[0]) setData({...data, image: await processImage(e.target.files[0])})}} />
                </div>
                
                {/* Compact Settings */}
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs space-y-3">
                    <div className="flex items-center gap-2">
                        <label className="font-bold w-12">Type</label>
                        <select className="flex-1 p-1.5 border rounded bg-white" value={data.visualType} onChange={e=>setData({...data, visualType:e.target.value})}>
                            <option value="SOLID">Solid Color</option><option value="GRADATION">Gradation</option><option value="TEXTURE">Texture Image</option>
                        </select>
                    </div>
                    {!data.image && (
                    <div className="flex items-center gap-2">
                        <label className="font-bold w-12">Hex</label>
                        <input type="color" className="w-8 h-8 p-0 border-none rounded overflow-hidden cursor-pointer" value={data.hex} onChange={e=>setData({...data, hex:e.target.value})}/>
                        <input className="flex-1 p-1.5 border rounded bg-white font-mono" value={data.hex} onChange={e=>setData({...data, hex:e.target.value})}/>
                    </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div><label className="block text-xs font-bold mb-1 text-zinc-500 uppercase">Name</label><input className="w-full p-2 border rounded text-sm font-bold" value={data.name} onChange={e=>setData({...data, name:e.target.value})}/></div>
                    <div><label className="block text-xs font-bold mb-1 text-zinc-500 uppercase">Code</label><input className="w-full p-2 border rounded text-sm font-mono" value={data.materialCode} onChange={e=>setData({...data, materialCode:e.target.value})}/></div>
                </div>
            </div>
            <div className="p-3 border-t bg-zinc-50 flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 text-xs font-bold border rounded bg-white hover:bg-zinc-100">Cancel</button>
                <button onClick={()=>onSave(data)} className="px-4 py-2 text-xs font-bold bg-black text-white rounded hover:bg-zinc-800 shadow">Save</button>
            </div>
        </div>
    );
}

function SceneEditModal({ initialData, allProducts, spaceTags = [], onClose, onSave, onDelete }) {
  const [data, setData] = useState({ 
      id: initialData.id || null, 
      title: initialData.title || '', 
      description: initialData.description || '', 
      image: initialData.image || null, 
      productIds: initialData.productIds || [], 
      tags: initialData.tags || [],
      spaceId: initialData.spaceId 
  });
  const fileRef = useRef(null);
  const processImage = (file) => { return new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); }); };

  return (
    <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
         <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
            <h3 className="text-lg font-bold text-zinc-900">{data.id ? 'Edit Scene' : 'New Scene'}</h3>
            <div className="flex gap-2">
                {data.id && <button onClick={()=>onDelete(data.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="w-5 h-5"/></button>}
                <button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-black"/></button>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div onClick={()=>fileRef.current.click()} className="w-full h-56 bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-100 transition-all group overflow-hidden relative">
                {data.image ? <img src={data.image} className="w-full h-full object-cover"/> : <div className="text-center"><ImagePlus className="w-8 h-8 mx-auto text-zinc-300 mb-2"/><span className="text-zinc-400 text-xs font-bold">Upload Scene Image</span></div>}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity">Change Image</div>
            </div>
            <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={async(e)=>{if(e.target.files[0]) setData({...data, image: await processImage(e.target.files[0])})}} />
            
            <div className="space-y-4">
                <div><label className="text-xs font-bold uppercase block mb-1 text-zinc-500">Title</label><input className="w-full border rounded-lg p-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none" value={data.title} onChange={e=>setData({...data, title:e.target.value})}/></div>
                <div><label className="text-xs font-bold uppercase block mb-1 text-zinc-500">Description</label><textarea className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-black outline-none" rows={2} value={data.description} onChange={e=>setData({...data, description:e.target.value})}/></div>
            </div>

            {spaceTags.length > 0 && (
                <div>
                   <label className="text-xs font-bold uppercase block mb-2 text-zinc-500">Space Filters</label>
                   <div className="flex flex-wrap gap-2">
                      {spaceTags.map(tag => (
                         <button key={tag} onClick={() => setData(p => ({...p, tags: p.tags.includes(tag)?p.tags.filter(t=>t!==tag):[...p.tags,tag]}))} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${data.tags.includes(tag)?'bg-black text-white border-black':'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'}`}>{tag}</button>
                      ))}
                   </div>
                </div>
            )}
         </div>
         <div className="p-4 border-t bg-zinc-50 flex justify-end">
             <button onClick={()=>onSave(data)} className="bg-black text-white px-8 py-2.5 rounded-full text-sm font-bold shadow-lg hover:bg-zinc-800 transition-transform active:scale-95">Save Scene</button>
         </div>
    </div>
  );
}

function SpaceInfoEditModal({ spaceId, currentData = {}, defaultTags, onClose, onSave }) {
  const [data, setData] = useState({ description: '', trend: '', tagsString: '' });
  useEffect(() => { 
     const tags = currentData.tags || defaultTags || [];
     setData({ 
        description: currentData.description || '', 
        trend: currentData.trend || '',
        tagsString: tags.join(', ')
     }); 
  }, [currentData, defaultTags]);

  const handleSave = () => {
     const tags = data.tagsString.split(',').map(t => t.trim()).filter(Boolean);
     onSave({ ...data, tags });
  };

  return (
    <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
      <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50"><h3 className="text-lg font-bold text-zinc-900">Edit Space Info</h3><button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-black" /></button></div>
      <div className="p-6 space-y-5">
         <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Description</label><textarea className="w-full border border-zinc-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" rows={4} value={data.description} onChange={(e) => setData({...data, description: e.target.value})} /></div>
         <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Design Trend Keywords</label><input type="text" className="w-full border border-zinc-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={data.trend} onChange={(e) => setData({...data, trend: e.target.value})} placeholder="e.g. Minimalist, Eco-friendly" /></div>
         <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Space Tags (comma separated)</label><input type="text" className="w-full border border-zinc-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={data.tagsString} onChange={(e) => setData({...data, tagsString: e.target.value})} placeholder="Task, Executive..." /></div>
      </div>
      <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end"><button onClick={handleSave} className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-black shadow-lg">Save Changes</button></div>
    </div>
  );
}

function SpaceProductManager({ spaceId, products, onClose, onToggle }) {
  const [filter, setFilter] = useState('');
  return (
    <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-indigo-50"><div><h3 className="text-lg font-bold text-indigo-900">Manage Products</h3><p className="text-xs text-indigo-600">Select products to display in {spaceId}</p></div><button onClick={onClose}><X className="w-5 h-5 text-indigo-400 hover:text-indigo-900" /></button></div>
        <div className="p-4 border-b border-zinc-100"><input type="text" placeholder="Filter products..." className="w-full px-4 py-2 bg-zinc-50 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" value={filter} onChange={(e) => setFilter(e.target.value)} /></div>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3 custom-scrollbar">{products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())).map(product => { const isAdded = product.spaces && product.spaces.includes(spaceId); return (<div key={product.id} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${isAdded ? 'border-indigo-500 bg-indigo-50' : 'border-zinc-200 hover:border-zinc-300'}`} onClick={() => onToggle(product.id, !isAdded)}><div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${isAdded ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-zinc-300'}`}>{isAdded && <Check className="w-3.5 h-3.5 text-white" />}</div>{product.images?.[0] && <img src={typeof product.images[0] === 'object' ? product.images[0].url : product.images[0]} className="w-10 h-10 rounded-lg object-cover mr-3" />}<div><div className="text-sm font-bold text-zinc-900">{product.name}</div><div className="text-xs text-zinc-500">{product.category}</div></div></div>); })}</div>
    </div>
  );
}

function AdminDashboardModal({ isOpen, onClose, products, swatches, spaceContents, onImport, onExport }) {
    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 print:hidden">
            <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-900 text-white">
                    <h3 className="text-lg font-bold flex items-center"><ShieldAlert className="w-5 h-5 mr-2" /> Admin Console</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" /></button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-zinc-400 space-y-6 overflow-y-auto">
                    <div className="text-center">
                        <Activity className="w-12 h-12 mb-3 mx-auto text-zinc-300"/>
                        <p className="text-lg font-bold text-zinc-600">System Status: Active</p>
                        <p className="text-xs text-zinc-400 mt-1">
                            Products: {products.length} | Materials: {swatches.length} | Spaces: {Object.keys(spaceContents).length}
                        </p>
                    </div>
               
                    <div className="w-full max-w-md bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                        <h4 className="text-sm font-bold text-zinc-500 uppercase mb-4 flex items-center"><Database className="w-4 h-4 mr-2"/> Data Management (Backup / Restore)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={onExport} className="flex flex-col items-center justify-center p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-400 transition-all hover:shadow-md group">
                                <FileDown className="w-8 h-8 text-zinc-400 group-hover:text-blue-600 mb-2"/>
                                <span className="text-xs font-bold text-zinc-600">Export Backup (JSON)</span>
                            </button>
                            <label className="flex flex-col items-center justify-center p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-400 transition-all hover:shadow-md group cursor-pointer">
                                <FileUp className="w-8 h-8 text-zinc-400 group-hover:text-red-600 mb-2"/>
                                <span className="text-xs font-bold text-zinc-600">Import Restore (JSON)</span>
                                <input type="file" accept=".json" onChange={onImport} className="hidden" />
                            </label>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-3 text-center">* Import overwrites existing local data. Use with caution.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// End of Application Code
// ----------------------------------------------------------------------