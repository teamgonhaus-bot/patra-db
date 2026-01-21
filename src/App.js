/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Search, X, Check, Tag, Palette, Settings, Image as ImageIcon,
  Upload, Trash2, Edit2, RefreshCw, Cloud, CloudOff, Lock, Unlock,
  Database, Info, ArrowUpDown, ListFilter, Menu, History,
  Copy, ChevronRight, ChevronDown, ChevronUp, Activity, ShieldAlert, FileJson, Calendar,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Layers, Star,
  Trophy, Heart, Link as LinkIcon, Paperclip, PieChart, Clock,
  Share2, Download, Maximize2, LayoutGrid, Zap, GripHorizontal, ImageIcon as ImgIcon,
  ChevronsUp, Camera, ImagePlus, Sofa, Briefcase, Users, Home as HomeIcon, MapPin,
  Edit3, Grid, MoreVertical, MousePointer2, CheckSquare, XCircle, Printer, List, Eye,
  PlayCircle, BarChart3, CornerUpLeft, Pipette
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
const APP_VERSION = "v0.6.3-stable"; 
const BUILD_DATE = "2026.01.21";
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

// 카테고리 정의
const CATEGORIES = [
  { id: 'ALL', label: 'Total View', isSpecial: true, color: '#18181b' },
  { id: 'NEW', label: 'New Arrivals', isSpecial: true, color: '#ef4444' },
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
  { id: 'OFFICE', label: 'Office Space', icon: Briefcase },
  { id: 'MEETING', label: 'Meeting Room', icon: Users },
  { id: 'LOUNGE_SPACE', label: 'Lounge & Lobby', icon: Sofa },
  { id: 'HOME_SPACE', label: 'Home Interior', icon: HomeIcon },
];

// 스와치 카테고리
const SWATCH_CATEGORIES = [
  { id: 'SWATCH_MESH', label: 'Mesh', dbValue: 'MESH', icon: Grid },
  { id: 'SWATCH_FABRIC', label: 'Fabric', dbValue: 'FABRIC', icon: Layers },
  { id: 'SWATCH_LEATHER', label: 'Leather', dbValue: 'LEATHER', icon: Briefcase },
  { id: 'SWATCH_RESIN', label: 'Resin', dbValue: 'RESIN', icon: DiscIcon }, 
  { id: 'SWATCH_STEEL', label: 'Steel', dbValue: 'STEEL', icon: Settings },
  { id: 'SWATCH_WOOD', label: 'Wood', dbValue: 'WOOD', icon: TreesIcon }, 
];

