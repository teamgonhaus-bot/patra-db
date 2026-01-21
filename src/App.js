/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Search, X, Check, Tag, Palette, Settings, Image as ImageIcon,
  Upload, Trash2, Edit2, RefreshCw, Cloud, CloudOff, Lock, Unlock,
  Database, Info, ArrowUpDown, ListFilter, Menu, History,
  Copy, ChevronRight, Activity, ShieldAlert, FileJson, Calendar,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Layers, Star,
  Trophy, Heart, Link as LinkIcon, Paperclip, PieChart, Clock,
  Share2, Download, Maximize2, LayoutGrid, Zap, GripHorizontal, ImageIcon as ImgIcon,
  ChevronsUp, Camera, ImagePlus, Sofa, Briefcase, Users, Home as HomeIcon, MapPin,
  Edit3, Grid, MoreVertical, MousePointer2, CheckSquare, XCircle, Printer, List, Eye
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, addDoc, query, orderBy, limit, getDoc, writeBatch 
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
const APP_VERSION = "v0.5.6-fix"; // Updated Version
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

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
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
  
  // My Pick View Mode (Grid vs List)
  const [myPickViewMode, setMyPickViewMode] = useState('grid'); // 'grid' or 'list'

  // Banner & Space Data States
  const [bannerData, setBannerData] = useState({ url: null, title: 'Design Lab DB', subtitle: 'Integrated Product Database & Archives' });
  const [spaceContents, setSpaceContents] = useState({}); 

  // Modal States
  const [editingSpaceInfoId, setEditingSpaceInfoId] = useState(null);
  const [managingSpaceProductsId, setManagingSpaceProductsId] = useState(null);
  const [editingScene, setEditingScene] = useState(null);
  const [selectedScene, setSelectedScene] = useState(null);

  // Scroll Handler
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

  // Browser Back Button Handling (V0.5.6 addition)
  useEffect(() => {
    const handlePopState = (event) => {
      if (selectedProduct) {
        setSelectedProduct(null);
        window.history.pushState(null, '', window.location.pathname); // Prevent actually going back
      } else if (activeCategory !== 'DASHBOARD') {
        setActiveCategory('DASHBOARD');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedProduct, activeCategory]);

  // Push state when opening modal
  useEffect(() => {
    if (selectedProduct) {
      window.history.pushState({ modal: true }, '', `?id=${selectedProduct.id}`);
    }
  }, [selectedProduct]);

  // URL Query Parameter
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

  // Auth
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

  // Data Sync
  useEffect(() => {
    if (isFirebaseAvailable && user && db) {
      const qProducts = collection(db, 'artifacts', appId, 'public', 'data', 'products');
      const unsubProducts = onSnapshot(qProducts, (snapshot) => {
        const loadedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(loadedProducts);
        setIsLoading(false);
      });

      const bannerDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'banner');
      const unsubBanner = onSnapshot(bannerDocRef, (doc) => {
        if (doc.exists()) setBannerData(prev => ({ ...prev, ...doc.data() }));
      });

      return () => { unsubProducts(); unsubBanner(); };
    } else {
      const localBanner = localStorage.getItem('patra_banner_data');
      if (localBanner) setBannerData(JSON.parse(localBanner));
      loadFromLocalStorage();
    }
  }, [user]);

  // Space Content Sync
  useEffect(() => {
    if (!isFirebaseAvailable || !user || !db) return;
    if (!SPACES.find(s => s.id === activeCategory)) return;

    const spaceDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', activeCategory);
    const unsubSpace = onSnapshot(spaceDocRef, (doc) => {
      if (doc.exists()) {
        setSpaceContents(prev => ({ ...prev, [activeCategory]: doc.data() }));
      } else {
        setSpaceContents(prev => ({ ...prev, [activeCategory]: { scenes: [] } }));
      }
    });
    return () => unsubSpace();
  }, [activeCategory, user]);

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

  const handleBannerUpload = async (e) => {
    if (!isAdmin) return;
    const file = e.target.files[0];
    if (!file) return;
    try {
      const resizedImage = await processImage(file);
      const newData = { ...bannerData, url: resizedImage };
      if (isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'banner'), newData, { merge: true });
      else { localStorage.setItem('patra_banner_data', JSON.stringify(newData)); setBannerData(newData); }
      showToast("메인 배너가 업데이트되었습니다.");
    } catch (error) { showToast("이미지 처리 실패", "error"); }
  };

  const handleBannerTextChange = (key, value) => { if (!isAdmin) return; setBannerData(prev => ({ ...prev, [key]: value })); };
  const saveBannerText = async () => {
    if (isFirebaseAvailable && db) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'banner'), bannerData, { merge: true });
      showToast("배너 문구가 저장되었습니다.");
    }
  };

  const handleSpaceBannerUpload = async (e, spaceId) => {
    if (!isAdmin) return;
    const file = e.target.files[0];
    if (!file) return;
    try {
      const resizedImage = await processImage(file);
      const currentContent = spaceContents[spaceId] || {};
      const newContent = { ...currentContent, banner: resizedImage };
      if (isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), newContent, { merge: true });
      showToast("공간 배너가 업데이트되었습니다.");
    } catch (error) { showToast("이미지 처리 실패", "error"); }
  };

  const handleSpaceInfoSave = async (spaceId, info) => {
     const currentContent = spaceContents[spaceId] || {};
     const newContent = { ...currentContent, ...info };
     if (isFirebaseAvailable && db) {
       await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), newContent, { merge: true });
     }
     showToast("공간 정보가 저장되었습니다.");
  };

  const handleSceneSave = async (spaceId, sceneData) => {
    const currentContent = spaceContents[spaceId] || { scenes: [] };
    let newScenes = [...(currentContent.scenes || [])];
    
    if (sceneData.id) {
       const idx = newScenes.findIndex(s => s.id === sceneData.id);
       if (idx >= 0) newScenes[idx] = sceneData;
       else newScenes.push(sceneData);
    } else {
       sceneData.id = Date.now().toString();
       newScenes.push(sceneData);
    }

    if (isFirebaseAvailable && db) {
       await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), { scenes: newScenes }, { merge: true });
    }
    showToast("장면(Scene)이 저장되었습니다.");
  };

  const handleSceneDelete = async (spaceId, sceneId) => {
    if(!window.confirm("이 장면을 삭제하시겠습니까?")) return;
    const currentContent = spaceContents[spaceId] || { scenes: [] };
    const newScenes = (currentContent.scenes || []).filter(s => s.id !== sceneId);
    
    if (isFirebaseAvailable && db) {
       await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), { scenes: newScenes }, { merge: true });
    }
    showToast("장면이 삭제되었습니다.");
  };

  const handleSpaceProductToggle = async (spaceId, productId, isAdded) => {
     const product = products.find(p => p.id === productId);
     if(!product) return;
     let newSpaces = product.spaces || [];
     if(isAdded) { if(!newSpaces.includes(spaceId)) newSpaces.push(spaceId); } 
     else { newSpaces = newSpaces.filter(s => s !== spaceId); }
     
     if (isFirebaseAvailable && db) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', product.id), { spaces: newSpaces }, { merge: true });
     } else {
        const idx = products.findIndex(p => p.id === productId);
        const newProds = [...products];
        newProds[idx] = { ...product, spaces: newSpaces };
        saveToLocalStorage(newProds);
     }
  };

  const logActivity = async (action, productName, details = "") => {
    if (!isFirebaseAvailable || !db) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), { action, productName, details, timestamp: Date.now(), adminId: 'admin' }); } catch (e) { console.error(e); }
  };
  
  const fetchLogs = async () => {
    if (!isFirebaseAvailable || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), orderBy('timestamp', 'desc'), limit(100));
    onSnapshot(q, (snapshot) => { setActivityLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
  };

  const handleSaveProduct = async (productData) => {
    const docId = productData.id ? String(productData.id) : String(Date.now());
    const isEdit = !!productData.id && products.some(p => String(p.id) === docId);
    const payload = {
      ...productData, id: docId, updatedAt: Date.now(),
      createdAt: isEdit ? (products.find(p => String(p.id) === docId)?.createdAt || Date.now()) : Date.now(),
      orderIndex: isEdit ? (products.find(p => String(p.id) === docId)?.orderIndex || Date.now()) : Date.now()
    };
    if (isFirebaseAvailable && db) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', docId), payload, { merge: true }); } 
      catch (error) { showToast("저장 실패", "error"); return; }
    } else {
      const idx = products.findIndex(p => String(p.id) === docId); let newProducts = [...products];
      if (idx >= 0) newProducts[idx] = payload; else newProducts = [payload, ...products];
      saveToLocalStorage(newProducts);
    }
    if (selectedProduct && String(selectedProduct.id) === docId) setSelectedProduct(payload);
    setIsFormOpen(false); setEditingProduct(null); showToast(isEdit ? "수정 완료" : "등록 완료");
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    if (isFirebaseAvailable && db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', String(productId)));
        await logActivity("DELETE", productName, "삭제됨");
      } catch (error) { showToast("삭제 실패", "error"); return; }
    } else {
      const newProducts = products.filter(p => String(p.id) !== String(productId));
      saveToLocalStorage(newProducts);
    }
    setSelectedProduct(null); setIsFormOpen(false); showToast("삭제되었습니다.");
  };

  const getProcessedProducts = () => {
    let filtered = products.filter(product => {
      let matchesCategory = true;
      if (activeCategory === 'DASHBOARD') matchesCategory = false; 
      else if (activeCategory === 'MY_PICK') matchesCategory = favorites.includes(product.id);
      else if (activeCategory === 'NEW') matchesCategory = product.isNew;
      else if (activeCategory === 'ALL') matchesCategory = true;
      else if (SPACES.find(s => s.id === activeCategory)) matchesCategory = product.spaces && product.spaces.includes(activeCategory);
      else matchesCategory = product.category === activeCategory;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) || 
        product.specs.toLowerCase().includes(searchLower) ||
        (product.designer && product.designer.toLowerCase().includes(searchLower)) ||
        (product.options && product.options.some(opt => opt.toLowerCase().includes(searchLower)));
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
  
  const handleMoveProduct = async (index, direction) => {
    if (!processedProducts || processedProducts.length <= 1) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= processedProducts.length) return;
    const currentItem = processedProducts[index];
    const swapItem = processedProducts[targetIndex];
    const currentOrder = currentItem.orderIndex !== undefined ? currentItem.orderIndex : currentItem.createdAt;
    const swapOrder = swapItem.orderIndex !== undefined ? swapItem.orderIndex : swapItem.createdAt;
    if (isFirebaseAvailable && db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', currentItem.id), { orderIndex: swapOrder }, { merge: true });
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', swapItem.id), { orderIndex: currentOrder }, { merge: true });
      } catch (e) { showToast("순서 변경 실패", "error"); }
    } else {
      const newProducts = [...products];
      const p1 = newProducts.find(p => p.id === currentItem.id);
      const p2 = newProducts.find(p => p.id === swapItem.id);
      if (p1 && p2) { p1.orderIndex = swapOrder; p2.orderIndex = currentOrder; saveToLocalStorage(newProducts); }
    }
  };

  const handleFullBackup = async () => { 
    const backupData = { version: APP_VERSION, date: new Date().toISOString(), products: products, logs: activityLogs };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `PATRA_DB_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast("전체 데이터 백업이 완료되었습니다.");
  };

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 overflow-hidden relative selection:bg-black selection:text-white print:overflow-visible print:h-auto print:bg-white">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />}
      
      {/* Sidebar - Hide on Print */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-md border-r border-zinc-200 flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 md:relative md:translate-x-0 print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between cursor-pointer group" onClick={() => { setActiveCategory('DASHBOARD'); setIsMobileMenuOpen(false); }}>
          <div className="flex items-center space-x-3"><div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">P</div><div><h1 className="text-lg font-extrabold tracking-tight text-zinc-900">PATRA</h1><span className="text-[10px] font-semibold text-zinc-400 tracking-widest uppercase block -mt-1">Design Lab DB</span></div></div>
          <button onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }} className="md:hidden text-zinc-400 hover:text-zinc-600"><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-4 custom-scrollbar">
          <div className="space-y-1">
            {CATEGORIES.filter(c => c.isSpecial).map((cat) => (<button key={cat.id} onClick={() => { setActiveCategory(cat.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group border ${activeCategory === cat.id ? 'bg-zinc-900 text-white shadow-lg border-zinc-900' : 'bg-white text-zinc-600 border-zinc-100 hover:bg-zinc-50 hover:border-zinc-300'}`}><div className="flex items-center">{cat.id === 'ALL' && <LayoutGrid className="w-4 h-4 mr-3 opacity-70" />}{cat.id === 'NEW' && <Zap className="w-4 h-4 mr-3 opacity-70" />}<span className="font-bold tracking-tight">{cat.label}</span></div>{cat.id === 'NEW' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-auto"></span>}</button>))}
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-400 mb-2 px-3 flex justify-between items-center tracking-widest uppercase"><span>SPACES</span></div>
            <div className="space-y-1">{SPACES.map((space) => (<button key={space.id} onClick={() => { setActiveCategory(space.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === space.id ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}><div className="flex items-center"><space.icon className={`w-3.5 h-3.5 mr-3 ${activeCategory === space.id ? 'text-white' : 'text-zinc-400'}`} />{space.label}</div>{activeCategory === space.id && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}</button>))}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-400 mb-2 px-3 flex justify-between items-center tracking-widest uppercase border-t border-zinc-100 pt-4"><span>COLLECTIONS</span>{isFirebaseAvailable ? <div className="flex items-center text-green-500"><Cloud className="w-3 h-3 mr-1" /></div> : <div className="flex items-center text-zinc-300"><CloudOff className="w-3 h-3 mr-1" /></div>}</div>
            <div className="space-y-0.5">{CATEGORIES.filter(c => !c.isSpecial).map((cat) => (<button key={cat.id} onClick={() => { setActiveCategory(cat.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === cat.id ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}>{cat.label}</button>))}</div>
          </div>
          <div className="pt-2"><button onClick={() => { setActiveCategory('MY_PICK'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center space-x-3 group border ${activeCategory === 'MY_PICK' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'text-zinc-400 border-transparent hover:bg-zinc-50 hover:text-zinc-600'}`}><Heart className={`w-4 h-4 ${activeCategory === 'MY_PICK' ? 'fill-yellow-500 text-yellow-500' : ''}`} /><span>My Pick ({favorites.length})</span></button></div>
        </nav>
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 space-y-3"><button onClick={toggleAdminMode} className={`w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isAdmin ? 'bg-zinc-900 text-white shadow-md' : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100'}`}>{isAdmin ? <Unlock className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2" />}{isAdmin ? "ADMIN MODE" : "VIEWER MODE"}</button><div className="flex justify-between items-center px-1">{isAdmin ? (<button onClick={() => { fetchLogs(); setShowAdminDashboard(true); }} className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center font-bold"><Settings className="w-3 h-3 mr-1" /> Dashboard</button>) : <span className="text-[10px] text-zinc-400">{APP_VERSION}</span>}{isAdmin && <span className="text-[10px] text-zinc-300">{BUILD_DATE}</span>}</div></div>
      </aside>

      {/* Main Content */}
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
                      
                      {/* My Pick Tools */}
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
                                       <div><span className="font-bold text-xs text-zinc-400 uppercase">Colors</span> <span className="text-zinc-700">{product.bodyColors?.join(', ')} / {product.upholsteryColors?.join(', ')}</span></div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8 pb-20 print:grid-cols-3 print:gap-4">
                        {processedProducts.map((product, idx) => (<ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} isAdmin={isAdmin} showMoveControls={isAdmin && sortOption === 'manual'} onMove={(dir) => handleMoveProduct(idx, dir)} isFavorite={favorites.includes(product.id)} onToggleFavorite={(e) => toggleFavorite(e, product.id)} />))}
                        {isAdmin && activeCategory !== 'MY_PICK' && activeCategory !== 'NEW' && !SPACES.find(s => s.id === activeCategory) && (<button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px] text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-all group print:hidden"><div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Plus className="w-6 h-6" /></div><span className="text-xs md:text-sm font-bold">Add Product</span></button>)}
                     </div>
                  )}
                  
                  {processedProducts.length === 0 && (<div className="flex flex-col items-center justify-center py-32 text-zinc-300"><CloudOff className="w-16 h-16 mb-4 opacity-50" /><p className="text-sm font-medium">No products found for this space.</p>{isAdmin && SPACES.find(s => s.id === activeCategory) && (<button onClick={() => setManagingSpaceProductsId(activeCategory)} className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors">+ Select Products</button>)}</div>)}
                </>
              )}
            </>
          )}
          {showScrollTop && (<button onClick={scrollToTop} className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-10 h-10 md:w-12 md:h-12 bg-black/80 backdrop-blur-md text-white rounded-full shadow-lg flex items-center justify-center hover:bg-black hover:scale-110 transition-all z-40 animate-in fade-in slide-in-from-bottom-4 print:hidden"><ChevronsUp className="w-6 h-6" /></button>)}
        </div>
      </main>

      {/* Modals & Overlays */}
      {toast && <div className="fixed bottom-8 right-8 bg-zinc-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-bottom-10 fade-in z-[90] print:hidden">{toast.type === 'success' ? <Check className="w-5 h-5 text-green-400" /> : <Info className="w-5 h-5 text-red-400" />}<span className="text-sm font-bold tracking-wide">{toast.message}</span></div>}
      {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onEdit={() => { setEditingProduct(selectedProduct); setIsFormOpen(true); }} isAdmin={isAdmin} showToast={showToast} isFavorite={favorites.includes(selectedProduct.id)} onToggleFavorite={(e) => toggleFavorite(e, selectedProduct.id)} onNavigateSpace={(spaceId) => { setSelectedProduct(null); setActiveCategory(spaceId); }} />}
      {isFormOpen && <ProductFormModal categories={CATEGORIES.filter(c => !c.isSpecial)} initialCategory={activeCategory} existingData={editingProduct} onClose={() => { setIsFormOpen(false); setEditingProduct(null); }} onSave={handleSaveProduct} onDelete={handleDeleteProduct} isFirebaseAvailable={isFirebaseAvailable} />}
      
      {/* Space Modals (Missing Components Restored) */}
      {editingSpaceInfoId && (
        <SpaceInfoEditModal spaceId={editingSpaceInfoId} currentData={spaceContents[editingSpaceInfoId]} onClose={() => setEditingSpaceInfoId(null)} onSave={(data) => { handleSpaceInfoSave(editingSpaceInfoId, data); setEditingSpaceInfoId(null); }} />
      )}
      {managingSpaceProductsId && <SpaceProductManager spaceId={managingSpaceProductsId} products={products} onClose={() => setManagingSpaceProductsId(null)} onToggle={(pid, add) => handleSpaceProductToggle(managingSpaceProductsId, pid, add)} />}
      
      {/* Scene Modals */}
      {editingScene && (
        <SceneEditModal 
           initialData={editingScene} 
           allProducts={products}
           onClose={() => setEditingScene(null)} 
           onSave={(data) => { handleSceneSave(editingScene.spaceId, data); setEditingScene(null); }} 
           onDelete={(id) => { handleSceneDelete(editingScene.spaceId, id); setEditingScene(null); }} 
        />
      )}
      {selectedScene && (
        <SpaceSceneModal 
           scene={selectedScene} 
           products={products.filter(p => selectedScene.productIds && selectedScene.productIds.includes(p.id))} 
           allProducts={products}
           isAdmin={isAdmin} 
           onClose={() => setSelectedScene(null)} 
           onEdit={() => { setEditingScene({ ...selectedScene, isNew: false }); setSelectedScene(null); }} 
           onProductToggle={async (pid, add) => {
              const newPids = add ? [...(selectedScene.productIds||[]), pid] : (selectedScene.productIds||[]).filter(id=>id!==pid);
              const updatedScene = { ...selectedScene, productIds: newPids };
              setSelectedScene(updatedScene);
              await handleSceneSave(selectedScene.spaceId, updatedScene);
           }}
           onNavigateProduct={(p) => { setSelectedScene(null); setSelectedProduct(p); }}
        />
      )}
      {showAdminDashboard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-900 text-white">
              <h3 className="text-lg font-bold flex items-center"><ShieldAlert className="w-5 h-5 mr-2" /> Admin Console</h3>
              <button onClick={() => setShowAdminDashboard(false)}><X className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" /></button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-zinc-400"><Activity className="w-10 h-10 mb-2"/><p>Dashboard active.</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Components: Space & Dashboard & Product
// ----------------------------------------------------------------------

function SpaceDetailView({ space, spaceContent, isAdmin, onBannerUpload, onEditInfo, onManageProducts, onAddScene, onViewScene, productCount }) {
  const banner = spaceContent.banner;
  const description = spaceContent.description || "이 공간에 대한 설명이 없습니다.";
  const trend = spaceContent.trend || "";
  const scenes = spaceContent.scenes || [];
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
      <div className="mb-12 print:hidden">
        <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-extrabold text-zinc-900 flex items-center"><ImageIcon className="w-6 h-6 mr-2 text-indigo-500" /> Space Scenes</h3>{isAdmin && (<button onClick={onAddScene} className="flex items-center text-sm font-bold bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors shadow-lg"><Plus className="w-4 h-4 mr-2" /> Add Scene</button>)}</div>
        {scenes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenes.map((scene) => (
              <div key={scene.id} onClick={() => onViewScene(scene)} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 shadow-md hover:shadow-xl transition-all cursor-pointer">
                <img src={scene.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={scene.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                {/* Badge for Product Count */}
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

function SpaceSceneModal({ scene, products, allProducts, isAdmin, onClose, onEdit, onProductToggle, onNavigateProduct }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = scene.images ? [scene.image, ...scene.images] : [scene.image];
  const [isProductManagerOpen, setProductManagerOpen] = useState(false);
  const [productFilter, setProductFilter] = useState('');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-0 md:p-6 animate-in zoom-in-95 duration-200 print:hidden">
      <div className="bg-white w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
         <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/20 text-white hover:bg-black/50 rounded-full backdrop-blur"><X className="w-6 h-6"/></button>
         <div className="w-full md:w-2/3 bg-black relative flex flex-col justify-center h-[40vh] md:h-full">
            <img src={images[currentImageIndex]} className="w-full h-full object-contain" alt="Scene" />
            {images.length > 1 && (<div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 px-4">{images.map((_, idx) => (<button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === idx ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/80'}`} />))}</div>)}
         </div>
         <div className="w-full md:w-1/3 bg-white flex flex-col border-l border-zinc-100 h-[60vh] md:h-full relative">
            <div className="p-6 md:p-8 border-b border-zinc-50">
               <div className="flex justify-between items-start mb-4"><div><h2 className="text-2xl md:text-3xl font-black text-zinc-900 mb-2">{scene.title}</h2><p className="text-zinc-500 text-sm leading-relaxed">{scene.description}</p></div>{isAdmin && <button onClick={onEdit} className="p-2 text-zinc-400 hover:text-zinc-900"><Edit3 className="w-5 h-5"/></button>}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-zinc-50/50">
               <div className="flex justify-between items-center mb-4"><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tagged Products</h3>{isAdmin && <button onClick={() => setProductManagerOpen(!isProductManagerOpen)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">+ Add Tag</button>}</div>
               {isAdmin && isProductManagerOpen && (
                 <div className="mb-4 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm animate-in slide-in-from-top-2">
                    <input type="text" placeholder="Search to tag..." className="w-full text-xs p-2 bg-zinc-50 rounded-lg border border-zinc-200 mb-2 outline-none focus:border-indigo-500" value={productFilter} onChange={(e) => setProductFilter(e.target.value)} />
                    <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">{allProducts.filter(p => p.name.toLowerCase().includes(productFilter.toLowerCase())).map(p => { const isTagged = scene.productIds?.includes(p.id); return (<div key={p.id} onClick={() => onProductToggle(p.id, !isTagged)} className={`flex items-center p-1.5 rounded cursor-pointer ${isTagged ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-zinc-50'}`}><div className={`w-3 h-3 border rounded mr-2 flex items-center justify-center ${isTagged ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-300'}`}>{isTagged && <Check className="w-2 h-2 text-white"/>}</div><span className="text-xs truncate">{p.name}</span></div>) })}</div>
                 </div>
               )}
               <div className="space-y-3">{products.length > 0 ? products.map(product => (<div key={product.id} onClick={() => onNavigateProduct(product)} className="flex items-center p-3 bg-white rounded-xl border border-zinc-100 shadow-sm hover:border-zinc-300 transition-all cursor-pointer group"><div className="w-12 h-12 bg-zinc-50 rounded-lg flex-shrink-0 flex items-center justify-center mr-3 overflow-hidden">{product.images?.[0] ? <img src={product.images[0]} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-zinc-300"/>}</div><div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-zinc-900 truncate group-hover:text-blue-600">{product.name}</h4><p className="text-xs text-zinc-500">{product.category}</p></div><ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600"/></div>)) : (<div className="text-center py-8 text-zinc-400 text-xs">연관된 제품이 없습니다.</div>)}</div>
            </div>
         </div>
      </div>
    </div>
  );
}

function SceneEditModal({ initialData, allProducts, onClose, onSave, onDelete }) {
  const [data, setData] = useState({ id: null, title: '', description: '', image: null, images: [], productIds: [] });
  const [filter, setFilter] = useState('');
  const mainInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  
  useEffect(() => {
    if(initialData && !initialData.isNew) {
      setData({ 
        id: initialData.id, title: initialData.title || '', description: initialData.description || '', image: initialData.image || null, images: initialData.images || [], productIds: initialData.productIds || [] 
      });
    }
  }, [initialData]);

  const processImage = (file) => { return new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const MAX_WIDTH = 1200; let width = img.width; let height = img.height; if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.8)); }; img.src = e.target.result; }; reader.readAsDataURL(file); }); };
  const handleMainImage = async (e) => { const file = e.target.files[0]; if (file) { const imageUrl = await processImage(file); setData(prev => ({ ...prev, image: imageUrl })); } };
  const handleGalleryUpload = async (e) => { const files = Array.from(e.target.files); if(files.length > 0) { const newUrls = []; for(const file of files) { try { newUrls.push(await processImage(file)); } catch(e) {} } setData(prev => ({ ...prev, images: [...prev.images, ...newUrls] })); } };
  const toggleProduct = (pid) => { setData(prev => { const ids = prev.productIds || []; return ids.includes(pid) ? { ...prev, productIds: ids.filter(id => id !== pid) } : { ...prev, productIds: [...ids, pid] }; }); };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
         <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-white z-10">
            <h3 className="text-lg font-bold text-zinc-900">{initialData.isNew ? 'New Scene' : 'Edit Scene'}</h3>
            <button onClick={onClose}><X className="w-5 h-5 text-zinc-400"/></button>
         </div>
         <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-zinc-50">
            <div className="space-y-4">
              <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Main Image</label><div onClick={() => mainInputRef.current.click()} className="w-full h-48 bg-white rounded-xl flex items-center justify-center cursor-pointer border border-dashed border-zinc-300 overflow-hidden relative hover:border-zinc-400 transition-colors shadow-sm">{data.image ? <img src={data.image} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-zinc-400"><ImagePlus className="w-8 h-8 mb-2"/><span className="text-xs">Upload Main</span></div>}</div><input type="file" ref={mainInputRef} className="hidden" accept="image/*" onChange={handleMainImage} /></div>
              <div>
                 <div className="flex justify-between items-center mb-2"><label className="block text-xs font-bold text-zinc-500 uppercase">Additional Images</label><button type="button" onClick={() => galleryInputRef.current.click()} className="text-[10px] bg-white border px-2 py-1 rounded hover:bg-zinc-100">+ Add</button><input type="file" ref={galleryInputRef} multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} /></div>
                 {data.images.length > 0 && <div className="grid grid-cols-5 gap-2">{data.images.map((img, i) => (<div key={i} className="relative aspect-square rounded-lg overflow-hidden group border border-zinc-200"><img src={img} className="w-full h-full object-cover" /><button onClick={() => setData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button></div>))}</div>}
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
         <div className="px-6 py-4 border-t border-zinc-100 bg-white flex justify-between items-center z-10">
            {!initialData.isNew ? <button onClick={()=>onDelete(data.id)} className="text-red-500 text-xs font-bold flex items-center hover:bg-red-50 px-2 py-1 rounded"><Trash2 className="w-3.5 h-3.5 mr-1"/> Delete Scene</button> : <div></div>}
            <div className="flex space-x-3"><button onClick={onClose} className="px-4 py-2 border border-zinc-300 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50">Cancel</button><button onClick={()=>onSave(data)} className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-black shadow-md">Save Scene</button></div>
         </div>
      </div>
    </div>
  );
}

function SpaceInfoEditModal({ spaceId, currentData = {}, onClose, onSave }) {
  const [data, setData] = useState({ description: '', trend: '' });
  useEffect(() => { setData({ description: currentData.description || '', trend: currentData.trend || '' }); }, [currentData]);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center"><h3 className="text-lg font-bold text-zinc-900">Edit Space Info</h3><button onClick={onClose}><X className="w-5 h-5 text-zinc-400" /></button></div>
        <div className="p-6 space-y-4"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Description</label><textarea className="w-full border border-zinc-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" rows={4} value={data.description} onChange={(e) => setData({...data, description: e.target.value})} /></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Design Trend Keywords</label><input type="text" className="w-full border border-zinc-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={data.trend} onChange={(e) => setData({...data, trend: e.target.value})} placeholder="e.g. Minimalist, Eco-friendly, Open Plan" /></div></div>
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end"><button onClick={() => onSave(data)} className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-black shadow-lg">Save Changes</button></div>
      </div>
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
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3 custom-scrollbar">{products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())).map(product => { const isAdded = product.spaces && product.spaces.includes(spaceId); return (<div key={product.id} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${isAdded ? 'border-indigo-500 bg-indigo-50' : 'border-zinc-200 hover:border-zinc-300'}`} onClick={() => onToggle(product.id, !isAdded)}><div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${isAdded ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-zinc-300'}`}>{isAdded && <Check className="w-3.5 h-3.5 text-white" />}</div>{product.images?.[0] && <img src={product.images[0]} className="w-10 h-10 rounded-lg object-cover mr-3" />}<div><div className="text-sm font-bold text-zinc-900">{product.name}</div><div className="text-xs text-zinc-500">{product.category}</div></div></div>); })}</div>
      </div>
    </div>
  );
}

function DashboardView({ products, favorites, setActiveCategory, setSelectedProduct, isAdmin, bannerData, onBannerUpload, onBannerTextChange, onSaveBannerText }) {
  const totalCount = products.length; const newCount = products.filter(p => p.isNew).length; const pickCount = favorites.length;
  const categoryCounts = []; let totalStandardProducts = 0;
  CATEGORIES.filter(c => !c.isSpecial).forEach(c => { const count = products.filter(p => p.category === c.id).length; if (count > 0) { categoryCounts.push({ ...c, count }); totalStandardProducts += count; } });
  let currentAngle = 0; const gradientParts = categoryCounts.map(item => { const start = currentAngle; const percentage = (item.count / totalStandardProducts) * 100; currentAngle += percentage; return `${item.color} ${start}% ${currentAngle}%`; });
  const chartStyle = { background: totalStandardProducts > 0 ? `conic-gradient(${gradientParts.join(', ')})` : '#f4f4f5' };
  const recentUpdates = [...products].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 5);
  const fileInputRef = useRef(null);

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 print:hidden">
      <div className="relative w-full h-48 md:h-72 rounded-3xl overflow-hidden shadow-lg border border-zinc-200 group bg-zinc-900">
         <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10"></div>
         {bannerData.url ? <img src={bannerData.url} alt="Dashboard Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><img src="/api/placeholder/1200/400" className="w-full h-full object-cover grayscale" alt="Pattern" /></div>}
         <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-20 max-w-2xl">
            {isAdmin ? (
              <div className="space-y-2">
                <input type="text" value={bannerData.title} onChange={(e) => onBannerTextChange('title', e.target.value)} onBlur={onSaveBannerText} className="bg-transparent text-3xl md:text-5xl font-black text-white tracking-tighter w-full outline-none placeholder-zinc-500 border-b border-transparent hover:border-zinc-500 transition-colors" />
                <input type="text" value={bannerData.subtitle} onChange={(e) => onBannerTextChange('subtitle', e.target.value)} onBlur={onSaveBannerText} className="bg-transparent text-zinc-300 font-medium text-sm md:text-lg w-full outline-none placeholder-zinc-500 border-b border-transparent hover:border-zinc-500 transition-colors" />
              </div>
            ) : (
              <>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2">{bannerData.title}</h2>
                <p className="text-zinc-300 font-medium text-sm md:text-lg">{bannerData.subtitle}</p>
              </>
            )}
         </div>
         {isAdmin && (<><button onClick={() => fileInputRef.current.click()} className="absolute top-4 right-4 z-30 p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100" title="Change Banner Image"><Camera className="w-5 h-5" /></button><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onBannerUpload} /></>)}
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <div onClick={() => setActiveCategory('ALL')} className="bg-white p-4 rounded-xl md:rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md cursor-pointer group flex items-center justify-between transition-all">
          <div className="flex items-center space-x-3 md:space-x-4">
             <div className="p-2.5 bg-zinc-100 rounded-lg group-hover:bg-zinc-900 group-hover:text-white transition-colors text-zinc-500"><LayoutGrid className="w-5 h-5 md:w-6 md:h-6" /></div>
             <span className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-wide">Total</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-zinc-900">{totalCount}</h3>
        </div>
        <div onClick={() => setActiveCategory('NEW')} className="bg-white p-4 rounded-xl md:rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md cursor-pointer group flex items-center justify-between transition-all">
          <div className="flex items-center space-x-3 md:space-x-4">
             <div className="p-2.5 bg-red-50 rounded-lg text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors"><Zap className="w-5 h-5 md:w-6 md:h-6" /></div>
             <span className="text-xs md:text-sm font-bold text-red-400 uppercase tracking-wide">New</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-zinc-900">{newCount}</h3>
        </div>
        <div onClick={() => setActiveCategory('MY_PICK')} className="bg-white p-4 rounded-xl md:rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md cursor-pointer group flex items-center justify-between transition-all">
          <div className="flex items-center space-x-3 md:space-x-4">
             <div className="p-2.5 bg-yellow-50 rounded-lg text-yellow-500 group-hover:bg-yellow-400 group-hover:text-white transition-colors"><Heart className="w-5 h-5 md:w-6 md:h-6 fill-current" /></div>
             <span className="text-xs md:text-sm font-bold text-yellow-500 uppercase tracking-wide">Pick</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-zinc-900">{pickCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-center min-h-[auto] md:min-h-[360px]"><h3 className="text-base md:text-lg font-bold text-zinc-900 mb-6 flex items-center"><PieChart className="w-5 h-5 mr-2 text-zinc-400" /> Category Distribution</h3>{totalStandardProducts > 0 ? (<div className="flex flex-col sm:flex-row items-center justify-around gap-6 md:gap-8"><div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full shadow-inner flex-shrink-0 aspect-square" style={chartStyle}><div className="absolute inset-0 m-auto w-16 h-16 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center flex-col shadow-sm"><span className="text-[8px] md:text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Total</span><span className="text-lg md:text-2xl font-extrabold text-zinc-800">{totalStandardProducts}</span></div></div><div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full sm:w-auto">{categoryCounts.map(item => (<div key={item.id} className="flex items-center text-[10px] md:text-xs group cursor-default"><div className="w-2.5 h-2.5 rounded-full mr-2.5 ring-2 ring-transparent group-hover:ring-zinc-100 transition-all flex-shrink-0" style={{ backgroundColor: item.color }}></div><span className="font-bold text-zinc-600 mr-2 flex-1">{item.label}</span><span className="text-zinc-400 font-bold tabular-nums">{Math.round((item.count/totalStandardProducts)*100)}%</span></div>))}</div></div>) : <div className="text-center text-zinc-300 text-sm">No data available</div>}</div>
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-zinc-100 shadow-sm flex flex-col min-h-[auto] md:min-h-[360px]"><h3 className="text-base md:text-lg font-bold text-zinc-900 mb-6 flex items-center"><Clock className="w-5 h-5 mr-2 text-zinc-400" /> Recent Updates</h3><div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">{recentUpdates.length > 0 ? recentUpdates.map(product => (<div key={product.id} onClick={() => setSelectedProduct(product)} className="flex items-center p-3 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer transition-all group"><div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-100 rounded-lg flex-shrink-0 flex items-center justify-center mr-3 md:mr-4 overflow-hidden border border-zinc-200">{product.images?.[0] ? <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" /> : <ImageIcon className="w-5 h-5 text-zinc-300"/>}</div><div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-zinc-800 truncate group-hover:text-blue-600 transition-colors">{product.name}</h4><p className="text-[10px] md:text-[11px] text-zinc-400 mt-0.5 truncate">{new Date(product.updatedAt || product.createdAt).toLocaleDateString()} · {product.category}</p></div><ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-1 transition-all" /></div>)) : <div className="text-center text-zinc-300 text-sm py-10">No updates yet.</div>}</div></div>
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
        <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-col gap-1 z-10 items-start">
           {product.isNew && <span className="bg-black text-white text-[8px] md:text-[9px] font-extrabold px-1.5 py-0.5 md:px-2 md:py-1 rounded shadow-sm tracking-wide">NEW</span>}
           {awardBadge && <span className="bg-yellow-400 text-yellow-900 text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded shadow-sm flex items-center"><Trophy className="w-2 h-2 md:w-2.5 md:h-2.5 mr-1" /> {awardBadge}</span>}
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
        {/* Related Spaces Badges in Card */}
        {product.spaces && product.spaces.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 print:opacity-100">
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
                {product.bodyColors?.slice(0, 4).map((c, i) => <div key={i} className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full border border-white shadow-sm ring-1 ring-zinc-100" style={{ backgroundColor: c }} />)}
             </div>
             {product.upholsteryColors?.length > 0 && <span className="text-zinc-200 text-[10px] mx-0.5">|</span>}
             <div className="flex -space-x-1">
                {product.upholsteryColors?.slice(0, 4).map((c, i) => <div key={i} className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-sm border border-white shadow-sm ring-1 ring-zinc-100" style={{ backgroundColor: c }} />)}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailModal({ product, onClose, onEdit, isAdmin, showToast, isFavorite, onToggleFavorite, onNavigateSpace }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const canvasRef = useRef(null);
  if (!product) return null;
  const images = product.images || [];
  const currentImage = images.length > 0 ? images[currentImageIndex] : null;
  const contentImages = product.contentImages || [];
  const relatedSpaces = SPACES.filter(s => product.spaces && product.spaces.includes(s.id));

  const copyToClipboard = () => { navigator.clipboard.writeText(`[${product.name}]\n${product.specs}`); showToast("Copied to clipboard"); };
  
  const handleShareImage = () => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d');
    const w = 1080;
    // Calculate estimated height
    const baseHeight = 1350;
    const specLines = product.specs.split('\n').length;
    const featureCount = (product.features?.length || 0) + (product.options?.length || 0);
    const estimatedExtraHeight = (specLines * 40) + (featureCount * 50);
    const h = baseHeight + Math.max(0, estimatedExtraHeight - 400); // Dynamic height
    
    canvas.width = w; canvas.height = h; const img = new Image(); img.crossOrigin = "Anonymous";
    img.onload = () => {
      // Background
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#18181b'; ctx.fillRect(0, 0, w, 140);
      
      // Header
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'left'; ctx.fillText("PATRA DESIGN LAB", 60, 85);
      
      // Main Image
      const ratio = Math.min((w - 120) / img.width, 600 / img.height);
      const imgW = img.width * ratio; const imgH = img.height * ratio;
      ctx.drawImage(img, (w - imgW) / 2, 200, imgW, imgH);
      
      let cursorY = 200 + imgH + 80;

      // Title & Category
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
      } else {
         cursorY += 40;
      }

      // Specs Box
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f4f4f5'; ctx.fillRect(60, cursorY, w - 120, h - cursorY - 60);
      
      cursorY += 60;
      ctx.fillStyle = '#3f3f46'; ctx.font = 'bold 30px sans-serif';
      ctx.fillText("SPECIFICATIONS", 100, cursorY);
      cursorY += 50;
      
      ctx.font = '26px sans-serif'; ctx.fillStyle = '#52525b';
      const specText = product.specs.split('\n');
      specText.forEach(line => {
         ctx.fillText(line, 100, cursorY);
         cursorY += 40;
      });
      
      cursorY += 40;

      // Features if any
      if (product.features?.length > 0 || product.options?.length > 0) {
         ctx.fillStyle = '#3f3f46'; ctx.font = 'bold 30px sans-serif';
         ctx.fillText("FEATURES & OPTIONS", 100, cursorY);
         cursorY += 50;
         
         ctx.font = '26px sans-serif'; ctx.fillStyle = '#52525b';
         const allFeatures = [...(product.options||[]), ...(product.features||[])];
         allFeatures.forEach(f => {
             ctx.fillText(`• ${f}`, 100, cursorY);
             cursorY += 40;
         });
      }

      const dataUrl = canvas.toDataURL('image/png'); const a = document.createElement('a'); a.href = dataUrl; a.download = `${product.name}-card.png`; a.click(); showToast("이미지가 저장되었습니다.");
    };
    if(currentImage) img.src = currentImage; else showToast("이미지가 없어 생성할 수 없습니다.", "error");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200 print:hidden">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {isZoomed && currentImage && (<div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-8 cursor-zoom-out" onClick={() => setIsZoomed(false)}><img src={currentImage} className="max-w-full max-h-full object-contain" alt="Zoomed" /><button className="absolute top-6 right-6 text-white/50 hover:text-white"><X className="w-10 h-10" /></button></div>)}
      <div className="bg-white w-full h-full md:h-[90vh] md:w-full md:max-w-6xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
        <button onClick={onClose} className="hidden md:flex absolute top-5 right-5 p-2 bg-white/50 hover:bg-zinc-100 rounded-full z-[60] transition-colors backdrop-blur"><X className="w-6 h-6 text-zinc-900" /></button>
        
        {/* Mobile Sticky Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-100 bg-white sticky top-0 z-50">
           <button onClick={onClose} className="p-2 -ml-2"><ArrowLeft className="w-6 h-6"/></button>
           <span className="font-bold text-sm truncate max-w-[200px]">{product.name}</span>
           <div className="flex gap-2">
              <button onClick={onToggleFavorite}><Star className={`w-6 h-6 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`}/></button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row h-full pb-20 md:pb-0">
          <div className="w-full md:w-1/2 bg-zinc-50 p-6 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-zinc-100 md:sticky md:top-0">
            <div className="flex-1 w-full bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 overflow-hidden p-8 mb-4 relative group min-h-[300px]">
               {currentImage ? (<><img src={currentImage} alt="Main" className="w-full h-full object-contain cursor-zoom-in mix-blend-multiply" onClick={() => setIsZoomed(true)} /><div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"><div className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-bold flex items-center"><Maximize2 className="w-4 h-4 mr-2"/> ZOOM</div></div></>) : <ImageIcon className="w-20 h-20 opacity-20 text-zinc-400" />}
               <button onClick={onToggleFavorite} className="absolute top-4 left-4 p-3 bg-white rounded-full shadow-sm border border-zinc-100 hover:border-zinc-300 transition-all hidden md:flex"><Star className={`w-5 h-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`} /></button>
            </div>
            {images.length > 0 && (<div className="flex space-x-2 md:space-x-3 overflow-x-auto custom-scrollbar pb-1 px-1">{images.map((img, idx) => (<button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`flex-shrink-0 w-10 h-10 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-zinc-900 ring-2 ring-zinc-200' : 'border-transparent opacity-60 hover:opacity-100 bg-white'}`}><img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" /></button>))}</div>)}
          </div>
          <div className="w-full md:w-1/2 p-6 md:p-12 bg-white pb-32 md:pb-12">
            <div className="mb-6 md:mb-10">
              <div className="flex flex-wrap gap-2 mb-2"><span className="inline-block px-2.5 py-0.5 bg-zinc-900 text-white text-[10px] font-extrabold rounded uppercase tracking-widest">{product.category}</span>{product.awards?.map(award => (<span key={award} className="inline-flex items-center px-2.5 py-0.5 bg-yellow-400/20 text-yellow-700 border border-yellow-400/30 text-[10px] font-bold rounded uppercase tracking-wide"><Trophy className="w-3 h-3 mr-1" /> {award}</span>))}</div>
              <h2 className="text-3xl md:text-5xl font-black text-zinc-900 mb-1 tracking-tight">{product.name}</h2>
              {product.designer && <p className="text-sm text-zinc-500 font-medium">Designed by <span className="text-zinc-900">{product.designer}</span></p>}
            </div>
            <div className="space-y-6 md:space-y-10">
              <div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between">Specifications <button onClick={copyToClipboard} className="text-zinc-400 hover:text-zinc-900"><Copy className="w-4 h-4" /></button></h3><p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 md:p-6 rounded-2xl border border-zinc-100 whitespace-pre-wrap">{product.specs}</p></div>
              {(product.features?.length > 0 || product.options?.length > 0) && (<div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Features & Options</h3><div className="flex flex-wrap gap-2">{product.options?.map((opt, idx) => (<span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold">{opt}</span>))}{product.features?.map((ft, idx) => (<span key={idx} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium flex items-center"><Check className="w-3 h-3 mr-1.5" /> {ft}</span>))}</div></div>)}
              <div className="grid grid-cols-2 gap-4 md:gap-8">
                 <div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Body Color</h3><div className="flex flex-wrap gap-2">{product.bodyColors?.map((c, i) => (<div key={i} className="group relative"><div className="w-6 h-6 rounded-full border border-zinc-200 shadow-sm cursor-help" style={{ backgroundColor: c }} /><span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">{c}</span></div>))}</div></div>
                 <div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Upholstery</h3><div className="flex flex-wrap gap-2">{product.upholsteryColors?.map((c, i) => (<div key={i} className="group relative"><div className="w-6 h-6 rounded-md border border-zinc-200 shadow-sm cursor-help" style={{ backgroundColor: c }} /><span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">{c}</span></div>))}</div></div>
              </div>
              {(product.productLink || product.attachments?.length > 0) && (<div className="pt-6 border-t border-zinc-100 flex flex-col gap-3">{product.productLink && <a href={product.productLink} target="_blank" rel="noreferrer" className="flex items-center text-sm font-bold text-zinc-900 hover:text-blue-600 transition-colors"><LinkIcon className="w-4 h-4 mr-2" /> Visit Product Website</a>}{product.attachments?.map((file, idx) => (<a key={idx} href={file.url} target="_blank" rel="noreferrer" className="flex items-center p-3 bg-zinc-50 border border-zinc-100 rounded-xl hover:border-zinc-300 hover:bg-white transition-all group"><div className="p-2 bg-white rounded-lg shadow-sm mr-3 group-hover:text-blue-500"><Paperclip className="w-4 h-4" /></div><span className="text-sm font-medium text-zinc-600 group-hover:text-zinc-900">{file.name}</span></a>))}</div>)}
              
              {/* Related Spaces Section */}
              {relatedSpaces.length > 0 && (
                <div className="pt-8 border-t border-zinc-100">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Related Spaces</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {relatedSpaces.map(space => (
                      <button key={space.id} onClick={() => onNavigateSpace(space.id)} className="flex items-center p-3 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-all text-left border border-transparent hover:border-zinc-200 group">
                         <div className="p-2 bg-white rounded-lg shadow-sm mr-3 text-zinc-400 group-hover:text-black transition-colors"><space.icon className="w-4 h-4" /></div>
                         <span className="text-sm font-bold text-zinc-700">{space.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {contentImages.length > 0 && (<div className="pt-8 border-t border-zinc-100 space-y-4"><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Detail View</h3><div className="flex flex-col gap-4">{contentImages.map((img, idx) => (<img key={idx} src={img} alt={`Detail ${idx+1}`} className="w-full h-auto rounded-xl border border-zinc-100" />))}</div></div>)}
            </div>
            
            {/* Desktop Bottom Action Bar */}
            <div className="hidden md:flex mt-12 pt-6 border-t border-zinc-100 justify-between items-center">
              <div className="flex gap-3">
                 <button onClick={handleShareImage} className="flex items-center px-5 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors"><ImgIcon className="w-4 h-4 mr-2" /> Share Image</button>
                 <button onClick={() => window.print()} className="flex items-center px-5 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors"><Printer className="w-4 h-4 mr-2" /> Print PDF</button>
              </div>
              {isAdmin && (<button onClick={onEdit} className="flex items-center px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-black hover:shadow-lg transition-all"><Edit2 className="w-4 h-4 mr-2" /> Edit</button>)}
            </div>
          </div>
        </div>
        
        {/* Mobile Sticky Bottom Bar */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-zinc-100 p-4 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
           <div className="flex gap-2">
             <button onClick={handleShareImage} className="p-3 bg-zinc-100 rounded-xl"><ImgIcon className="w-5 h-5 text-zinc-600"/></button>
             <button onClick={() => window.print()} className="p-3 bg-zinc-100 rounded-xl"><Printer className="w-5 h-5 text-zinc-600"/></button>
           </div>
           {isAdmin && <button onClick={onEdit} className="flex items-center px-6 py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold">Edit Product</button>}
        </div>
      </div>
    </div>
  );
}

function ProductFormModal({ categories, existingData, onClose, onSave, onDelete, isFirebaseAvailable, initialCategory }) {
  const isEditMode = !!existingData;
  const fileInputRef = useRef(null);
  const contentInputRef = useRef(null);
  const defaultCategory = (initialCategory && !['ALL','NEW','MY_PICK','DASHBOARD'].includes(initialCategory) && !SPACES.find(s=>s.id===initialCategory)) ? initialCategory : 'EXECUTIVE';
  const [formData, setFormData] = useState({ 
    id: null, name: '', category: defaultCategory, specs: '', designer: '',
    featuresString: '', optionsString: '', materialsString: '',
    bodyColorsString: '', upholsteryColorsString: '', awardsString: '',
    productLink: '', isNew: false, launchDate: new Date().toISOString().split('T')[0],
    images: [], attachments: [], contentImages: [], spaces: []
  });
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (existingData) {
      setFormData({ 
        id: existingData.id, name: existingData.name, category: existingData.category, specs: existingData.specs, designer: existingData.designer || '',
        featuresString: existingData.features?.join(', ') || '', optionsString: existingData.options?.join(', ') || '', materialsString: existingData.materials?.join(', ') || '',
        bodyColorsString: existingData.bodyColors?.join(', ') || '', upholsteryColorsString: existingData.upholsteryColors?.join(', ') || '', awardsString: existingData.awards?.join(', ') || '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      ...formData,
      features: formData.featuresString.split(',').map(s=>s.trim()).filter(Boolean),
      options: formData.optionsString.split(',').map(s=>s.trim()).filter(Boolean),
      materials: formData.materialsString.split(',').map(s=>s.trim()).filter(Boolean),
      bodyColors: formData.bodyColorsString.split(',').map(s=>s.trim()).filter(Boolean),
      upholsteryColors: formData.upholsteryColorsString.split(',').map(s=>s.trim()).filter(Boolean),
      awards: formData.awardsString.split(',').map(s=>s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-4 duration-200">
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
          <div className="grid grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Launch Date</label><input type="date" className="w-full border p-2 rounded-lg" value={formData.launchDate} onChange={e=>setFormData({...formData, launchDate: e.target.value})}/></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Designer</label><input className="w-full border p-2 rounded-lg" value={formData.designer} onChange={e=>setFormData({...formData, designer: e.target.value})}/></div></div>
          <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Specs</label><textarea required rows={2} className="w-full border p-2 rounded-lg" value={formData.specs} onChange={e=>setFormData({...formData, specs: e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Options (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.optionsString} onChange={e=>setFormData({...formData, optionsString: e.target.value})}/></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Features (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.featuresString} onChange={e=>setFormData({...formData, featuresString: e.target.value})}/></div></div>
          <div className="grid grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Materials (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.materialsString} onChange={e=>setFormData({...formData, materialsString: e.target.value})}/></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Awards (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.awardsString} onChange={e=>setFormData({...formData, awardsString: e.target.value})}/></div></div>
          <div className="grid grid-cols-2 gap-6 bg-zinc-50 p-4 rounded-xl border border-zinc-100"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Body Colors</label><input className="w-full border p-2 rounded-lg" placeholder="Black, #fff..." value={formData.bodyColorsString} onChange={e=>setFormData({...formData, bodyColorsString: e.target.value})}/></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Upholstery Colors</label><input className="w-full border p-2 rounded-lg" placeholder="Red, Blue..." value={formData.upholsteryColorsString} onChange={e=>setFormData({...formData, upholsteryColorsString: e.target.value})}/></div></div>
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