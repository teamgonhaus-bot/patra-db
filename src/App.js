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
  Edit3, Grid, MoreVertical, MousePointer2, CheckSquare, XCircle, Printer, LayoutList,
  ExternalLink
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
  // 예시: apiKey: "AIzaSy...",
};

// ----------------------------------------------------------------------
// 상수 및 설정
// ----------------------------------------------------------------------
const APP_VERSION = "v0.5.6-Full"; // Complete Integrated Version
const BUILD_DATE = "2024.06.19";
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list' (My Pick)
  
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
  
  const [bannerData, setBannerData] = useState({ url: null, title: 'Design Lab DB', subtitle: 'Integrated Product Database & Archives' });
  const [spaceContents, setSpaceContents] = useState({}); 

  // Modal States
  const [editingSpaceInfoId, setEditingSpaceInfoId] = useState(null);
  const [managingSpaceProductsId, setManagingSpaceProductsId] = useState(null);
  const [editingScene, setEditingScene] = useState(null);
  const [selectedScene, setSelectedScene] = useState(null);

  const mainContentRef = useRef(null);

  // Inject Print Styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page { size: A4; margin: 10mm; }
        body * { visibility: hidden; }
        .print-area, .print-area * { visibility: visible; }
        .print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; color: black; }
        .no-print { display: none !important; }
        .print-break-inside-avoid { break-inside: avoid; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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

  // URL Query Sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('id');
    const sharedSpace = params.get('space');
    
    if (sharedId && products.length > 0) {
      const found = products.find(p => String(p.id) === sharedId);
      if (found) {
        setSelectedProduct(found);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    
    if (sharedSpace && SPACES.find(s => s.id === sharedSpace)) {
       setActiveCategory(sharedSpace);
       window.history.replaceState({}, document.title, window.location.pathname);
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
      const unsubBanner = onSnapshot(bannerDocRef, (doc) => { if (doc.exists()) setBannerData(prev => ({ ...prev, ...doc.data() })); });
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
      if (doc.exists()) setSpaceContents(prev => ({ ...prev, [activeCategory]: doc.data() }));
      else setSpaceContents(prev => ({ ...prev, [activeCategory]: { scenes: [] } }));
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

  // Image & Data Handlers
  const processImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
           const canvas = document.createElement('canvas'); const MAX_WIDTH = 1200; let width = img.width; let height = img.height;
           if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } canvas.width = width; canvas.height = height;
           const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBannerUpload = async (e) => { if (!isAdmin) return; const file = e.target.files[0]; if (!file) return; try { const resizedImage = await processImage(file); const newData = { ...bannerData, url: resizedImage }; if (isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'banner'), newData, { merge: true }); else { localStorage.setItem('patra_banner_data', JSON.stringify(newData)); setBannerData(newData); } showToast("메인 배너가 업데이트되었습니다."); } catch (error) { showToast("이미지 처리 실패", "error"); } };
  const handleBannerTextChange = (key, value) => { if (!isAdmin) return; setBannerData(prev => ({ ...prev, [key]: value })); };
  const saveBannerText = async () => { if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'banner'), bannerData, { merge: true }); showToast("배너 문구가 저장되었습니다."); } };
  const handleSpaceBannerUpload = async (e, spaceId) => { if (!isAdmin) return; const file = e.target.files[0]; if (!file) return; try { const resizedImage = await processImage(file); const currentContent = spaceContents[spaceId] || {}; const newContent = { ...currentContent, banner: resizedImage }; if (isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), newContent, { merge: true }); showToast("공간 배너가 업데이트되었습니다."); } catch (error) { showToast("이미지 처리 실패", "error"); } };
  const handleSpaceInfoSave = async (spaceId, info) => { const currentContent = spaceContents[spaceId] || {}; const newContent = { ...currentContent, ...info }; if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), newContent, { merge: true }); } showToast("공간 정보가 저장되었습니다."); };
  
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

  const handleSceneDelete = async (spaceId, sceneId) => { if(!window.confirm("이 장면을 삭제하시겠습니까?")) return; const currentContent = spaceContents[spaceId] || { scenes: [] }; const newScenes = (currentContent.scenes || []).filter(s => s.id !== sceneId); if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), { scenes: newScenes }, { merge: true }); } showToast("장면이 삭제되었습니다."); };
  const handleSpaceProductToggle = async (spaceId, productId, isAdded) => { const product = products.find(p => p.id === productId); if(!product) return; let newSpaces = product.spaces || []; if(isAdded) { if(!newSpaces.includes(spaceId)) newSpaces.push(spaceId); } else { newSpaces = newSpaces.filter(s => s !== spaceId); } if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', product.id), { spaces: newSpaces }, { merge: true }); } else { const idx = products.findIndex(p => p.id === productId); const newProds = [...products]; newProds[idx] = { ...product, spaces: newSpaces }; saveToLocalStorage(newProds); } };
  const logActivity = async (action, productName, details = "") => { if (!isFirebaseAvailable || !db) return; try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), { action, productName, details, timestamp: Date.now(), adminId: 'admin' }); } catch (e) { console.error(e); } };
  const fetchLogs = async () => { if (!isFirebaseAvailable || !db) return; const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), orderBy('timestamp', 'desc'), limit(100)); onSnapshot(q, (snapshot) => { setActivityLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); }); };
  const handleSaveProduct = async (productData) => { const docId = productData.id ? String(productData.id) : String(Date.now()); const isEdit = !!productData.id && products.some(p => String(p.id) === docId); const payload = { ...productData, id: docId, updatedAt: Date.now(), createdAt: isEdit ? (products.find(p => String(p.id) === docId)?.createdAt || Date.now()) : Date.now(), orderIndex: isEdit ? (products.find(p => String(p.id) === docId)?.orderIndex || Date.now()) : Date.now() }; if (isFirebaseAvailable && db) { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', docId), payload, { merge: true }); await logActivity(isEdit ? "UPDATE" : "CREATE", productData.name, isEdit ? "정보 수정" : "신규 등록"); } catch (error) { showToast("저장 실패", "error"); return; } } else { const idx = products.findIndex(p => String(p.id) === docId); let newProducts = [...products]; if (idx >= 0) newProducts[idx] = payload; else newProducts = [payload, ...products]; saveToLocalStorage(newProducts); } if (selectedProduct && String(selectedProduct.id) === docId) setSelectedProduct(payload); setIsFormOpen(false); setEditingProduct(null); showToast(isEdit ? "수정 완료" : "등록 완료"); };
  const handleDeleteProduct = async (productId, productName) => { if (!window.confirm('정말 삭제하시겠습니까?')) return; if (isFirebaseAvailable && db) { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', String(productId))); await logActivity("DELETE", productName, "삭제됨"); } catch (error) { showToast("삭제 실패", "error"); return; } } else { const newProducts = products.filter(p => String(p.id) !== String(productId)); saveToLocalStorage(newProducts); } setSelectedProduct(null); setIsFormOpen(false); showToast("삭제되었습니다."); };

  // Filter & Sort
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

  // My Pick Export Handler (Canvas)
  const handleExportMyPicks = async () => {
    if (processedProducts.length === 0) return;
    showToast("마이픽 리스트 이미지를 생성중입니다...");
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const cardWidth = 400;
    const cardHeight = 600;
    const gap = 40;
    const cols = 2; // Fixed cols for export
    const rows = Math.ceil(processedProducts.length / cols);
    const headerHeight = 250;
    const w = cols * cardWidth + (cols + 1) * gap;
    const h = rows * cardHeight + (rows + 1) * gap + headerHeight;

    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Header
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, w, headerHeight - gap/2);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px sans-serif';
    ctx.fillText("MY PICK", gap, 120);
    ctx.font = '40px sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(`${new Date().toLocaleDateString()} · ${processedProducts.length} Selections`, gap, 190);

    const drawItem = async (product, idx) => {
       const col = idx % cols;
       const row = Math.floor(idx / cols);
       const x = gap + col * (cardWidth + gap);
       const y = headerHeight + row * (cardHeight + gap);

       // Card Box
       ctx.fillStyle = '#ffffff';
       ctx.fillRect(x, y, cardWidth, cardHeight);

       // Image
       if (product.images?.[0]) {
         const img = new Image();
         img.crossOrigin = "Anonymous";
         img.src = product.images[0];
         await new Promise(r => img.onload = r);
         
         const imgH = 300;
         const ratio = Math.min(cardWidth / img.width, imgH / img.height);
         const dw = img.width * ratio;
         const dh = img.height * ratio;
         const dx = x + (cardWidth - dw) / 2;
         const dy = y + (imgH - dh) / 2;

         ctx.drawImage(img, dx, dy, dw, dh);
       } else {
         ctx.fillStyle = '#f1f5f9';
         ctx.fillRect(x, y, cardWidth, 300);
       }

       // Text Area
       const ty = y + 320;
       ctx.fillStyle = '#18181b';
       ctx.font = 'bold 36px sans-serif';
       ctx.fillText(product.name, x + 25, ty + 40);
       
       ctx.fillStyle = '#71717a';
       ctx.font = 'bold 24px sans-serif';
       ctx.fillText(product.category, x + 25, ty + 80);

       ctx.fillStyle = '#52525b';
       ctx.font = '22px sans-serif';
       const specs = product.specs.split('\n')[0] || '';
       ctx.fillText(specs.substring(0, 30) + (specs.length>30?'...':''), x + 25, ty + 120);

       // Border
       ctx.strokeStyle = '#e2e8f0';
       ctx.lineWidth = 2;
       ctx.strokeRect(x, y, cardWidth, cardHeight);
    };

    for (let i = 0; i < processedProducts.length; i++) {
      await drawItem(processedProducts[i], i);
    }

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `My_Picks_Collection.png`;
    a.click();
    showToast("마이픽 리스트 이미지가 저장되었습니다.");
  };

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 overflow-hidden relative selection:bg-black selection:text-white print:bg-white print:h-auto print:overflow-visible">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in no-print" onClick={() => setIsMobileMenuOpen(false)} />}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-md border-r border-zinc-200 flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} no-print`}>
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between cursor-pointer group" onClick={() => { setActiveCategory('DASHBOARD'); setIsMobileMenuOpen(false); }}>
          <div className="flex items-center space-x-3"><div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">P</div><div><h1 className="text-lg font-extrabold tracking-tight text-zinc-900">PATRA</h1><span className="text-[10px] font-semibold text-zinc-400 tracking-widest uppercase block -mt-1">Design Lab DB</span></div></div>
          <button onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }} className="md:hidden text-zinc-400 hover:text-zinc-600"><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-4 custom-scrollbar">
          <div className="space-y-1">{CATEGORIES.filter(c => c.isSpecial).map((cat) => (<button key={cat.id} onClick={() => { setActiveCategory(cat.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group border ${activeCategory === cat.id ? 'bg-zinc-900 text-white shadow-lg border-zinc-900' : 'bg-white text-zinc-600 border-zinc-100 hover:bg-zinc-50 hover:border-zinc-300'}`}><div className="flex items-center">{cat.id === 'ALL' && <LayoutGrid className="w-4 h-4 mr-3 opacity-70" />}{cat.id === 'NEW' && <Zap className="w-4 h-4 mr-3 opacity-70" />}<span className="font-bold tracking-tight">{cat.label}</span></div>{cat.id === 'NEW' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-auto"></span>}</button>))}</div>
          <div><div className="text-[10px] font-bold text-zinc-400 mb-2 px-3 flex justify-between items-center tracking-widest uppercase"><span>SPACES</span></div><div className="space-y-1">{SPACES.map((space) => (<button key={space.id} onClick={() => { setActiveCategory(space.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === space.id ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}><div className="flex items-center"><space.icon className={`w-3.5 h-3.5 mr-3 ${activeCategory === space.id ? 'text-white' : 'text-zinc-400'}`} />{space.label}</div>{activeCategory === space.id && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}</button>))}</div></div>
          <div><div className="text-[10px] font-bold text-zinc-400 mb-2 px-3 flex justify-between items-center tracking-widest uppercase border-t border-zinc-100 pt-4"><span>COLLECTIONS</span>{isFirebaseAvailable ? <div className="flex items-center text-green-500"><Cloud className="w-3 h-3 mr-1" /></div> : <div className="flex items-center text-zinc-300"><CloudOff className="w-3 h-3 mr-1" /></div>}</div><div className="space-y-0.5">{CATEGORIES.filter(c => !c.isSpecial).map((cat) => (<button key={cat.id} onClick={() => { setActiveCategory(cat.id); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === cat.id ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}>{cat.label}</button>))}</div></div>
          <div className="pt-2"><button onClick={() => { setActiveCategory('MY_PICK'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center space-x-3 group border ${activeCategory === 'MY_PICK' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'text-zinc-400 border-transparent hover:bg-zinc-50 hover:text-zinc-600'}`}><Heart className={`w-4 h-4 ${activeCategory === 'MY_PICK' ? 'fill-yellow-500 text-yellow-500' : ''}`} /><span>My Pick ({favorites.length})</span></button></div>
        </nav>
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 space-y-3"><button onClick={toggleAdminMode} className={`w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isAdmin ? 'bg-zinc-900 text-white shadow-md' : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100'}`}>{isAdmin ? <Unlock className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2" />}{isAdmin ? "ADMIN MODE" : "VIEWER MODE"}</button><div className="flex justify-between items-center px-1">{isAdmin ? (<button onClick={() => { fetchLogs(); setShowAdminDashboard(true); }} className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center font-bold"><Settings className="w-3 h-3 mr-1" /> Dashboard</button>) : <span className="text-[10px] text-zinc-400">{APP_VERSION}</span>}{isAdmin && <span className="text-[10px] text-zinc-300">{BUILD_DATE}</span>}</div></div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative print:h-auto print:overflow-visible">
        <header className="h-14 md:h-16 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex items-center justify-between px-4 md:px-8 z-30 flex-shrink-0 sticky top-0 transition-all no-print">
          <div className="flex items-center space-x-3 w-full md:w-auto flex-1 mr-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-lg active:scale-95 transition-transform"><Menu className="w-6 h-6" /></button>
            <div className="relative w-full max-w-md group"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" /><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); if (activeCategory === 'DASHBOARD' && e.target.value) setActiveCategory('ALL'); }} className="w-full pl-10 pr-4 py-2 bg-zinc-50/50 border border-transparent focus:bg-white focus:border-zinc-200 focus:ring-4 focus:ring-zinc-50 rounded-full text-sm transition-all outline-none" /></div>
          </div>
          <div className="flex items-center space-x-2">
             {activeCategory === 'MY_PICK' && (
                <div className="flex space-x-2 bg-yellow-50 p-1 rounded-lg">
                   <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode==='grid'?'bg-white shadow text-yellow-600':'text-yellow-600/50'}`}><LayoutGrid className="w-4 h-4"/></button>
                   <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode==='list'?'bg-white shadow text-yellow-600':'text-yellow-600/50'}`}><LayoutList className="w-4 h-4"/></button>
                   <button onClick={handleExportMyPicks} className="p-1.5 rounded-md hover:bg-white hover:shadow text-yellow-600 ml-2" title="Export as Image"><Download className="w-4 h-4"/></button>
                </div>
             )}
             <button onClick={() => setActiveCategory('MY_PICK')} className={`hidden md:flex p-2 rounded-full transition-all items-center space-x-1 ${activeCategory === 'MY_PICK' ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600'}`} title="My Pick"><Heart className={`w-5 h-5 ${activeCategory === 'MY_PICK' ? 'fill-yellow-500 text-yellow-500' : ''}`} /></button>
             <div className="flex items-center bg-zinc-100 rounded-lg p-1">
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="bg-transparent text-xs font-bold text-zinc-600 outline-none px-2 py-1 max-w-[80px] md:max-w-none cursor-pointer"><option value="manual">Manual</option><option value="launchDate">Launch</option><option value="createdAt">Added</option><option value="name">Name</option></select>
                <button onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-zinc-500" title="Sort">{sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}</button>
             </div>
            {isAdmin && (<button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 bg-zinc-900 text-white rounded-full hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95 flex-shrink-0"><Plus className="w-4 h-4 md:mr-1.5" /><span className="hidden md:inline text-sm font-bold">New</span></button>)}
          </div>
        </header>

        <div ref={mainContentRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative print:p-0 print:overflow-visible">
          {activeCategory === 'DASHBOARD' && !searchTerm ? (
            <DashboardView products={products} favorites={favorites} setActiveCategory={setActiveCategory} setSelectedProduct={setSelectedProduct} isAdmin={isAdmin} bannerData={bannerData} onBannerUpload={handleBannerUpload} onBannerTextChange={handleBannerTextChange} onSaveBannerText={saveBannerText} />
          ) : (
            <>
              {SPACES.find(s => s.id === activeCategory) && (
                 <SpaceDetailView space={SPACES.find(s => s.id === activeCategory)} spaceContent={spaceContents[activeCategory] || {}} isAdmin={isAdmin} onBannerUpload={(e) => handleSpaceBannerUpload(e, activeCategory)} onEditInfo={() => setEditingSpaceInfoId(activeCategory)} onManageProducts={() => setManagingSpaceProductsId(activeCategory)} onAddScene={() => setEditingScene({ isNew: true, spaceId: activeCategory })} onViewScene={(scene) => setSelectedScene({ ...scene, spaceId: activeCategory })} productCount={processedProducts.length} />
              )}
              
              {!SPACES.find(s => s.id === activeCategory) && (
                 <div className="mb-4 md:mb-8 flex items-end justify-between px-1 no-print">
                   <div><h2 className="text-xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">{activeCategory === 'MY_PICK' ? 'MY PICK COLLECTION' : CATEGORIES.find(c => c.id === activeCategory)?.label || activeCategory}</h2><p className="text-zinc-500 text-xs md:text-sm mt-1 font-medium">{processedProducts.length} items found</p></div>
                 </div>
              )}

              {activeCategory === 'MY_PICK' && viewMode === 'list' ? (
                <div className="space-y-3 pb-20">
                   {processedProducts.map(product => (
                     <div key={product.id} onClick={() => setSelectedProduct(product)} className="flex items-center p-4 bg-white rounded-xl border border-zinc-200 shadow-sm hover:border-zinc-400 cursor-pointer transition-all">
                        <div className="w-16 h-16 bg-zinc-50 rounded-lg flex-shrink-0 overflow-hidden mr-4 border border-zinc-100">{product.images?.[0] ? <img src={product.images[0]} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 m-auto text-zinc-300"/>}</div>
                        <div className="flex-1 min-w-0"><div className="flex justify-between"><h4 className="text-lg font-bold text-zinc-900">{product.name}</h4><span className="text-[10px] bg-zinc-100 px-2 py-1 rounded text-zinc-500 font-bold">{product.category}</span></div><p className="text-sm text-zinc-500 truncate mt-1">{product.specs}</p></div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 ml-4"/>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8 pb-20 print:grid-cols-2 print:gap-4">
                  {processedProducts.map((product, idx) => (<ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} isAdmin={isAdmin} showMoveControls={isAdmin && sortOption === 'manual'} onMove={(dir) => handleMoveProduct(idx, dir)} isFavorite={favorites.includes(product.id)} onToggleFavorite={(e) => toggleFavorite(e, product.id)} />))}
                  {isAdmin && activeCategory !== 'MY_PICK' && activeCategory !== 'NEW' && !SPACES.find(s => s.id === activeCategory) && (<button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px] text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-all group no-print"><Plus className="w-8 h-8" /><span className="text-xs md:text-sm font-bold mt-2">Add Product</span></button>)}
                </div>
              )}
            </>
          )}
          {showScrollTop && (<button onClick={scrollToTop} className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-10 h-10 md:w-12 md:h-12 bg-black/80 backdrop-blur-md text-white rounded-full shadow-lg flex items-center justify-center hover:bg-black hover:scale-110 transition-all z-40 animate-in fade-in slide-in-from-bottom-4 no-print"><ChevronsUp className="w-6 h-6" /></button>)}
        </div>
      </main>

      {/* Modals */}
      {toast && <div className="fixed bottom-8 right-8 bg-zinc-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-bottom-10 fade-in z-[90] no-print">{toast.type === 'success' ? <Check className="w-5 h-5 text-green-400" /> : <Info className="w-5 h-5 text-red-400" />}<span className="text-sm font-bold tracking-wide">{toast.message}</span></div>}
      {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onEdit={() => { setEditingProduct(selectedProduct); setIsFormOpen(true); }} isAdmin={isAdmin} showToast={showToast} isFavorite={favorites.includes(selectedProduct.id)} onToggleFavorite={(e) => toggleFavorite(e, selectedProduct.id)} navigateToSpace={(sid) => { setSelectedProduct(null); setActiveCategory(sid); }} />}
      {isFormOpen && <ProductFormModal categories={CATEGORIES.filter(c => !c.isSpecial)} initialCategory={activeCategory} existingData={editingProduct} onClose={() => { setIsFormOpen(false); setEditingProduct(null); }} onSave={handleSaveProduct} onDelete={handleDeleteProduct} isFirebaseAvailable={isFirebaseAvailable} />}
      {editingSpaceInfoId && <SpaceInfoEditModal spaceId={editingSpaceInfoId} currentData={spaceContents[editingSpaceInfoId]} onClose={() => setEditingSpaceInfoId(null)} onSave={(data) => { handleSpaceInfoSave(editingSpaceInfoId, data); setEditingSpaceInfoId(null); }} />}
      {managingSpaceProductsId && <SpaceProductManager spaceId={managingSpaceProductsId} products={products} onClose={() => setManagingSpaceProductsId(null)} onToggle={(pid, add) => handleSpaceProductToggle(managingSpaceProductsId, pid, add)} />}
      {editingScene && <SceneEditModal initialData={editingScene} allProducts={products} onClose={() => setEditingScene(null)} onSave={(data) => { handleSceneSave(editingScene.spaceId, data); setEditingScene(null); }} onDelete={(id) => { handleSceneDelete(editingScene.spaceId, id); setEditingScene(null); }} />}
      {selectedScene && <SpaceSceneModal scene={selectedScene} products={products.filter(p => selectedScene.productIds && selectedScene.productIds.includes(p.id))} allProducts={products} isAdmin={isAdmin} onClose={() => setSelectedScene(null)} onEdit={() => { setEditingScene({ ...selectedScene, isNew: false }); setSelectedScene(null); }} onProductToggle={async (pid, add) => { const newPids = add ? [...(selectedScene.productIds||[]), pid] : (selectedScene.productIds||[]).filter(id=>id!==pid); const updatedScene = { ...selectedScene, productIds: newPids }; setSelectedScene(updatedScene); await handleSceneSave(selectedScene.spaceId, updatedScene); }} />}
      {showAdminDashboard && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 no-print"><div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"><div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-900 text-white"><h3 className="text-lg font-bold flex items-center"><ShieldAlert className="w-5 h-5 mr-2" /> Admin Console</h3><button onClick={() => setShowAdminDashboard(false)}><X className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" /></button></div><div className="flex-1 flex flex-col items-center justify-center p-10 text-zinc-400"><Activity className="w-10 h-10 mb-2"/><p>Dashboard active.</p></div></div></div>}
    </div>
  );
}

// ----------------------------------------------------------------------
// Space & Scene Components
// ----------------------------------------------------------------------
function SpaceDetailView({ space, spaceContent, isAdmin, onBannerUpload, onEditInfo, onManageProducts, onAddScene, onViewScene, productCount }) {
  const banner = spaceContent.banner;
  const description = spaceContent.description || "이 공간에 대한 설명이 없습니다.";
  const trend = spaceContent.trend || "";
  const scenes = spaceContent.scenes || [];
  const copySpaceLink = () => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?space=${space.id}`); window.alert("공간 공유 링크가 복사되었습니다."); };

  return (
    <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative rounded-3xl overflow-hidden h-72 md:h-96 shadow-lg group mb-8 bg-zinc-900">
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
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-extrabold text-zinc-900 flex items-center"><ImageIcon className="w-6 h-6 mr-2 text-indigo-500" /> Space Scenes</h3>{isAdmin && (<button onClick={onAddScene} className="flex items-center text-sm font-bold bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors shadow-lg"><Plus className="w-4 h-4 mr-2" /> Add Scene</button>)}</div>
        {scenes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenes.map((scene) => (
              <div key={scene.id} onClick={() => onViewScene(scene)} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 shadow-md hover:shadow-xl transition-all cursor-pointer">
                <img src={scene.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={scene.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                {scene.productIds && scene.productIds.length > 0 && <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center"><Tag className="w-3 h-3 mr-1" /> {scene.productIds.length} Products</div>}
                <div className="absolute bottom-5 left-5 right-5 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform"><h4 className="text-xl font-bold mb-1 truncate">{scene.title}</h4><p className="text-xs text-zinc-300 line-clamp-1">{scene.description}</p></div>
              </div>
            ))}
          </div>
        ) : (<div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-zinc-400"><ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">등록된 공간 장면이 없습니다.</p></div>)}
      </div>
      <div className="flex items-center justify-between mb-6 border-t border-zinc-100 pt-12">
         <h3 className="text-xl font-bold text-zinc-900 flex items-center"><Tag className="w-5 h-5 mr-2 text-zinc-400" /> All Curated Products <span className="ml-2 text-sm font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{productCount}</span></h3>
         {isAdmin && (<button onClick={onManageProducts} className="flex items-center text-sm font-bold text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 px-4 py-2 rounded-lg hover:border-zinc-400 transition-colors"><Settings className="w-4 h-4 mr-2" /> Manage List</button>)}
      </div>
    </div>
  );
}

function SpaceSceneModal({ scene, products, allProducts, isAdmin, onClose, onEdit, onProductToggle }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = scene.images ? [scene.image, ...scene.images] : [scene.image];
  const [isProductManagerOpen, setProductManagerOpen] = useState(false);
  const [productFilter, setProductFilter] = useState('');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-0 md:p-6 animate-in zoom-in-95 duration-200">
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
               <div className="space-y-3">{products.length > 0 ? products.map(product => (<div key={product.id} className="flex items-center p-3 bg-white rounded-xl border border-zinc-100 shadow-sm hover:border-zinc-300 transition-all cursor-pointer group"><div className="w-12 h-12 bg-zinc-50 rounded-lg flex-shrink-0 flex items-center justify-center mr-3 overflow-hidden">{product.images?.[0] ? <img src={product.images[0]} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-zinc-300"/>}</div><div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-zinc-900 truncate group-hover:text-blue-600">{product.name}</h4><p className="text-xs text-zinc-500">{product.category}</p></div><ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600"/></div>)) : (<div className="text-center py-8 text-zinc-400 text-xs">연관된 제품이 없습니다.</div>)}</div>
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

// ... DashboardView, ProductCard (Unchanged) ...
function DashboardView({ products, favorites, setActiveCategory, setSelectedProduct, isAdmin, bannerData, onBannerUpload, onBannerTextChange, onSaveBannerText }) {
  const totalCount = products.length; const newCount = products.filter(p => p.isNew).length; const pickCount = favorites.length;
  const categoryCounts = []; let totalStandardProducts = 0;
  CATEGORIES.filter(c => !c.isSpecial).forEach(c => { const count = products.filter(p => p.category === c.id).length; if (count > 0) { categoryCounts.push({ ...c, count }); totalStandardProducts += count; } });
  let currentAngle = 0; const gradientParts = categoryCounts.map(item => { const start = currentAngle; const percentage = (item.count / totalStandardProducts) * 100; currentAngle += percentage; return `${item.color} ${start}% ${currentAngle}%`; });
  const chartStyle = { background: totalStandardProducts > 0 ? `conic-gradient(${gradientParts.join(', ')})` : '#f4f4f5' };
  const recentUpdates = [...products].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 5);
  const fileInputRef = useRef(null);
  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="relative w-full h-48 md:h-72 rounded-3xl overflow-hidden shadow-lg border border-zinc-200 group bg-zinc-900"><div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10"></div>{bannerData.url ? <img src={bannerData.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><img src="/api/placeholder/1200/400" className="w-full h-full object-cover grayscale" /></div>}<div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-20 max-w-2xl">{isAdmin ? (<div className="space-y-2"><input type="text" value={bannerData.title} onChange={(e) => onBannerTextChange('title', e.target.value)} onBlur={onSaveBannerText} className="bg-transparent text-3xl md:text-5xl font-black text-white w-full outline-none" /><input type="text" value={bannerData.subtitle} onChange={(e) => onBannerTextChange('subtitle', e.target.value)} onBlur={onSaveBannerText} className="bg-transparent text-zinc-300 font-medium text-sm md:text-lg w-full outline-none" /></div>) : (<><h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2">{bannerData.title}</h2><p className="text-zinc-300 font-medium text-sm md:text-lg">{bannerData.subtitle}</p></>)}</div>{isAdmin && (<><button onClick={() => fileInputRef.current.click()} className="absolute top-4 right-4 z-30 p-2 bg-white/20 backdrop-blur rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"><Camera className="w-5 h-5" /></button><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onBannerUpload} /></>)}</div>
      <div className="grid grid-cols-3 gap-3 md:gap-6"><div onClick={() => setActiveCategory('ALL')} className="bg-white p-3 md:p-6 rounded-xl border shadow-sm flex flex-col justify-center items-center md:items-start h-24 md:h-32"><p className="text-[10px] font-bold text-zinc-400">TOTAL</p><h3 className="text-xl md:text-4xl font-extrabold">{totalCount}</h3></div><div onClick={() => setActiveCategory('NEW')} className="bg-white p-3 md:p-6 rounded-xl border shadow-sm flex flex-col justify-center items-center md:items-start h-24 md:h-32"><p className="text-[10px] font-bold text-red-400">NEW</p><h3 className="text-xl md:text-4xl font-extrabold">{newCount}</h3></div><div onClick={() => setActiveCategory('MY_PICK')} className="bg-white p-3 md:p-6 rounded-xl border shadow-sm flex flex-col justify-center items-center md:items-start h-24 md:h-32"><p className="text-[10px] font-bold text-yellow-500">PICK</p><h3 className="text-xl md:text-4xl font-extrabold">{pickCount}</h3></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-center min-h-[300px]"><h3 className="text-lg font-bold mb-6">Distribution</h3><div className="flex justify-around items-center"><div className="w-32 h-32 rounded-full shadow-inner" style={chartStyle}></div><div className="grid grid-cols-2 gap-2 text-[10px]">{categoryCounts.map(i=><div key={i.id} className="flex items-center"><div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor:i.color}}></div>{i.label}</div>)}</div></div></div><div className="bg-white p-6 rounded-2xl border shadow-sm min-h-[300px]"><h3 className="text-lg font-bold mb-6">Updates</h3><div className="space-y-3">{recentUpdates.map(p=><div key={p.id} onClick={()=>setSelectedProduct(p)} className="flex items-center p-3 rounded-xl border hover:bg-zinc-50 cursor-pointer"><div className="w-10 h-10 bg-zinc-100 rounded mr-3 overflow-hidden">{p.images?.[0]&&<img src={p.images[0]} className="w-full h-full object-cover"/>}</div><div><div className="text-sm font-bold">{p.name}</div><div className="text-xs text-zinc-400">{p.category}</div></div></div>)}</div></div></div>
    </div>
  );
}

function ProductCard({ product, onClick, showMoveControls, onMove, isFavorite, onToggleFavorite }) {
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;
  return (
    <div onClick={onClick} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-zinc-100 relative flex flex-col h-full print:border-black print:shadow-none">
      <div className="relative h-32 md:h-64 bg-zinc-50 p-2 md:p-6 flex items-center justify-center overflow-hidden">
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 items-start no-print">
           {product.isNew && <span className="bg-black text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded">NEW</span>}
        </div>
        <button onClick={onToggleFavorite} className="absolute top-2 right-2 z-20 text-zinc-300 hover:text-yellow-400 no-print"><Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} /></button>
        <div className="w-full h-full flex items-center justify-center"><img src={mainImage} loading="lazy" className="w-full h-full object-contain mix-blend-multiply" /></div>
      </div>
      <div className="p-3 md:p-5 flex-1 flex flex-col bg-white">
        <div className="text-[9px] font-bold text-zinc-400 uppercase mb-1">{product.category}</div>
        <h3 className="text-sm md:text-lg font-extrabold text-zinc-900 mb-1 line-clamp-1">{product.name}</h3>
        <div className="mt-auto pt-2 border-t border-zinc-50 flex gap-1 no-print">
           {product.bodyColors?.slice(0,4).map((c,i)=><div key={i} className="w-2.5 h-2.5 rounded-full border shadow-sm" style={{backgroundColor:c}}/>)}
        </div>
      </div>
    </div>
  );
}

function ProductDetailModal({ product, onClose, onEdit, isAdmin, showToast, isFavorite, onToggleFavorite, navigateToSpace }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const canvasRef = useRef(null);
  
  if (!product) return null;
  const images = product.images || [];
  const currentImage = images.length > 0 ? images[currentImageIndex] : null;
  const contentImages = product.contentImages || [];

  const copyShareLink = () => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?id=${product.id}`); showToast("Link copied"); };
  
  // Smart Image Share (Scroll Capture Simulation)
  const handleShareImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    showToast("이미지 생성 중... 잠시만 기다려주세요.");
    const ctx = canvas.getContext('2d');
    const w = 800; // Fixed width for cleaner export
    
    // Calculate total height needed
    const headerH = 150;
    const mainImgH = 600;
    const infoH = 400;
    const contentImgH = contentImages.length * 800; // Approx height per detail image
    const totalH = headerH + mainImgH + infoH + contentImgH + 100;
    
    canvas.width = w;
    canvas.height = totalH;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, totalH);

    // Header
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, w, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText("PATRA DESIGN LAB", 40, 60);

    let currentY = 140;

    // Helper to load image
    const loadImage = (src) => new Promise((resolve) => {
       const img = new Image();
       img.crossOrigin = "Anonymous";
       img.onload = () => resolve(img);
       img.onerror = () => resolve(null);
       img.src = src;
    });

    (async () => {
       // 1. Draw Main Product Info
       ctx.fillStyle = '#18181b';
       ctx.font = 'bold 50px sans-serif';
       ctx.fillText(product.name, 40, currentY);
       currentY += 40;
       
       ctx.fillStyle = '#71717a';
       ctx.font = 'bold 24px sans-serif';
       ctx.fillText(product.category.toUpperCase(), 40, currentY);
       currentY += 50;

       // 2. Draw Main Image
       if (currentImage) {
          const mImg = await loadImage(currentImage);
          if (mImg) {
             const ratio = Math.min((w-80)/mImg.width, 500/mImg.height);
             const dw = mImg.width * ratio;
             const dh = mImg.height * ratio;
             ctx.drawImage(mImg, (w-dw)/2, currentY, dw, dh);
             currentY += dh + 50;
          }
       }

       // 3. Draw Specs
       ctx.fillStyle = '#f4f4f5';
       ctx.fillRect(40, currentY, w-80, 200);
       ctx.fillStyle = '#3f3f46';
       ctx.font = '20px sans-serif';
       const specLines = product.specs.split('\n');
       let textY = currentY + 40;
       specLines.forEach(line => {
          ctx.fillText(line, 60, textY);
          textY += 30;
       });
       currentY += 240;

       // 4. Draw Detail Images (Scroll Content)
       for (const src of contentImages) {
          const cImg = await loadImage(src);
          if (cImg) {
             const ratio = (w-80) / cImg.width;
             const dh = cImg.height * ratio;
             ctx.drawImage(cImg, 40, currentY, w-80, dh);
             currentY += dh + 20;
          }
       }

       // Export
       const dataUrl = canvas.toDataURL('image/png');
       const a = document.createElement('a');
       a.href = dataUrl;
       a.download = `${product.name}-full-card.png`;
       a.click();
       showToast("전체 내용이 이미지로 저장되었습니다.");
    })();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200 no-print-overlay">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {/* Zoom Overlay (Omitted for brevity, same as v0.5.5) */}
      
      {/* Modal Container */}
      <div className="bg-white w-full h-full md:h-[95vh] md:w-full md:max-w-6xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative print-area">
        {/* Back Button */}
        <button onClick={onClose} className="absolute top-4 left-4 z-50 p-2 bg-white/80 rounded-full shadow-sm hover:bg-zinc-100 transition-colors flex items-center text-sm font-bold md:hidden no-print">
           <ArrowLeft className="w-5 h-5 mr-1"/> Back
        </button>
        <button onClick={onClose} className="fixed md:absolute top-4 right-4 md:top-5 md:right-5 p-2 bg-white/50 hover:bg-zinc-100 rounded-full z-[60] transition-colors backdrop-blur no-print"><X className="w-6 h-6 text-zinc-900" /></button>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row h-full">
          {/* Left: Visual */}
          <div className="w-full md:w-1/2 bg-zinc-50 p-6 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-zinc-100 md:sticky md:top-0 h-auto md:h-full">
            <div className="flex-1 w-full bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 overflow-hidden p-8 mb-4 relative group min-h-[300px]">
               {currentImage ? <img src={currentImage} className="w-full h-full object-contain" /> : <ImageIcon className="w-20 h-20 opacity-20 text-zinc-400" />}
            </div>
            {/* Thumbnails */}
            {images.length > 0 && (<div className="flex space-x-2 no-print overflow-x-auto pb-2">{images.map((img, idx) => (<button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`w-16 h-16 rounded border ${currentImageIndex===idx?'border-black':'border-transparent'}`}><img src={img} className="w-full h-full object-cover"/></button>))}</div>)}
          </div>

          {/* Right: Info */}
          <div className="w-full md:w-1/2 p-6 md:p-12 bg-white pb-20 md:pb-12">
            <div className="mb-6 md:mb-10">
              <span className="inline-block px-2.5 py-0.5 bg-zinc-900 text-white text-[10px] font-extrabold rounded uppercase tracking-widest mb-2">{product.category}</span>
              <h2 className="text-4xl font-black text-zinc-900 mb-1">{product.name}</h2>
              {product.designer && <p className="text-sm text-zinc-500 font-medium">Designed by {product.designer}</p>}
            </div>
            
            <div className="space-y-8">
               <div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Specs</h3><p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{product.specs}</p></div>
               
               {/* Content Images */}
               {contentImages.length > 0 && (
                 <div className="space-y-4 pt-4 border-t border-zinc-100">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Details</h3>
                    <div className="flex flex-col gap-4">
                      {contentImages.map((img, i) => <img key={i} src={img} className="w-full rounded-lg" />)}
                    </div>
                 </div>
               )}

               {/* Related Spaces (Reverse Link) */}
               {product.spaces && product.spaces.length > 0 && (
                 <div className="pt-6 border-t border-zinc-100 no-print">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Related Spaces</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.spaces.map(spaceId => {
                        const space = SPACES.find(s => s.id === spaceId);
                        return space ? (
                          <button key={spaceId} onClick={() => navigateToSpace(spaceId)} className="flex items-center px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors">
                             {React.createElement(space.icon, { className: "w-4 h-4 mr-2 text-zinc-500" })}
                             <span className="text-xs font-bold text-zinc-700">{space.label}</span>
                          </button>
                        ) : null;
                      })}
                    </div>
                 </div>
               )}
            </div>

            <div className="mt-12 pt-6 border-t border-zinc-100 flex gap-3 no-print">
               <button onClick={handleShareImage} className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors flex items-center justify-center"><ImgIcon className="w-4 h-4 mr-2"/> Save Image</button>
               <button onClick={handlePrint} className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-colors flex items-center justify-center"><Printer className="w-4 h-4 mr-2"/> Print / PDF</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductFormModal({ categories, existingData, onClose, onSave, onDelete }) { const [formData, setFormData] = useState(existingData || {name:'', category:'EXECUTIVE', images:[], specs:''}); const handleSubmit = (e) => { e.preventDefault(); onSave(formData); }; return (<div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center"><div className="bg-white p-6 rounded-2xl w-full max-w-xl"><h3 className="font-bold mb-4">Edit Product</h3><input value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} className="border p-2 w-full mb-2" placeholder="Name"/><button onClick={handleSubmit} className="bg-black text-white px-4 py-2 rounded w-full">Save</button><button onClick={onClose} className="mt-2 w-full text-sm">Cancel</button></div></div>); }