function DiscIcon(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>; }
function TreesIcon(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 5.3-2.1l.4.4.4-.4A3 3 0 0 1 14.9 10z"/><path d="M10 16v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2"/><path d="M14.9 10a3 3 0 0 1 0 5.8v0h4v0h0a3 3 0 0 1-1.1-5.8v-.2a3 3 0 0 1-5.3-2.1l-.4.4-.4-.4a3 3 0 0 1-1.7 2.3"/></svg>; }

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [swatches, setSwatches] = useState([]); 
  const [activeCategory, setActiveCategory] = useState('DASHBOARD');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [sortOption, setSortOption] = useState('manual'); 
  const [sortDirection, setSortDirection] = useState('desc'); 
  
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [toast, setToast] = useState(null);
  const [favorites, setFavorites] = useState([]);
  
  // States
  const [sidebarState, setSidebarState] = useState({ spaces: true, collections: true, swatches: true });
  const [myPickViewMode, setMyPickViewMode] = useState('grid'); 
  const [bannerData, setBannerData] = useState({ url: null, title: 'Design Lab DB', subtitle: 'Integrated Product Database & Archives' });
  const [spaceContents, setSpaceContents] = useState({}); 

  // Modals
  const [editingSpaceInfoId, setEditingSpaceInfoId] = useState(null);
  const [managingSpaceProductsId, setManagingSpaceProductsId] = useState(null);
  const [editingScene, setEditingScene] = useState(null);
  const [selectedScene, setSelectedScene] = useState(null);
  const [isSwatchFormOpen, setIsSwatchFormOpen] = useState(false);
  const [editingSwatch, setEditingSwatch] = useState(null);

  const mainContentRef = useRef(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current.scrollTop > 300) setShowScrollTop(true);
      else setShowScrollTop(false);
    };
    const div = mainContentRef.current;
    if (div) div.addEventListener('scroll', handleScroll);
    return () => div && div.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      if (selectedProduct) {
        setSelectedProduct(null);
        window.history.replaceState(null, '', window.location.pathname);
      } else if (activeCategory !== 'DASHBOARD') {
        setActiveCategory('DASHBOARD');
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedProduct, activeCategory]);

  useEffect(() => {
    if (selectedProduct) {
      const url = new URL(window.location);
      url.searchParams.set('id', selectedProduct.id);
      window.history.pushState({ modal: true }, '', url);
    }
  }, [selectedProduct]);

  const handleHomeClick = () => {
    setActiveCategory('DASHBOARD');
    setIsMobileMenuOpen(false);
    window.history.pushState({}, '', window.location.pathname);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('id');
    const sharedSpace = params.get('space');
    
    if (sharedId && products.length > 0) {
      const found = products.find(p => String(p.id) === sharedId);
      if (found) setSelectedProduct(found);
    }
    if (sharedSpace && SPACES.find(s => s.id === sharedSpace)) {
       setActiveCategory(sharedSpace);
    }
  }, [products]);

  // Auth & Sync
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
      const unsubBanner = onSnapshot(bannerDocRef, (doc) => {
        if (doc.exists()) setBannerData(prev => ({ ...prev, ...doc.data() }));
      });
      SPACES.forEach(space => {
         onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', space.id), (docSnapshot) => {
            if(docSnapshot.exists()) {
               setSpaceContents(prev => ({ ...prev, [space.id]: docSnapshot.data() }));
            }
         });
      });
      return () => { unsubProducts(); unsubSwatches(); unsubBanner(); };
    } else {
      const localBanner = localStorage.getItem('patra_banner_data');
      if (localBanner) setBannerData(JSON.parse(localBanner));
      const localSwatches = localStorage.getItem('patra_swatches');
      if (localSwatches) setSwatches(JSON.parse(localSwatches));
      loadFromLocalStorage();
    }
  }, [user]);

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('patra_products');
    setProducts(saved ? JSON.parse(saved) : []);
    setIsLoading(false);
  };
  
  const saveToLocalStorage = (newProducts) => {
    localStorage.setItem('patra_products', JSON.stringify(newProducts));
    setProducts(newProducts);
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

  // Swatch Functions
  const handleSaveSwatch = async (swatchData) => {
    const docId = swatchData.id ? swatchData.id : `swatch_${Date.now()}`;
    const payload = { ...swatchData, id: docId, updatedAt: Date.now() };
    if(isFirebaseAvailable && db) {
       await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'swatches', docId), payload, { merge: true });
    } else {
       const idx = swatches.findIndex(s => s.id === docId);
       let newSwatches = [...swatches];
       if(idx >= 0) newSwatches[idx] = payload; else newSwatches.push(payload);
       setSwatches(newSwatches);
       localStorage.setItem('patra_swatches', JSON.stringify(newSwatches));
    }
    setIsSwatchFormOpen(false); setEditingSwatch(null); showToast("스와치가 저장되었습니다.");
  };

  const handleDeleteSwatch = async (swatchId) => {
    if(!window.confirm("삭제하시겠습니까?")) return;
    if(isFirebaseAvailable && db) {
       await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'swatches', swatchId));
    } else {
       const newSwatches = swatches.filter(s => s.id !== swatchId);
       setSwatches(newSwatches);
       localStorage.setItem('patra_swatches', JSON.stringify(newSwatches));
    }
    setIsSwatchFormOpen(false); showToast("스와치가 삭제되었습니다.");
  };

  // Handlers
  const handleBannerUpload = async (e) => { if (!isAdmin) return; const file = e.target.files[0]; if (!file) return; try { const resizedImage = await processImage(file); const newData = { ...bannerData, url: resizedImage }; if (isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'banner'), newData, { merge: true }); else { localStorage.setItem('patra_banner_data', JSON.stringify(newData)); setBannerData(newData); } showToast("메인 배너가 업데이트되었습니다."); } catch (error) { showToast("이미지 처리 실패", "error"); } };
  const handleBannerTextChange = (key, value) => { if (!isAdmin) return; setBannerData(prev => ({ ...prev, [key]: value })); };
  const saveBannerText = async () => { if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'banner'), bannerData, { merge: true }); showToast("배너 문구가 저장되었습니다."); } };
  const handleSpaceBannerUpload = async (e, spaceId) => { if (!isAdmin) return; const file = e.target.files[0]; if (!file) return; try { const resizedImage = await processImage(file); const currentContent = spaceContents[spaceId] || {}; const newContent = { ...currentContent, banner: resizedImage }; if (isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), newContent, { merge: true }); showToast("공간 배너가 업데이트되었습니다."); } catch (error) { showToast("이미지 처리 실패", "error"); } };
  const handleSpaceInfoSave = async (spaceId, info) => { const currentContent = spaceContents[spaceId] || {}; const newContent = { ...currentContent, ...info }; if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), newContent, { merge: true }); } showToast("공간 정보가 저장되었습니다."); };
  const handleSceneSave = async (spaceId, sceneData) => { const currentContent = spaceContents[spaceId] || { scenes: [] }; let newScenes = [...(currentContent.scenes || [])]; if (sceneData.id) { const idx = newScenes.findIndex(s => s.id === sceneData.id); if (idx >= 0) newScenes[idx] = sceneData; else newScenes.push(sceneData); } else { sceneData.id = Date.now().toString(); newScenes.push(sceneData); } if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), { scenes: newScenes }, { merge: true }); } showToast("장면(Scene)이 저장되었습니다."); };
  const handleSceneDelete = async (spaceId, sceneId) => { if(!window.confirm("이 장면을 삭제하시겠습니까?")) return; const currentContent = spaceContents[spaceId] || { scenes: [] }; const newScenes = (currentContent.scenes || []).filter(s => s.id !== sceneId); if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), { scenes: newScenes }, { merge: true }); } showToast("장면이 삭제되었습니다."); };
  const handleSpaceProductToggle = async (spaceId, productId, isAdded) => { const product = products.find(p => p.id === productId); if(!product) return; let newSpaces = product.spaces || []; if(isAdded) { if(!newSpaces.includes(spaceId)) newSpaces.push(spaceId); } else { newSpaces = newSpaces.filter(s => s !== spaceId); } if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', product.id), { spaces: newSpaces }, { merge: true }); } else { const idx = products.findIndex(p => p.id === productId); const newProds = [...products]; newProds[idx] = { ...product, spaces: newSpaces }; saveToLocalStorage(newProds); } };
  const logActivity = async (action, productName, details = "") => { if (!isFirebaseAvailable || !db) return; try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), { action, productName, details, timestamp: Date.now(), adminId: 'admin' }); } catch (e) { console.error(e); } };
  const fetchLogs = async () => { if (!isFirebaseAvailable || !db) return; const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), orderBy('timestamp', 'desc'), limit(100)); onSnapshot(q, (snapshot) => { setActivityLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); }); };
  const handleSaveProduct = async (productData) => { const docId = productData.id ? String(productData.id) : String(Date.now()); const isEdit = !!productData.id && products.some(p => String(p.id) === docId); const payload = { ...productData, id: docId, updatedAt: Date.now(), createdAt: isEdit ? (products.find(p => String(p.id) === docId)?.createdAt || Date.now()) : Date.now(), orderIndex: isEdit ? (products.find(p => String(p.id) === docId)?.orderIndex || Date.now()) : Date.now() }; if (isFirebaseAvailable && db) { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', docId), payload, { merge: true }); } catch (error) { showToast("저장 실패", "error"); return; } } else { const idx = products.findIndex(p => String(p.id) === docId); let newProducts = [...products]; if (idx >= 0) newProducts[idx] = payload; else newProducts = [payload, ...products]; saveToLocalStorage(newProducts); } if (selectedProduct && String(selectedProduct.id) === docId) setSelectedProduct(payload); setIsFormOpen(false); setEditingProduct(null); showToast(isEdit ? "수정 완료" : "등록 완료"); };
  const handleDeleteProduct = async (productId, productName) => { if (!window.confirm('정말 삭제하시겠습니까?')) return; if (isFirebaseAvailable && db) { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', String(productId))); await logActivity("DELETE", productName, "삭제됨"); } catch (error) { showToast("삭제 실패", "error"); return; } } else { const newProducts = products.filter(p => String(p.id) !== String(productId)); saveToLocalStorage(newProducts); } setSelectedProduct(null); setIsFormOpen(false); showToast("삭제되었습니다."); };
  
  const getProcessedProducts = () => {
    let filtered = products.filter(product => {
      let matchesCategory = true;
      if (activeCategory === 'DASHBOARD') matchesCategory = false; 
      else if (activeCategory === 'MY_PICK') matchesCategory = favorites.includes(product.id);
      else if (activeCategory === 'NEW') matchesCategory = product.isNew;
      else if (activeCategory === 'ALL') matchesCategory = true;
      else if (SPACES.find(s => s.id === activeCategory)) matchesCategory = product.spaces && product.spaces.includes(activeCategory);
      else if (SWATCH_CATEGORIES.find(s => s.id === activeCategory)) matchesCategory = false; 
      else matchesCategory = product.category === activeCategory;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = product.name.toLowerCase().includes(searchLower) || product.specs.toLowerCase().includes(searchLower) || (product.designer && product.designer.toLowerCase().includes(searchLower)) || (product.options && product.options.some(opt => opt.toLowerCase().includes(searchLower)));
      return matchesCategory && matchesSearch;
    });
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortOption === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortOption === 'launchDate') comparison = new Date(a.launchDate || 0) - new Date(b.launchDate || 0);
      else if (sortOption === 'manual') comparison = (a.orderIndex || 0) - (b.orderIndex || 0);
      else comparison = (a.createdAt || 0) - (b.createdAt || 0);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return filtered;
  };
  const processedProducts = getProcessedProducts();
  const handleMoveProduct = async (index, direction) => { if (!processedProducts || processedProducts.length <= 1) return; const targetIndex = direction === 'left' ? index - 1 : index + 1; if (targetIndex < 0 || targetIndex >= processedProducts.length) return; const currentItem = processedProducts[index]; const swapItem = processedProducts[targetIndex]; const currentOrder = currentItem.orderIndex !== undefined ? currentItem.orderIndex : currentItem.createdAt; const swapOrder = swapItem.orderIndex !== undefined ? swapItem.orderIndex : swapItem.createdAt; if (isFirebaseAvailable && db) { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', currentItem.id), { orderIndex: swapOrder }, { merge: true }); await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', swapItem.id), { orderIndex: currentOrder }, { merge: true }); } catch (e) { showToast("순서 변경 실패", "error"); } } else { const newProducts = [...products]; const p1 = newProducts.find(p => p.id === currentItem.id); const p2 = newProducts.find(p => p.id === swapItem.id); if (p1 && p2) { p1.orderIndex = swapOrder; p2.orderIndex = currentOrder; saveToLocalStorage(newProducts); } } };

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 overflow-hidden relative selection:bg-black selection:text-white print:overflow-visible print:h-auto print:bg-white">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-md border-r border-zinc-200 flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 md:relative md:translate-x-0 print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between cursor-pointer group" onClick={handleHomeClick}>
          <div className="flex flex-col">
             <div className="flex items-center space-x-1">
                <span className="text-2xl font-black tracking-tighter text-zinc-900 group-hover:scale-105 transition-transform origin-left">PATRA</span>
             </div>
             <span className="text-[10px] font-medium text-zinc-500 tracking-[0.2em] uppercase mt-0.5">Design Lab DB</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }} className="md:hidden text-zinc-400 hover:text-zinc-600"><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-4 custom-scrollbar">
          <div className="space-y-1">
            {CATEGORIES.filter(c => c.isSpecial).map((cat) => (<button key={cat.id} onClick={() => { setActiveCategory(cat.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group border ${activeCategory === cat.id ? 'bg-zinc-900 text-white shadow-lg border-zinc-900' : 'bg-white text-zinc-600 border-zinc-100 hover:bg-zinc-50 hover:border-zinc-300'}`}><div className="flex items-center">{cat.id === 'ALL' && <LayoutGrid className="w-4 h-4 mr-3 opacity-70" />}{cat.id === 'NEW' && <Zap className="w-4 h-4 mr-3 opacity-70" />}<span className="font-bold tracking-tight">{cat.label}</span></div>{cat.id === 'NEW' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-auto"></span>}</button>))}
          </div>
          <div className="py-2">
             <button onClick={() => setSidebarState(p => ({...p, spaces: !p.spaces}))} className="w-full flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-2 px-3 tracking-widest uppercase hover:text-zinc-600 transition-colors"><span>SPACES</span>{sidebarState.spaces ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>
             {sidebarState.spaces && (<div className="space-y-1 animate-in slide-in-from-top-2 duration-200">{SPACES.map((space) => (<button key={space.id} onClick={() => { setActiveCategory(space.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === space.id ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}><div className="flex items-center"><space.icon className={`w-3.5 h-3.5 mr-3 ${activeCategory === space.id ? 'text-white' : 'text-zinc-400'}`} />{space.label}</div>{activeCategory === space.id && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}</button>))}</div>)}
          </div>
          <div className="py-2 border-t border-zinc-100">
             <button onClick={() => setSidebarState(p => ({...p, collections: !p.collections}))} className="w-full flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-2 px-3 tracking-widest uppercase hover:text-zinc-600 transition-colors"><div className="flex items-center"><span>COLLECTIONS</span>{isFirebaseAvailable ? <Cloud className="w-3 h-3 ml-2 text-green-500" /> : <CloudOff className="w-3 h-3 ml-2 text-zinc-300" />}</div>{sidebarState.collections ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>
             {sidebarState.collections && (<div className="space-y-0.5 animate-in slide-in-from-top-2 duration-200">{CATEGORIES.filter(c => !c.isSpecial).map((cat) => (<button key={cat.id} onClick={() => { setActiveCategory(cat.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === cat.id ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}>{cat.label}</button>))}</div>)}
          </div>
          <div className="py-2 border-t border-zinc-100">
             <button onClick={() => setSidebarState(p => ({...p, swatches: !p.swatches}))} className="w-full flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-2 px-3 tracking-widest uppercase hover:text-zinc-600 transition-colors"><span>SWATCHES</span>{sidebarState.swatches ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>
             {sidebarState.swatches && (<div className="space-y-0.5 animate-in slide-in-from-top-2 duration-200">{SWATCH_CATEGORIES.map((cat) => (<button key={cat.id} onClick={() => { setActiveCategory(cat.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === cat.id ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}><div className="flex items-center"><cat.icon className="w-3.5 h-3.5 mr-2 opacity-50"/>{cat.label}</div></button>))}</div>)}
          </div>
          <div className="pt-2"><button onClick={() => { setActiveCategory('MY_PICK'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center space-x-3 group border ${activeCategory === 'MY_PICK' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'text-zinc-400 border-transparent hover:bg-zinc-50 hover:text-zinc-600'}`}><Heart className={`w-4 h-4 ${activeCategory === 'MY_PICK' ? 'fill-yellow-500 text-yellow-500' : ''}`} /><span>My Pick ({favorites.length})</span></button></div>
        </nav>
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 space-y-3"><button onClick={toggleAdminMode} className={`w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isAdmin ? 'bg-zinc-900 text-white shadow-md' : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100'}`}>{isAdmin ? <Unlock className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2" />}{isAdmin ? "ADMIN MODE" : "VIEWER MODE"}</button><div className="flex justify-between items-center px-1">{isAdmin ? (<button onClick={() => { fetchLogs(); setShowAdminDashboard(true); }} className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center font-bold"><Settings className="w-3 h-3 mr-1" /> Dashboard</button>) : <span className="text-[10px] text-zinc-400">{APP_VERSION}</span>}{isAdmin && <span className="text-[10px] text-zinc-300">{BUILD_DATE}</span>}</div></div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative print:overflow-visible print:h-auto">
        <header className="h-14 md:h-16 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex items-center justify-between px-4 md:px-8 z-30 flex-shrink-0 sticky top-0 transition-all print:hidden">
          <div className="flex items-center space-x-3 w-full md:w-auto flex-1 mr-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-lg active:scale-95 transition-transform"><Menu className="w-6 h-6" /></button>
            <div className="relative w-full max-w-md group"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4 group-focus-within:text-zinc-800 transition-colors" /><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); if (activeCategory === 'DASHBOARD' && e.target.value) setActiveCategory('ALL'); }} className="w-full pl-10 pr-4 py-2 bg-zinc-50/50 border border-transparent focus:bg-white focus:border-zinc-200 focus:ring-4 focus:ring-zinc-50 rounded-full text-sm transition-all outline-none" /></div>
          </div>
          <div className="flex items-center space-x-2">
             <button onClick={() => setActiveCategory('MY_PICK')} className={`hidden md:flex p-2 rounded-full transition-all items-center space-x-1 ${activeCategory === 'MY_PICK' ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600'}`} title="My Pick"><Heart className={`w-5 h-5 ${activeCategory === 'MY_PICK' ? 'fill-yellow-500 text-yellow-500' : ''}`} /></button>
             <div className="flex items-center bg-zinc-100 rounded-lg p-1">
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="bg-transparent text-xs font-bold text-zinc-600 outline-none px-2 py-1 max-w-[80px] md:max-w-none cursor-pointer"><option value="manual">Manual</option><option value="launchDate">Launch</option><option value="createdAt">Added</option><option value="name">Name</option></select>
                <button onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-zinc-500" title="Sort">{sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}</button>
             </div>
            {isAdmin && (<button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 bg-zinc-900 text-white rounded-full hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95 flex-shrink-0"><Plus className="w-4 h-4 md:mr-1.5" /><span className="hidden md:inline text-sm font-bold">New</span></button>)}
          </div>
        </header>

        <div ref={mainContentRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative print:overflow-visible print:p-0">
          {activeCategory === 'DASHBOARD' && !searchTerm ? (
            <DashboardView 
              products={products} favorites={favorites} setActiveCategory={setActiveCategory} setSelectedProduct={setSelectedProduct} 
              isAdmin={isAdmin} bannerData={bannerData} onBannerUpload={handleBannerUpload} onBannerTextChange={handleBannerTextChange} onSaveBannerText={saveBannerText}
            />
          ) : (
            <>
              {/* Swatch Library View */}
              {SWATCH_CATEGORIES.find(s => s.id === activeCategory) && (
                 <SwatchLibraryView 
                    category={SWATCH_CATEGORIES.find(s => s.id === activeCategory)}
                    swatches={swatches.filter(s => s.category === SWATCH_CATEGORIES.find(cat => cat.id === activeCategory).dbValue)}
                    isAdmin={isAdmin}
                    onAdd={() => { setEditingSwatch(null); setIsSwatchFormOpen(true); }}
                    onEdit={(swatch) => { setEditingSwatch(swatch); setIsSwatchFormOpen(true); }}
                    onDelete={handleDeleteSwatch}
                 />
              )}

              {/* Space Detail View */}
              {SPACES.find(s => s.id === activeCategory) && (
                 <SpaceDetailView 
                    space={SPACES.find(s => s.id === activeCategory)}
                    spaceContent={spaceContents[activeCategory] || {}}
                    isAdmin={isAdmin}
                    onBannerUpload={(e) => handleSpaceBannerUpload(e, activeCategory)}
                    onEditInfo={() => setEditingSpaceInfoId(activeCategory)}
                    onManageProducts={() => setManagingSpaceProductsId(activeCategory)}
                    onAddScene={() => setEditingScene({ isNew: true, spaceId: activeCategory })}
                    onViewScene={(scene) => setSelectedScene({ ...scene, spaceId: activeCategory })}
                    productCount={processedProducts.length}
                 />
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
                          {activeCategory === 'MY_PICK' && processedProducts.length > 0 && (
                            <div className="flex space-x-2">
                               <div className="flex bg-zinc-100 p-1 rounded-lg">
                                  <button onClick={() => setMyPickViewMode('grid')} className={`p-2 rounded-md ${myPickViewMode === 'grid' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400'}`} title="Grid View"><Grid className="w-4 h-4"/></button>
                                  <button onClick={() => setMyPickViewMode('list')} className={`p-2 rounded-md ${myPickViewMode === 'list' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400'}`} title="List View"><List className="w-4 h-4"/></button>
                                </div>
                               <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors"><Printer className="w-4 h-4 mr-2"/> Export</button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeCategory === 'MY_PICK' && myPickViewMode === 'list' ? (
                         <div className="space-y-4 print:space-y-6">
                            <div className="hidden print:block mb-8">
                               <h1 className="text-4xl font-bold mb-2">MY PICK SELECTION</h1>
                               <p className="text-zinc-500">{new Date().toLocaleDateString()} · Patra Design Lab</p>
                            </div>
                            {processedProducts.map((product) => (
                               <div key={product.id} className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-2xl border border-zinc-200 print:border-zinc-300 print:break-inside-avoid">
                                  <div className="w-full md:w-48 h-48 bg-zinc-50 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-100 flex items-center justify-center">
                                     {product.images?.[0] ? <img src={product.images[0]} className="w-full h-full object-contain mix-blend-multiply" alt={product.name} /> : <ImageIcon className="w-8 h-8 text-zinc-300"/>}
                                  </div>
                                  <div className="flex-1">
                                     <div className="flex justify-between items-start">
                                        <div>
                                           <span className="inline-block px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs font-bold rounded mb-2">{product.category}</span>
                                           <h3 className="text-2xl font-bold text-zinc-900 mb-1">{product.name}</h3>
                                           <p className="text-zinc-500 font-medium text-sm mb-4">Designed by {product.designer || 'Patra Design Lab'}</p>
                                        </div>
                                        <button onClick={(e) => toggleFavorite(e, product.id)} className="print:hidden text-yellow-400 hover:scale-110 transition-transform"><Star className="w-6 h-6 fill-current"/></button>
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="bg-zinc-50 p-3 rounded-lg"><span className="font-bold block text-xs text-zinc-400 uppercase mb-1">Specs</span>{product.specs}</div>
                                        <div className="space-y-2">
                                           <div><span className="font-bold text-xs text-zinc-400 uppercase">Options</span> <span className="text-zinc-700">{product.options?.join(', ')}</span></div>
                                           <div><span className="font-bold text-xs text-zinc-400 uppercase">Colors</span> <span className="text-zinc-700">{Array.isArray(product.bodyColors) && product.bodyColors.map(c => typeof c === 'string' ? c : c.name).join(', ')} / {Array.isArray(product.upholsteryColors) && product.upholsteryColors.map(c => typeof c === 'string' ? c : c.name).join(', ')}</span></div>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      ) : (
                         <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 pb-20 print:grid-cols-3 print:gap-4">
                            {processedProducts.map((product, idx) => (<ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} isAdmin={isAdmin} showMoveControls={isAdmin && sortOption === 'manual'} onMove={(dir) => handleMoveProduct(idx, dir)} isFavorite={favorites.includes(product.id)} onToggleFavorite={(e) => toggleFavorite(e, product.id)} />))}
                            {isAdmin && activeCategory !== 'MY_PICK' && activeCategory !== 'NEW' && !SPACES.find(s => s.id === activeCategory) && (<button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px] text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-all group print:hidden"><div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Plus className="w-6 h-6" /></div><span className="text-xs md:text-sm font-bold">Add Product</span></button>)}
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
      
      {/* Modals */}
      {selectedProduct && <ProductDetailModal product={selectedProduct} spaceContents={spaceContents} onClose={() => setSelectedProduct(null)} onEdit={() => { setEditingProduct(selectedProduct); setIsFormOpen(true); }} isAdmin={isAdmin} showToast={showToast} isFavorite={favorites.includes(selectedProduct.id)} onToggleFavorite={(e) => toggleFavorite(e, selectedProduct.id)} onNavigateSpace={(spaceId) => { setSelectedProduct(null); setActiveCategory(spaceId); }} onNavigateScene={(scene) => { setSelectedProduct(null); setActiveCategory(scene.spaceId || scene.id); setSelectedScene({...scene, spaceId: scene.spaceId || 'UNKNOWN'}); }} />}
      {isFormOpen && <ProductFormModal categories={CATEGORIES.filter(c => !c.isSpecial)} initialCategory={activeCategory} existingData={editingProduct} swatches={swatches} onClose={() => { setIsFormOpen(false); setEditingProduct(null); }} onSave={handleSaveProduct} onDelete={handleDeleteProduct} isFirebaseAvailable={isFirebaseAvailable} />}
      {isSwatchFormOpen && <SwatchFormModal existingData={editingSwatch} category={SWATCH_CATEGORIES.find(s => s.id === activeCategory)} onClose={() => setIsSwatchFormOpen(false)} onSave={handleSaveSwatch} />}
      
      {editingSpaceInfoId && <SpaceInfoEditModal spaceId={editingSpaceInfoId} currentData={spaceContents[editingSpaceInfoId]} onClose={() => setEditingSpaceInfoId(null)} onSave={(data) => { handleSpaceInfoSave(editingSpaceInfoId, data); setEditingSpaceInfoId(null); }} />}
      {managingSpaceProductsId && <SpaceProductManager spaceId={managingSpaceProductsId} products={products} onClose={() => setManagingSpaceProductsId(null)} onToggle={(pid, add) => handleSpaceProductToggle(managingSpaceProductsId, pid, add)} />}
      {editingScene && <SceneEditModal initialData={editingScene} allProducts={products} onClose={() => setEditingScene(null)} onSave={(data) => { handleSceneSave(editingScene.spaceId, data); setEditingScene(null); }} onDelete={(id) => { handleSceneDelete(editingScene.spaceId, id); setEditingScene(null); }} />}
      {selectedScene && <SpaceSceneModal scene={selectedScene} products={products.filter(p => selectedScene.productIds && selectedScene.productIds.includes(p.id))} allProducts={products} isAdmin={isAdmin} onClose={() => setSelectedScene(null)} onEdit={() => { setEditingScene({ ...selectedScene, isNew: false }); setSelectedScene(null); }} onProductToggle={async (pid, add) => { const newPids = add ? [...(selectedScene.productIds||[]), pid] : (selectedScene.productIds||[]).filter(id=>id!==pid); const updatedScene = { ...selectedScene, productIds: newPids }; setSelectedScene(updatedScene); await handleSceneSave(selectedScene.spaceId, updatedScene); }} onNavigateProduct={(p) => { setSelectedScene(null); setSelectedProduct(p); }} />}
      {showAdminDashboard && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 print:hidden"><div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"><div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-900 text-white"><h3 className="text-lg font-bold flex items-center"><ShieldAlert className="w-5 h-5 mr-2" /> Admin Console</h3><button onClick={() => setShowAdminDashboard(false)}><X className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" /></button></div><div className="flex-1 flex flex-col items-center justify-center p-10 text-zinc-400"><Activity className="w-10 h-10 mb-2"/><p>Dashboard active.</p></div></div></div>}
    </div>
  );
}

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

function SwatchLibraryView({ category, swatches, isAdmin, onAdd, onEdit, onDelete }) {
  return (
    <div className="animate-in fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 mb-1 flex items-center"><category.icon className="w-6 h-6 mr-2 text-zinc-400" /> {category.label} Library</h2>
          <p className="text-sm text-zinc-500">Manage materials and finishes for {category.label}</p>
        </div>
        {isAdmin && <button onClick={onAdd} className="flex items-center px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-black">+ Add Swatch</button>}
      </div>
      
      {swatches.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {swatches.map(swatch => (
            <div key={swatch.id} className="group relative aspect-square rounded-xl border border-zinc-200 overflow-hidden bg-white shadow-sm hover:shadow-md cursor-pointer" onClick={() => isAdmin && onEdit(swatch)}>
               <div className="w-full h-full bg-cover bg-center" style={swatch.type === 'image' ? { backgroundImage: `url(${swatch.value})` } : { backgroundColor: swatch.value }} />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center">
                  <span className="text-xs font-bold">{swatch.name}</span>
                  {isAdmin && <button onClick={(e) => {e.stopPropagation(); onDelete(swatch.id)}} className="mt-2 p-1 bg-white/20 rounded-full hover:bg-red-500 hover:text-white transition-colors"><X className="w-4 h-4"/></button>}
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-300 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
           <Palette className="w-10 h-10 mx-auto mb-2 opacity-20"/>
           <p className="text-sm">No swatches found.</p>
        </div>
      )}
    </div>
  );
}

function SwatchFormModal({ existingData, category, onClose, onSave }) {
  const [formData, setFormData] = useState({ id: null, name: '', type: 'color', value: '#000000', category: category.dbValue });
  const fileInputRef = useRef(null);

  useEffect(() => { if(existingData) setFormData(existingData); }, [existingData]);

  const handleImage = (e) => {
     const file = e.target.files[0];
     if(file) {
        const reader = new FileReader();
        reader.onload = (e) => setFormData({...formData, type: 'image', value: e.target.result});
        reader.readAsDataURL(file);
     }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
       <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6">
          <h3 className="text-lg font-bold mb-4">{existingData ? 'Edit Swatch' : 'New Swatch'}</h3>
          <div className="space-y-4">
             <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Name</label><input className="w-full border rounded-lg p-2 text-sm" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})}/></div>
             <div className="flex gap-2 p-1 bg-zinc-100 rounded-lg">
                <button onClick={() => setFormData({...formData, type: 'color'})} className={`flex-1 text-xs py-1.5 rounded-md font-bold ${formData.type === 'color' ? 'bg-white shadow-sm' : 'text-zinc-400'}`}>Color</button>
                <button onClick={() => setFormData({...formData, type: 'image'})} className={`flex-1 text-xs py-1.5 rounded-md font-bold ${formData.type === 'image' ? 'bg-white shadow-sm' : 'text-zinc-400'}`}>Image</button>
             </div>
             {formData.type === 'color' ? (
                <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Color Picker</label><div className="flex gap-2"><input type="color" className="h-10 w-10 border rounded cursor-pointer" value={formData.value} onChange={e=>setFormData({...formData, value: e.target.value})}/><input className="flex-1 border rounded-lg p-2 text-sm uppercase" value={formData.value} onChange={e=>setFormData({...formData, value: e.target.value})}/></div></div>
             ) : (
                <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Pattern Image</label><div onClick={() => fileInputRef.current.click()} className="w-full h-24 border border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-50 overflow-hidden">{formData.value && formData.value.startsWith('data:') ? <img src={formData.value} className="w-full h-full object-cover"/> : <span className="text-xs text-zinc-400">Click to upload</span>}</div><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImage}/></div>
             )}
          </div>
          <div className="mt-6 flex justify-end gap-2">
             <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm font-bold">Cancel</button>
             <button onClick={() => onSave(formData)} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold">Save</button>
          </div>
       </div>
    </div>
  );
}

function PieChartComponent({ data, total }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  let cumulativePercent = 0;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
        {data.map((item, idx) => {
           const percent = item.count / total;
           const dashArray = 2 * Math.PI * 0.4; 
           const startRotation = (cumulativePercent - percent) * 360; 
           cumulativePercent += percent;
           
           const isLargest = percent === Math.max(...data.map(d => d.count/total));
           const strokeWidth = hoveredIndex === idx ? 0.28 : (isLargest ? 0.25 : 0.2); 
           const radius = 0.4; 

           return (
             <circle
               key={item.id}
               r={radius}
               cx="0" cy="0"
               fill="transparent"
               stroke={item.color}
               strokeWidth={strokeWidth}
               strokeDasharray={`${dashArray * percent} ${dashArray * (1 - percent)}`}
               transform={`rotate(${startRotation + (percent*360)} 0 0)`}
               className="transition-all duration-300 cursor-pointer"
               onMouseEnter={() => setHoveredIndex(idx)}
               onMouseLeave={() => setHoveredIndex(null)}
             />
           );
        })}
      </svg>
      {/* Smart Label Overlay */}
      {data.map((item, idx) => {
         let prevPercent = 0; for(let i=0; i<idx; i++) prevPercent += data[i].count/total;
         const percent = item.count/total;
         const midPercent = prevPercent + percent/2;
         const angleRad = (midPercent * 2 * Math.PI) - (Math.PI / 2);
         const r = 0.65; 
         const x = 50 + (r * 50 * Math.cos(angleRad));
         const y = 50 + (r * 50 * Math.sin(angleRad));
         if (percent < 0.1) return null; 
         return (
            <div key={`label-${item.id}`} className="absolute text-[8px] md:text-[10px] font-bold text-zinc-600 flex flex-col items-center leading-none pointer-events-none drop-shadow-sm bg-white/90 backdrop-blur rounded px-1.5 py-0.5" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
               <span>{item.label}</span><span className="opacity-80 text-[7px]">{Math.round(percent*100)}%</span>
            </div>
         );
      })}
      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
         <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">TOTAL</span>
         <span className="text-3xl font-black text-zinc-900">{total}</span>
      </div>
    </div>
  );
}

function DashboardView({ products, favorites, setActiveCategory, setSelectedProduct, isAdmin, bannerData, onBannerUpload, onBannerTextChange, onSaveBannerText }) {
  const totalCount = products.length; const newCount = products.filter(p => p.isNew).length; const pickCount = favorites.length;
  const categoryCounts = []; let totalStandardProducts = 0;
  CATEGORIES.filter(c => !c.isSpecial).forEach(c => { const count = products.filter(p => p.category === c.id).length; if (count > 0) { categoryCounts.push({ ...c, count }); totalStandardProducts += count; } });
  
  const donutColors = ['#2563eb', '#0891b2', '#7c3aed', '#db2777', '#059669', '#d97706', '#ea580c', '#475569', '#9ca3af'];
  const chartData = categoryCounts.map((item, idx) => ({ ...item, color: donutColors[idx % donutColors.length] }));
  
  const recentUpdates = [...products].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 6);
  const fileInputRef = useRef(null);

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 print:hidden">
      <div className="relative w-full h-48 md:h-80 rounded-3xl overflow-hidden shadow-lg border border-zinc-200 group bg-zinc-900">
         <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10"></div>
         {bannerData.url ? <img src={bannerData.url} alt="Dashboard Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><img src="/api/placeholder/1200/400" className="w-full h-full object-cover grayscale" alt="Pattern" /></div>}
         <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-20 max-w-2xl">
            {isAdmin ? (
              <div className="space-y-2">
                <input type="text" value={bannerData.title} onChange={(e) => onBannerTextChange('title', e.target.value)} onBlur={onSaveBannerText} className="bg-transparent text-3xl md:text-6xl font-black text-white tracking-tighter w-full outline-none placeholder-zinc-500 border-b border-transparent hover:border-zinc-500 transition-colors" />
                <input type="text" value={bannerData.subtitle} onChange={(e) => onBannerTextChange('subtitle', e.target.value)} onBlur={onSaveBannerText} className="bg-transparent text-zinc-300 font-medium text-sm md:text-xl w-full outline-none placeholder-zinc-500 border-b border-transparent hover:border-zinc-500 transition-colors" />
              </div>
            ) : (
              <>
                <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter mb-2">{bannerData.title}</h2>
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
        <div onClick={() => setActiveCategory('NEW')} className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md cursor-pointer group flex flex-col md:flex-row items-center md:justify-between transition-all text-center md:text-left">
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
           <div className="flex flex-col lg:flex-row gap-10 items-center">
              <div className="relative w-64 h-64 md:w-72 md:h-72 flex-shrink-0">
                 <PieChartComponent data={chartData} total={totalStandardProducts} />
              </div>
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
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
           </div>
         ) : <div className="text-center py-20 text-zinc-300">No category data available</div>}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-zinc-900 flex items-center"><Clock className="w-6 h-6 mr-3 text-zinc-400" /> Recent Updates</h3>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center" onClick={() => setActiveCategory('NEW')}>View All <ArrowRight className="w-3 h-3 ml-1"/></button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentUpdates.length > 0 ? recentUpdates.map(product => (
               <div key={product.id} onClick={() => setSelectedProduct(product)} className="flex items-center p-3 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer transition-all group">
                  <div className="w-14 h-14 bg-zinc-100 rounded-lg flex-shrink-0 flex items-center justify-center mr-4 overflow-hidden border border-zinc-200">
                     {product.images?.[0] ? <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" /> : <ImageIcon className="w-6 h-6 text-zinc-300"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-zinc-900 truncate pr-2 group-hover:text-blue-600 transition-colors">{product.name}</h4>
                        {product.isNew && <span className="bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">NEW</span>}
                     </div>
                     <div className="flex items-center text-[10px] text-zinc-400 space-x-2">
                        <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 font-medium">{product.category}</span>
                        <span>•</span>
                        <span>{new Date(product.updatedAt || product.createdAt).toLocaleDateString()}</span>
                     </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-1 transition-transform" />
               </div>
            )) : <div className="col-span-full text-center text-zinc-300 py-10">No recent updates.</div>}
         </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onClick, showMoveControls, onMove, isFavorite, onToggleFavorite }) {
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;
  const awardBadge = product.awards?.[0];
  
  return (
    <div onClick={onClick} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border border-zinc-100 relative flex flex-col h-full print:break-inside-avoid print:shadow-none print:border-zinc-200">
      <div className="relative h-32 md:h-64 bg-zinc-50 p-2 md:p-6 flex items-center justify-center overflow-hidden">
        <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-wrap gap-1.5 z-10 items-start max-w-[80%]">
           {product.isNew && <span className="bg-black text-white text-[8px] md:text-[9px] font-extrabold px-1.5 py-0.5 md:px-2 md:py-1 rounded shadow-sm tracking-wide">NEW</span>}
           {awardBadge && <span className="bg-yellow-400 text-yellow-900 text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded shadow-sm flex items-center whitespace-nowrap"><Trophy className="w-2 h-2 md:w-2.5 md:h-2.5 mr-1" /> {awardBadge}</span>}
        </div>
        <button onClick={onToggleFavorite} className="absolute top-2 right-2 md:top-4 md:right-4 z-20 text-zinc-300 hover:text-yellow-400 hover:scale-110 transition-all print:hidden"><Star className={`w-4 h-4 md:w-5 md:h-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} /></button>
        <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            {mainImage ? <img src={mainImage} alt={product.name} loading="lazy" className="w-full h-full object-contain mix-blend-multiply" /> : <div className="text-center opacity-30"><ImageIcon className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 text-zinc-400" /></div>}
        </div>
        {showMoveControls && (
          <div className="absolute bottom-1 md:bottom-2 left-0 right-0 flex justify-center gap-2 z-20 print:hidden">
             <button onClick={(e) => {e.stopPropagation(); onMove('left')}} className="p-1 md:p-1.5 bg-white/90 rounded-full shadow hover:bg-black hover:text-white text-zinc-700 transition-colors"><ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /></button>
             <button onClick={(e) => {e.stopPropagation(); onMove('right')}} className="p-1 md:p-1.5 bg-white/90 rounded-full shadow hover:bg-black hover:text-white text-zinc-700 transition-colors"><ArrowRight className="w-3 h-3 md:w-4 md:h-4" /></button>
          </div>
        )}
        {product.spaces && product.spaces.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 print:opacity-100">
             {product.spaces.slice(0, 2).map(sid => {
                const s = SPACES.find(sp => sp.id === sid);
                if (!s) return null;
                return <div key={sid} className="bg-white/80 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-bold text-zinc-600 border border-zinc-200">{s.label}</div>
             })}
          </div>
        )}
      </div>
      <div className="p-3 md:p-5 flex-1 flex flex-col bg-white">
        <div className="flex justify-between items-start mb-1 md:mb-2">
          <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded uppercase tracking-wider break-words whitespace-normal leading-tight">{product.category}</span>
        </div>
        <h3 className="text-sm md:text-lg font-extrabold text-zinc-900 mb-1 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">{product.name}</h3>
        <div className="mt-auto pt-2 md:pt-4 border-t border-zinc-50 space-y-2">
          <div className="flex items-center gap-1 md:gap-2">
             <div className="flex -space-x-1">
                {Array.isArray(product.bodyColors) && product.bodyColors.slice(0, 4).map((c, i) => {
                   const colorVal = typeof c === 'object' ? c.value : c;
                   const isImg = typeof c === 'object' && c.type === 'image';
                   return <div key={i} className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full border border-white shadow-sm ring-1 ring-zinc-100 bg-cover" style={isImg ? { backgroundImage: `url(${colorVal})` } : { backgroundColor: colorVal }} />
                })}
             </div>
             {product.upholsteryColors?.length > 0 && <span className="text-zinc-200 text-[10px] mx-0.5">|</span>}
             <div className="flex -space-x-1">
                {Array.isArray(product.upholsteryColors) && product.upholsteryColors.slice(0, 4).map((c, i) => {
                   const colorVal = typeof c === 'object' ? c.value : c;
                   const isImg = typeof c === 'object' && c.type === 'image';
                   return <div key={i} className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-sm border border-white shadow-sm ring-1 ring-zinc-100 bg-cover" style={isImg ? { backgroundImage: `url(${colorVal})` } : { backgroundColor: colorVal }} />
                })}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailModal({ product, spaceContents, onClose, onEdit, isAdmin, showToast, isFavorite, onToggleFavorite, onNavigateSpace, onNavigateScene }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const canvasRef = useRef(null);
  
  if (!product) return null;
  const images = product.images || [];
  const currentImage = images.length > 0 ? images[currentImageIndex] : null;
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

  const copyToClipboard = () => { navigator.clipboard.writeText(`[${product.name}]\n${product.specs}`); showToast("Copied to clipboard"); };
  
  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
     if(!text) return y;
     const words = text.split(' ');
     let line = '';
     for(let n = 0; n < words.length; n++) {
       const testLine = line + words[n] + ' ';
       const metrics = ctx.measureText(testLine);
       const testWidth = metrics.width;
       if (testWidth > maxWidth && n > 0) {
         ctx.fillText(line, x, y);
         line = words[n] + ' ';
         y += lineHeight;
       } else { line = testLine; }
     }
     ctx.fillText(line, x, y);
     return y + lineHeight;
  };

  const handleShareImage = () => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d');
    const w = 1080;
    
    ctx.font = '26px sans-serif'; 
    const specLines = product.specs.split('\n');
    let tempY = 1400; // Header + Image
    specLines.forEach(l => { tempY += Math.ceil(ctx.measureText(l).width / (w-200)) * 40; }); 
    const features = [...(product.options||[]), ...(product.features||[])];
    tempY += 100; // Feature Header
    features.forEach(f => { tempY += Math.ceil(ctx.measureText(f).width / (w-200)) * 40; });
    
    const baseHeight = tempY + 200;
    
    canvas.width = w; canvas.height = baseHeight; 
    const img = new Image(); img.crossOrigin = "Anonymous";
    img.onload = () => {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, baseHeight);
      ctx.fillStyle = '#18181b'; ctx.fillRect(0, 0, w, 140);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'left'; ctx.fillText("PATRA DESIGN LAB", 60, 85);
      
      const ratio = Math.min((w - 120) / img.width, 600 / img.height);
      const imgW = img.width * ratio; const imgH = img.height * ratio;
      ctx.drawImage(img, (w - imgW) / 2, 200, imgW, imgH);
      
      let cursorY = 200 + imgH + 80;
      ctx.textAlign = 'center'; ctx.fillStyle = '#18181b'; ctx.font = 'bold 70px sans-serif'; 
      ctx.fillText(product.name, w/2, cursorY);
      cursorY += 60;
      
      ctx.fillStyle = '#71717a'; ctx.font = 'bold 30px sans-serif'; 
      ctx.fillText(product.category.toUpperCase(), w/2, cursorY);
      cursorY += 50;

      if(product.designer) {
        ctx.fillStyle = '#a1a1aa'; ctx.font = '30px sans-serif'; 
        ctx.fillText(`Designed by ${product.designer}`, w/2, cursorY);
        cursorY += 80;
      } else { cursorY += 40; }

      ctx.textAlign = 'left';
      ctx.fillStyle = '#f4f4f5'; ctx.fillRect(60, cursorY, w - 120, baseHeight - cursorY - 60);
      cursorY += 60;
      ctx.fillStyle = '#3f3f46'; ctx.font = 'bold 30px sans-serif';
      ctx.fillText("SPECIFICATIONS", 100, cursorY);
      cursorY += 50;
      
      ctx.font = '26px sans-serif'; ctx.fillStyle = '#52525b';
      const specTextLines = product.specs.split('\n');
      specTextLines.forEach(line => { cursorY = wrapText(ctx, line, 100, cursorY, w - 200, 40); });
      cursorY += 40;

      if (features.length > 0) {
         ctx.fillStyle = '#3f3f46'; ctx.font = 'bold 30px sans-serif';
         ctx.fillText("FEATURES & OPTIONS", 100, cursorY);
         cursorY += 50;
         ctx.font = '26px sans-serif'; ctx.fillStyle = '#52525b';
         features.forEach(f => { cursorY = wrapText(ctx, `• ${f}`, 100, cursorY, w - 200, 40); });
      }

      const dataUrl = canvas.toDataURL('image/png'); const a = document.createElement('a'); a.href = dataUrl; a.download = `${product.name}-card.png`; a.click(); showToast("이미지가 저장되었습니다.");
    };
    if(currentImage) img.src = currentImage; else showToast("이미지가 없어 생성할 수 없습니다.", "error");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200 print:fixed print:inset-0 print:z-[100] print:bg-white print:h-auto print:overflow-visible">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {isZoomed && currentImage && (<div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-8 cursor-zoom-out print:hidden" onClick={() => setIsZoomed(false)}><img src={currentImage} className="max-w-full max-h-full object-contain" alt="Zoomed" /><button className="absolute top-6 right-6 text-white/50 hover:text-white"><X className="w-10 h-10" /></button></div>)}
      <div className="bg-white w-full h-full md:h-[90vh] md:w-full md:max-w-6xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative print:h-auto print:overflow-visible print:shadow-none print:rounded-none">
        <button onClick={onClose} className="hidden md:flex absolute top-5 right-5 p-2 bg-white/50 hover:bg-zinc-100 rounded-full z-[60] transition-colors backdrop-blur print:hidden"><X className="w-6 h-6 text-zinc-900" /></button>
        
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-100 bg-white sticky top-0 z-50 print:hidden">
           <button onClick={onClose} className="p-2 -ml-2"><ArrowLeft className="w-6 h-6"/></button>
           <span className="font-bold text-sm truncate max-w-[200px]">{product.name}</span>
           <div className="flex gap-2">
              <button onClick={onToggleFavorite}><Star className={`w-6 h-6 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`}/></button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row h-full pb-safe print:overflow-visible print:h-auto">
          <div className="w-full md:w-1/2 bg-zinc-50 p-6 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-zinc-100 md:sticky md:top-0 print:static print:bg-white print:border-none">
            <div className="flex-1 w-full bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 overflow-hidden p-8 mb-4 relative group min-h-[300px] print:shadow-none print:border-zinc-200">
               {currentImage ? (<><img src={currentImage} alt="Main" className="w-full h-full object-contain cursor-zoom-in mix-blend-multiply" onClick={() => setIsZoomed(true)} /><div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity print:hidden"><div className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-bold flex items-center"><Maximize2 className="w-4 h-4 mr-2"/> ZOOM</div></div></>) : <ImageIcon className="w-20 h-20 opacity-20 text-zinc-400" />}
               <button onClick={onToggleFavorite} className="absolute top-4 left-4 p-3 bg-white rounded-full shadow-sm border border-zinc-100 hover:border-zinc-300 transition-all hidden md:flex print:hidden"><Star className={`w-5 h-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`} /></button>
            </div>
            {images.length > 0 && (<div className="flex space-x-2 md:space-x-3 overflow-x-auto custom-scrollbar pb-1 px-1 print:hidden">{images.map((img, idx) => (<button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`flex-shrink-0 w-10 h-10 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-zinc-900 ring-2 ring-zinc-200' : 'border-transparent opacity-60 hover:opacity-100 bg-white'}`}><img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" /></button>))}</div>)}
          </div>
          <div className="w-full md:w-1/2 p-6 md:p-12 bg-white pb-32 md:pb-12 print:pb-0">
            <div className="mb-6 md:mb-10">
              <div className="flex flex-wrap gap-2 mb-2"><span className="inline-block px-2.5 py-0.5 bg-zinc-900 text-white text-[10px] font-extrabold rounded uppercase tracking-widest">{product.category}</span>{product.awards?.map(award => (<span key={award} className="inline-flex items-center px-2.5 py-0.5 bg-yellow-400/20 text-yellow-700 border border-yellow-400/30 text-[10px] font-bold rounded uppercase tracking-wide"><Trophy className="w-3 h-3 mr-1" /> {award}</span>))}</div>
              <h2 className="text-3xl md:text-5xl font-black text-zinc-900 mb-1 tracking-tight">{product.name}</h2>
              {product.designer && <p className="text-sm text-zinc-500 font-medium">Designed by <span className="text-zinc-900">{product.designer}</span></p>}
            </div>
            <div className="space-y-6 md:space-y-10">
              <div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between">Specifications <button onClick={copyToClipboard} className="text-zinc-400 hover:text-zinc-900 print:hidden"><Copy className="w-4 h-4" /></button></h3><p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 md:p-6 rounded-2xl border border-zinc-100 whitespace-pre-wrap print:bg-transparent print:border-none print:p-0">{product.specs}</p></div>
              {(product.features?.length > 0 || product.options?.length > 0) && (<div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Features & Options</h3><div className="flex flex-wrap gap-2">{product.options?.map((opt, idx) => (<span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold print:border-gray-300 print:text-black">{opt}</span>))}{product.features?.map((ft, idx) => (<span key={idx} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium flex items-center print:bg-transparent"><Check className="w-3 h-3 mr-1.5" /> {ft}</span>))}</div></div>)}
              <div className="grid grid-cols-2 gap-4 md:gap-8">
                 <div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Body Color</h3><div className="flex flex-wrap gap-2">{Array.isArray(product.bodyColors) && product.bodyColors.map((c, i) => { const isObj = typeof c === 'object'; const val = isObj ? c.value : c; const name = isObj ? c.name : c; const isImg = isObj && c.type === 'image'; return <div key={i} className="group relative w-8 h-8 rounded-full border border-zinc-200 shadow-sm cursor-help print:border-gray-400 bg-cover bg-center" style={isImg ? { backgroundImage: `url(${val})` } : { backgroundColor: val }}><span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none print:hidden">{name}</span></div> })}</div></div>
                 <div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Upholstery</h3><div className="flex flex-wrap gap-2">{Array.isArray(product.upholsteryColors) && product.upholsteryColors.map((c, i) => { const isObj = typeof c === 'object'; const val = isObj ? c.value : c; const name = isObj ? c.name : c; const isImg = isObj && c.type === 'image'; return <div key={i} className="group relative w-8 h-8 rounded-md border border-zinc-200 shadow-sm cursor-help print:border-gray-400 bg-cover bg-center" style={isImg ? { backgroundImage: `url(${val})` } : { backgroundColor: val }}><span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none print:hidden">{name}</span></div> })}</div></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-zinc-100 print:hidden">
                {relatedSpaces.length > 0 && (<div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Related Spaces</h3><div className="space-y-2">{relatedSpaces.map(space => (<button key={space.id} onClick={() => onNavigateSpace(space.id)} className="w-full flex items-center p-3 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-all text-left border border-transparent hover:border-zinc-200 group"><div className="p-2 bg-white rounded-lg shadow-sm mr-3 text-zinc-400 group-hover:text-black transition-colors"><space.icon className="w-4 h-4" /></div><span className="text-sm font-bold text-zinc-700">{space.label}</span></button>))}</div></div>)}
                {relatedScenes.length > 0 && (<div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Related Scenes</h3><div className="space-y-2">{relatedScenes.map(scene => (<button key={scene.id} onClick={() => onNavigateScene(scene)} className="w-full flex items-center p-2 bg-white border border-zinc-200 hover:border-zinc-400 rounded-xl transition-all text-left shadow-sm group"><div className="w-10 h-10 bg-zinc-100 rounded-lg overflow-hidden mr-3 flex-shrink-0"><img src={scene.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Scene"/></div><div className="min-w-0"><div className="text-xs font-bold text-zinc-900 truncate">{scene.title}</div><div className="text-[10px] text-zinc-500 truncate flex items-center"><ImageIcon className="w-3 h-3 mr-1"/> View Scene</div></div></button>))}</div></div>)}
              </div>

              {contentImages.length > 0 && (<div className="pt-8 border-t border-zinc-100 space-y-4"><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Detail View</h3><div className="flex flex-col gap-4">{contentImages.map((img, idx) => (<img key={idx} src={img} alt={`Detail ${idx+1}`} className="w-full h-auto rounded-xl border border-zinc-100 print:border-none" />))}</div></div>)}
            </div>
            
            <div className="hidden md:flex mt-12 pt-6 border-t border-zinc-100 justify-between items-center pb-8 print:hidden">
              <div className="flex gap-3">
                 <button onClick={handleShareImage} className="flex items-center px-5 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors shadow-sm"><ImgIcon className="w-4 h-4 mr-2" /> Share Image</button>
                 <button onClick={() => window.print()} className="flex items-center px-5 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors shadow-sm"><Printer className="w-4 h-4 mr-2" /> Print PDF</button>
              </div>
              {isAdmin && (<button onClick={onEdit} className="flex items-center px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-black hover:shadow-lg transition-all"><Edit2 className="w-4 h-4 mr-2" /> Edit</button>)}
            </div>
          </div>
        </div>
        
        {/* Mobile Safe Bottom Bar (Scrollable) */}
        <div className="md:hidden mt-8 pt-6 border-t border-zinc-100 p-4 pb-12 flex justify-between items-center print:hidden">
           <div className="flex gap-3 w-full">
             <button onClick={handleShareImage} className="flex-1 flex items-center justify-center px-4 py-3 bg-zinc-100 rounded-xl text-sm font-bold text-zinc-600"><ImgIcon className="w-4 h-4 mr-2"/> Share</button>
             <button onClick={() => window.print()} className="flex-1 flex items-center justify-center px-4 py-3 bg-zinc-100 rounded-xl text-sm font-bold text-zinc-600"><Printer className="w-4 h-4 mr-2"/> PDF</button>
           </div>
           {isAdmin && <button onClick={onEdit} className="ml-3 flex items-center justify-center w-12 h-12 bg-zinc-900 text-white rounded-xl shadow-lg"><Edit2 className="w-5 h-5"/></button>}
        </div>
      </div>
    </div>
  );
}

function ProductFormModal({ categories, existingData, swatches, onClose, onSave, onDelete, isFirebaseAvailable, initialCategory }) {
  const isEditMode = !!existingData;
  const fileInputRef = useRef(null);
  const contentInputRef = useRef(null);
  const defaultCategory = (initialCategory && !['ALL','NEW','MY_PICK','DASHBOARD'].includes(initialCategory) && !SPACES.find(s=>s.id===initialCategory)) ? initialCategory : 'EXECUTIVE';
  
  const [formData, setFormData] = useState({ 
    id: null, name: '', category: defaultCategory, specs: '', designer: '',
    featuresString: '', optionsString: '', materialsString: '',
    bodyColors: [], upholsteryColors: [], awardsString: '',
    productLink: '', isNew: false, launchDate: new Date().toISOString().split('T')[0],
    images: [], attachments: [], contentImages: [], spaces: []
  });
  
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [swatchSelectorType, setSwatchSelectorType] = useState(null); 

  useEffect(() => {
    if (existingData) {
      setFormData({ 
        id: existingData.id, name: existingData.name, category: existingData.category, specs: existingData.specs, designer: existingData.designer || '',
        featuresString: existingData.features?.join(', ') || '', optionsString: existingData.options?.join(', ') || '', materialsString: existingData.materials?.join(', ') || '',
        bodyColors: existingData.bodyColors || [], upholsteryColors: existingData.upholsteryColors || [], awardsString: existingData.awards?.join(', ') || '',
        productLink: existingData.productLink || '', isNew: existingData.isNew, launchDate: existingData.launchDate || new Date().toISOString().split('T')[0],
        images: existingData.images || [], attachments: existingData.attachments || [], contentImages: existingData.contentImages || [],
        spaces: existingData.spaces || []
      });
    }
  }, [existingData]);

  const processImage = (file) => { return new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const MAX_WIDTH = 1000; let width = img.width; let height = img.height; if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.8)); }; img.src = e.target.result; }; reader.readAsDataURL(file); }); };
  const handleImageUpload = async (e) => { const files = Array.from(e.target.files); if (files.length > 0) { setIsProcessingImage(true); const newUrls = []; for (const file of files) { try { newUrls.push(await processImage(file)); } catch (e) {} } setFormData(prev => ({ ...prev, images: [...prev.images, ...newUrls] })); setIsProcessingImage(false); } };
  const handleContentImageUpload = async (e) => { const files = Array.from(e.target.files); if (files.length > 0) { setIsProcessingImage(true); const newUrls = []; for (const file of files) { try { newUrls.push(await processImage(file)); } catch (e) {} } setFormData(prev => ({ ...prev, contentImages: [...prev.contentImages, ...newUrls] })); setIsProcessingImage(false); } };
  const handleAttachmentUpload = (e) => { const files = Array.from(e.target.files); files.forEach(file => { if (file.size > 300*1024) return window.alert("Too large"); const reader = new FileReader(); reader.onload = (e) => setFormData(p => ({...p, attachments: [...p.attachments, {name: file.name, url: e.target.result}]})); reader.readAsDataURL(file); }); };
  const handleAddLinkAttachment = () => { const url = window.prompt("URL:"); const name = window.prompt("Name:"); if(url && name) setFormData(p => ({...p, attachments: [...p.attachments, {name, url}]})); };
  const removeImage = (i) => setFormData(p => ({...p, images: p.images.filter((_, idx) => idx !== i)}));
  const removeContentImage = (i) => setFormData(p => ({...p, contentImages: p.contentImages.filter((_, idx) => idx !== i)}));
  const setMainImage = (i) => setFormData(p => { const imgs = [...p.images]; const [m] = imgs.splice(i, 1); imgs.unshift(m); return {...p, images: imgs}; });
  const removeAttachment = (i) => setFormData(p => ({...p, attachments: p.attachments.filter((_, idx) => idx !== i)}));
  const toggleSpace = (spaceId) => { setFormData(prev => { const currentSpaces = prev.spaces || []; if (currentSpaces.includes(spaceId)) { return { ...prev, spaces: currentSpaces.filter(id => id !== spaceId) }; } else { return { ...prev, spaces: [...currentSpaces, spaceId] }; } }); };

  const handleSwatchSelection = (swatch) => {
     const field = swatchSelectorType === 'body' ? 'bodyColors' : 'upholsteryColors';
     const current = formData[field] || [];
     const swatchObj = { id: swatch.id, name: swatch.name, type: swatch.type, value: swatch.value };
     const exists = current.find(c => (typeof c === 'object' ? c.id === swatch.id : false));
     if (exists) {
        setFormData({ ...formData, [field]: current.filter(c => (typeof c === 'object' ? c.id !== swatch.id : true)) });
     } else {
        setFormData({ ...formData, [field]: [...current, swatchObj] });
     }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      ...formData,
      features: formData.featuresString.split(',').map(s=>s.trim()).filter(Boolean),
      options: formData.optionsString.split(',').map(s=>s.trim()).filter(Boolean),
      materials: formData.materialsString.split(',').map(s=>s.trim()).filter(Boolean),
      awards: formData.awardsString.split(',').map(s=>s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-4 duration-200 relative">
        <div className="px-8 py-5 border-b border-zinc-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-900">{isEditMode ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose}><X className="w-6 h-6 text-zinc-400 hover:text-zinc-900" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
             <div className="flex justify-between mb-4"><span className="font-bold text-sm">Product Images (Main)</span><div className="space-x-2"><button type="button" onClick={() => fileInputRef.current.click()} className="text-xs bg-white border px-3 py-1 rounded-lg font-medium hover:bg-zinc-100">Upload</button></div><input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleImageUpload} accept="image/*"/></div>
             <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
               {formData.images.map((img, i) => (<div key={i} className="relative aspect-square bg-white rounded-lg border overflow-hidden group"><img src={img} className="w-full h-full object-cover" /><button type="button" onClick={()=>removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button>{i===0 && <span className="absolute bottom-1 left-1 bg-black text-white text-[9px] px-1 rounded">MAIN</span>}{i!==0 && <button type="button" onClick={()=>setMainImage(i)} className="absolute bottom-1 left-1 bg-white text-black text-[9px] px-1 rounded opacity-0 group-hover:opacity-100">Set Main</button>}</div>))}
             </div>
          </div>
          <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
             <div className="flex justify-between mb-4"><span className="font-bold text-sm">Detailed Content Images (Vertical Scroll)</span><div className="space-x-2"><button type="button" onClick={() => contentInputRef.current.click()} className="text-xs bg-white border px-3 py-1 rounded-lg font-medium hover:bg-zinc-100">Upload</button></div><input ref={contentInputRef} type="file" multiple className="hidden" onChange={handleContentImageUpload} accept="image/*"/></div>
             <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
               {formData.contentImages.map((img, i) => (<div key={i} className="relative aspect-[3/4] bg-white rounded-lg border overflow-hidden group"><img src={img} className="w-full h-full object-cover" /><button type="button" onClick={()=>removeContentImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button></div>))}
             </div>
          </div>
          <div className="mb-4"><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Related Spaces</label><div className="flex flex-wrap gap-2">{SPACES.map(space => (<button key={space.id} type="button" onClick={() => toggleSpace(space.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center ${formData.spaces.includes(space.id) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}>{formData.spaces.includes(space.id) && <Check className="w-3 h-3 mr-1.5" />}{space.label}</button>))}</div></div>
          <div className="grid grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Name</label><input required className="w-full border p-2 rounded-lg" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})}/></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label><select className="w-full border p-2 rounded-lg" value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})}>{categories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div></div>
          
          <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Specs</label><textarea required rows={2} className="w-full border p-2 rounded-lg" value={formData.specs} onChange={e=>setFormData({...formData, specs: e.target.value})}/></div>
          
          <div className="grid grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Options (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.optionsString} onChange={e=>setFormData({...formData, optionsString: e.target.value})}/></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Features (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.featuresString} onChange={e=>setFormData({...formData, featuresString: e.target.value})}/></div></div>
          
          <div className="grid grid-cols-2 gap-6 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
             <div>
                <div className="flex justify-between items-center mb-1"><label className="block text-xs font-bold text-zinc-500 uppercase">Body Colors</label><button type="button" onClick={() => setSwatchSelectorType('body')} className="text-[10px] text-blue-600 font-bold">+ Select Swatch</button></div>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-white rounded border border-zinc-200">
                   {formData.bodyColors.map((c, i) => <div key={i} className="text-xs bg-zinc-100 px-2 py-1 rounded flex items-center">{typeof c === 'object' ? c.name : c}</div>)}
                </div>
             </div>
             <div>
                <div className="flex justify-between items-center mb-1"><label className="block text-xs font-bold text-zinc-500 uppercase">Upholstery</label><button type="button" onClick={() => setSwatchSelectorType('upholstery')} className="text-[10px] text-blue-600 font-bold">+ Select Swatch</button></div>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-white rounded border border-zinc-200">
                   {formData.upholsteryColors.map((c, i) => <div key={i} className="text-xs bg-zinc-100 px-2 py-1 rounded flex items-center">{typeof c === 'object' ? c.name : c}</div>)}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Materials (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.materialsString} onChange={e=>setFormData({...formData, materialsString: e.target.value})}/></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Awards (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.awardsString} onChange={e=>setFormData({...formData, awardsString: e.target.value})}/></div></div>
          <div className="flex items-center space-x-2"><input type="checkbox" checked={formData.isNew} onChange={e=>setFormData({...formData, isNew: e.target.checked})}/><label className="text-sm font-bold">Mark as New Arrival</label></div>
        </form>
        <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50 flex justify-between">
           {isEditMode && <button type="button" onClick={()=>onDelete(formData.id, formData.name)} className="text-red-500 font-bold text-sm flex items-center"><Trash2 className="w-4 h-4 mr-2"/> Delete</button>}
           <div className="flex space-x-3 ml-auto">
              <button type="button" onClick={onClose} className="px-5 py-2.5 border rounded-xl text-sm font-bold hover:bg-white">Cancel</button>
              <button onClick={handleSubmit} disabled={isProcessingImage} className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-black shadow-lg disabled:opacity-50">{isProcessingImage ? 'Processing...' : 'Save Product'}</button>
           </div>
        </div>

        {swatchSelectorType && (
           <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-10">
              <div className="px-4 py-3 border-b flex justify-between items-center bg-zinc-50">
                 <h3 className="font-bold text-sm">Select {swatchSelectorType} Swatches</h3>
                 <button onClick={() => setSwatchSelectorType(null)} className="p-2 bg-white rounded-full shadow-sm"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                 {SWATCH_CATEGORIES.map(cat => {
                    const catSwatches = swatches.filter(s => s.category === cat.dbValue);
                    if (catSwatches.length === 0) return null;
                    return (
                       <div key={cat.id} className="mb-6">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase mb-2 flex items-center"><cat.icon className="w-3 h-3 mr-1"/> {cat.label}</h4>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                             {catSwatches.map(s => {
                                const field = swatchSelectorType === 'body' ? 'bodyColors' : 'upholsteryColors';
                                const isSelected = formData[field].some(c => (typeof c === 'object' ? c.id === s.id : false));
                                return (
                                   <div key={s.id} onClick={() => handleSwatchSelection(s)} className={`aspect-square rounded-lg border-2 cursor-pointer relative overflow-hidden ${isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent'}`}>
                                      <div className="w-full h-full bg-cover bg-center" style={s.type === 'image' ? { backgroundImage: `url(${s.value})` } : { backgroundColor: s.value }} />
                                      {isSelected && <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center"><Check className="text-white w-5 h-5 drop-shadow-md"/></div>}
                                      <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] p-0.5 text-center truncate">{s.name}</span>
                                   </div>
                                )
                             })}
                          </div>
                       </div>
                    )
                 })}
              </div>
              <div className="p-4 border-t bg-zinc-50 text-right"><button onClick={() => setSwatchSelectorType(null)} className="px-6 py-2 bg-black text-white rounded-lg text-sm font-bold">Done</button></div>
           </div>
        )}
      </div>
    </div>
  );
}