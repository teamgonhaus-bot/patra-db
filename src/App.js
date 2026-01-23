/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useRef, useEffect } from 'react';
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
  ArrowLeftRight, SlidersHorizontal, Move, Monitor, Maximize, EyeOff, Type, ExternalLink
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, addDoc, query, orderBy, limit, getDoc, writeBatch, getDocs 
} from 'firebase/firestore';

// ----------------------------------------------------------------------
// [중요] 배포 시 사용할 실제 Firebase 설정
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

// ----------------------------------------------------------------------
// 상수 및 설정
// ----------------------------------------------------------------------
const APP_VERSION = "v0.7.5"; 
const BUILD_DATE = "2026.01.24";
const ADMIN_PASSWORD = "adminlcg1"; 

// Firebase 초기화
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

// 카테고리 정의 (NEW 제거됨)
const CATEGORIES = [
  { id: 'ALL', label: 'Grand Overview', isSpecial: true, color: '#18181b' },
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

// 공간 (Spaces) 정의
const SPACES = [
  { 
    id: 'OFFICE', label: 'Office', icon: Briefcase, 
    defaultTags: ['Task', 'Executive', 'Meeting', 'Office Lounge'] 
  },
  { 
    id: 'TRAINING', label: 'Training', icon: GraduationCap, 
    defaultTags: ['Education', 'Library', 'Public'] 
  },
  { 
    id: 'LIFESTYLE', label: 'Lifestyle', icon: Sofa, 
    defaultTags: ['Dining', 'Study', 'Living', 'Outdoor'] 
  },
  { 
    id: 'COMMERCIAL', label: 'Commercial', icon: ShoppingBag, 
    defaultTags: ['Cafe', 'Restaurant', 'Store', 'Outdoor'] 
  },
];

// 스와치(마감재) 정의
const SWATCH_CATEGORIES = [
  { id: 'MESH', label: 'Mesh', color: '#a1a1aa' },
  { id: 'FABRIC', label: 'Fabric', color: '#a1a1aa' },
  { id: 'LEATHER', label: 'Leather', color: '#78350f' },
  { id: 'RESIN', label: 'Resin', color: '#27272a' },
  { id: 'METAL', label: 'Metal', color: '#64748b' },
  { id: 'WOOD', label: 'Wood', color: '#92400e' },
  { id: 'ETC', label: 'Etc', color: '#9ca3af' },
];

const PATTERN_TYPES = [
    { id: 'NONE', label: 'None' },
    { id: 'KNIT', label: 'Knit' },
    { id: 'WEAVE', label: 'Weave' },
    { id: 'DOT', label: 'Dot' },
    { id: 'DIAGONAL', label: 'Diagonal' },
    { id: 'GRID', label: 'Grid' },
    { id: 'FUR', label: 'Fur' },
    { id: 'LEATHER', label: 'Leather' }
];

const TEXTURE_TYPES = [
    { id: 'SOLID', label: 'Solid Color' },
    { id: 'TEXTURE', label: 'Texture' },
    { id: 'CLEAR', label: 'Clear' },
    { id: 'GLOSSY', label: 'Glossy' },
    { id: 'SEMI_GLOSSY', label: 'Semi-Glossy' },
    { id: 'MATTE', label: 'Matte' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [swatches, setSwatches] = useState([]); 
  const [activeCategory, setActiveCategory] = useState('DASHBOARD');
  const [previousCategory, setPreviousCategory] = useState('DASHBOARD'); 
  const [activeSpaceTag, setActiveSpaceTag] = useState('ALL'); 
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [searchChips, setSearchChips] = useState([]);
  const [sortOption, setSortOption] = useState('manual'); 
  const [sortDirection, setSortDirection] = useState('desc'); 
  const [filters, setFilters] = useState({ year: '', color: '', isNew: false });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal Stack (Stacking Modals)
  const [modalStack, setModalStack] = useState([]); // Array of { type: 'product'|'swatch'|'scene', data: ... }
  
  // Selection & Compare
  const [compareList, setCompareList] = useState([]);
  const [hiddenCompareIds, setHiddenCompareIds] = useState([]); 
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Edit & Admin
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingSwatchFromModal, setEditingSwatchFromModal] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [toast, setToast] = useState(null);
  const [favorites, setFavorites] = useState([]);
  
  // UI State
  const [sidebarState, setSidebarState] = useState({ spaces: true, collections: true, materials: true });
  const [myPickViewMode, setMyPickViewMode] = useState('grid'); 
  const [bannerData, setBannerData] = useState({ url: null, logoUrl: null, title: 'Design Lab DB', subtitle: 'Integrated Product Database & Archives' });
  const [appSettings, setAppSettings] = useState({ logo: null, title: 'PATRA', subtitle: 'Design Lab DB' });
  const [spaceContents, setSpaceContents] = useState({}); 

  // Space/Scene Editing
  const [editingSpaceInfoId, setEditingSpaceInfoId] = useState(null);
  const [managingSpaceProductsId, setManagingSpaceProductsId] = useState(null);
  const [editingScene, setEditingScene] = useState(null);
  
  // Drag & Drop
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const mainContentRef = useRef(null);
  const sidebarLogoInputRef = useRef(null);

  // --- Modal Management Helpers ---
  const pushModal = (type, data) => {
      setModalStack(prev => [...prev, { type, data }]);
  };
  const popModal = () => {
      setModalStack(prev => prev.slice(0, -1));
  };
  const clearModals = () => setModalStack([]);
  
  // --- Effects ---
  useEffect(() => {
    // Scroll Lock when modals are open
    if (modalStack.length > 0 || isFormOpen || editingScene || managingSpaceProductsId || showAdminDashboard) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalStack.length, isFormOpen, editingScene, managingSpaceProductsId, showAdminDashboard]);

  useEffect(() => {
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            if (editingSwatchFromModal) setEditingSwatchFromModal(null);
            else if (modalStack.length > 0) popModal();
            else if (editingScene) setEditingScene(null);
            else if (isFormOpen) setIsFormOpen(false);
            else if (managingSpaceProductsId) setManagingSpaceProductsId(null);
            else if (editingSpaceInfoId) setEditingSpaceInfoId(null);
            else if (showAdminDashboard) setShowAdminDashboard(false);
        }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [modalStack, editingSwatchFromModal, editingScene, isFormOpen, managingSpaceProductsId, editingSpaceInfoId, showAdminDashboard]);

  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current && mainContentRef.current.scrollTop > 300) setShowScrollTop(true);
      else setShowScrollTop(false);
    };
    const div = mainContentRef.current;
    if (div) div.addEventListener('scroll', handleScroll);
    return () => div && div.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if(mainContentRef.current) mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (modalStack.length > 0) {
          popModal();
      } else if (activeCategory === 'COMPARE_PAGE') {
        setActiveCategory(previousCategory || 'DASHBOARD');
        window.history.replaceState(null, '', window.location.pathname);
      } else if (activeCategory !== 'DASHBOARD') {
        setActiveCategory('DASHBOARD');
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [modalStack, activeCategory, previousCategory]);

  useEffect(() => {
     setActiveSpaceTag('ALL');
     setSearchTerm('');
     setSearchChips([]);
  }, [activeCategory]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('id');
    const sharedSpace = params.get('space');
    
    if (sharedId && products.length > 0) {
      const found = products.find(p => String(p.id) === sharedId);
      if (found) pushModal('product', found);
    }
    if (sharedSpace && SPACES.find(s => s.id === sharedSpace)) {
       setActiveCategory(sharedSpace);
    }
  }, [products]);

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

  useEffect(() => {
    if (isFirebaseAvailable && user && db) {
      const qProducts = collection(db, 'artifacts', appId, 'public', 'data', 'products');
      const unsubProducts = onSnapshot(qProducts, (snapshot) => {
        const loadedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(loadedProducts);
        setIsLoading(false);
      });
      const qSwatches = collection(db, 'artifacts', appId, 'public', 'data', 'swatches');
      const unsubSwatches = onSnapshot(qSwatches, (snapshot) => {
        const loadedSwatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSwatches(loadedSwatches);
      });
      const bannerDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'banner');
      onSnapshot(bannerDocRef, (doc) => { if (doc.exists()) setBannerData(prev => ({ ...prev, ...doc.data() })); });
      const appSettingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'app');
      onSnapshot(appSettingsRef, (doc) => { if(doc.exists()) setAppSettings(prev => ({...prev, ...doc.data()})); });

      SPACES.forEach(space => {
         onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', space.id), (docSnapshot) => {
            if(docSnapshot.exists()) {
               setSpaceContents(prev => ({ ...prev, [space.id]: docSnapshot.data() }));
            }
         });
      });
      return () => { unsubProducts(); unsubSwatches(); };
    } else {
      const localBanner = localStorage.getItem('patra_banner_data');
      if (localBanner) setBannerData(JSON.parse(localBanner));
      const localAppSettings = localStorage.getItem('patra_app_settings');
      if(localAppSettings) setAppSettings(JSON.parse(localAppSettings));
      loadFromLocalStorage();
    }
  }, [user]);

  // --- Handlers ---
  const handleHomeClick = () => {
    setActiveCategory('DASHBOARD');
    setIsMobileMenuOpen(false);
    window.history.pushState({}, '', window.location.pathname);
  };
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('patra_products');
    setProducts(saved ? JSON.parse(saved) : []);
    setIsLoading(false);
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
  const toggleAdminMode = () => {
    if (isAdmin) { setIsAdmin(false); setShowAdminDashboard(false); showToast("뷰어 모드로 전환되었습니다.", "info"); } 
    else {
      const password = window.prompt("관리자 비밀번호를 입력하세요:");
      if (password === ADMIN_PASSWORD) { setIsAdmin(true); showToast("관리자 모드로 접속했습니다."); } 
      else if (password !== null) showToast("비밀번호가 올바르지 않습니다.", "error");
    }
  };
  const toggleFavorite = (e, productId) => {
    if(e) e.stopPropagation();
    let newFavs;
    if (favorites.includes(productId)) { newFavs = favorites.filter(id => id !== productId); showToast("MY PICK에서 제거되었습니다.", "info"); } 
    else { newFavs = [...favorites, productId]; showToast("MY PICK에 추가되었습니다."); }
    setFavorites(newFavs);
    localStorage.setItem('patra_favorites', JSON.stringify(newFavs));
  };
  const toggleCompare = (e, product) => {
    if(e) e.stopPropagation();
    if(compareList.find(p => p.id === product.id)) {
        setCompareList(compareList.filter(p => p.id !== product.id));
        setHiddenCompareIds(prev => prev.filter(id => id !== product.id));
    } else {
        if(compareList.length >= 8) { showToast("비교는 최대 8개까지 가능합니다.", "error"); return; }
        setCompareList([...compareList, product]);
    }
  };
  
  const handleCompareButtonClick = () => {
      if(activeCategory === 'COMPARE_PAGE') {
          setActiveCategory(previousCategory);
      } else {
          setPreviousCategory(activeCategory);
          setActiveCategory('COMPARE_PAGE');
      }
  };

  const toggleCompareVisibility = (id) => {
      setHiddenCompareIds(prev => {
          if (prev.includes(id)) return prev.filter(hid => hid !== id);
          else return [...prev, id];
      });
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

  // --- Actions ---
  const handleBannerUpload = async (e) => { if (!isAdmin) return; const file = e.target.files[0]; if (!file) return; try { const resizedImage = await processImage(file); const newData = { ...bannerData, url: resizedImage }; if (isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'banner'), newData, { merge: true }); else { localStorage.setItem('patra_banner_data', JSON.stringify(newData)); setBannerData(newData); } showToast("메인 배너가 업데이트되었습니다."); } catch (error) { showToast("이미지 처리 실패", "error"); } };
  const handleLogoUpload = async (e) => { if (!isAdmin) return; const file = e.target.files[0]; if (!file) return; try { const resizedImage = await processImage(file); const newData = { ...bannerData, logoUrl: resizedImage }; if (isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'banner'), newData, { merge: true }); else { localStorage.setItem('patra_banner_data', JSON.stringify(newData)); setBannerData(newData); } showToast("로고가 업데이트되었습니다."); } catch (error) { showToast("이미지 처리 실패", "error"); } };
  const handleBannerTextChange = (key, value) => { if (!isAdmin) return; setBannerData(prev => ({ ...prev, [key]: value })); };
  const saveBannerText = async () => { if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'banner'), bannerData, { merge: true }); showToast("배너 문구가 저장되었습니다."); } };
  
  // App Header Settings
  const handleSidebarLogoUpload = async (e) => {
      if(!isAdmin) return;
      const file = e.target.files[0];
      if(!file) return;
      try {
          const resized = await processImage(file);
          const newData = { ...appSettings, logo: resized };
          if(isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'app'), newData, {merge: true});
          else { localStorage.setItem('patra_app_settings', JSON.stringify(newData)); setAppSettings(newData); }
          showToast("헤더 로고가 변경되었습니다.");
      } catch(e) { showToast("이미지 처리 실패", "error"); }
  };
  const handleSidebarTitleChange = async (key, newValue) => {
      if(!isAdmin) return;
      const val = newValue !== undefined ? newValue : prompt(`새로운 ${key}을 입력하세요:`, appSettings[key]);
      if(val !== null) {
          const newData = { ...appSettings, [key]: val };
          if(isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'app'), newData, {merge: true});
          else { localStorage.setItem('patra_app_settings', JSON.stringify(newData)); setAppSettings(newData); }
          // showToast("변경사항이 저장되었습니다.");
      }
  };

  const handleSpaceBannerUpload = async (e, spaceId) => { if (!isAdmin) return; const file = e.target.files[0]; if (!file) return; try { const resizedImage = await processImage(file); const currentContent = spaceContents[spaceId] || {}; const newContent = { ...currentContent, banner: resizedImage }; if (isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), newContent, { merge: true }); showToast("공간 배너가 업데이트되었습니다."); } catch (error) { showToast("이미지 처리 실패", "error"); } };
  const handleSpaceInfoSave = async (spaceId, info) => { const currentContent = spaceContents[spaceId] || {}; const newContent = { ...currentContent, ...info }; if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), newContent, { merge: true }); } showToast("공간 정보가 저장되었습니다."); };
  
  const handleSceneSave = async (targetSpaceId, sceneData) => { 
      let originalSpaceId = targetSpaceId;
      let isMove = false;
      if(sceneData.id) {
          for(const [sId, content] of Object.entries(spaceContents)) {
              if(content.scenes?.some(s => s.id === sceneData.id)) {
                  originalSpaceId = sId;
                  break;
              }
          }
      }
      if(originalSpaceId !== targetSpaceId && sceneData.id) {
          isMove = true;
      }

      const targetContent = spaceContents[targetSpaceId] || { scenes: [] };
      let targetScenes = [...(targetContent.scenes || [])];
      
      if(isMove) {
          const originalContent = spaceContents[originalSpaceId] || { scenes: [] };
          const originalScenes = (originalContent.scenes || []).filter(s => s.id !== sceneData.id);
          if (isFirebaseAvailable && db) { 
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', originalSpaceId), { scenes: originalScenes }, { merge: true }); 
          }
          targetScenes.push(sceneData);
      } else {
          if (sceneData.id) {
              const idx = targetScenes.findIndex(s => s.id === sceneData.id);
              if (idx >= 0) targetScenes[idx] = sceneData; else targetScenes.push(sceneData); 
          } else { 
              sceneData.id = Date.now().toString(); 
              targetScenes.push(sceneData); 
          }
      }

      if (isFirebaseAvailable && db) { 
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', targetSpaceId), { scenes: targetScenes }, { merge: true }); 
      } 
      showToast(isMove ? "장면이 이동되었습니다." : "장면이 저장되었습니다."); 
  };

  const handleSceneDelete = async (spaceId, sceneId) => { if(!window.confirm("이 장면을 삭제하시겠습니까?")) return; const currentContent = spaceContents[spaceId] || { scenes: [] }; const newScenes = (currentContent.scenes || []).filter(s => s.id !== sceneId); if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), { scenes: newScenes }, { merge: true }); } showToast("장면이 삭제되었습니다."); };
  const handleSpaceProductToggle = async (spaceId, productId, isAdded) => { const product = products.find(p => p.id === productId); if(!product) return; let newSpaces = product.spaces || []; if(isAdded) { if(!newSpaces.includes(spaceId)) newSpaces.push(spaceId); } else { newSpaces = newSpaces.filter(s => s !== spaceId); } if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', product.id), { spaces: newSpaces }, { merge: true }); } else { const idx = products.findIndex(p => p.id === productId); const newProds = [...products]; newProds[idx] = { ...product, spaces: newSpaces }; saveToLocalStorage(newProds); } };
  const logActivity = async (action, productName, details = "") => { if (!isFirebaseAvailable || !db) return; try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), { action, productName, details, timestamp: Date.now(), adminId: 'admin' }); } catch (e) { console.error(e); } };
  const fetchLogs = async () => { if (!isFirebaseAvailable || !db) return; const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), orderBy('timestamp', 'desc'), limit(100)); onSnapshot(q, (snapshot) => { setActivityLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); }); };
  const handleSaveSwatch = async (swatchData) => { const docId = swatchData.id ? String(swatchData.id) : String(Date.now()); const payload = { ...swatchData, id: docId, updatedAt: Date.now() }; if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'swatches', docId), payload, { merge: true }); } else { const idx = swatches.findIndex(s => s.id === docId); let newSwatches = [...swatches]; if (idx >= 0) newSwatches[idx] = payload; else newSwatches = [payload, ...newSwatches]; saveSwatchesToLocal(newSwatches); } showToast("마감재가 저장되었습니다."); };
  const handleDeleteSwatch = async (swatchId) => { if (!window.confirm("정말 삭제하시겠습니까?")) return; if (isFirebaseAvailable && db) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'swatches', String(swatchId))); } else { saveSwatchesToLocal(swatches.filter(s => s.id !== swatchId)); } showToast("마감재가 삭제되었습니다."); };
  const handleSaveProduct = async (productData) => { 
      const docId = productData.id ? String(productData.id) : String(Date.now()); 
      const isEdit = !!productData.id && products.some(p => String(p.id) === docId); 
      const payload = { 
          ...productData, 
          id: docId, 
          updatedAt: Date.now(), 
          createdAt: isEdit ? (products.find(p => String(p.id) === docId)?.createdAt || Date.now()) : Date.now(), 
          orderIndex: isEdit ? (products.find(p => String(p.id) === docId)?.orderIndex || Date.now()) : Date.now() 
      }; 
      
      if (isFirebaseAvailable && db) { 
          try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', docId), payload, { merge: true }); } 
          catch (error) { showToast("저장 실패", "error"); return; } 
      } else { 
          const idx = products.findIndex(p => String(p.id) === docId); 
          let newProducts = [...products]; 
          if (idx >= 0) newProducts[idx] = payload; else newProducts = [payload, ...products]; 
          saveToLocalStorage(newProducts); 
      } 
      
      setCompareList(prev => prev.map(p => p.id === docId ? payload : p));

      // Update stack if needed
      setModalStack(prev => prev.map(item => (item.type === 'product' && String(item.data.id) === docId) ? { ...item, data: payload } : item));

      setIsFormOpen(false); 
      setEditingProduct(null); 
      showToast(isEdit ? "수정 완료" : "등록 완료"); 
  };
  const handleDeleteProduct = async (productId, productName) => { 
      if (!window.confirm('정말 삭제하시겠습니까?')) return; 
      if (isFirebaseAvailable && db) { 
          try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', String(productId))); await logActivity("DELETE", productName, "삭제됨"); } 
          catch (error) { showToast("삭제 실패", "error"); return; } 
      } else { 
          const newProducts = products.filter(p => String(p.id) !== String(productId)); saveToLocalStorage(newProducts); 
      } 
      
      setCompareList(prev => prev.filter(p => p.id !== productId));
      
      // Close modal if open
      setModalStack(prev => prev.filter(item => !(item.type === 'product' && item.data.id === productId)));

      setIsFormOpen(false); 
      showToast("삭제되었습니다."); 
  };
  
  const handleDuplicateProduct = async (product) => {
     if(!isAdmin) return;
     const newProduct = { ...product, id: Date.now().toString(), name: `${product.name} (Copy)`, createdAt: Date.now(), updatedAt: Date.now(), orderIndex: Date.now() };
     await handleSaveProduct(newProduct);
     showToast("제품이 복제되었습니다.");
  };

  const handleDuplicateSwatch = async (swatch) => {
     if(!isAdmin) return;
     const newSwatch = { ...swatch, id: Date.now().toString(), name: `${swatch.name} (Copy)`, updatedAt: Date.now() };
     await handleSaveSwatch(newSwatch);
     showToast("스와치가 복제되었습니다.");
  };

  // --- Search & Filters ---
  const handleSearchKeyDown = (e) => {
     if (e.key === 'Enter' || e.key === ',') {
         e.preventDefault();
         const val = searchTerm.trim().replace(/,/g, '');
         if (val) {
             setSearchChips(prev => [...prev, val]);
             setSearchTerm('');
         }
     }
  };
  const removeSearchChip = (index) => {
      setSearchChips(prev => prev.filter((_, i) => i !== index));
  };

  const getProcessedProducts = () => {
    let filtered = products.filter(product => {
      let matchesCategory = true;
      if (activeCategory === 'DASHBOARD' || activeCategory === 'COMPARE_PAGE' || activeCategory === 'SPACES_HUB' || activeCategory === 'MATERIALS_HUB') matchesCategory = false; 
      else if (activeCategory === 'MY_PICK') matchesCategory = favorites.includes(product.id);
      else if (activeCategory === 'ALL') matchesCategory = true;
      else if (SPACES.find(s => s.id === activeCategory)) {
         matchesCategory = product.spaces && product.spaces.includes(activeCategory);
         if (matchesCategory && activeSpaceTag !== 'ALL') { matchesCategory = product.spaceTags && product.spaceTags.includes(activeSpaceTag); }
      }
      else if (SWATCH_CATEGORIES.find(s => s.id === activeCategory)) matchesCategory = false; 
      else matchesCategory = product.category === activeCategory;
      
      // Search Chips Logic (AND)
      const searchFields = [ product.name, product.specs, product.designer, ...(product.features || []), ...(product.options || []), ...(product.awards || []), ...(product.materials || []), ...(product.bodyColors || []).map(c => typeof c === 'object' ? c.name : c), ...(product.upholsteryColors || []).map(c => typeof c === 'object' ? c.name : c) ].join(' ').toLowerCase();
      let matchesSearch = true;
      
      if (searchChips.length > 0) {
          matchesSearch = searchChips.every(chip => searchFields.includes(chip.toLowerCase()));
      }
      if (searchTerm && matchesSearch) {
          matchesSearch = searchFields.includes(searchTerm.toLowerCase());
      }

      let matchesFilter = true;
      if(filters.isNew && !product.isNew) matchesFilter = false;
      if(filters.year && !product.launchDate?.startsWith(filters.year)) matchesFilter = false;
      if(filters.color) {
         const colorMatch = [...(product.bodyColors||[]), ...(product.upholsteryColors||[])].some(c => { const name = typeof c === 'object' ? c.name : c; return name.toLowerCase().includes(filters.color.toLowerCase()); });
         if(!colorMatch) matchesFilter = false;
      }
      return matchesCategory && matchesSearch && matchesFilter;
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

  // --- Drag & Drop ---
  const handleDragStart = (e, index) => { dragItem.current = index; };
  const handleDragEnter = (e, index) => { dragOverItem.current = index; };
  const handleDragEnd = async () => {
     const _products = [...processedProducts];
     const dragIndex = dragItem.current; const dragOverIndex = dragOverItem.current;
     if(dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) return;
     const draggedItemContent = _products[dragIndex]; _products.splice(dragIndex, 1); _products.splice(dragOverIndex, 0, draggedItemContent);
     if(isFirebaseAvailable && db) { showToast("순서가 변경되었습니다. (DB 반영은 전체 업데이트 필요)"); } else { saveToLocalStorage(_products); }
     setProducts(_products); dragItem.current = null; dragOverItem.current = null;
  };

  // Import/Export
  const handleExportData = () => { const dataStr = JSON.stringify({ products, swatches, spaces: spaceContents, version: APP_VERSION }, null, 2); const blob = new Blob([dataStr], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `patra_db_backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); showToast("데이터 백업이 완료되었습니다."); };
  const handleImportData = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (event) => { try { const imported = JSON.parse(event.target.result); if (window.confirm(`총 ${imported.products?.length || 0}개 제품, ${imported.swatches?.length || 0}개 스와치를 불러오시겠습니까?`)) { if (!isFirebaseAvailable) { saveToLocalStorage(imported.products || []); saveSwatchesToLocal(imported.swatches || []); window.location.reload(); } else { setProducts(imported.products || []); setSwatches(imported.swatches || []); } showToast("데이터 복원 완료 (메모리 로드)"); } } catch (err) { showToast("파일 형식이 올바르지 않습니다.", "error"); } }; reader.readAsText(file); };

  const activeProduct = modalStack.length > 0 && modalStack[modalStack.length - 1].type === 'product' ? modalStack[modalStack.length - 1].data : null;

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 overflow-hidden relative selection:bg-black selection:text-white print:overflow-visible print:h-auto print:bg-white">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .slide-in-animation {
          animation: slideIn 0.3s ease-out forwards;
        }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        .mb-safe { margin-bottom: env(safe-area-inset-bottom, 20px); }
      `}</style>
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-md border-r border-zinc-200 flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 md:relative md:translate-x-0 print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between cursor-pointer group relative" onClick={handleHomeClick}>
          <div className="flex flex-col group/header">
             <div className="flex items-center space-x-1">
                 {appSettings.logo ? (
                     <img src={appSettings.logo} alt="Logo" className="h-8 object-contain" />
                 ) : (
                     <span className="text-2xl font-black tracking-tighter text-zinc-900 group-hover:scale-105 transition-transform origin-left">{appSettings.title}</span>
                 )}
                 {isAdmin && (
                     <div className="absolute right-12 top-6 opacity-0 group-hover/header:opacity-100 transition-opacity flex space-x-1 bg-white shadow-lg p-1 rounded-lg z-50">
                         <button onClick={(e)=>{e.stopPropagation(); sidebarLogoInputRef.current.click()}} className="p-1 bg-zinc-100 rounded hover:bg-zinc-200"><ImageIcon className="w-3 h-3"/></button>
                         <button onClick={(e)=>{e.stopPropagation(); handleSidebarTitleChange('title')}} className="p-1 bg-zinc-100 rounded hover:bg-zinc-200"><Type className="w-3 h-3"/></button>
                         <button onClick={(e)=>{e.stopPropagation(); handleSidebarTitleChange('subtitle')}} className="p-1 bg-zinc-100 rounded hover:bg-zinc-200"><Edit3 className="w-3 h-3"/></button>
                         <input type="file" ref={sidebarLogoInputRef} className="hidden" accept="image/*" onChange={handleSidebarLogoUpload}/>
                     </div>
                 )}
             </div>
             <span className="text-[10px] font-medium text-zinc-500 tracking-[0.2em] uppercase mt-0.5">{appSettings.subtitle}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }} className="md:hidden text-zinc-400 hover:text-zinc-600"><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-4 custom-scrollbar">
          <div className="space-y-1">{CATEGORIES.filter(c => c.isSpecial).map((cat) => (<button key={cat.id} onClick={() => { setActiveCategory(cat.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group border ${activeCategory === cat.id ? 'bg-zinc-900 text-white shadow-lg border-zinc-900' : 'bg-white text-zinc-600 border-zinc-100 hover:bg-zinc-50 hover:border-zinc-300'}`}><div className="flex items-center">{cat.id === 'ALL' && <LayoutGrid className="w-4 h-4 mr-3 opacity-70" />}<span className="font-bold tracking-tight">{cat.label}</span></div></button>))}</div>
          <div className="py-2">
              <div className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group border bg-white text-zinc-600 border-zinc-100 hover:bg-zinc-50 hover:border-zinc-300 mb-1 shadow-sm`}>
                  <button onClick={() => { setActiveCategory('SPACES_HUB'); setIsMobileMenuOpen(false); }} className="flex-1 text-left font-bold tracking-tight">SPACES</button>
                  <button onClick={(e) => { e.stopPropagation(); setSidebarState(p => ({...p, spaces: !p.spaces})); }}>
                    {sidebarState.spaces ? <ChevronUp className="w-4 h-4 text-zinc-400 hover:text-zinc-900" /> : <ChevronDown className="w-4 h-4 text-zinc-400 hover:text-zinc-900" />}
                  </button>
              </div>
              {sidebarState.spaces && (<div className="space-y-1 mt-2 pl-2 animate-in slide-in-from-top-2 duration-200">{SPACES.map((space) => (<button key={space.id} onClick={() => { setActiveCategory(space.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === space.id ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}><div className="flex items-center"><space.icon className={`w-3.5 h-3.5 mr-3 ${activeCategory === space.id ? 'text-white' : 'text-zinc-400'}`} />{space.label}</div>{activeCategory === space.id && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}</button>))}</div>)}
          </div>
          <div className="py-2"><button onClick={() => setSidebarState(p => ({...p, collections: !p.collections}))} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group border bg-white text-zinc-600 border-zinc-100 hover:bg-zinc-50 hover:border-zinc-300 mb-1 shadow-sm`}><div className="flex items-center"><span className="font-bold tracking-tight">COLLECTIONS</span>{isFirebaseAvailable ? <Cloud className="w-3 h-3 ml-2 text-green-500" /> : <CloudOff className="w-3 h-3 ml-2 text-zinc-300" />}</div>{sidebarState.collections ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}</button>{sidebarState.collections && (<div className="space-y-0.5 mt-2 pl-2 animate-in slide-in-from-top-2 duration-200">{CATEGORIES.filter(c => !c.isSpecial).map((cat) => (<button key={cat.id} onClick={() => { setActiveCategory(cat.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === cat.id ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}>{cat.label}</button>))}</div>)}</div>
          <div className="py-2">
              <div className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group border bg-white text-zinc-600 border-zinc-100 hover:bg-zinc-50 hover:border-zinc-300 mb-1 shadow-sm`}>
                  <button onClick={() => { setActiveCategory('MATERIALS_HUB'); setIsMobileMenuOpen(false); }} className="flex-1 text-left font-bold tracking-tight">MATERIALS</button>
                  <button onClick={(e) => { e.stopPropagation(); setSidebarState(p => ({...p, materials: !p.materials})); }}>
                     {sidebarState.materials ? <ChevronUp className="w-4 h-4 text-zinc-400 hover:text-zinc-900" /> : <ChevronDown className="w-4 h-4 text-zinc-400 hover:text-zinc-900" />}
                  </button>
              </div>
              {sidebarState.materials && (<div className="space-y-0.5 mt-2 pl-2 animate-in slide-in-from-top-2 duration-200">{SWATCH_CATEGORIES.map((cat) => (<button key={cat.id} onClick={() => { setActiveCategory(cat.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === cat.id ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}>{cat.label}</button>))}</div>)}
          </div>
          <div className="pt-2"><button onClick={() => { setActiveCategory('MY_PICK'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center space-x-3 group border ${activeCategory === 'MY_PICK' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'text-zinc-400 border-transparent hover:bg-zinc-50 hover:text-zinc-600'}`}><Heart className={`w-4 h-4 ${activeCategory === 'MY_PICK' ? 'fill-yellow-500 text-yellow-500' : ''}`} /><span>My Pick ({favorites.length})</span></button></div>
        </nav>
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 space-y-3">
           {isAdmin && (<button onClick={() => { fetchLogs(); setShowAdminDashboard(true); }} className="w-full text-[10px] text-blue-600 hover:text-blue-800 flex items-center justify-center font-bold py-1 mb-2 bg-blue-50 rounded border border-blue-100"><Settings className="w-3 h-3 mr-1" /> Dashboard</button>)}
           <button onClick={toggleAdminMode} className={`w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isAdmin ? 'bg-zinc-900 text-white shadow-md' : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100'}`}>{isAdmin ? <Unlock className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2" />}{isAdmin ? "ADMIN MODE" : "VIEWER MODE"}</button>
           <div className="flex justify-between items-center px-1"><span className="text-[10px] text-zinc-400">{APP_VERSION}</span><span className="text-[10px] text-zinc-300">{BUILD_DATE}</span></div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative print:overflow-visible print:h-auto">
        <header className="h-14 md:h-16 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex items-center justify-between px-4 md:px-8 z-30 flex-shrink-0 sticky top-0 transition-all print:hidden">
          <div className="flex items-center space-x-3 w-full md:w-auto flex-1 mr-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-lg active:scale-95 transition-transform"><Menu className="w-6 h-6" /></button>
            <div className="relative w-full max-w-md group flex items-center bg-zinc-50/50 border border-transparent focus-within:bg-white focus-within:border-zinc-200 focus-within:ring-4 focus-within:ring-zinc-50 rounded-full px-4 py-1.5 transition-all">
               <Search className="text-zinc-400 w-4 h-4 mr-2" />
               <div className="flex-1 flex flex-wrap gap-1.5 items-center overflow-hidden">
                   {searchChips.map((chip, i) => (
                       <span key={i} className="flex items-center bg-zinc-200 text-zinc-700 text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                           {chip}
                           <button onClick={() => removeSearchChip(i)} className="ml-1 hover:text-red-500"><X className="w-3 h-3"/></button>
                       </span>
                   ))}
                   <input type="text" placeholder={searchChips.length > 0 ? "" : "Search..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleSearchKeyDown} className="bg-transparent text-sm outline-none min-w-[60px] flex-1 py-0.5" />
               </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             {compareList.length > 0 && <button onClick={handleCompareButtonClick} className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold animate-in fade-in transition-all mr-2 shadow-lg ${activeCategory === 'COMPARE_PAGE' ? 'bg-black text-white ring-2 ring-zinc-200' : 'bg-zinc-900 text-white hover:bg-black'}`}><ArrowLeftRight className="w-3 h-3 mr-1.5"/> Compare ({compareList.length})</button>}
             <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`p-2 rounded-full transition-all ${isFilterOpen ? 'bg-zinc-200 text-black' : 'hover:bg-zinc-100 text-zinc-500'}`} title="Filters"><SlidersHorizontal className="w-5 h-5" /></button>
             <button onClick={() => setActiveCategory('MY_PICK')} className={`hidden md:flex p-2 rounded-full transition-all items-center space-x-1 ${activeCategory === 'MY_PICK' ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600'}`} title="My Pick"><Heart className={`w-5 h-5 ${activeCategory === 'MY_PICK' ? 'fill-yellow-500 text-yellow-500' : ''}`} /></button>
             <div className="flex items-center bg-zinc-100 rounded-lg p-1">
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="bg-transparent text-xs font-bold text-zinc-600 outline-none px-2 py-1 max-w-[80px] md:max-w-none cursor-pointer"><option value="manual">Manual</option><option value="launchDate">Launch</option><option value="createdAt">Added</option><option value="name">Name</option></select>
                <button onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-zinc-500" title="Sort">{sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}</button>
             </div>
            {isAdmin && (<button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 bg-zinc-900 text-white rounded-full hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95 flex-shrink-0"><Plus className="w-4 h-4 md:mr-1.5" /><span className="hidden md:inline text-sm font-bold">New</span></button>)}
          </div>
        </header>

        {isFilterOpen && (
           <div className="bg-zinc-50 border-b border-zinc-200 p-4 flex gap-4 overflow-x-auto items-center animate-in slide-in-from-top-5">
              <div className="flex items-center space-x-2"><span className="text-xs font-bold text-zinc-500">Year:</span><input type="number" placeholder="YYYY" className="px-2 py-1 rounded border text-xs" value={filters.year} onChange={e=>setFilters({...filters, year: e.target.value})} /></div>
              <div className="flex items-center space-x-2"><span className="text-xs font-bold text-zinc-500">Color:</span><input type="text" placeholder="Red, Blue..." className="px-2 py-1 rounded border text-xs" value={filters.color} onChange={e=>setFilters({...filters, color: e.target.value})} /></div>
              <label className="flex items-center space-x-2 text-xs font-bold text-zinc-600 cursor-pointer"><input type="checkbox" checked={filters.isNew} onChange={e=>setFilters({...filters, isNew: e.target.checked})} /> <span>New Only</span></label>
              <button onClick={() => setFilters({year:'', color:'', isNew:false})} className="text-xs text-red-500 hover:underline ml-auto">Reset</button>
           </div>
        )}

        <div ref={mainContentRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative print:overflow-visible print:p-0">
          {activeCategory === 'DASHBOARD' && !searchTerm && searchChips.length === 0 ? (
            <DashboardView 
               products={products} 
               favorites={favorites} 
               setActiveCategory={setActiveCategory} 
               onProductClick={(p) => pushModal('product', p)} 
               isAdmin={isAdmin} 
               bannerData={bannerData} 
               onBannerUpload={handleBannerUpload} 
               onLogoUpload={handleLogoUpload} 
               onBannerTextChange={handleBannerTextChange} 
               onSaveBannerText={saveBannerText}
               setFilters={setFilters} 
            />
          ) : activeCategory === 'COMPARE_PAGE' ? (
            <CompareView 
                products={compareList} 
                hiddenIds={hiddenCompareIds}
                onToggleVisibility={toggleCompareVisibility}
                onRemove={(id) => setCompareList(prev => prev.filter(p => p.id !== id))}
                onEdit={(product) => { setEditingProduct(product); setIsFormOpen(true); }}
                onProductClick={(p) => pushModal('product', p)}
                isAdmin={isAdmin}
            />
          ) : activeCategory === 'SPACES_HUB' ? (
             <SpacesHubView spaces={SPACES} spaceContents={spaceContents} setActiveCategory={setActiveCategory} searchString={searchTerm} chips={searchChips}/>
          ) : activeCategory === 'MATERIALS_HUB' ? (
             <MaterialsHubView categories={SWATCH_CATEGORIES} swatches={swatches} setActiveCategory={setActiveCategory} searchString={searchTerm} chips={searchChips} />
          ) : (
            <>
              {SPACES.find(s => s.id === activeCategory) && (
                 <SpaceDetailView 
                    space={SPACES.find(s => s.id === activeCategory)} 
                    spaceContent={spaceContents[activeCategory] || {}} 
                    isAdmin={isAdmin} 
                    activeTag={activeSpaceTag} 
                    setActiveTag={setActiveSpaceTag} 
                    onBannerUpload={(e) => handleSpaceBannerUpload(e, activeCategory)} 
                    onEditInfo={() => setEditingSpaceInfoId(activeCategory)} 
                    onManageProducts={() => setManagingSpaceProductsId(activeCategory)} 
                    onAddScene={() => setEditingScene({ isNew: true, spaceId: activeCategory })} 
                    onViewScene={(scene) => pushModal('scene', { ...scene, spaceId: activeCategory })} 
                    productCount={processedProducts.length} 
                 />
              )}
              {SWATCH_CATEGORIES.find(s => s.id === activeCategory) && (
                <SwatchManager category={SWATCH_CATEGORIES.find(s => s.id === activeCategory)} swatches={swatches.filter(s => s.category === activeCategory)} isAdmin={isAdmin} onSave={handleSaveSwatch} onDelete={handleDeleteSwatch} onSelect={(swatch) => pushModal('swatch', swatch)} onDuplicate={handleDuplicateSwatch} />
              )}
              {!SWATCH_CATEGORIES.find(s => s.id === activeCategory) && (
                <>
                  {isLoading && products.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">{[1,2,3,4].map(n => (<div key={n} className="bg-white rounded-2xl p-4 h-[250px] md:h-[300px] animate-pulse border border-zinc-100"><div className="bg-zinc-100 h-32 md:h-40 rounded-xl mb-4"></div><div className="bg-zinc-100 h-4 w-2/3 rounded mb-2"></div><div className="bg-zinc-100 h-3 w-1/2 rounded"></div></div>))}</div>
                  ) : (
                    <>
                      {!SPACES.find(s => s.id === activeCategory) && (
                        <div className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-end justify-between px-1 print:hidden">
                          <div className="mb-4 md:mb-0">
                            <h2 className="text-xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">{activeCategory === 'MY_PICK' ? 'MY PICK' : CATEGORIES.find(c => c.id === activeCategory)?.label || activeCategory}</h2>
                            <p className="text-zinc-500 text-xs md:text-sm mt-1 font-medium">{processedProducts.length} items found {!isFirebaseAvailable && <span className="ml-2 text-red-400 bg-red-50 px-2 py-0.5 rounded-full text-xs">Offline Mode</span>}</p>
                          </div>
                          {activeCategory === 'MY_PICK' && processedProducts.length > 0 && (<div className="flex space-x-2"><div className="flex bg-zinc-100 p-1 rounded-lg"><button onClick={() => setMyPickViewMode('grid')} className={`p-2 rounded-md ${myPickViewMode === 'grid' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400'}`} title="Grid View"><Grid className="w-4 h-4"/></button><button onClick={() => setMyPickViewMode('list')} className={`p-2 rounded-md ${myPickViewMode === 'list' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400'}`} title="List View"><List className="w-4 h-4"/></button></div><button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors"><Printer className="w-4 h-4 mr-2"/> Export</button></div>)}
                        </div>
                      )}
                      {activeCategory === 'MY_PICK' && myPickViewMode === 'list' ? (
                        <div className="space-y-4 print:space-y-6 pb-32">
                            <div className="hidden print:block mb-8"><h1 className="text-4xl font-bold mb-2">MY PICK SELECTION</h1><p className="text-zinc-500">{new Date().toLocaleDateString()} · Patra Design Lab</p></div>
                            {processedProducts.map((product) => (<div key={product.id} className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-2xl border border-zinc-200 print:border-zinc-300 print:break-inside-avoid"><div className="w-full md:w-48 h-48 bg-zinc-50 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-100 flex items-center justify-center">{product.images?.[0] ? <img src={typeof product.images[0] === 'object' ? product.images[0].url : product.images[0]} className="w-full h-full object-contain mix-blend-multiply" alt={product.name} /> : <ImageIcon className="w-8 h-8 text-zinc-300"/>}</div><div className="flex-1"><div className="flex justify-between items-start"><div><span className="inline-block px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs font-bold rounded mb-2">{product.category}</span><h3 className="text-2xl font-bold text-zinc-900 mb-1">{product.name}</h3><p className="text-zinc-500 font-medium text-sm mb-4">Designed by {product.designer || 'Patra Design Lab'}</p></div><button onClick={(e) => toggleFavorite(e, product.id)} className="print:hidden text-yellow-400 hover:scale-110 transition-transform"><Star className="w-6 h-6 fill-current"/></button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><div className="bg-zinc-50 p-3 rounded-lg"><span className="font-bold block text-xs text-zinc-400 uppercase mb-1">Specs</span>{product.specs}</div><div className="space-y-2"><div><span className="font-bold text-xs text-zinc-400 uppercase">Options</span> <span className="text-zinc-700">{product.options?.join(', ')}</span></div><div><span className="font-bold text-xs text-zinc-400 uppercase block mb-1">Colors</span> <div className="flex gap-2 mb-1"><span className="text-xs text-zinc-400 w-16">Body:</span><div className="flex gap-1">{product.bodyColors?.map((c, i) => <SwatchDisplay key={i} color={c} size="small" />)}</div></div><div className="flex gap-2"><span className="text-xs text-zinc-400 w-16">Upholstery:</span><div className="flex gap-1">{product.upholsteryColors?.map((c, i) => <SwatchDisplay key={i} color={c} size="small" />)}</div></div></div></div></div></div></div>))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 pb-32 print:grid-cols-3 print:gap-4">
                            {processedProducts.map((product, idx) => (
                               <div key={product.id} draggable={isAdmin && sortOption === 'manual'} onDragStart={(e) => handleDragStart(e, idx)} onDragEnter={(e) => handleDragEnter(e, idx)} onDragEnd={handleDragEnd} className={isAdmin && sortOption === 'manual' ? 'cursor-move active:opacity-50 transition-all' : ''}>
                                  <ProductCard product={product} onClick={() => pushModal('product', product)} isAdmin={isAdmin} isFavorite={favorites.includes(product.id)} onToggleFavorite={(e) => toggleFavorite(e, product.id)} onCompareToggle={(e) => toggleCompare(e, product)} onDuplicate={(e) => { e.stopPropagation(); handleDuplicateProduct(product); }} isCompared={!!compareList.find(p=>p.id===product.id)} />
                               </div>
                            ))}
                            {isAdmin && activeCategory !== 'MY_PICK' && !SPACES.find(s => s.id === activeCategory) && (<button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px] text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-all group print:hidden"><div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Plus className="w-6 h-6" /></div><span className="text-xs md:text-sm font-bold">Add Product</span></button>)}
                        </div>
                      )}
                      {processedProducts.length === 0 && (<div className="flex flex-col items-center justify-center py-32 text-zinc-300"><CloudOff className="w-16 h-16 mb-4 opacity-50" /><p className="text-sm font-medium">No products found for this space.</p>{isAdmin && SPACES.find(s => s.id === activeCategory) && (<button onClick={() => setManagingSpaceProductsId(activeCategory)} className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors">+ Select Products</button>)}</div>)}
                    </>
                  )}
                </>
              )}
            </>
          )}
          {showScrollTop && (<button onClick={scrollToTop} className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-10 h-10 md:w-12 md:h-12 bg-black/80 backdrop-blur-md text-white rounded-full shadow-lg flex items-center justify-center hover:bg-black hover:scale-110 transition-all z-40 animate-in fade-in slide-in-from-bottom-4 print:hidden"><ChevronsUp className="w-6 h-6" /></button>)}
        </div>
      </main>

      {toast && <div className="fixed bottom-8 right-8 bg-zinc-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-bottom-10 fade-in z-[90] print:hidden">{toast.type === 'success' ? <Check className="w-5 h-5 text-green-400" /> : <Info className="w-5 h-5 text-red-400" />}<span className="text-sm font-bold tracking-wide">{toast.message}</span></div>}
      
      {/* Stacked Modals Render */}
      {modalStack.map((modal, index) => (
          <div key={index} className="fixed inset-0 z-[100]" style={{ zIndex: 100 + index }}>
              {modal.type === 'product' && (
                  <ProductDetailModal 
                    product={modal.data} 
                    allProducts={products}
                    swatches={swatches}
                    spaceContents={spaceContents} 
                    onClose={popModal} 
                    onEdit={() => { setEditingProduct(modal.data); setIsFormOpen(true); }} 
                    isAdmin={isAdmin} 
                    showToast={showToast} 
                    isFavorite={favorites.includes(modal.data.id)} 
                    onToggleFavorite={(e) => toggleFavorite(e, modal.data.id)} 
                    onNavigateSpace={(spaceId) => { clearModals(); setActiveCategory(spaceId); }} 
                    onNavigateScene={(scene) => pushModal('scene', scene)}
                    onNavigateProduct={(product) => pushModal('product', product)}
                    onNavigateSwatch={(swatch) => pushModal('swatch', swatch)}
                  />
              )}
              {modal.type === 'swatch' && (
                  <SwatchDetailModal 
                    swatch={modal.data}
                    allProducts={products}
                    swatches={swatches}
                    isAdmin={isAdmin}
                    onClose={popModal}
                    onNavigateProduct={(product) => pushModal('product', product)}
                    onNavigateSwatch={(swatch) => pushModal('swatch', swatch)}
                    onEdit={() => { popModal(); setEditingSwatchFromModal(modal.data); }}
                  />
              )}
              {modal.type === 'scene' && (
                  <SpaceSceneModal 
                     scene={modal.data} 
                     products={products.filter(p => modal.data.productIds && modal.data.productIds.includes(p.id))} 
                     allProducts={products}
                     isAdmin={isAdmin} 
                     onClose={popModal} 
                     onEdit={() => { setEditingScene({ ...modal.data, isNew: false }); popModal(); }} 
                     onProductToggle={async (pid, add) => {
                        const newPids = add ? [...(modal.data.productIds||[]), pid] : (modal.data.productIds||[]).filter(id=>id!==pid);
                        const updatedScene = { ...modal.data, productIds: newPids };
                        await handleSceneSave(modal.data.spaceId, updatedScene);
                        setModalStack(prev => prev.map((m, i) => i === index ? { ...m, data: updatedScene } : m));
                     }}
                     onNavigateProduct={(p) => pushModal('product', p)}
                  />
              )}
          </div>
      ))}
      
      {isFormOpen && (
        <ProductFormModal 
          categories={CATEGORIES.filter(c => !c.isSpecial)} 
          swatches={swatches} 
          allProducts={products}
          initialCategory={activeCategory} 
          existingData={editingProduct} 
          onClose={() => { setIsFormOpen(false); setEditingProduct(null); }} 
          onSave={handleSaveProduct} 
          onDelete={handleDeleteProduct} 
          isFirebaseAvailable={isFirebaseAvailable} 
          spaceTags={SPACES.find(s=>s.id===activeCategory)?.defaultTags || []} 
        />
      )}
      
      {editingSwatchFromModal && (
        <SwatchFormModal 
           category={SWATCH_CATEGORIES.find(c => c.id === editingSwatchFromModal.category) || SWATCH_CATEGORIES[0]}
           existingData={editingSwatchFromModal}
           onClose={() => setEditingSwatchFromModal(null)}
           onSave={(data) => { handleSaveSwatch(data); setEditingSwatchFromModal(null); }}
        />
      )}

      {editingSpaceInfoId && (
        <SpaceInfoEditModal 
          spaceId={editingSpaceInfoId} 
          currentData={spaceContents[editingSpaceInfoId]} 
          defaultTags={SPACES.find(s=>s.id===editingSpaceInfoId)?.defaultTags} 
          onClose={() => setEditingSpaceInfoId(null)} 
          onSave={(data) => { handleSpaceInfoSave(editingSpaceInfoId, data); setEditingSpaceInfoId(null); }} 
        />
      )}
      
      {managingSpaceProductsId && (
        <SpaceProductManager 
          spaceId={managingSpaceProductsId} 
          products={products} 
          onClose={() => setManagingSpaceProductsId(null)} 
          onToggle={(pid, add) => handleSpaceProductToggle(managingSpaceProductsId, pid, add)} 
        />
      )}
      
      {editingScene && (
        <SceneEditModal 
           initialData={editingScene} 
           allProducts={products}
           spaceTags={SPACES.find(s => s.id === editingScene.spaceId)?.defaultTags || (spaceContents[editingScene.spaceId]?.tags) || []}
           spaceOptions={SPACES}
           onClose={() => setEditingScene(null)} 
           onSave={(data) => { handleSceneSave(editingScene.spaceId, data); setEditingScene(null); }} 
           onDelete={(id) => { handleSceneDelete(editingScene.spaceId, id); setEditingScene(null); }} 
        />
      )}
      
      {showAdminDashboard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-900 text-white">
              <h3 className="text-lg font-bold flex items-center"><ShieldAlert className="w-5 h-5 mr-2" /> Admin Console</h3>
              <button onClick={() => setShowAdminDashboard(false)}><X className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" /></button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-zinc-400 space-y-6">
               <div className="text-center">
                  <Activity className="w-12 h-12 mb-3 mx-auto text-zinc-300"/>
                  <p className="text-lg font-bold text-zinc-600">System Status: Active</p>
               </div>
               
               <div className="w-full max-w-md bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                  <h4 className="text-sm font-bold text-zinc-500 uppercase mb-4 flex items-center"><Database className="w-4 h-4 mr-2"/> Data Management (Backup / Restore)</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <button onClick={handleExportData} className="flex flex-col items-center justify-center p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-400 transition-all hover:shadow-md group">
                        <FileDown className="w-8 h-8 text-zinc-400 group-hover:text-blue-600 mb-2"/>
                        <span className="text-xs font-bold text-zinc-600">Export Backup (JSON)</span>
                     </button>
                     <label className="flex flex-col items-center justify-center p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-400 transition-all hover:shadow-md group cursor-pointer">
                        <FileUp className="w-8 h-8 text-zinc-400 group-hover:text-red-600 mb-2"/>
                        <span className="text-xs font-bold text-zinc-600">Import Restore (JSON)</span>
                        <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                     </label>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-3 text-center">* Import overwrites existing local data. Use with caution.</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Helper Components & Views
// ----------------------------------------------------------------------

function SpacesHubView({ spaces, spaceContents, setActiveCategory, searchString, chips }) {
    // Filter logic
    const filteredSpaces = spaces.filter(space => {
        const textMatch = !searchString && chips.length === 0 ? true : 
            (space.label.toLowerCase().includes(searchString.toLowerCase()) || 
             chips.some(c => space.label.toLowerCase().includes(c.toLowerCase())));
        return textMatch;
    });

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 pb-32">
            <h2 className="text-3xl font-black mb-8 px-1 tracking-tight">Spaces Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSpaces.map(space => {
                    const content = spaceContents[space.id] || {};
                    return (
                        <div key={space.id} onClick={() => setActiveCategory(space.id)} className="group relative h-64 md:h-80 rounded-3xl overflow-hidden cursor-pointer shadow-lg bg-zinc-900">
                            {content.banner ? (
                                <img src={content.banner} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800"><space.icon className="w-16 h-16 text-zinc-700"/></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                            <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 text-white">
                                <div className="flex items-center space-x-2 mb-2 opacity-80">
                                    <space.icon className="w-5 h-5"/>
                                    <span className="text-xs font-bold uppercase tracking-widest">Curated Space</span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-black mb-2">{space.label}</h3>
                                <p className="text-zinc-300 text-sm line-clamp-1 max-w-md">{content.description || 'No description available.'}</p>
                            </div>
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur rounded-full p-2">
                                <ArrowRight className="w-6 h-6 text-white"/>
                            </div>
                        </div>
                    );
                })}
            </div>
            {filteredSpaces.length === 0 && <div className="text-center py-20 text-zinc-400">No spaces found matching your search.</div>}
        </div>
    );
}

function MaterialsHubView({ categories, swatches, setActiveCategory, searchString, chips }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 pb-32">
            <h2 className="text-3xl font-black mb-8 px-1 tracking-tight">Materials Hub</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(cat => {
                    const catSwatches = swatches.filter(s => s.category === cat.id);
                    // Check search match
                    const hasMatch = !searchString && chips.length === 0 ? true : 
                        catSwatches.some(s => s.name.toLowerCase().includes(searchString.toLowerCase()) || 
                        chips.some(c => s.name.toLowerCase().includes(c.toLowerCase())));
                    
                    if(!hasMatch) return null;

                    return (
                        <div key={cat.id} onClick={() => setActiveCategory(cat.id)} className="bg-white border border-zinc-200 rounded-3xl p-6 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1">
                             <div className="flex justify-between items-start mb-6">
                                 <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-md" style={{backgroundColor: cat.color}}>
                                     {cat.label[0]}
                                 </div>
                                 <div className="bg-zinc-100 text-zinc-500 text-xs font-bold px-3 py-1 rounded-full group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                                     {catSwatches.length} Items
                                 </div>
                             </div>
                             <h3 className="text-2xl font-bold text-zinc-900 mb-2">{cat.label}</h3>
                             <p className="text-sm text-zinc-500 mb-6">Browse all {cat.label.toLowerCase()} textures and finishes.</p>
                             
                             <div className="flex -space-x-2 overflow-hidden">
                                 {catSwatches.slice(0, 5).map((s, i) => (
                                     <div key={i} className="w-8 h-8 rounded-full border-2 border-white relative z-0">
                                         <SwatchDisplay color={s} size="full" className="w-full h-full"/>
                                     </div>
                                 ))}
                                 {catSwatches.length > 5 && <div className="w-8 h-8 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-zinc-500">+{catSwatches.length - 5}</div>}
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function DashboardView({ products, favorites, setActiveCategory, onProductClick, isAdmin, bannerData, onBannerUpload, onLogoUpload, onBannerTextChange, onSaveBannerText, setFilters }) {
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
  
  const recentUpdates = [...products].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 6);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [selectedSlice, setSelectedSlice] = useState(null);
  // Inline Accordion State
  const [expandedSection, setExpandedSection] = useState(null);

  const getSelectedSliceDetails = () => {
      if(selectedSlice === null) return null;
      const catId = chartData[selectedSlice].id;
      const catProducts = products.filter(p => p.category === catId);
      const years = [...new Set(catProducts.map(p => p.launchDate ? p.launchDate.substring(0,4) : 'Unknown'))].sort().join(', ');
      const awardCount = catProducts.reduce((acc, curr) => acc + (curr.awards?.length || 0), 0);
      const uniqueColors = new Set();
      catProducts.forEach(p => { (p.bodyColors || []).forEach(c => uniqueColors.add(c)); (p.upholsteryColors || []).forEach(c => uniqueColors.add(c)); });
      return { products: catProducts, years, awardCount, uniqueColors: Array.from(uniqueColors) };
  };

  const sliceDetails = getSelectedSliceDetails();

  // Helper to jump to ALL view with filters
  const jumpToFilter = (type, val) => {
      if(type === 'year') setFilters(prev => ({ ...prev, year: val }));
      if(type === 'color') setFilters(prev => ({ ...prev, color: val }));
      setActiveCategory('ALL');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 print:hidden" onClick={() => setSelectedSlice(null)}>
      
      <div className="relative w-full h-48 md:h-80 rounded-3xl overflow-hidden shadow-lg border border-zinc-200 group bg-zinc-900">
         <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10"></div>
         {bannerData.url ? <img src={bannerData.url} alt="Dashboard Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><img src="/api/placeholder/1200/400" className="w-full h-full object-cover grayscale" alt="Pattern" /></div>}
         <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-20 max-w-2xl">
            {isAdmin ? (
              <div className="space-y-4">
                 <div className="flex items-center gap-4">
                    {bannerData.logoUrl ? (
                        <div className="relative group/logo">
                            <img src={bannerData.logoUrl} className="h-16 md:h-24 w-auto object-contain" alt="Logo" />
                            <button onClick={()=>logoInputRef.current.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover/logo:opacity-100 rounded"><Edit2 className="w-4 h-4"/></button>
                        </div>
                    ) : (
                        <button onClick={()=>logoInputRef.current.click()} className="text-xs text-white bg-white/20 px-3 py-1 rounded hover:bg-white/40">+ Upload Logo</button>
                    )}
                    <input type="text" value={bannerData.title} onChange={(e) => onBannerTextChange('title', e.target.value)} onBlur={onSaveBannerText} className="bg-transparent text-3xl md:text-5xl font-black text-white tracking-tighter w-full outline-none placeholder-zinc-500 border-b border-transparent hover:border-zinc-500 transition-colors" placeholder="Main Title" />
                 </div>
                <input type="text" value={bannerData.subtitle} onChange={(e) => onBannerTextChange('subtitle', e.target.value)} onBlur={onSaveBannerText} className="bg-transparent text-zinc-300 font-medium text-sm md:text-xl w-full outline-none placeholder-zinc-500 border-b border-transparent hover:border-zinc-500 transition-colors" placeholder="Subtitle" />
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={onLogoUpload} />
              </div>
            ) : (
              <>
                {bannerData.logoUrl ? <img src={bannerData.logoUrl} className="h-16 md:h-24 w-auto object-contain mb-4" alt="Logo" /> : <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter mb-2">{bannerData.title}</h2>}
                <p className="text-zinc-300 font-medium text-sm md:text-xl opacity-90">{bannerData.subtitle}</p>
              </>
            )}
         </div>
         {isAdmin && (<><button onClick={() => fileInputRef.current.click()} className="absolute top-4 right-4 z-30 p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100" title="Change Banner Image"><Camera className="w-5 h-5" /></button><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onBannerUpload} /></>)}
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div onClick={() => setActiveCategory('ALL')} className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md cursor-pointer group flex flex-col md:flex-row items-center md:justify-between transition-all text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:space-x-4 w-full justify-center md:justify-start">
             <div className="p-2 md:p-3 bg-zinc-100 rounded-xl group-hover:bg-zinc-900 group-hover:text-white transition-colors text-zinc-500 mb-1 md:mb-0"><LayoutGrid className="w-4 h-4 md:w-6 md:h-6" /></div>
             <div className="flex flex-col">
                <span className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-wide">Total</span>
                <span className="text-base md:text-2xl font-black text-zinc-900 leading-tight">{totalCount}</span>
             </div>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-600 hidden md:block" />
        </div>
        <div onClick={() => setFilters(p => ({...p, isNew: true})) || setActiveCategory('ALL')} className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md cursor-pointer group flex flex-col md:flex-row items-center md:justify-between transition-all text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:space-x-4 w-full justify-center md:justify-start">
             <div className="p-2 md:p-3 bg-red-50 rounded-xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors mb-1 md:mb-0"><Zap className="w-4 h-4 md:w-6 md:h-6" /></div>
             <div className="flex flex-col">
                <span className="text-[10px] md:text-xs font-bold text-red-400 uppercase tracking-wide">New</span>
                <span className="text-base md:text-2xl font-black text-zinc-900 leading-tight">{newCount}</span>
             </div>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-600 hidden md:block" />
        </div>
        <div onClick={() => setActiveCategory('MY_PICK')} className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md cursor-pointer group flex flex-col md:flex-row items-center md:justify-between transition-all text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:space-x-4 w-full justify-center md:justify-start">
             <div className="p-2 md:p-3 bg-yellow-50 rounded-xl text-yellow-500 group-hover:bg-yellow-400 group-hover:text-white transition-colors mb-1 md:mb-0"><Heart className="w-4 h-4 md:w-6 md:h-6 fill-current" /></div>
             <div className="flex flex-col">
                <span className="text-[10px] md:text-xs font-bold text-yellow-500 uppercase tracking-wide">Pick</span>
                <span className="text-base md:text-2xl font-black text-zinc-900 leading-tight">{pickCount}</span>
             </div>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-600 hidden md:block" />
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-zinc-900 flex items-center"><PieChart className="w-6 h-6 mr-3 text-zinc-400" /> Category Contribution</h3>
            <span className="text-xs font-medium text-zinc-400 bg-zinc-50 px-3 py-1 rounded-full">{totalStandardProducts} items</span>
         </div>
         {totalStandardProducts > 0 ? (
           <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="relative w-72 h-72 md:w-96 md:h-96 flex-shrink-0">
                 <PieChartComponent data={chartData} total={totalStandardProducts} selectedIndex={selectedSlice} onSelect={setSelectedSlice} />
              </div>
              <div className="flex-1 w-full" onClick={(e) => e.stopPropagation()}>
                 {selectedSlice !== null ? (
                    <div className="animate-in fade-in slide-in-from-left-4 h-full flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-zinc-100">
                             <div className="w-4 h-4 rounded-full" style={{backgroundColor: chartData[selectedSlice].color}}></div>
                             <h4 className="text-2xl font-black text-zinc-900">{chartData[selectedSlice].label}</h4>
                             <button onClick={() => setActiveCategory(chartData[selectedSlice].id)} className="ml-auto text-xs font-bold text-blue-600 hover:underline flex items-center">Explore <ArrowRight className="w-3 h-3 ml-1"/></button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                           <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Products</span>
                              <span className="text-xl font-black text-zinc-900">{chartData[selectedSlice].count}</span>
                           </div>
                           <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">New Arrivals</span>
                              <span className="text-xl font-black text-zinc-900">{sliceDetails.products.filter(p=>p.isNew).length}</span>
                           </div>
                           <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Total Awards</span>
                              <span className="text-xl font-black text-zinc-900">{sliceDetails.awardCount}</span>
                           </div>
                           
                           {/* Inline Expand for Years */}
                           <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 cursor-pointer hover:bg-zinc-100"
                                onClick={() => setExpandedSection(expandedSection === 'years' ? null : 'years')}
                           >
                              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Launching</span>
                              <span className="text-xs font-bold text-zinc-900 truncate block" title={sliceDetails.years}>{sliceDetails.years.substring(0,12)}...</span>
                           </div>
                        </div>

                        {/* Expanded Years Area */}
                        {expandedSection === 'years' && (
                            <div className="mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-200 animate-in slide-in-from-top-2">
                                <h5 className="text-xs font-bold text-zinc-500 mb-2">Launch Years</h5>
                                <div className="flex flex-wrap gap-2">
                                    {sliceDetails.years.split(', ').map(y => (
                                        <button key={y} onClick={() => jumpToFilter('year', y)} className="text-xs bg-white px-2 py-1 rounded border hover:bg-zinc-100">{y}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <span className="text-xs text-zinc-400 uppercase font-bold block mb-2">Palette Preview</span>
                            <div className="flex flex-wrap gap-1">
                                {sliceDetails.uniqueColors.slice(0, 10).map((c, i) => (
                                    <div key={i}><SwatchDisplay color={c} size="small"/></div>
                                ))}
                                {sliceDetails.uniqueColors.length > 10 && <span className="text-[9px] text-zinc-400">+{sliceDetails.uniqueColors.length - 10}</span>}
                            </div>
                        </div>

                        <div className="flex-1 max-h-60 custom-scrollbar bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                            <div className="flex justify-between items-center mb-2 sticky top-0 bg-zinc-50 pb-1 border-b border-zinc-100">
                                <span className="text-[10px] text-zinc-400 uppercase font-bold">Product List</span>
                                {sliceDetails.products.length > 8 && <button onClick={() => setExpandedSection(expandedSection === 'list' ? null : 'list')} className="text-[10px] text-blue-600 font-bold">
                                    {expandedSection === 'list' ? 'Collapse' : 'View All'}
                                </button>}
                            </div>
                            <div className={`grid grid-cols-2 gap-2 ${expandedSection === 'list' ? '' : 'overflow-hidden'}`} style={{ maxHeight: expandedSection === 'list' ? 'none' : '200px' }}>
                                {sliceDetails.products.slice(0, expandedSection === 'list' ? undefined : 8).map(p => (
                                    <div key={p.id} className="text-xs truncate text-zinc-600 hover:text-black cursor-pointer p-1 hover:bg-zinc-100 rounded" onClick={() => onProductClick(p)}>• {p.name}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        {chartData.map((item) => {
                            const percent = Math.round((item.count/totalStandardProducts)*100);
                            return (
                                <button key={item.id} onClick={() => setActiveCategory(item.id)} className="flex flex-col group p-2 rounded-lg hover:bg-zinc-50 transition-colors text-left">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full mr-2.5 shadow-sm" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-sm font-bold text-zinc-700 group-hover:text-zinc-900">{item.label}</span>
                                        </div>
                                        <div className="flex items-baseline space-x-1">
                                            <span className="text-sm font-black text-zinc-900">{item.count}</span>
                                            <span className="text-[10px] text-zinc-400 font-medium">({percent}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: item.color }}></div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                 )}
              </div>
           </div>
         ) : <div className="text-center py-20 text-zinc-300">No category data available</div>}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-zinc-900 flex items-center"><Clock className="w-6 h-6 mr-3 text-zinc-400" /> Recent Updates</h3>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center" onClick={() => setFilters({isNew:true}) || setActiveCategory('ALL')}>View All <ArrowRight className="w-3 h-3 ml-1"/></button>
         </div>
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentUpdates.length > 0 ? recentUpdates.map(product => (
               <div key={product.id} onClick={() => onProductClick(product)} className="flex flex-col p-3 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer transition-all group">
                  <div className="aspect-[4/3] bg-zinc-100 rounded-lg flex items-center justify-center overflow-hidden border border-zinc-200 mb-2 relative">
                     <div className="absolute inset-0 bg-zinc-100/50 mix-blend-multiply z-10 pointer-events-none"></div>
                     {product.images?.[0] ? <img src={typeof product.images[0] === 'object' ? product.images[0].url : product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" /> : <ImageIcon className="w-6 h-6 text-zinc-300"/>}
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 truncate">{product.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                     <span className="text-[9px] text-zinc-400 uppercase">{product.category}</span>
                     {product.isNew && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                  </div>
               </div>
            )) : <div className="col-span-full text-center text-zinc-300 py-10">No recent updates.</div>}
         </div>
      </div>
    </div>
  );
}

function PieChartComponent({ data, total, selectedIndex, onSelect }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  let cumulativePercent = 0;
  const radius = 0.7; 

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-full h-full transform -rotate-90">
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

           const strokeWidth = isSelected ? 0.22 : 0.2; 

           return (
             <React.Fragment key={item.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  transform={`translate(${tx}, ${ty})`}
                  className="transition-all duration-500 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : idx); }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
             </React.Fragment>
           );
        })}
      </svg>
      
      {/* Optimized Labels: Only show if > 4% and offset better */}
      {data.map((item, idx) => {
          let prevPercent = 0;
          for(let i=0; i<idx; i++) prevPercent += data[i].count/total;
          const percent = item.count/total;
          if(percent < 0.05) return null; // Hide small labels

          const midPercent = prevPercent + percent/2;
          const angleRad = (midPercent * 2 * Math.PI) - (Math.PI / 2); 
          
          const labelRadius = 1.05; 
          const lx = Math.cos(angleRad) * labelRadius;
          const ly = Math.sin(angleRad) * labelRadius;

          return (
             <div 
                key={`label-${item.id}`} 
                className="absolute text-[9px] font-bold text-zinc-500 pointer-events-none whitespace-nowrap bg-white/80 px-1 rounded backdrop-blur-sm"
                style={{ 
                    left: '50%', top: '50%', 
                    transform: `translate(calc(-50% + ${lx * 130}px), calc(-50% + ${ly * 130}px))` 
                }}
             >
                {item.label}
             </div>
          );
      })}

      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none transition-all duration-300">
         {selectedIndex !== null ? (
            <>
                <span className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-widest">{data[selectedIndex].label}</span>
                <span className="text-3xl md:text-4xl font-black text-zinc-900" style={{color: data[selectedIndex].color}}>{data[selectedIndex].count}</span>
            </>
         ) : (
            <>
                <span className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-widest">TOTAL</span>
                <span className="text-3xl md:text-4xl font-black text-zinc-900">{total}</span>
            </>
         )}
      </div>
    </div>
  );
}

// ... CompareView, SwatchDisplay, SwatchManager, SwatchDetailModal, SpaceDetailView, ProductCard, ProductDetailModal, SpaceInfoEditModal, ProductFormModal, SpaceProductManager, SceneEditModal, SpaceSceneModal codes remain the same ...

function CompareView({ products, hiddenIds, onToggleVisibility, onRemove, onEdit, onProductClick, isAdmin }) {
    const visibleProducts = products.filter(p => !hiddenIds.includes(p.id));

    return (
        <div className="animate-in fade-in h-full flex flex-col">
            <div className="bg-white border-b border-zinc-200 p-4 sticky top-0 z-20 shadow-sm flex items-center gap-4 overflow-x-auto custom-scrollbar">
                <span className="text-sm font-bold text-zinc-500 uppercase flex-shrink-0 mr-2">Visibility</span>
                {products.map(p => (
                    <label key={p.id} className="flex items-center space-x-2 text-xs font-bold bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 cursor-pointer hover:bg-zinc-100 flex-shrink-0">
                        <input 
                            type="checkbox" 
                            checked={!hiddenIds.includes(p.id)} 
                            onChange={() => onToggleVisibility(p.id)}
                            className="rounded text-zinc-900 focus:ring-zinc-900"
                        />
                        <span className={`truncate max-w-[100px] ${hiddenIds.includes(p.id) ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>{p.name}</span>
                    </label>
                ))}
            </div>

            <div className="flex-1 overflow-auto bg-white relative pb-32">
                <table className="w-full table-fixed border-collapse">
                    <thead>
                        <tr>
                            {/* Fixed Header Column */}
                            <th className="w-20 md:w-32 bg-zinc-50 border-b border-r border-zinc-100 p-2 md:p-4 text-left text-[10px] md:text-xs font-bold text-zinc-400 uppercase sticky top-0 left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Feature</th>
                            {visibleProducts.map(p => (
                                <th key={p.id} className="w-36 md:w-72 bg-white border-b border-r border-zinc-100 p-2 md:p-4 align-top sticky top-0 z-10">
                                    <div className="relative group">
                                        <div onClick={() => onProductClick(p)} className="aspect-[4/3] bg-zinc-50 rounded-xl mb-2 md:mb-4 flex items-center justify-center overflow-hidden border border-zinc-100 relative max-h-24 md:max-h-full cursor-pointer">
                                            {p.images?.[0] ? <img src={typeof p.images[0] === 'object' ? p.images[0].url : p.images[0]} className="w-full h-full object-contain mix-blend-multiply" /> : <ImageIcon className="text-zinc-300"/>}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                                        </div>
                                        <h4 className="font-bold text-xs md:text-lg text-zinc-900 mb-1 truncate">{p.name}</h4>
                                        <button onClick={() => onRemove(p.id)} className="absolute top-0 right-0 bg-white rounded-full p-1 shadow-sm hover:text-red-500 border border-zinc-100"><X className="w-3 h-3 md:w-4 md:h-4"/></button>
                                    </div>
                                </th>
                            ))}
                            {/* Empty Placeholders */}
                            {visibleProducts.length < 2 && Array(2 - visibleProducts.length).fill(0).map((_, i) => <th key={`ph-${i}`} className="w-36 md:w-72 bg-zinc-50/10 border-b border-zinc-50"></th>)}
                        </tr>
                    </thead>
                    <tbody className="text-xs md:text-sm">
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-4 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Category</td>
                            {visibleProducts.map(p => <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-4 text-zinc-700 font-medium truncate">{p.category}</td>)}
                            {visibleProducts.length < 2 && Array(2 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-4 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Designer</td>
                            {visibleProducts.map(p => <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-4 text-zinc-700 truncate">{p.designer || '-'}</td>)}
                            {visibleProducts.length < 2 && Array(2 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-4 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Launch</td>
                            {visibleProducts.map(p => <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-4 text-zinc-700">{p.launchDate ? p.launchDate.substring(0,4) : '-'}</td>)}
                            {visibleProducts.length < 2 && Array(2 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-4 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Specs</td>
                            {visibleProducts.map(p => <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-4 text-zinc-600 text-[10px] md:text-xs leading-relaxed whitespace-pre-wrap">{p.specs}</td>)}
                            {visibleProducts.length < 2 && Array(2 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-4 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Options</td>
                            {visibleProducts.map(p => (
                                <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {p.options?.map((opt, i) => <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] md:text-[10px] font-bold border border-blue-100">{opt}</span>)}
                                    </div>
                                </td>
                            ))}
                            {visibleProducts.length < 2 && Array(2 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-4 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Colors</td>
                            {visibleProducts.map(p => (
                                <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {[...(p.bodyColors||[]), ...(p.upholsteryColors||[])].slice(0, 8).map((c, i) => <SwatchDisplay key={i} color={c} size="small"/>)}
                                        {([...(p.bodyColors||[]), ...(p.upholsteryColors||[])].length > 8) && <span className="text-[9px] text-zinc-400">+</span>}
                                    </div>
                                </td>
                            ))}
                            {visibleProducts.length < 2 && Array(2 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                        
                        {/* Edit Row for Admins */}
                        {isAdmin && (
                            <tr>
                                <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-4 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Actions</td>
                                {visibleProducts.map(p => (
                                    <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-4 text-center">
                                        <button onClick={() => onEdit(p)} className="px-3 py-1.5 bg-zinc-900 text-white text-[10px] md:text-xs font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center w-full">
                                            <Edit2 className="w-3 h-3 mr-1"/> Edit
                                        </button>
                                    </td>
                                ))}
                                {visibleProducts.length < 2 && Array(2 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SwatchDisplay({ color, size = 'medium', className = '', onClick }) {
  const isObject = typeof color === 'object' && color !== null;
  const hex = isObject ? color.hex : color;
  const image = isObject ? color.image : null;
  const name = isObject ? color.name : color;
  
  // Advanced Visual Properties
  const visualType = isObject ? (color.visualType || 'SOLID') : 'SOLID';
  const textureType = isObject ? (color.textureType || 'SOLID') : 'SOLID';
  const gradient = isObject ? color.gradient : null;
  const pattern = isObject ? (color.pattern || 'NONE') : 'NONE';
  const patternColor = isObject ? (color.patternColor || '#00000033') : '#00000033';

  const hasSize = className.includes('w-') || className.includes('h-');
  const sizeClass = hasSize ? '' : (size === 'large' ? 'w-10 h-10' : size === 'small' ? 'w-4 h-4' : 'w-6 h-6');
  const roundedClass = className.includes('rounded') ? '' : 'rounded-full';

  const isLight = hex && (
     hex.toLowerCase() === '#ffffff' || 
     hex.toLowerCase() === '#fff' || 
     hex.toLowerCase().startsWith('#f') || 
     hex.toLowerCase().startsWith('#e')
  );

  const getPatternStyle = (type, pColor) => {
      switch(type) {
          case 'DOT': return { backgroundImage: `radial-gradient(${pColor} 1px, transparent 1px)`, backgroundSize: '4px 4px' };
          case 'DIAGONAL': return { backgroundImage: `repeating-linear-gradient(45deg, ${pColor} 0, ${pColor} 1px, transparent 0, transparent 50%)`, backgroundSize: '6px 6px' };
          case 'GRID': return { backgroundImage: `linear-gradient(${pColor} 1px, transparent 1px), linear-gradient(90deg, ${pColor} 1px, transparent 1px)`, backgroundSize: '6px 6px' };
          case 'KNIT': return { backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, ${pColor} 2px, ${pColor} 4px), repeating-linear-gradient(-45deg, transparent, transparent 2px, ${pColor} 2px, ${pColor} 4px)` };
          case 'WEAVE': return { backgroundImage: `linear-gradient(45deg, ${pColor} 25%, transparent 25%, transparent 75%, ${pColor} 75%, ${pColor}), linear-gradient(45deg, ${pColor} 25%, transparent 25%, transparent 75%, ${pColor} 75%, ${pColor})`, backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px' };
          case 'FUR': return { backgroundImage: `repeating-radial-gradient(circle at 50% 50%, ${pColor} 0, transparent 2px)`, backgroundSize: '3px 3px' }; 
          case 'LEATHER': return { backgroundImage: `radial-gradient(${pColor} 1px, transparent 0)`, backgroundSize: '3px 3px' }; 
          default: return {};
      }
  };

  const baseStyle = image ? 
    { backgroundImage: `url(${image})`, backgroundSize: 'cover' } : 
    (visualType === 'GRADATION' && gradient) ? { background: gradient } : { backgroundColor: hex };

  const getTextureOverlay = (type) => {
      if(type === 'GLOSSY') return { background: 'linear-gradient(to bottom right, rgba(255,255,255,0.6) 0%, transparent 40%, transparent 100%)' };
      if(type === 'SEMI_GLOSSY') return { background: 'linear-gradient(to bottom right, rgba(255,255,255,0.3) 0%, transparent 50%, transparent 100%)' };
      if(type === 'MATTE') return { boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' };
      if(type === 'CLEAR') return { opacity: 0.6, border: '1px solid rgba(0,0,0,0.1)' };
      return {};
  };
  
  return (
    <div className={`group relative inline-block ${sizeClass} ${roundedClass} ${className} ${onClick ? 'cursor-pointer' : ''} overflow-hidden box-border`} title={name} onClick={onClick} style={{boxShadow: isLight ? 'inset 0 0 0 1px rgba(0,0,0,0.15)' : 'inset 0 0 0 1px rgba(0,0,0,0.05)'}}>
         <div className="absolute inset-0 w-full h-full" style={baseStyle}></div>
         {!image && pattern !== 'NONE' && (
             <div className="absolute inset-0 w-full h-full" style={getPatternStyle(pattern, patternColor)}></div>
         )}
         <div className="absolute inset-0 w-full h-full pointer-events-none" style={getTextureOverlay(textureType)}></div>
    </div>
  );
}

function SwatchManager({ category, swatches, isAdmin, onSave, onDelete, onSelect, onDuplicate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSwatch, setEditingSwatch] = useState(null);
  const [activeTag, setActiveTag] = useState('ALL');

  const allTags = Array.from(new Set(swatches.flatMap(s => s.tags || []))).sort();
  const handleCardClick = (swatch) => { onSelect(swatch); };
  const handleEditClick = (e, swatch) => { e.stopPropagation(); setEditingSwatch(swatch); setIsModalOpen(true); };
  const filteredSwatches = activeTag === 'ALL' ? swatches : swatches.filter(s => s.tags && s.tags.includes(activeTag));

  return (
    <div className="p-1 animate-in fade-in pb-32">
       <div className="flex items-center justify-between mb-6">
         <h3 className="text-2xl font-extrabold text-zinc-900 flex items-center tracking-tight">
             <div className="w-3 h-6 mr-3 rounded-full" style={{backgroundColor: category.color}}></div>
             {category.label}
         </h3>
         {isAdmin && (
             <button onClick={() => { setEditingSwatch(null); setIsModalOpen(true); }} className="px-4 py-2 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all flex items-center shadow-lg whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" /> Add Material
             </button>
          )}
       </div>

       {allTags.length > 0 && (
         <div className="mb-6 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <button onClick={() => setActiveTag('ALL')} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeTag === 'ALL' ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}>ALL</button>
            {allTags.map(tag => (
               <button key={tag} onClick={() => setActiveTag(tag)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeTag === tag ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}>{tag}</button>
            ))}
         </div>
       )}

       <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {filteredSwatches.map(swatch => (
             <div key={swatch.id} onClick={() => handleCardClick(swatch)} className="bg-white rounded-xl border border-zinc-200 overflow-hidden group hover:shadow-lg transition-all relative cursor-pointer">
                <div className="aspect-square relative bg-zinc-100 flex items-center justify-center">
                   <SwatchDisplay color={swatch} className="w-full h-full rounded-none scale-100"/>
                   {isAdmin && (
                     <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={(e) => {e.stopPropagation(); onDuplicate(swatch);}} className="p-1.5 bg-white rounded-full shadow hover:text-green-600"><Layers className="w-3 h-3"/></button>
                        <button onClick={(e) => handleEditClick(e, swatch)} className="p-1.5 bg-white rounded-full shadow hover:text-blue-600"><Edit2 className="w-3 h-3"/></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(swatch.id); }} className="p-1.5 bg-white rounded-full shadow hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                     </div>
                   )}
                </div>
                <div className="p-3">
                   <h4 className="font-bold text-sm truncate mb-1">{swatch.name}</h4>
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] text-zinc-400 uppercase font-medium">{swatch.category}</span>
                      <span className="text-lg font-extrabold text-zinc-900 tracking-tight">{swatch.materialCode || '-'}</span>
                   </div>
                </div>
             </div>
          ))}
          {filteredSwatches.length === 0 && (
             <div className="col-span-full py-20 text-center text-zinc-400 border-2 border-dashed border-zinc-100 rounded-xl">
                <Palette className="w-10 h-10 mx-auto mb-2 opacity-20" />
                No materials registered in this category.
             </div>
          )}
       </div>

       {isModalOpen && (
         <SwatchFormModal 
            category={category} 
            existingData={editingSwatch} 
            onClose={() => setIsModalOpen(false)} 
            onSave={(data) => { onSave(data); setIsModalOpen(false); }} 
         />
       )}
    </div>
  );
}

function SwatchDetailModal({ swatch, allProducts, swatches, onClose, onNavigateProduct, onNavigateSwatch, isAdmin, onEdit }) {
    const relatedProducts = allProducts.filter(p => {
        const inBody = p.bodyColors?.some(c => typeof c === 'object' && c.id === swatch.id);
        const inUph = p.upholsteryColors?.some(c => typeof c === 'object' && c.id === swatch.id);
        return inBody || inUph;
    });

    const handleShareImage = async () => { /* Placeholder */ };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-0 md:p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-white w-full h-full md:h-auto md:max-w-4xl rounded-none md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row md:max-h-[90vh] relative">
                <div className="absolute top-4 right-4 z-[100] flex gap-2">
                   {isAdmin && <button onClick={onEdit} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><Edit3 className="w-6 h-6 text-zinc-900"/></button>}
                   <button onClick={onClose} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><X className="w-6 h-6 text-zinc-900"/></button>
                </div>
                
                <div className="w-full md:w-5/12 bg-zinc-50 flex items-center justify-center p-8 relative min-h-[40vh]">
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full shadow-2xl overflow-hidden border-4 border-white ring-1 ring-black/5 flex items-center justify-center bg-white">
                        <SwatchDisplay color={swatch} size="large" className="w-full h-full scale-100 rounded-full"/>
                    </div>
                </div>

                <div className="w-full md:w-7/12 bg-white p-8 md:p-10 flex flex-col overflow-y-auto pb-safe">
                    <div className="mb-6">
                        <div className="flex gap-2 mb-2">
                            <span className="inline-block px-2.5 py-0.5 bg-zinc-900 text-white text-[10px] font-bold rounded uppercase tracking-widest">{swatch.category}</span>
                            {swatch.tags?.map(t => <span key={t} className="inline-block px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold rounded uppercase tracking-widest">{t}</span>)}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-4xl font-black text-zinc-900 tracking-tighter mb-1">{swatch.materialCode || 'NO CODE'}</span>
                           <h2 className="text-xl font-bold text-zinc-500">{swatch.name}</h2>
                        </div>
                        <div className="flex items-center mt-3 text-zinc-400 font-mono text-xs">
                            <span className="w-3 h-3 rounded-full mr-2 border border-zinc-200" style={{backgroundColor: swatch.hex}}></span>
                            {swatch.hex}
                        </div>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div>
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Description</h3>
                            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                                {swatch.description || "No description provided for this material."}
                            </p>
                        </div>
                        
                        {swatch.textureType && (
                            <div>
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Finish Type</h3>
                                <p className="text-sm font-bold text-zinc-800">{swatch.textureType}</p>
                            </div>
                        )}

                        <div className="pt-6 border-t border-zinc-100">
                             <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex justify-between items-center">
                                 Applied Products 
                                 <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-[10px]">{relatedProducts.length}</span>
                             </h3>
                             <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
                                 {relatedProducts.length > 0 ? relatedProducts.map(p => (
                                     <button key={p.id} onClick={() => onNavigateProduct(p)} className="flex items-center p-2 rounded-lg border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all text-left group">
                                         <div className="w-10 h-10 rounded-md bg-zinc-100 overflow-hidden mr-3 flex-shrink-0">
                                            {p.images?.[0] ? <img src={typeof p.images[0] === 'object' ? p.images[0].url : p.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-200"></div>}
                                         </div>
                                         <div className="min-w-0">
                                             <div className="text-xs font-bold text-zinc-900 truncate group-hover:text-blue-600">{p.name}</div>
                                             <div className="text-[10px] text-zinc-500 truncate">{p.category}</div>
                                         </div>
                                     </button>
                                 )) : (
                                     <div className="col-span-2 text-center py-6 text-zinc-300 text-xs">No products currently use this finish.</div>
                                 )}
                             </div>
                        </div>

                        {/* Share & Print for Mobile Consistency */}
                        <div className="pt-6 border-t border-zinc-100 flex gap-3 print:hidden mb-safe">
                             <button onClick={handleShareImage} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 flex items-center justify-center"><ImgIcon className="w-4 h-4 mr-2"/> Share</button>
                             <button onClick={() => window.print()} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 flex items-center justify-center"><Printer className="w-4 h-4 mr-2"/> PDF</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SwatchFormModal({ category, existingData, onClose, onSave }) {
  const [data, setData] = useState({ 
     id: null, name: '', category: category.id, hex: '#000000', image: null, 
     description: '', materialCode: '', tags: '', textureType: 'SOLID',
     visualType: 'SOLID', gradient: 'linear-gradient(to right, #000, #fff)', 
     pattern: 'NONE', patternColor: '#00000033'
  });
  
  const [gradientColors, setGradientColors] = useState(['#000000', '#ffffff']);
  const fileRef = useRef(null);

  useEffect(() => {
     if(existingData) {
         setData({ 
            ...existingData, 
            description: existingData.description || '', 
            materialCode: existingData.materialCode || '',
            tags: existingData.tags ? existingData.tags.join(', ') : '',
            textureType: existingData.textureType || 'SOLID',
            visualType: existingData.visualType || 'SOLID',
            gradient: existingData.gradient || 'linear-gradient(to right, #000, #fff)',
            pattern: existingData.pattern || 'NONE',
            patternColor: existingData.patternColor || '#00000033'
         });
         if(existingData.visualType === 'GRADATION' && existingData.gradient) {
             const matches = existingData.gradient.match(/#[0-9a-fA-F]{3,6}/g);
             if(matches && matches.length >= 2) setGradientColors([matches[0], matches[1]]);
         }
     }
  }, [existingData]);

  useEffect(() => {
      if(data.visualType === 'GRADATION') {
          setData(prev => ({...prev, gradient: `linear-gradient(to right, ${gradientColors[0]}, ${gradientColors[1]})`}));
      }
  }, [gradientColors]);

  const processImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
           const canvas = document.createElement('canvas'); 
           const MAX = 500; 
           let w = img.width; let h = img.height; 
           const minDim = Math.min(w, h);
           const sx = (w - minDim) / 2; const sy = (h - minDim) / 2;
           canvas.width = MAX; canvas.height = MAX;
           const ctx = canvas.getContext('2d'); 
           ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, MAX, MAX); 
           resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e) => {
     const file = e.target.files[0];
     if(file) {
        try { const url = await processImage(file); setData(p => ({...p, image: url})); } catch(e){}
     }
  };
  
  const handleDeleteImage = () => setData(p => ({...p, image: null}));

  const handleSubmit = () => {
      onSave({
          ...data,
          tags: data.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
       <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <div className="px-5 py-4 border-b border-zinc-100 font-bold text-lg flex-shrink-0">
             {existingData ? 'Edit Material' : 'Add Material'}
          </div>
          <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
             {/* Preview */}
             <div className="flex justify-center mb-2">
                <div onClick={() => fileRef.current.click()} className="w-20 h-20 rounded-full shadow-md border-4 border-white cursor-pointer overflow-hidden relative group bg-zinc-100 flex items-center justify-center">
                    <SwatchDisplay color={data} size="large" className="w-full h-full scale-100 rounded-none"/>
                   <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-6 h-6 text-white"/></div>
                </div>
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleUpload} />
             </div>
             
             {data.image && (
                 <button onClick={handleDeleteImage} className="w-full py-1 text-xs text-red-500 font-bold border border-red-100 rounded bg-red-50 hover:bg-red-100 mb-1">Delete Image</button>
             )}
             
             {/* Visual Settings Group */}
             <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 space-y-2">
                 <h4 className="text-[10px] font-bold text-zinc-400 uppercase">Visual Settings</h4>
                 <div>
                    <div className="flex gap-2">
                        <button onClick={()=>setData({...data, visualType: 'SOLID'})} className={`flex-1 py-1.5 text-xs font-bold rounded border ${data.visualType==='SOLID' ? 'bg-zinc-900 text-white' : 'bg-white'}`}>Solid</button>
                        <button onClick={()=>setData({...data, visualType: 'GRADATION'})} className={`flex-1 py-1.5 text-xs font-bold rounded border ${data.visualType==='GRADATION' ? 'bg-zinc-900 text-white' : 'bg-white'}`}>Gradation</button>
                    </div>
                 </div>

                 {data.visualType === 'SOLID' ? (
                     <div>
                        <div className="flex gap-2">
                           <input type="color" value={data.hex} onChange={e=>setData({...data, hex: e.target.value})} className="h-8 w-10 p-0 border rounded overflow-hidden" />
                           <input value={data.hex} onChange={e=>setData({...data, hex: e.target.value})} className="flex-1 border rounded-lg p-1.5 text-xs outline-none" />
                        </div>
                     </div>
                 ) : (
                     <div>
                        <div className="flex gap-2 mb-1">
                           <input type="color" value={gradientColors[0]} onChange={e=>setGradientColors([e.target.value, gradientColors[1]])} className="h-6 w-full rounded border" />
                           <input type="color" value={gradientColors[1]} onChange={e=>setGradientColors([gradientColors[0], e.target.value])} className="h-6 w-full rounded border" />
                        </div>
                        <input value={data.gradient} onChange={e=>setData({...data, gradient: e.target.value})} className="w-full border rounded-lg p-1.5 text-[10px] outline-none bg-white text-zinc-400" readOnly/>
                     </div>
                 )}

                 <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Pattern</label>
                        <select value={data.pattern} onChange={e=>setData({...data, pattern: e.target.value})} className="w-full border rounded-lg p-1.5 text-xs outline-none bg-white">
                            {PATTERN_TYPES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Pattern Color</label>
                        <div className="flex items-center gap-2">
                            <input type="color" value={data.patternColor?.substring(0,7) || '#000000'} onChange={e=>setData({...data, patternColor: e.target.value})} className="h-7 w-7 rounded border p-0 overflow-hidden"/>
                            <span className="text-[10px] text-zinc-400">{data.patternColor}</span>
                        </div>
                     </div>
                 </div>
                 
                 <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Finish Type</label>
                    <select value={data.textureType} onChange={e=>setData({...data, textureType: e.target.value})} className="w-full border rounded-lg p-1.5 text-xs outline-none bg-white">
                        {TEXTURE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Code</label>
                    <input value={data.materialCode} onChange={e=>setData({...data, materialCode: e.target.value})} className="w-full border rounded-lg p-1.5 text-xs outline-none font-mono font-bold" />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Name</label>
                    <input value={data.name} onChange={e=>setData({...data, name: e.target.value})} className="w-full border rounded-lg p-1.5 text-xs outline-none" />
                 </div>
             </div>
             
             <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Tags</label>
                <input value={data.tags} onChange={e=>setData({...data, tags: e.target.value})} className="w-full border rounded-lg p-1.5 text-xs outline-none" />
             </div>

             <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Category</label>
                <select value={data.category} onChange={e=>setData({...data, category: e.target.value})} className="w-full border rounded-lg p-1.5 text-xs outline-none bg-white">
                   {SWATCH_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
             </div>
          </div>
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 flex justify-end space-x-2 flex-shrink-0">
             <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900">Cancel</button>
             <button onClick={handleSubmit} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold shadow-md hover:bg-black">Save</button>
          </div>
       </div>
    </div>
  );
}

function SpaceDetailView({ space, spaceContent, activeTag, setActiveTag, isAdmin, onBannerUpload, onEditInfo, onManageProducts, onAddScene, onViewScene, productCount }) {
  const banner = spaceContent.banner;
  const description = spaceContent.description || "이 공간에 대한 설명이 없습니다.";
  const trend = spaceContent.trend || "";
  const scenes = spaceContent.scenes || [];
  const tags = spaceContent.tags || space.defaultTags || []; 

  const filteredScenes = activeTag === 'ALL' ? scenes : scenes.filter(s => s.tags && s.tags.includes(activeTag));

  const copySpaceLink = () => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?space=${space.id}`); window.alert("공간 공유 링크가 복사되었습니다."); };

  return (
    <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative rounded-3xl overflow-hidden h-72 md:h-96 shadow-lg group mb-8 bg-zinc-900 print:hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10"></div>
        {banner ? <img src={banner} className="w-full h-full object-cover transition-transform duration-1000" alt="Space Banner" /> : <div className="w-full h-full flex items-center justify-center opacity-30"><span className="text-white text-4xl font-bold uppercase">{space.label}</span></div>}
        <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 z-20 text-white max-w-3xl">
           <div className="flex items-center space-x-3 mb-3"><div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">{React.createElement(space.icon, { className: "w-6 h-6" })}</div><span className="text-sm font-bold uppercase tracking-widest opacity-90">Space Curation</span></div>
           <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-tight">{space.label}</h2>
           <p className="text-zinc-200 text-sm md:text-lg leading-relaxed font-light">{description}</p>
           {trend && (<div className="mt-6 pl-4 border-l-2 border-indigo-500"><p className="text-indigo-300 text-xs font-bold uppercase mb-1">Design Trend</p><p className="text-zinc-300 text-sm italic">"{trend}"</p></div>)}
        </div>
        <div className="absolute top-6 right-6 z-30 flex space-x-3">
           <button onClick={copySpaceLink} className="p-2.5 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-all"><Share2 className="w-5 h-5" /></button>
           {isAdmin && (<><label className="p-2.5 bg-black/40 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-all cursor-pointer"><Camera className="w-5 h-5" /><input type="file" className="hidden" accept="image/*" onChange={onBannerUpload} /></label><button onClick={onEditInfo} className="p-2.5 bg-black/40 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-all"><Edit3 className="w-5 h-5" /></button></>)}
        </div>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
         <button onClick={() => setActiveTag('ALL')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${activeTag === 'ALL' ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}>ALL</button>
         {tags.map((tag, idx) => (
            <button key={idx} onClick={() => setActiveTag(tag)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${activeTag === tag ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}>{tag}</button>
         ))}
      </div>

      <div className="mb-12 print:hidden">
        <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-extrabold text-zinc-900 flex items-center"><ImageIcon className="w-6 h-6 mr-2 text-indigo-500" /> Space Scenes ({filteredScenes.length})</h3>{isAdmin && (<button onClick={onAddScene} className="flex items-center text-sm font-bold bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors shadow-lg"><Plus className="w-4 h-4 mr-2" /> Add Scene</button>)}</div>
        {filteredScenes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScenes.map((scene) => (
              <div key={scene.id} onClick={() => onViewScene(scene)} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 shadow-md hover:shadow-xl transition-all cursor-pointer">
                <img src={scene.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={scene.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                {scene.productIds && scene.productIds.length > 0 && <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center"><Tag className="w-3 h-3 mr-1" /> {scene.productIds.length} Products</div>}
                <div className="absolute bottom-5 left-5 right-5 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <h4 className="text-xl font-bold mb-1 truncate">{scene.title}</h4>
                  <p className="text-xs text-zinc-300 line-clamp-1">{scene.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (<div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-zinc-400"><ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">등록된 공간 장면이 없습니다.</p></div>)}
      </div>
      <div className="flex items-center justify-between mb-6 border-t border-zinc-100 pt-12 print:border-none print:pt-0">
         <h3 className="text-xl font-bold text-zinc-900 flex items-center"><Tag className="w-5 h-5 mr-2 text-zinc-400" /> All Curated Products <span className="ml-2 text-sm font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{productCount}</span></h3>
         {isAdmin && (<button onClick={onManageProducts} className="flex items-center text-sm font-bold text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 px-4 py-2 rounded-lg hover:border-zinc-400 transition-colors"><Settings className="w-4 h-4 mr-2" /> Manage List</button>)}
      </div>
    </div>
  );
}

function ProductCard({ product, onClick, showMoveControls, onMove, isFavorite, onToggleFavorite, onCompareToggle, isCompared, isAdmin, onDuplicate }) {
  const mainImageEntry = product.images && product.images.length > 0 ? product.images[0] : null;
  const mainImageUrl = mainImageEntry ? (typeof mainImageEntry === 'object' ? mainImageEntry.url : mainImageEntry) : null;
  
  return (
    <div onClick={onClick} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border border-zinc-100 relative flex flex-col h-full print:break-inside-avoid print:shadow-none print:border-zinc-200">
      <div className="relative aspect-[4/3] bg-zinc-50 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-zinc-100/30 mix-blend-multiply pointer-events-none z-10"></div>
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 z-20 items-start max-w-[80%]">
           {product.isNew && <span className="bg-black text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-sm tracking-wide">NEW</span>}
        </div>
        
        <div className="absolute top-2 right-2 flex gap-1 z-20">
           {isAdmin && (
              <button onClick={onDuplicate} className="p-1.5 bg-white/80 rounded-full text-zinc-400 hover:text-green-600 hover:scale-110 transition-all" title="Duplicate">
                 <Layers className="w-3.5 h-3.5" />
              </button>
           )}
           <button onClick={(e) => onCompareToggle(e)} className={`p-1.5 rounded-full transition-all ${isCompared ? 'bg-zinc-900 text-white' : 'bg-white/80 text-zinc-400 hover:text-zinc-900'}`} title="Compare">
              <ArrowLeftRight className="w-3.5 h-3.5" />
           </button>
           <button onClick={onToggleFavorite} className="p-1.5 bg-white/80 rounded-full text-zinc-300 hover:text-yellow-400 hover:scale-110 transition-all"><Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} /></button>
        </div>

        <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            {mainImageUrl ? <img src={mainImageUrl} alt={product.name} loading="lazy" className="w-full h-full object-cover" /> : <div className="text-center opacity-30"><ImageIcon className="w-8 h-8 text-zinc-400" /></div>}
        </div>
        
        {showMoveControls && (
          <div className="absolute bottom-1 md:bottom-2 left-0 right-0 flex justify-center gap-2 z-20 print:hidden">
             <button onClick={(e) => {e.stopPropagation(); onMove('left')}} className="p-1 md:p-1.5 bg-white/90 rounded-full shadow hover:bg-black hover:text-white text-zinc-700 transition-colors"><ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /></button>
             <button onClick={(e) => {e.stopPropagation(); onMove('right')}} className="p-1 md:p-1.5 bg-white/90 rounded-full shadow hover:bg-black hover:text-white text-zinc-700 transition-colors"><ArrowRight className="w-3 h-3 md:w-4 md:h-4" /></button>
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col bg-white">
        <h3 className="text-sm font-extrabold text-zinc-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1 mb-3">{product.name}</h3>
        <div className="flex justify-between items-end mt-auto pt-2 border-t border-zinc-50">
           <span className="text-[10px] font-medium text-zinc-400 truncate max-w-[60%]">{product.designer || 'Patra Design'}</span>
           <span className="text-[9px] font-bold text-zinc-500 bg-zinc-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{product.category}</span>
        </div>
      </div>
    </div>
  );
}

function ProductDetailModal({ product, allProducts, swatches, spaceContents, onClose, onEdit, isAdmin, showToast, isFavorite, onToggleFavorite, onNavigateSpace, onNavigateScene, onNavigateProduct, onNavigateSwatch }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [swatchPopup, setSwatchPopup] = useState(null); 

  useEffect(() => {
      const closePopup = () => setSwatchPopup(null);
      window.addEventListener('click', closePopup);
      return () => window.removeEventListener('click', closePopup);
  }, []);

  if (!product) return null;

  const images = product.images || [];
  const currentImageEntry = images.length > 0 ? images[currentImageIndex] : null;
  const currentImageUrl = currentImageEntry ? (typeof currentImageEntry === 'object' ? currentImageEntry.url : currentImageEntry) : null;
  const currentImageCaption = currentImageEntry && typeof currentImageEntry === 'object' ? currentImageEntry.caption : '';

  const contentImages = product.contentImages || [];
  
  const relatedSpaces = SPACES.filter(s => product.spaces && product.spaces.includes(s.id));
  const relatedScenes = [];
  if (spaceContents) {
    Object.keys(spaceContents).forEach(spaceId => {
       const content = spaceContents[spaceId];
       if (content && content.scenes) {
          content.scenes.forEach(scene => {
             if (scene.productIds && scene.productIds.includes(product.id)) relatedScenes.push({ ...scene, spaceId });
          });
       }
    });
  }

  const relatedItems = allProducts.filter(p => product.relatedProductIds?.includes(p.id));

  const copyToClipboard = () => { navigator.clipboard.writeText(`[${product.name}]\n${product.specs}`); showToast("Copied to clipboard"); };
  const launchYear = product.launchDate ? product.launchDate.substring(0, 4) : '';

  const handleSwatchClick = (e, color) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      let code = 'NO CODE';
      let name = '';
      let swatchId = null;

      if (typeof color === 'object') {
          swatchId = color.id;
          const globalSwatch = swatches.find(s => s.id === swatchId);
          if(globalSwatch && globalSwatch.materialCode) code = globalSwatch.materialCode;
          else if (color.materialCode) code = color.materialCode; 
          name = color.name || '';
      } else {
          code = color; 
      }
      const foundSwatch = swatches.find(s => s.id === swatchId) || (typeof color === 'object' ? color : null);
      
      setSwatchPopup({ x: rect.left + rect.width / 2, y: rect.top, code, name, swatchObj: foundSwatch });
  };

  const navigateToSwatch = () => {
      if(swatchPopup && swatchPopup.swatchObj && swatchPopup.swatchObj.id) {
         const fullSwatch = swatches.find(s => s.id === swatchPopup.swatchObj.id);
         if(fullSwatch) onNavigateSwatch(fullSwatch);
         else onNavigateSwatch(swatchPopup.swatchObj);
         setSwatchPopup(null);
      }
  };

  return (
    <div key={product.id} className="w-full h-full flex flex-col md:flex-row bg-white overflow-hidden relative print:overflow-visible print:h-auto">
      {swatchPopup && (
          <div 
             className="fixed z-[160] bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-black/80 transition-colors border border-white/10 pointer-events-auto"
             style={{ top: swatchPopup.y - 10, left: swatchPopup.x, transform: 'translate(-50%, -100%)' }}
             onClick={(e) => { e.stopPropagation(); navigateToSwatch(); }}
          >
              <div className="text-sm font-bold tracking-tight leading-none mb-0.5 text-center">{swatchPopup.code}</div>
              {swatchPopup.name && <div className="text-[10px] font-medium text-white/80 text-center">{swatchPopup.name}</div>}
              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-black/60 backdrop-blur-sm border-r border-b border-white/10 rotate-45"></div>
          </div>
      )}

      {/* Close & Edit Buttons are moved to parent modal wrapper, but we keep a header for mobile */}
      <div className="absolute top-4 right-4 z-[100] flex gap-2">
            {isAdmin && <button onClick={onEdit} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><Edit3 className="w-6 h-6 text-zinc-900" /></button>}
            <button onClick={onClose} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><X className="w-6 h-6 text-zinc-900" /></button>
      </div>
        
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-100 bg-white sticky top-0 z-50 print:hidden">
         <div className="flex items-center">
            <button onClick={onToggleFavorite}><Star className={`w-6 h-6 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`}/></button>
            <span className="font-bold text-sm truncate max-w-[200px] ml-3">{product.name}</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row h-full pb-safe print:overflow-visible print:h-auto">
          <div className="w-full md:w-1/2 bg-zinc-50 p-6 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-zinc-100 md:sticky md:top-0 print:static print:bg-white print:border-none">
            <div className="flex-1 w-full bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 overflow-hidden p-8 mb-4 relative group min-h-[300px] print:shadow-none print:border-zinc-200">
               {currentImageUrl ? (
                   <div className="relative w-full h-full flex items-center justify-center">
                       <img src={currentImageUrl} alt="Main" className="w-full h-full object-contain mix-blend-multiply" />
                       {currentImageCaption && <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs p-3 rounded-xl text-center">{currentImageCaption}</div>}
                   </div>
               ) : <ImageIcon className="w-20 h-20 opacity-20 text-zinc-400" />}
               <button onClick={onToggleFavorite} className="absolute top-4 left-4 p-3 bg-white rounded-full shadow-sm border border-zinc-100 hover:border-zinc-300 transition-all hidden md:flex print:hidden"><Star className={`w-5 h-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`} /></button>
            </div>
            {images.length > 0 && (<div className="flex space-x-2 md:space-x-3 overflow-x-auto custom-scrollbar pb-1 px-1 print:hidden">{images.map((img, idx) => (<button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`flex-shrink-0 w-10 h-10 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-zinc-900 ring-2 ring-zinc-200' : 'border-transparent opacity-60 hover:opacity-100 bg-white'}`}><img src={typeof img === 'object' ? img.url : img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" /></button>))}</div>)}
          </div>
          <div className="w-full md:w-1/2 p-6 md:p-12 bg-white pb-12 print:pb-0">
            <div className="mb-6 md:mb-10">
              <div className="mb-2">
                 <span className="inline-block px-2.5 py-0.5 bg-zinc-900 text-white text-[10px] font-extrabold rounded uppercase tracking-widest">{product.category}</span>
              </div>
              {product.awards && product.awards.length > 0 && (
                 <div className="flex flex-wrap gap-2 mb-3">
                    {product.awards.map(award => (<span key={award} className="inline-flex items-center px-2.5 py-0.5 bg-yellow-400/20 text-yellow-700 border border-yellow-400/30 text-[10px] font-bold rounded uppercase tracking-wide"><Trophy className="w-3 h-3 mr-1" /> {award}</span>))}
                 </div>
              )}
              <h2 className="text-3xl md:text-5xl font-black text-zinc-900 mb-1 tracking-tight">{product.name}</h2>
              <div className="flex items-center text-sm text-zinc-500 font-medium">
                 {product.designer && <span className="mr-3">Designed by <span className="text-zinc-900">{product.designer}</span></span>}
                 {launchYear && <span>Since {launchYear}</span>}
              </div>
            </div>
            
            <div className="space-y-6 md:space-y-10">
              <div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between">Specifications <button onClick={copyToClipboard} className="text-zinc-400 hover:text-zinc-900 print:hidden"><Copy className="w-4 h-4" /></button></h3><p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 md:p-6 rounded-2xl border border-zinc-100 whitespace-pre-wrap print:bg-transparent print:border-none print:p-0">{product.specs}</p></div>
              {(product.features?.length > 0 || product.options?.length > 0) && (<div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Features & Options</h3><div className="flex flex-wrap gap-2">{product.options?.map((opt, idx) => (<span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold print:border-gray-300 print:text-black">{opt}</span>))}{product.features?.map((ft, idx) => (<span key={idx} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium flex items-center print:bg-transparent"><Check className="w-3 h-3 mr-1.5" /> {ft}</span>))}</div></div>)}
              <div className="grid grid-cols-2 gap-4 md:gap-8">
                 <div>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Body Color</h3>
                    <div className="flex flex-wrap gap-2">
                       {product.bodyColors?.map((c, i) => <SwatchDisplay key={i} color={c} size="medium" onClick={(e) => handleSwatchClick(e, c)} />)}
                    </div>
                 </div>
                 <div>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Upholstery</h3>
                    <div className="flex flex-wrap gap-2">
                       {product.upholsteryColors?.map((c, i) => <SwatchDisplay key={i} color={c} size="medium" onClick={(e) => handleSwatchClick(e, c)} />)}
                    </div>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-zinc-100 print:hidden">
                {relatedSpaces.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Related Spaces</h3>
                    <div className="space-y-2">
                      {relatedSpaces.map(space => (
                        <button key={space.id} onClick={() => onNavigateSpace(space.id)} className="w-full flex items-center p-3 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-all text-left border border-transparent hover:border-zinc-200 group">
                          <div className="p-2 bg-white rounded-lg shadow-sm mr-3 text-zinc-400 group-hover:text-black transition-colors"><space.icon className="w-4 h-4" /></div>
                          <span className="text-sm font-bold text-zinc-700">{space.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {relatedScenes.length > 0 && (
                   <div>
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Related Scenes</h3>
                      <div className="space-y-2">
                         {relatedScenes.map(scene => (
                            <button key={scene.id} onClick={() => onNavigateScene(scene)} className="w-full flex items-center p-2 bg-white border border-zinc-200 hover:border-zinc-400 rounded-xl transition-all text-left shadow-sm group">
                               <div className="w-10 h-10 bg-zinc-100 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                                  <img src={scene.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Scene"/>
                               </div>
                               <div className="min-w-0">
                                  <div className="text-xs font-bold text-zinc-900 truncate">{scene.title}</div>
                                  <div className="text-[10px] text-zinc-500 truncate flex items-center"><ImageIcon className="w-3 h-3 mr-1"/> View Scene</div>
                               </div>
                            </button>
                         ))}
                      </div>
                   </div>
                )}
              </div>

              {relatedItems.length > 0 && (
                  <div className="pt-8 border-t border-zinc-100">
                     <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Related Products</h3>
                     <div className="grid grid-cols-2 gap-3">
                        {relatedItems.map(p => (
                            <button key={p.id} onClick={() => onNavigateProduct(p)} className="flex items-center p-2 rounded-lg border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all text-left group">
                                <div className="w-10 h-10 rounded-md bg-zinc-100 overflow-hidden mr-3 flex-shrink-0">
                                    {p.images?.[0] ? <img src={typeof p.images[0] === 'object' ? p.images[0].url : p.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-200"></div>}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-zinc-900 truncate group-hover:text-blue-600">{p.name}</div>
                                    <div className="text-[10px] text-zinc-500 truncate">{p.category}</div>
                                </div>
                            </button>
                        ))}
                     </div>
                  </div>
              )}

              {contentImages.length > 0 && (<div className="pt-8 border-t border-zinc-100 space-y-4"><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Detail View</h3><div className="flex flex-col gap-4">{contentImages.map((img, idx) => (
                  <div key={idx} className="relative">
                      <img src={typeof img === 'object' ? img.url : img} alt={`Detail ${idx+1}`} className="w-full h-auto rounded-xl border border-zinc-100 print:border-none" />
                      {typeof img === 'object' && img.caption && <div className="absolute bottom-3 left-3 right-3 bg-black/60 text-white text-xs p-2 rounded-lg text-center backdrop-blur-sm">{img.caption}</div>}
                  </div>
              ))}</div></div>)}

              <div className="hidden md:flex mt-12 pt-6 border-t border-zinc-100 justify-between items-center pb-8 print:hidden">
                 <button onClick={() => window.print()} className="flex items-center px-5 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors shadow-sm"><Printer className="w-4 h-4 mr-2" /> Print PDF</button>
              </div>
          </div>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center"><h3 className="text-lg font-bold text-zinc-900">Edit Space Info</h3><button onClick={onClose}><X className="w-5 h-5 text-zinc-400" /></button></div>
        <div className="p-6 space-y-4">
           <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Description</label><textarea className="w-full border border-zinc-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" rows={4} value={data.description} onChange={(e) => setData({...data, description: e.target.value})} /></div>
           <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Design Trend Keywords</label><input type="text" className="w-full border border-zinc-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={data.trend} onChange={(e) => setData({...data, trend: e.target.value})} placeholder="e.g. Minimalist, Eco-friendly, Open Plan" /></div>
           <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Space Tags (comma separated)</label><input type="text" className="w-full border border-zinc-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={data.tagsString} onChange={(e) => setData({...data, tagsString: e.target.value})} placeholder="Task, Executive, Meeting..." /></div>
        </div>
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end"><button onClick={handleSave} className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-black shadow-lg">Save Changes</button></div>
      </div>
    </div>
  );
}

function ProductFormModal({ categories, swatches = [], allProducts = [], existingData, onClose, onSave, onDelete, isFirebaseAvailable, initialCategory, spaceTags = [] }) {
  const isEditMode = !!existingData;
  const fileInputRef = useRef(null);
  const contentInputRef = useRef(null);
  const defaultCategory = (initialCategory && !['ALL','NEW','MY_PICK','DASHBOARD','COMPARE_PAGE'].includes(initialCategory) && !SPACES.find(s=>s.id===initialCategory)) ? initialCategory : 'EXECUTIVE';
  
  const [formData, setFormData] = useState({ 
    id: null, name: '', category: defaultCategory, specs: '', designer: '',
    featuresString: '', optionsString: '', materialsString: '', awardsString: '',
    productLink: '', isNew: false, launchDate: new Date().getFullYear().toString(),
    images: [], attachments: [], contentImages: [], spaces: [], spaceTags: [],
    bodyColors: [], upholsteryColors: [], relatedProductIds: []
  });
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [relatedFilter, setRelatedFilter] = useState('');

  const normalizeImages = (imgs) => imgs.map(img => typeof img === 'string' ? { url: img, caption: '' } : img);

  useEffect(() => {
    if (existingData) {
      setFormData({ 
        id: existingData.id, name: existingData.name, category: existingData.category, specs: existingData.specs, designer: existingData.designer || '',
        featuresString: existingData.features?.join(', ') || '', optionsString: existingData.options?.join(', ') || '', materialsString: existingData.materials?.join(', ') || '',
        awardsString: existingData.awards?.join(', ') || '', productLink: existingData.productLink || '', isNew: existingData.isNew, 
        launchDate: existingData.launchDate ? existingData.launchDate.substring(0,4) : new Date().getFullYear().toString(),
        images: normalizeImages(existingData.images || []), 
        attachments: existingData.attachments || [], 
        contentImages: normalizeImages(existingData.contentImages || []),
        spaces: existingData.spaces || [], spaceTags: existingData.spaceTags || [],
        bodyColors: existingData.bodyColors || [],
        upholsteryColors: existingData.upholsteryColors || [],
        relatedProductIds: existingData.relatedProductIds || []
      });
    }
  }, [existingData]);

  const processImage = (file) => { return new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const MAX_WIDTH = 1000; let width = img.width; let height = img.height; if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.8)); }; img.src = e.target.result; }; reader.readAsDataURL(file); }); };
  
  const handleImageUpload = async (e) => { 
      const files = Array.from(e.target.files); 
      if (files.length > 0) { 
          setIsProcessingImage(true); 
          const newImgs = []; 
          for (const file of files) { try { newImgs.push({ url: await processImage(file), caption: '' }); } catch (e) {} } 
          setFormData(prev => ({ ...prev, images: [...prev.images, ...newImgs] })); 
          setIsProcessingImage(false); 
      } 
  };
  const handleContentImageUpload = async (e) => { 
      const files = Array.from(e.target.files); 
      if (files.length > 0) { 
          setIsProcessingImage(true); 
          const newImgs = []; 
          for (const file of files) { try { newImgs.push({ url: await processImage(file), caption: '' }); } catch (e) {} } 
          setFormData(prev => ({ ...prev, contentImages: [...prev.contentImages, ...newImgs] })); 
          setIsProcessingImage(false); 
      } 
  };

  const handleCaptionChange = (index, value, type) => {
      setFormData(prev => {
          const list = type === 'main' ? [...prev.images] : [...prev.contentImages];
          list[index] = { ...list[index], caption: value };
          return type === 'main' ? { ...prev, images: list } : { ...prev, contentImages: list };
      });
  };

  const handleAttachmentUpload = (e) => { const files = Array.from(e.target.files); files.forEach(file => { if (file.size > 300*1024) return window.alert("Too large"); const reader = new FileReader(); reader.onload = (e) => setFormData(p => ({...p, attachments: [...p.attachments, {name: file.name, url: e.target.result}]})); reader.readAsDataURL(file); }); };
  const handleAddLinkAttachment = () => { const url = window.prompt("URL:"); const name = window.prompt("Name:"); if(url && name) setFormData(p => ({...p, attachments: [...p.attachments, {name, url}]})); };
  const removeImage = (i) => setFormData(p => ({...p, images: p.images.filter((_, idx) => idx !== i)}));
  const removeContentImage = (i) => setFormData(p => ({...p, contentImages: p.contentImages.filter((_, idx) => idx !== i)}));
  const setMainImage = (i) => setFormData(p => { const imgs = [...p.images]; const [m] = imgs.splice(i, 1); imgs.unshift(m); return {...p, images: imgs}; });
  const removeAttachment = (i) => setFormData(p => ({...p, attachments: p.attachments.filter((_, idx) => idx !== i)}));
  const toggleSpace = (spaceId) => { setFormData(prev => { const currentSpaces = prev.spaces || []; if (currentSpaces.includes(spaceId)) { return { ...prev, spaces: currentSpaces.filter(id => id !== spaceId) }; } else { return { ...prev, spaces: [...currentSpaces, spaceId] }; } }); };
  const toggleSpaceTag = (tag) => { setFormData(prev => { const currentTags = prev.spaceTags || []; if (currentTags.includes(tag)) return { ...prev, spaceTags: currentTags.filter(t => t !== tag) }; else return { ...prev, spaceTags: [...currentTags, tag] }; }); };
  
  const toggleRelatedProduct = (pid) => {
      setFormData(prev => {
          const ids = prev.relatedProductIds || [];
          if(ids.includes(pid)) return { ...prev, relatedProductIds: ids.filter(id => id !== pid) };
          else return { ...prev, relatedProductIds: [...ids, pid] };
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      ...formData,
      launchDate: formData.launchDate, 
      features: formData.featuresString.split(',').map(s=>s.trim()).filter(Boolean),
      options: formData.optionsString.split(',').map(s=>s.trim()).filter(Boolean),
      materials: formData.materialsString.split(',').map(s=>s.trim()).filter(Boolean),
      awards: formData.awardsString.split(',').map(s=>s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[180] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-4 duration-200">
        <div className="px-8 py-5 border-b border-zinc-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-900">{isEditMode ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose}><X className="w-6 h-6 text-zinc-400 hover:text-zinc-900" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
             <div className="flex justify-between mb-4"><span className="font-bold text-sm">Product Images (Main)</span><div className="space-x-2"><button type="button" onClick={() => fileInputRef.current.click()} className="text-xs bg-white border px-3 py-1 rounded-lg font-medium hover:bg-zinc-100">Upload</button></div><input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleImageUpload} accept="image/*"/></div>
             <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
               {formData.images.map((img, i) => (
                   <div key={i} className="relative aspect-square bg-white rounded-lg border overflow-hidden group">
                       <img src={img.url || img} className="w-full h-full object-cover" />
                       <input 
                           className="absolute bottom-0 w-full text-[9px] bg-white/90 border-t p-1 outline-none opacity-0 group-hover:opacity-100 transition-opacity" 
                           placeholder="Caption..." 
                           value={img.caption || ''} 
                           onChange={(e) => handleCaptionChange(i, e.target.value, 'main')}
                       />
                       <button type="button" onClick={()=>removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button>
                       {i===0 && <span className="absolute top-1 left-1 bg-black text-white text-[9px] px-1 rounded">MAIN</span>}
                       {i!==0 && <button type="button" onClick={()=>setMainImage(i)} className="absolute top-1 left-1 bg-white text-black text-[9px] px-1 rounded opacity-0 group-hover:opacity-100">Set Main</button>}
                   </div>
               ))}
             </div>
          </div>
          <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
             <div className="flex justify-between mb-4"><span className="font-bold text-sm">Detailed Content Images (Vertical Scroll)</span><div className="space-x-2"><button type="button" onClick={() => contentInputRef.current.click()} className="text-xs bg-white border px-3 py-1 rounded-lg font-medium hover:bg-zinc-100">Upload</button></div><input ref={contentInputRef} type="file" multiple className="hidden" onChange={handleContentImageUpload} accept="image/*"/></div>
             <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
               {formData.contentImages.map((img, i) => (
                   <div key={i} className="relative aspect-[3/4] bg-white rounded-lg border overflow-hidden group">
                       <img src={img.url || img} className="w-full h-full object-cover" />
                       <input 
                           className="absolute bottom-0 w-full text-[9px] bg-white/90 border-t p-1 outline-none opacity-0 group-hover:opacity-100 transition-opacity" 
                           placeholder="Caption..." 
                           value={img.caption || ''} 
                           onChange={(e) => handleCaptionChange(i, e.target.value, 'content')}
                       />
                       <button type="button" onClick={()=>removeContentImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button>
                   </div>
               ))}
             </div>
          </div>
          
          <div className="mb-4">
             <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Related Spaces</label>
             <div className="flex flex-wrap gap-2 mb-2">{SPACES.map(space => (<button key={space.id} type="button" onClick={() => toggleSpace(space.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center ${formData.spaces.includes(space.id) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}>{formData.spaces.includes(space.id) && <Check className="w-3 h-3 mr-1.5" />}{space.label}</button>))}</div>
             {spaceTags.length > 0 && (<div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100"><label className="block text-[10px] font-bold text-zinc-400 uppercase mb-2">Detailed Space Tags</label><div className="flex flex-wrap gap-2">{spaceTags.map(tag => (<button key={tag} type="button" onClick={() => toggleSpaceTag(tag)} className={`px-2 py-1 rounded text-[10px] font-bold border ${formData.spaceTags.includes(tag) ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-zinc-500 border-zinc-200'}`}>{tag}</button>))}</div></div>)}
          </div>

          <div className="grid grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Name</label><input required className="w-full border p-2 rounded-lg" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})}/></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label><select className="w-full border p-2 rounded-lg" value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})}>{categories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div></div>
          
          <div className="grid grid-cols-2 gap-6">
             <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Launch Year</label><input type="number" min="1900" max="2099" step="1" className="w-full border p-2 rounded-lg" value={formData.launchDate} onChange={e=>setFormData({...formData, launchDate: e.target.value})}/></div>
             <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Designer</label><input className="w-full border p-2 rounded-lg" value={formData.designer} onChange={e=>setFormData({...formData, designer: e.target.value})}/></div>
          </div>
          
          <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Specs</label><textarea required rows={2} className="w-full border p-2 rounded-lg" value={formData.specs} onChange={e=>setFormData({...formData, specs: e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Options (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.optionsString} onChange={e=>setFormData({...formData, optionsString: e.target.value})}/></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Features (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.featuresString} onChange={e=>setFormData({...formData, featuresString: e.target.value})}/></div></div>
          <div className="grid grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Materials (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.materialsString} onChange={e=>setFormData({...formData, materialsString: e.target.value})}/></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Awards (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.awardsString} onChange={e=>setFormData({...formData, awardsString: e.target.value})}/></div></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
             <SwatchSelector 
                label="Body Colors" 
                selected={formData.bodyColors} 
                swatches={swatches}
                onChange={(newColors) => setFormData({...formData, bodyColors: newColors})}
             />
             <SwatchSelector 
                label="Upholstery Colors" 
                selected={formData.upholsteryColors} 
                swatches={swatches}
                onChange={(newColors) => setFormData({...formData, upholsteryColors: newColors})}
             />
          </div>

          <div className="border-t border-zinc-100 pt-6">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Related Products (Tagging)</label>
              <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 max-h-60 overflow-y-auto">
                 <input className="w-full mb-3 p-2 border border-zinc-300 rounded text-xs" placeholder="Filter products..." value={relatedFilter} onChange={e => setRelatedFilter(e.target.value)} />
                 <div className="grid grid-cols-2 gap-2">
                     {allProducts.filter(p => p.id !== formData.id && p.name.toLowerCase().includes(relatedFilter.toLowerCase())).map(p => {
                         const isSelected = formData.relatedProductIds.includes(p.id);
                         return (
                             <div key={p.id} onClick={() => toggleRelatedProduct(p.id)} className={`flex items-center p-2 rounded cursor-pointer text-xs ${isSelected ? 'bg-indigo-100 border border-indigo-300 text-indigo-800' : 'bg-white border border-zinc-200 hover:bg-zinc-100'}`}>
                                 <div className={`w-3 h-3 border rounded mr-2 flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-300'}`}>{isSelected && <Check className="w-2 h-2 text-white"/>}</div>
                                 <span className="truncate">{p.name}</span>
                             </div>
                         );
                     })}
                 </div>
              </div>
          </div>
          
          <div className="space-y-4"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Link</label><input className="w-full border p-2 rounded-lg" placeholder="https://..." value={formData.productLink} onChange={e=>setFormData({...formData, productLink: e.target.value})}/></div><div className="flex justify-between"><label className="block text-xs font-bold text-zinc-500 uppercase">Attachments</label><div className="space-x-2"><button type="button" onClick={()=>document.getElementById('doc-upload').click()} className="text-xs border px-2 py-1 rounded bg-white">File</button><button type="button" onClick={handleAddLinkAttachment} className="text-xs border px-2 py-1 rounded bg-white">Link</button></div><input id="doc-upload" type="file" multiple className="hidden" onChange={handleAttachmentUpload}/></div><div className="space-y-1">{formData.attachments.map((f, i)=><div key={i} className="flex justify-between text-xs bg-zinc-50 p-2 rounded"><span>{f.name}</span><button type="button" onClick={()=>removeAttachment(i)} className="text-red-500"><X className="w-3 h-3"/></button></div>)}</div></div>
          <div className="flex items-center space-x-2"><input type="checkbox" checked={formData.isNew} onChange={e=>setFormData({...formData, isNew: e.target.checked})}/><label className="text-sm font-bold">Mark as New Arrival</label></div>
        </form>
        <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50 flex justify-between">
           {isEditMode && <button type="button" onClick={()=>onDelete(formData.id, formData.name)} className="text-red-500 font-bold text-sm flex items-center"><Trash2 className="w-4 h-4 mr-2"/> Delete</button>}
           <div className="flex space-x-3 ml-auto">
              <button type="button" onClick={onClose} className="px-5 py-2.5 border rounded-xl text-sm font-bold hover:bg-white">Cancel</button>
              <button onClick={handleSubmit} disabled={isProcessingImage} className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-black shadow-lg disabled:opacity-50">{isProcessingImage ? 'Processing...' : 'Save Product'}</button>
           </div>
        </div>
      </div>
    </div>
  );
}

function SwatchSelector({ label, selected, swatches, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const handleSelect = (swatch) => {
     const snapshot = { 
         id: swatch.id, name: swatch.name, hex: swatch.hex, image: swatch.image, 
         category: swatch.category, textureType: swatch.textureType, materialCode: swatch.materialCode 
     };
     if(!selected.find(s => (typeof s === 'object' ? s.id === swatch.id : false))) {
        onChange([...selected, snapshot]);
     }
     setIsOpen(false);
  };

  const handleRemove = (index) => {
     const newSelected = [...selected];
     newSelected.splice(index, 1);
     onChange(newSelected);
  };
  
  const handleMove = (index, direction) => {
     const newSelected = [...selected];
     const targetIndex = index + direction;
     if (targetIndex >= 0 && targetIndex < newSelected.length) {
        const temp = newSelected[index];
        newSelected[index] = newSelected[targetIndex];
        newSelected[targetIndex] = temp;
        onChange(newSelected);
     }
  };

  const handleManualAdd = () => {
     const hex = prompt("Enter Hex Color (e.g. #000000) or Name:");
     if(hex) onChange([...selected, hex]);
  };

  const filteredSwatches = swatches.filter(s => {
     if(activeTab !== 'ALL' && s.category !== activeTab) return false;
     return s.name.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="relative">
       <div className="flex justify-between items-center mb-1">
          <label className="block text-xs font-bold text-zinc-500 uppercase">{label}</label>
          <button type="button" onClick={handleManualAdd} className="text-[10px] text-blue-600 font-bold hover:underline">Manual Input</button>
       </div>
       <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-white border rounded-lg items-center">
          {selected.map((item, idx) => (
             <div key={idx} className="relative group">
                <SwatchDisplay color={item} size="small" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md rounded-full border border-zinc-200 overflow-hidden z-20 scale-75">
                  <button type="button" onClick={()=>handleMove(idx, -1)} className="p-1 hover:bg-zinc-100"><ChevronLeft size={10}/></button>
                  <button type="button" onClick={()=>handleRemove(idx)} className="p-1 hover:bg-zinc-100 text-red-500"><X size={10}/></button>
                  <button type="button" onClick={()=>handleMove(idx, 1)} className="p-1 hover:bg-zinc-100"><ChevronRight size={10}/></button>
                </div>
             </div>
          ))}
          <button type="button" onClick={() => setIsOpen(true)} className="w-6 h-6 rounded-full border border-dashed border-zinc-400 flex items-center justify-center text-zinc-400 hover:border-zinc-900 hover:text-zinc-900"><Plus className="w-3 h-3"/></button>
       </div>

       {isOpen && (
          <div className="absolute top-full left-0 z-50 mt-2 w-full md:w-[400px] bg-white rounded-xl shadow-xl border border-zinc-200 p-4">
             <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-sm">Select Material</h4>
                <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 text-zinc-400 hover:text-black"/></button>
             </div>
             
             <div className="flex gap-1 overflow-x-auto pb-2 mb-2 custom-scrollbar">
                <button type="button" onClick={()=>setActiveTab('ALL')} className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${activeTab==='ALL'?'bg-black text-white':'bg-zinc-100'}`}>ALL</button>
                {SWATCH_CATEGORIES.map(c => (
                   <button key={c.id} type="button" onClick={()=>setActiveTab(c.id)} className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${activeTab===c.id?'bg-black text-white':'bg-zinc-100'}`}>{c.label}</button>
                ))}
             </div>

             <input placeholder="Search materials..." value={filter} onChange={e=>setFilter(e.target.value)} className="w-full text-xs p-2 bg-zinc-50 rounded border mb-3 outline-none" />
             
             <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                {filteredSwatches.map(s => (
                   <button key={s.id} type="button" onClick={() => handleSelect(s)} className="flex flex-col items-center group">
                      <div className="w-8 h-8 rounded-full border overflow-hidden relative">
                         {s.image ? <img src={s.image} className="w-full h-full object-cover"/> : <div className="w-full h-full" style={{backgroundColor:s.hex}}></div>}
                         <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center"><Plus className="w-4 h-4 text-white"/></div>
                      </div>
                      <span className="text-[9px] text-zinc-500 truncate w-full text-center mt-1">{s.name}</span>
                   </button>
                ))}
             </div>
          </div>
       )}
    </div>
  );
}

function SpaceProductManager({ spaceId, products, onClose, onToggle }) {
  const [filter, setFilter] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-indigo-50"><div><h3 className="text-lg font-bold text-indigo-900">Manage Products</h3><p className="text-xs text-indigo-600">Select products to display in {spaceId}</p></div><button onClick={onClose}><X className="w-5 h-5 text-indigo-400" /></button></div>
        <div className="p-4 border-b border-zinc-100"><input type="text" placeholder="Filter products..." className="w-full px-4 py-2 bg-zinc-50 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-indigo-500" value={filter} onChange={(e) => setFilter(e.target.value)} /></div>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3 custom-scrollbar">{products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())).map(product => { const isAdded = product.spaces && product.spaces.includes(spaceId); return (<div key={product.id} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${isAdded ? 'border-indigo-500 bg-indigo-50' : 'border-zinc-200 hover:border-zinc-300'}`} onClick={() => onToggle(product.id, !isAdded)}><div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${isAdded ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-zinc-300'}`}>{isAdded && <Check className="w-3.5 h-3.5 text-white" />}</div>{product.images?.[0] && <img src={typeof product.images[0] === 'object' ? product.images[0].url : product.images[0]} className="w-10 h-10 rounded-lg object-cover mr-3" />}<div><div className="text-sm font-bold text-zinc-900">{product.name}</div><div className="text-xs text-zinc-500">{product.category}</div></div></div>); })}</div>
      </div>
    </div>
  );
}

function SceneEditModal({ initialData, allProducts, spaceTags = [], spaceOptions = [], onClose, onSave, onDelete }) {
  const [data, setData] = useState({ id: null, title: '', description: '', image: null, images: [], productIds: [], tags: [], spaceId: '' });
  const [filter, setFilter] = useState('');
  const mainInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const normalizeImages = (imgs) => imgs.map(img => typeof img === 'string' ? { url: img, caption: '' } : img);

  useEffect(() => {
    if(initialData) {
      setData({ 
        id: initialData.id || null, 
        title: initialData.title || '', 
        description: initialData.description || '', 
        image: initialData.image || null, 
        images: normalizeImages(initialData.images || []), 
        productIds: initialData.productIds || [], 
        tags: initialData.tags || [],
        spaceId: initialData.spaceId 
      });
    }
  }, [initialData]);

  const processImage = (file) => { return new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const MAX_WIDTH = 1200; let width = img.width; let height = img.height; if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.8)); }; img.src = e.target.result; }; reader.readAsDataURL(file); }); };
  
  const handleMainImage = async (e) => { const file = e.target.files[0]; if (file) { const imageUrl = await processImage(file); setData(prev => ({ ...prev, image: imageUrl })); } };
  const handleGalleryUpload = async (e) => { 
      const files = Array.from(e.target.files); 
      if(files.length > 0) { 
          const newUrls = []; 
          for(const file of files) { try { newUrls.push({ url: await processImage(file), caption: '' }); } catch(e) {} } 
          setData(prev => ({ ...prev, images: [...prev.images, ...newUrls] })); 
      } 
  };
  
  const handleCaptionChange = (index, val) => {
      setData(prev => {
          const newImgs = [...prev.images];
          newImgs[index] = { ...newImgs[index], caption: val };
          return { ...prev, images: newImgs };
      });
  };

  const toggleProduct = (pid) => { setData(prev => { const ids = prev.productIds || []; return ids.includes(pid) ? { ...prev, productIds: ids.filter(id => id !== pid) } : { ...prev, productIds: [...ids, pid] }; }); };
  const toggleTag = (tag) => { setData(prev => { const tags = prev.tags || []; if (tags.includes(tag)) return { ...prev, tags: tags.filter(t => t !== tag) }; else return { ...prev, tags: [...tags, tag] }; }); };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
         <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-white z-10">
            <h3 className="text-lg font-bold text-zinc-900">{!initialData.id ? 'New Scene' : 'Edit Scene'}</h3>
            <div className="flex gap-2">
                {!(!initialData.id) && <button onClick={()=>onDelete(data.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5"/></button>}
                <button onClick={onClose} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><X className="w-5 h-5 text-zinc-400 hover:text-black"/></button>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-zinc-50">
            <div className="space-y-4">
              <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Main Image</label><div onClick={() => mainInputRef.current.click()} className="w-full h-48 bg-white rounded-xl flex items-center justify-center cursor-pointer border border-dashed border-zinc-300 overflow-hidden relative hover:border-zinc-400 transition-colors shadow-sm">{data.image ? <img src={data.image} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-zinc-400"><ImagePlus className="w-8 h-8 mb-2"/><span className="text-xs">Upload Main</span></div>}</div><input type="file" ref={mainInputRef} className="hidden" accept="image/*" onChange={handleMainImage} /></div>
              
              {spaceOptions.length > 0 && (
                  <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Belongs To Space</label>
                      <select className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm bg-white" value={data.spaceId} onChange={e => setData({...data, spaceId: e.target.value})}>
                          {spaceOptions.map(s => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                      </select>
                  </div>
              )}

              {spaceTags.length > 0 && (
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Space Tags (Filter)</label>
                    <div className="flex flex-wrap gap-2">
                       {spaceTags.map(tag => (
                          <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${data.tags?.includes(tag) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200'}`}>
                             {tag}
                          </button>
                       ))}
                    </div>
                 </div>
              )}

              <div>
                 <div className="flex justify-between items-center mb-2"><label className="block text-xs font-bold text-zinc-500 uppercase">Additional Images</label><button type="button" onClick={() => galleryInputRef.current.click()} className="text-[10px] bg-white border px-2 py-1 rounded hover:bg-zinc-100">+ Add</button><input type="file" ref={galleryInputRef} multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} /></div>
                 {data.images.length > 0 && <div className="grid grid-cols-5 gap-2">{data.images.map((img, i) => (
                     <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border border-zinc-200">
                         <img src={img.url || img} className="w-full h-full object-cover" />
                         <input className="absolute bottom-0 w-full text-[8px] bg-white/90 p-1 opacity-0 group-hover:opacity-100" value={img.caption || ''} onChange={e => handleCaptionChange(i, e.target.value)} placeholder="Caption"/>
                         <button onClick={() => setData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button>
                     </div>
                 ))}</div>}
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Title</label><input className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={data.title} onChange={e=>setData({...data, title: e.target.value})} placeholder="e.g. Modern Office Lounge" /></div>
                <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label><textarea className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" rows={2} value={data.description} onChange={e=>setData({...data, description: e.target.value})} placeholder="Short description..." /></div>
              </div>
            </div>
            <div className="pt-6 border-t border-zinc-200">
               <div className="flex justify-between items-end mb-3"><div><h4 className="text-sm font-bold text-zinc-900">Related Products</h4><p className="text-[10px] text-zinc-500">Select products visible in this scene</p></div><span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{data.productIds.length} selected</span></div>
               <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                  <div className="p-2 border-b border-zinc-100 bg-zinc-50/50"><div className="flex items-center bg-white border border-zinc-200 rounded-lg px-2"><Search className="w-4 h-4 text-zinc-400 mr-2"/><input className="w-full py-2 text-xs outline-none bg-transparent" placeholder="Search product name..." value={filter} onChange={e => setFilter(e.target.value)} /></div></div>
                  <div className="h-48 overflow-y-auto p-2 space-y-1 custom-scrollbar">{allProducts.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())).map(p => { const isSelected = data.productIds.includes(p.id); return (<div key={p.id} onClick={() => toggleProduct(p.id)} className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-zinc-50 border border-transparent'}`}><div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 flex-shrink-0 ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-zinc-300'}`}>{isSelected && <Check className="w-3 h-3 text-white"/>}</div>{p.images?.[0] && <img src={p.images[0]} className="w-8 h-8 rounded object-cover mr-3 bg-zinc-100" />}<div className="min-w-0"><div className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-zinc-700'}`}>{p.name}</div><div className="text-[10px] text-zinc-400 truncate">{p.category}</div></div></div>) })}</div>
               </div>
            </div>
         </div>
         <div className="px-6 py-4 border-t border-zinc-100 bg-white flex justify-end items-center z-10 gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-zinc-300 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50">Cancel</button>
            <button onClick={()=>onSave(data)} className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-black shadow-md">Save Scene</button>
         </div>
      </div>
    </div>
  );
}

function SpaceSceneModal({ scene, products, allProducts, isAdmin, onClose, onEdit, onProductToggle, onNavigateProduct }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = scene.images ? [scene.image, ...scene.images] : [scene.image];
  const [isProductManagerOpen, setProductManagerOpen] = useState(false);
  const [productFilter, setProductFilter] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);

  const currentImgObj = images[currentImageIndex];
  const currentImgUrl = typeof currentImgObj === 'object' ? currentImgObj.url : currentImgObj;
  const currentImgCaption = typeof currentImgObj === 'object' ? currentImgObj.caption : '';

  const handleShareImage = async () => { /* Placeholder */ };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-0 md:p-6 animate-in zoom-in-95 duration-200 print:hidden">
      {isZoomed && currentImgUrl && (<div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-8 cursor-zoom-out print:hidden" onClick={() => setIsZoomed(false)}><img src={currentImgUrl} className="max-w-full max-h-full object-contain" alt="Zoomed" /><button className="absolute top-6 right-6 text-white/50 hover:text-white"><X className="w-10 h-10" /></button></div>)}
      
      <div className="bg-white w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
         <div className="absolute top-4 right-4 z-[100] flex gap-2">
            {isAdmin && <button onClick={onEdit} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><Edit3 className="w-6 h-6 text-zinc-900" /></button>}
            <button onClick={onClose} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><X className="w-6 h-6 text-zinc-900" /></button>
         </div>
         <div className="w-full md:w-2/3 bg-black relative flex flex-col justify-center h-[40vh] md:h-full">
            <div className="relative w-full h-full">
                <img src={currentImgUrl} className="w-full h-full object-contain cursor-zoom-in" alt="Scene" onClick={() => setIsZoomed(true)} />
                {currentImgCaption && <div className="absolute bottom-8 left-0 right-0 text-center text-white/90 text-sm bg-black/40 backdrop-blur-sm p-2 mx-auto max-w-md rounded-xl">{currentImgCaption}</div>}
            </div>
            {images.length > 1 && (<div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 px-4">{images.map((_, idx) => (<button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === idx ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/80'}`} />))}</div>)}
         </div>
         <div className="w-full md:w-1/3 bg-white flex flex-col border-l border-zinc-100 h-[60vh] md:h-full relative">
            <div className="p-6 md:p-8 border-b border-zinc-50 pt-16 md:pt-16">
               <div className="mb-4">
                   <h2 className="text-2xl md:text-3xl font-black text-zinc-900 mb-2">{scene.title}</h2>
                   <p className="text-zinc-500 text-sm leading-relaxed">{scene.description}</p>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-zinc-50/50 pb-safe">
               <div className="flex justify-between items-center mb-4"><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tagged Products</h3>{isAdmin && <button onClick={() => setProductManagerOpen(!isProductManagerOpen)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">+ Add Tag</button>}</div>
               {isAdmin && isProductManagerOpen && (
                 <div className="mb-4 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm animate-in slide-in-from-top-2">
                    <input type="text" placeholder="Search to tag..." className="w-full text-xs p-2 bg-zinc-50 rounded-lg border border-zinc-200 mb-2 outline-none focus:border-indigo-500" value={productFilter} onChange={(e) => setProductFilter(e.target.value)} />
                    <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">{allProducts.filter(p => p.name.toLowerCase().includes(productFilter.toLowerCase())).map(p => { const isTagged = scene.productIds?.includes(p.id); return (<div key={p.id} onClick={() => onProductToggle(p.id, !isTagged)} className={`flex items-center p-1.5 rounded cursor-pointer ${isTagged ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-zinc-50'}`}><div className={`w-3 h-3 border rounded mr-2 flex items-center justify-center ${isTagged ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-300'}`}>{isTagged && <Check className="w-2 h-2 text-white"/>}</div><span className="text-xs truncate">{p.name}</span></div>) })}</div>
                 </div>
               )}
               <div className="space-y-3 mb-8">{products.length > 0 ? products.map(product => (<div key={product.id} onClick={() => onNavigateProduct(product)} className="flex items-center p-3 bg-white rounded-xl border border-zinc-100 shadow-sm hover:border-zinc-300 transition-all cursor-pointer group"><div className="w-12 h-12 bg-zinc-50 rounded-lg flex-shrink-0 flex items-center justify-center mr-3 overflow-hidden">{product.images?.[0] ? <img src={typeof product.images[0] === 'object' ? product.images[0].url : product.images[0]} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-zinc-300"/>}</div><div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-zinc-900 truncate group-hover:text-blue-600">{product.name}</h4><p className="text-xs text-zinc-500">{product.category}</p></div><ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600"/></div>)) : (<div className="text-center py-8 text-zinc-400 text-xs">연관된 제품이 없습니다.</div>)}</div>
            
               <div className="pt-6 border-t border-zinc-100 flex gap-3 print:hidden">
                    <button onClick={handleShareImage} className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-50 flex items-center justify-center"><ImgIcon className="w-4 h-4 mr-2"/> Share</button>
                    <button onClick={() => window.print()} className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-50 flex items-center justify-center"><Printer className="w-4 h-4 mr-2"/> PDF</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}