/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Search, X, Check, Tag, Palette, Settings, Image as ImageIcon,
  Upload, Trash2, Edit2, RefreshCw, Cloud, CloudOff, Lock, Unlock,
  Database, Info, ArrowUpDown, ListFilter, Menu, History,
  Copy, ChevronRight, Activity, ShieldAlert, FileJson, Calendar,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Layers, Star,
  Trophy, Heart, Link as LinkIcon, Paperclip, PieChart, Clock,
  Share2, Download, Maximize2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, addDoc, query, orderBy, limit 
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
const APP_VERSION = "v2.1.0"; // Search Fix, Card Download, Share Link
const BUILD_DATE = "2024.05.30";
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
  { id: 'ALL', label: 'TOTAL VIEW', isSpecial: true, color: '#1e293b' },
  { id: 'NEW', label: 'NEW ARRIVALS', isSpecial: true, color: '#ef4444' },
  { id: 'EXECUTIVE', label: 'EXECUTIVE', color: '#3b82f6' },
  { id: 'TASK', label: 'TASK', color: '#06b6d4' },
  { id: 'CONFERENCE', label: 'CONFERENCE', color: '#8b5cf6' },
  { id: 'GUEST', label: 'GUEST', color: '#ec4899' },
  { id: 'STOOL', label: 'STOOL', color: '#10b981' },
  { id: 'LOUNGE', label: 'LOUNGE', color: '#f59e0b' },
  { id: 'HOME', label: 'HOME', color: '#f97316' },
  { id: 'TABLE', label: 'TABLE', color: '#64748b' },
  { id: 'ETC', label: 'ETC', color: '#94a3b8' }
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
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [toast, setToast] = useState(null);
  const [favorites, setFavorites] = useState([]);

  // URL Query Parameter Check (Share Link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('id');
    if (sharedId && products.length > 0) {
      const found = products.find(p => String(p.id) === sharedId);
      if (found) {
        setSelectedProduct(found);
        // Remove query param from URL without reload
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [products]);

  // 1. 인증 초기화
  useEffect(() => {
    const initApp = async () => {
      if (isFirebaseAvailable && auth) {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
          onAuthStateChanged(auth, setUser);
        } catch (error) {
          console.error("Auth Error:", error);
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
        setUser({ uid: 'local-user', isAnonymous: true });
      }
    };
    initApp();
    
    const savedFavs = localStorage.getItem('patra_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
  }, []);

  // 2. 실시간 데이터 동기화
  useEffect(() => {
    if (isFirebaseAvailable && user && db) {
      const qProducts = collection(db, 'artifacts', appId, 'public', 'data', 'products');
      const unsubProducts = onSnapshot(qProducts, (snapshot) => {
        const loadedProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(loadedProducts);
        setIsLoading(false);
      }, (error) => {
        console.error("Sync Error:", error);
        showToast("서버 동기화 오류. 로컬 데이터를 표시합니다.", "error");
        setIsLoading(false);
      });

      return () => {
        unsubProducts();
      };
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
    if (isAdmin) {
      setIsAdmin(false);
      setShowAdminDashboard(false);
      showToast("뷰어 모드로 전환되었습니다.", "info");
    } else {
      const password = window.prompt("관리자 비밀번호를 입력하세요:");
      if (password === ADMIN_PASSWORD) {
        setIsAdmin(true);
        showToast("관리자 모드로 접속했습니다.");
      } else if (password !== null) {
        showToast("비밀번호가 올바르지 않습니다.", "error");
      }
    }
  };

  const toggleFavorite = (e, productId) => {
    if(e) e.stopPropagation();
    let newFavs;
    if (favorites.includes(productId)) {
      newFavs = favorites.filter(id => id !== productId);
      showToast("MY PICK에서 제거되었습니다.", "info");
    } else {
      newFavs = [...favorites, productId];
      showToast("MY PICK에 추가되었습니다.");
    }
    setFavorites(newFavs);
    localStorage.setItem('patra_favorites', JSON.stringify(newFavs));
  };

  const logActivity = async (action, productName, details = "") => {
    if (!isFirebaseAvailable || !db) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), {
        action,
        productName,
        details,
        timestamp: Date.now(),
        adminId: 'admin'
      });
    } catch (e) {
      console.error("Logging failed", e);
    }
  };

  const fetchLogs = async () => {
    if (!isFirebaseAvailable || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), orderBy('timestamp', 'desc'), limit(100));
    onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivityLogs(logs);
    });
  };

  const handleFullBackup = async () => {
    const backupData = {
      version: APP_VERSION,
      date: new Date().toISOString(),
      products: products,
      logs: activityLogs
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PATRA_DB_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("전체 데이터 백업이 완료되었습니다.");
  };

  // 필터링 및 정렬 로직 (검색어 기능 강화)
  const getProcessedProducts = () => {
    let filtered = products.filter(product => {
      let matchesCategory = true;
      if (activeCategory === 'DASHBOARD') {
        matchesCategory = false; 
      } else if (activeCategory === 'MY_PICK') {
        matchesCategory = favorites.includes(product.id);
      } else if (activeCategory === 'NEW') {
        matchesCategory = product.isNew;
      } else if (activeCategory !== 'ALL') {
        matchesCategory = product.category === activeCategory;
      }

      const searchLower = searchTerm.toLowerCase();
      // [Update]: Features 검색 추가
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) || 
        product.specs.toLowerCase().includes(searchLower) ||
        (product.designer && product.designer.toLowerCase().includes(searchLower)) ||
        (product.options && product.options.some(opt => opt.toLowerCase().includes(searchLower))) ||
        (product.features && product.features.some(ft => ft.toLowerCase().includes(searchLower))) || // 기능 검색 추가
        (product.materials && product.materials.some(mat => mat.toLowerCase().includes(searchLower))) ||
        (product.bodyColors && product.bodyColors.some(c => c.toLowerCase().includes(searchLower))) ||
        (product.upholsteryColors && product.upholsteryColors.some(c => c.toLowerCase().includes(searchLower))) ||
        (product.awards && product.awards.some(a => a.toLowerCase().includes(searchLower)));

      return matchesCategory && matchesSearch;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortOption === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortOption === 'launchDate') {
        const dateA = a.launchDate || a.createdAt || 0;
        const dateB = b.launchDate || b.createdAt || 0;
        comparison = new Date(dateA) - new Date(dateB);
      } else if (sortOption === 'manual') {
        const orderA = a.orderIndex !== undefined ? a.orderIndex : (a.createdAt || 0);
        const orderB = b.orderIndex !== undefined ? b.orderIndex : (b.createdAt || 0);
        comparison = orderA - orderB;
      } else { 
        const dateA = a.createdAt || 0;
        const dateB = b.createdAt || 0;
        comparison = dateA - dateB;
      }
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

    const newCurrentOrder = swapOrder;
    const newSwapOrder = currentOrder;

    if (isFirebaseAvailable && db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', currentItem.id), { orderIndex: newCurrentOrder }, { merge: true });
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', swapItem.id), { orderIndex: newSwapOrder }, { merge: true });
      } catch (e) {
        showToast("순서 변경 실패", "error");
      }
    } else {
      const newProducts = [...products];
      const p1 = newProducts.find(p => p.id === currentItem.id);
      const p2 = newProducts.find(p => p.id === swapItem.id);
      if (p1 && p2) {
        p1.orderIndex = newCurrentOrder;
        p2.orderIndex = newSwapOrder;
        saveToLocalStorage(newProducts);
      }
    }
  };

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
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', docId);
        await setDoc(docRef, payload, { merge: true });
        await logActivity(isEdit ? "UPDATE" : "CREATE", productData.name, isEdit ? "정보 수정" : "신규 등록");
      } catch (error) {
        showToast("저장 실패: " + error.message, "error");
        return;
      }
    } else {
      const existingIndex = products.findIndex(p => String(p.id) === docId);
      let newProducts = [...products];
      if (existingIndex >= 0) newProducts[existingIndex] = payload;
      else newProducts = [payload, ...products];
      saveToLocalStorage(newProducts);
    }

    if (selectedProduct && String(selectedProduct.id) === docId) {
      setSelectedProduct(payload);
    }
    setIsFormOpen(false);
    setEditingProduct(null);
    showToast(isEdit ? "수정 완료" : "등록 완료");
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    if (isFirebaseAvailable && db) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', String(productId));
        await deleteDoc(docRef);
        await logActivity("DELETE", productName, "삭제됨");
      } catch (error) {
        showToast("삭제 실패", "error");
        return;
      }
    } else {
      const newProducts = products.filter(p => String(p.id) !== String(productId));
      saveToLocalStorage(newProducts);
    }
    setSelectedProduct(null);
    setIsFormOpen(false);
    showToast("삭제되었습니다.");
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col shadow-xl transition-transform duration-300 md:relative md:translate-x-0 md:shadow-sm
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between cursor-pointer" onClick={() => { setActiveCategory('DASHBOARD'); setIsMobileMenuOpen(false); }}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">P</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">PATRA <span className="text-xs font-normal text-slate-500 block">DB</span></h1>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }} className="md:hidden text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <div className="text-xs font-semibold text-slate-400 mb-2 px-2 flex justify-between items-center">
             <span>COLLECTIONS</span>
             {isFirebaseAvailable ? 
                <Cloud className="w-3 h-3 text-green-500" title="Online" /> : 
                <CloudOff className="w-3 h-3 text-red-400" title="Local" />
             }
          </div>
          
          {CATEGORIES.map((cat, index) => (
            <React.Fragment key={cat.id}>
              <button
                onClick={() => {
                  setActiveCategory(cat.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group
                  ${activeCategory === cat.id 
                    ? 'bg-indigo-50 text-indigo-900 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                  ${cat.isSpecial ? 'text-indigo-700 font-extrabold' : ''}
                `}
              >
                {cat.label}
                {cat.id === 'NEW' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-auto"></span>}
              </button>
              {(cat.id === 'NEW') && (
                <div className="my-3 mx-2 border-b border-slate-200"></div>
              )}
            </React.Fragment>
          ))}

          {/* My Pick */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setActiveCategory('MY_PICK');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center space-x-2 group
                ${activeCategory === 'MY_PICK' 
                  ? 'bg-yellow-50 text-yellow-700' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}
              `}
            >
              <Heart className={`w-3 h-3 ${activeCategory === 'MY_PICK' ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              <span>MY PICK ({favorites.length})</span>
            </button>
          </div>
        </nav>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
           <button 
             onClick={toggleAdminMode}
             className={`w-full flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
               isAdmin ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-500 hover:bg-slate-100'
             }`}
           >
             {isAdmin ? <Unlock className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2" />}
             {isAdmin ? "ADMIN MODE" : "VIEWER MODE"}
           </button>

           <div className="flex justify-between items-end">
              {isAdmin ? (
                <button 
                  onClick={() => {
                    fetchLogs();
                    setShowAdminDashboard(true);
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center font-bold"
                >
                  <Settings className="w-3 h-3 mr-1" /> Dashboard
                </button>
              ) : (
                <span className="text-[10px] text-slate-400">Read Only</span>
              )}
              <div className="text-[10px] text-slate-300 text-right">{APP_VERSION}</div>
           </div>
        </div>
      </aside>

      {/* 메인 영역 */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50/50">
        <header className="h-16 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-30 flex-shrink-0 sticky top-0">
          <div className="flex items-center space-x-3 w-full md:w-auto flex-1 mr-2">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="검색..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (activeCategory === 'DASHBOARD' && e.target.value) {
                    setActiveCategory('ALL');
                  }
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-slate-300 rounded-full text-sm transition-all outline-none focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
             <button 
                onClick={() => setActiveCategory('MY_PICK')}
                className={`p-2 rounded-full transition-all flex items-center space-x-1 ${activeCategory === 'MY_PICK' ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-slate-100 text-slate-500'}`}
                title="My Pick"
             >
                <Heart className={`w-5 h-5 ${activeCategory === 'MY_PICK' ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                {favorites.length > 0 && <span className="text-xs font-bold">{favorites.length}</span>}
             </button>

             <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-700 outline-none px-2 py-1 max-w-[80px] md:max-w-none"
                >
                  <option value="manual">사용자지정</option>
                  <option value="launchDate">출시일순</option>
                  <option value="createdAt">등록순</option>
                  <option value="name">이름순</option>
                </select>
                <button 
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 rounded-md hover:bg-white hover:shadow transition-all text-slate-500"
                  title={sortDirection === 'asc' ? "오름차순" : "내림차순"}
                >
                  {sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                </button>
             </div>

            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setIsFormOpen(true);
                }}
                className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-slate-300/50 flex-shrink-0"
              >
                <Plus className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline text-sm font-medium">등록</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          {activeCategory === 'DASHBOARD' && !searchTerm ? (
            <DashboardView 
              products={products} 
              favorites={favorites} 
              setActiveCategory={setActiveCategory} 
              setSelectedProduct={setSelectedProduct} 
            />
          ) : (
            <>
              {isLoading && products.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                   {[1,2,3,4].map(n => (
                     <div key={n} className="bg-white rounded-2xl p-4 h-[250px] md:h-[350px] animate-pulse border border-slate-100">
                        <div className="bg-slate-200 h-32 md:h-48 rounded-lg mb-4"></div>
                        <div className="bg-slate-200 h-4 md:h-6 w-3/4 rounded mb-2"></div>
                     </div>
                   ))}
                </div>
              ) : (
                <>
                  <div className="mb-4 md:mb-6 flex items-end justify-between">
                    <div>
                      <h2 className="text-lg md:text-2xl font-bold text-slate-900">
                        {activeCategory === 'MY_PICK' ? 'MY PICK' : CATEGORIES.find(c => c.id === activeCategory)?.label || activeCategory}
                      </h2>
                      <p className="text-slate-500 text-xs md:text-sm mt-1">
                        {processedProducts.length} items 
                        {!isFirebaseAvailable && <span className="ml-2 text-red-400 font-bold">(Local)</span>}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 pb-20">
                    {processedProducts.map((product, idx) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onClick={() => setSelectedProduct(product)} 
                        isAdmin={isAdmin}
                        showMoveControls={isAdmin && sortOption === 'manual'}
                        onMove={(dir) => handleMoveProduct(idx, dir)}
                        isFavorite={favorites.includes(product.id)}
                        onToggleFavorite={(e) => toggleFavorite(e, product.id)}
                      />
                    ))}
                    
                    {isAdmin && activeCategory !== 'MY_PICK' && activeCategory !== 'NEW' && (
                      <button 
                        onClick={() => {
                          setEditingProduct(null);
                          setIsFormOpen(true);
                        }}
                        className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px] text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all group bg-white/50"
                      >
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-slate-200 transition-colors">
                          <Plus className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <span className="text-xs md:text-sm font-medium">Add New</span>
                      </button>
                    )}
                  </div>

                  {processedProducts.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Cloud className="w-12 h-12 mb-4 opacity-20" />
                        <p>등록된 데이터가 없습니다.</p>
                     </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Admin Dashboard */}
      {showAdminDashboard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="text-lg font-bold flex items-center"><ShieldAlert className="w-5 h-5 mr-2" /> Admin Dashboard</h3>
              <button onClick={() => setShowAdminDashboard(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
               <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-4 space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                     <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Server Status</h4>
                     <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isFirebaseAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-bold text-slate-700">{isFirebaseAvailable ? 'Online' : 'Local'}</span>
                     </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                     <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Data Management</h4>
                     <button onClick={handleFullBackup} className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center hover:bg-slate-200 mb-2">
                        <FileJson className="w-4 h-4 mr-2" /> Full Backup
                     </button>
                  </div>
               </div>
               <div className="flex-1 flex flex-col bg-white">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                     <h4 className="font-bold text-slate-800 flex items-center"><Activity className="w-4 h-4 mr-2 text-blue-500" /> Activity Logs</h4>
                     <button onClick={fetchLogs} className="text-xs text-blue-500 hover:underline">Refresh</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                    {activityLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <History className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs">No logs found.</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                          <tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Product</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activityLogs.map((log, idx) => (
                            <tr key={log.id || idx} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleDateString()}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-[10px] font-bold ${log.action === 'CREATE' ? 'bg-green-100 text-green-700' : log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{log.action}</span></td>
                              <td className="px-4 py-3 font-medium text-slate-800 text-xs">{log.productName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900/90 backdrop-blur text-white px-4 py-3 rounded-lg shadow-2xl flex items-center space-x-3 animate-in slide-in-from-bottom-5 fade-in z-[80]">
          {toast.type === 'success' ? <Check className="w-5 h-5 text-green-400" /> : <Info className="w-5 h-5 text-red-400" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Modals */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onEdit={() => {
            setEditingProduct(selectedProduct);
            setIsFormOpen(true);
          }}
          isAdmin={isAdmin}
          showToast={showToast}
          isFavorite={favorites.includes(selectedProduct.id)}
          onToggleFavorite={(e) => toggleFavorite(e, selectedProduct.id)}
        />
      )}

      {isFormOpen && (
        <ProductFormModal 
          categories={CATEGORIES.filter(c => !c.isSpecial)}
          initialCategory={activeCategory} 
          existingData={editingProduct}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
          isFirebaseAvailable={isFirebaseAvailable}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// New Component: DashboardView
// ----------------------------------------------------------------------
function DashboardView({ products, favorites, setActiveCategory, setSelectedProduct }) {
  const totalCount = products.length;
  const newCount = products.filter(p => p.isNew).length;
  const pickCount = favorites.length;
  
  const categoryCounts = [];
  let totalStandardProducts = 0;
  const standardCategories = CATEGORIES.filter(c => !c.isSpecial);
  
  standardCategories.forEach(c => {
    const count = products.filter(p => p.category === c.id).length;
    if (count > 0) {
      categoryCounts.push({ ...c, count });
      totalStandardProducts += count;
    }
  });

  let currentAngle = 0;
  const gradientParts = categoryCounts.map(item => {
    const start = currentAngle;
    const percentage = (item.count / totalStandardProducts) * 100;
    currentAngle += percentage;
    return `${item.color} ${start}% ${currentAngle}%`;
  });
  const chartStyle = {
    background: totalStandardProducts > 0 
      ? `conic-gradient(${gradientParts.join(', ')})`
      : '#f1f5f9'
  };

  const recentUpdates = [...products]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500">Overview of PATRA Design Database</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => setActiveCategory('ALL')} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group">
          <div><p className="text-sm font-bold text-slate-400 uppercase mb-1">Total Products</p><h3 className="text-4xl font-bold text-slate-900">{totalCount}</h3></div>
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors"><Layers className="w-6 h-6" /></div>
        </div>
        <div onClick={() => setActiveCategory('NEW')} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group">
          <div><p className="text-sm font-bold text-red-400 uppercase mb-1">New Arrivals</p><h3 className="text-4xl font-bold text-slate-900">{newCount}</h3></div>
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-400 group-hover:bg-red-100 group-hover:text-red-500 transition-colors"><Activity className="w-6 h-6" /></div>
        </div>
        <div onClick={() => setActiveCategory('MY_PICK')} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group">
          <div><p className="text-sm font-bold text-yellow-500 uppercase mb-1">My Pick</p><h3 className="text-4xl font-bold text-slate-900">{pickCount}</h3></div>
          <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-400 group-hover:bg-yellow-100 group-hover:text-yellow-500 transition-colors"><Heart className="w-6 h-6 fill-current" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center self-start w-full">
            <PieChart className="w-5 h-5 mr-2 text-slate-400" /> Composition
          </h3>
          {totalStandardProducts > 0 ? (
            <div className="flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-10">
              <div className="relative w-48 h-48 rounded-full shadow-inner" style={chartStyle}>
                 <div className="absolute inset-0 m-auto w-24 h-24 bg-white rounded-full flex items-center justify-center flex-col">
                    <span className="text-xs text-slate-400 uppercase font-bold">Total</span>
                    <span className="text-2xl font-bold text-slate-800">{totalStandardProducts}</span>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {categoryCounts.map(item => (
                  <div key={item.id} className="flex items-center text-xs">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                    <span className="font-medium text-slate-600 mr-1">{item.label}</span>
                    <span className="text-slate-400">({item.count})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 text-sm">데이터가 없습니다.</div>
          )}
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[300px]">
           <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
             <Clock className="w-5 h-5 mr-2 text-slate-400" /> Recent Updates
           </h3>
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
             {recentUpdates.length > 0 ? recentUpdates.map(product => (
               <div 
                 key={product.id} 
                 onClick={() => setSelectedProduct(product)}
                 className="flex items-center p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all"
               >
                 <div className="w-10 h-10 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center mr-3 overflow-hidden">
                    {product.images?.[0] ? <img src={product.images[0]} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="w-4 h-4 text-slate-300"/>}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{product.name}</h4>
                    <p className="text-[10px] text-slate-500 truncate">
                      {new Date(product.updatedAt || product.createdAt).toLocaleDateString()} · {product.category}
                    </p>
                 </div>
                 <ChevronRight className="w-4 h-4 text-slate-300" />
               </div>
             )) : (
               <div className="text-center text-slate-400 text-sm py-10">최근 업데이트 내역이 없습니다.</div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Sub Components (ProductCard, ProductDetailModal, ProductFormModal)
// ----------------------------------------------------------------------

function ProductCard({ product, onClick, showMoveControls, onMove, isFavorite, onToggleFavorite }) {
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;
  const handleMove = (e, dir) => {
    e.stopPropagation();
    onMove(dir);
  };

  const materialBadge = product.materials && product.materials.length > 0 ? product.materials[0] : null;
  const awardBadge = product.awards && product.awards.length > 0 ? product.awards[0] : null;

  return (
    <div onClick={onClick} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-slate-100 flex flex-col h-full animate-in fade-in duration-500 relative">
      <div className="relative h-40 md:h-64 overflow-hidden bg-slate-50 p-4 md:p-6 flex items-center justify-center">
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-1 z-10 items-start">
           {product.isNew && <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-sm">NEW</span>}
           {awardBadge && <span className="bg-yellow-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm flex items-center shadow-sm"><Trophy className="w-2.5 h-2.5 mr-1" /> {awardBadge}</span>}
           {materialBadge && !awardBadge && <span className="bg-white/80 backdrop-blur border border-slate-200 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">{materialBadge}</span>}
        </div>
        
        {/* Favorite */}
        <button onClick={onToggleFavorite} className="absolute top-3 right-3 z-20 text-slate-300 hover:text-yellow-400 transition-colors">
          <Star className={`w-5 h-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} />
        </button>

        <div className="w-full h-full rounded-lg flex items-center justify-center text-slate-400 overflow-hidden relative">
            {mainImage ? <img src={mainImage} alt={product.name} loading="lazy" className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" /> : <div className="text-center opacity-50"><ImageIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" /><span className="text-[10px] md:text-xs">{product.name}</span></div>}
        </div>
        
        {/* Link / File Indicators (Tiny) */}
        <div className="absolute bottom-2 right-3 flex space-x-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
           {product.productLink && <div className="p-1 bg-white rounded-full shadow"><LinkIcon className="w-3 h-3 text-slate-400" /></div>}
           {product.attachments && product.attachments.length > 0 && <div className="p-1 bg-white rounded-full shadow"><Paperclip className="w-3 h-3 text-slate-400" /></div>}
        </div>

        {showMoveControls && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2 z-20">
             <button onClick={(e) => handleMove(e, 'left')} className="p-1 bg-white/90 rounded-full shadow hover:bg-white text-slate-700"><ArrowLeft className="w-4 h-4" /></button>
             <button onClick={(e) => handleMove(e, 'right')} className="p-1 bg-white/90 rounded-full shadow hover:bg-white text-slate-700"><ArrowRight className="w-4 h-4" /></button>
          </div>
        )}
      </div>
      <div className="p-3 md:p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1 md:mb-2">
          <span className="text-[10px] md:text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wide truncate max-w-[80px] md:max-w-none">{product.category}</span>
        </div>
        <h3 className="text-sm md:text-lg font-bold text-slate-900 mb-1 line-clamp-1">{product.name}</h3>
        {product.designer && <p className="text-[10px] text-slate-400 mb-1">by {product.designer}</p>}
        
        {/* Specs always shown */}
        <p className="text-[10px] md:text-xs text-slate-500 line-clamp-1 mb-1">
          {product.specs}
        </p>
        {/* Options shown separately if available */}
        {product.options && product.options.length > 0 && (
          <p className="text-[9px] md:text-[10px] text-blue-500 line-clamp-1 mb-2 font-medium">
            {product.options.join(' · ')}
          </p>
        )}
        
        <div className="mt-auto space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 overflow-hidden">
             <div className="flex -space-x-1">
                {product.bodyColors && product.bodyColors.slice(0, 5).map((color, i) => (
                  <div key={i} className="w-3 h-3 rounded-full border border-white ring-1 ring-slate-100 shadow-sm" style={{ backgroundColor: color }} title={color} />
                ))}
             </div>
          </div>
          <div className="flex items-center space-x-1.5 overflow-hidden">
             <div className="flex -space-x-1">
                {product.upholsteryColors && product.upholsteryColors.slice(0, 5).map((color, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm border border-white ring-1 ring-slate-100 shadow-sm" style={{ backgroundColor: color }} title={color} />
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailModal({ product, onClose, onEdit, isAdmin, showToast, isFavorite, onToggleFavorite }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false); // Zoom state

  if (!product) return null;
  const images = product.images || [];
  const currentImage = images.length > 0 ? images[currentImageIndex] : null;
  
  const copyToClipboard = () => {
    const text = `[${product.name}]\n- Category: ${product.category}\n- Specs: ${product.specs}`;
    navigator.clipboard.writeText(text);
    showToast("클립보드 복사 완료");
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?id=${product.id}`;
    navigator.clipboard.writeText(url);
    showToast("공유 링크 복사 완료");
  };

  const handleDownloadCard = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${product.name} - Spec Card</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f1f5f9; margin: 0; }
          .card { width: 320px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
          .image-area { width: 100%; height: 320px; background: #f8fafc; display: flex; align-items: center; justify-content: center; position: relative; }
          .image-area img { width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply; }
          .content { padding: 20px; }
          .category { font-size: 10px; font-weight: bold; color: #64748b; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; display: inline-block; margin-bottom: 8px; }
          .title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0 0 4px 0; }
          .designer { font-size: 11px; color: #94a3b8; margin-bottom: 12px; }
          .specs { font-size: 12px; color: #475569; line-height: 1.5; margin-bottom: 12px; border-top: 1px solid #f1f5f9; padding-top: 12px; }
          .options { font-size: 11px; color: #3b82f6; margin-bottom: 12px; font-weight: 500; }
          .footer { font-size: 10px; color: #cbd5e1; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="image-area">
            ${currentImage ? `<img src="${currentImage}" />` : '<div style="color:#cbd5e1">No Image</div>'}
          </div>
          <div class="content">
            <div class="category">${product.category}</div>
            <h1 class="title">${product.name}</h1>
            ${product.designer ? `<div class="designer">Designed by ${product.designer}</div>` : ''}
            <div class="specs">${product.specs}</div>
            ${product.options && product.options.length > 0 ? `<div class="options">Options: ${product.options.join(', ')}</div>` : ''}
            <div class="footer">PATRA DESIGN DATABASE</div>
          </div>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${product.name.replace(/\s+/g, '_')}_Card.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("카드 다운로드 완료 (HTML)");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Zoom Modal */}
      {isZoomed && currentImage && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setIsZoomed(false)}>
           <img src={currentImage} className="max-w-full max-h-full object-contain" alt="Zoomed" />
           <button className="absolute top-4 right-4 text-white p-2"><X className="w-8 h-8" /></button>
        </div>
      )}

      <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-slate-100 rounded-full z-10 transition-colors"><X className="w-5 h-5 text-slate-600" /></button>
        <div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 flex flex-col border-r border-slate-100">
          <div className="flex-1 w-full bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm overflow-hidden p-4 mb-4 relative group">
             {currentImage ? (
                <>
                  <img 
                    src={currentImage} 
                    alt="Main View" 
                    className="w-full h-full object-contain cursor-zoom-in" 
                    onClick={() => setIsZoomed(true)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/30 text-white p-2 rounded-full"><Maximize2 className="w-6 h-6"/></div>
                  </div>
                </>
             ) : <ImageIcon className="w-16 h-16 opacity-30" />}
             <button onClick={onToggleFavorite} className="absolute top-4 left-4 p-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors"><Star className={`w-6 h-6 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} /></button>
          </div>
          {images.length > 0 && (<div className="h-16 md:h-20 flex space-x-2 overflow-x-auto custom-scrollbar pb-2">{images.map((img, idx) => (<button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-slate-900 ring-2 ring-slate-200' : 'border-slate-200 opacity-60 hover:opacity-100'}`}><img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" /></button>))}</div>)}
        </div>
        <div className="w-full md:w-1/2 p-6 md:p-10 overflow-y-auto bg-white">
          <div className="mb-6 md:mb-8">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-full uppercase tracking-wider">{product.category}</span>
              {product.awards && product.awards.map(award => (<span key={award} className="inline-flex items-center px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-sm"><Trophy className="w-3 h-3 mr-1" /> {award}</span>))}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">{product.name}</h2>
            {product.designer && <p className="text-sm text-slate-500 font-medium mb-1">Designed by {product.designer}</p>}
            {product.isNew && <span className="text-red-500 text-sm font-semibold tracking-wide">● NEW ARRIVAL</span>}
          </div>
          
          <div className="space-y-6">
            <div className="relative group"><h3 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wide mb-3"><Settings className="w-4 h-4 mr-2" /> Specifications<button onClick={copyToClipboard} className="ml-2 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3 h-3" /></button></h3><p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl text-sm border border-slate-100">{product.specs}</p></div>
            <div><h3 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wide mb-3"><Tag className="w-4 h-4 mr-2" /> Options & Features</h3><div className="flex flex-wrap gap-2">{product.options && product.options.map((opt, idx) => (<span key={idx} className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"><Layers className="w-3 h-3 mr-1.5" /> {opt}</span>))}{product.features && product.features.map((feature, idx) => (<span key={idx} className="flex items-center px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm"><Check className="w-3 h-3 mr-1.5 text-green-500" /> {feature}</span>))}</div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div><h3 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Body Color</h3><div className="flex flex-wrap gap-2">{product.bodyColors && product.bodyColors.map((color, idx) => (<div key={idx} className="flex items-center space-x-2 border border-slate-200 rounded-lg px-2 py-1 pr-3"><div className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: color }} /><span className="text-xs text-slate-600">{color}</span></div>))}</div></div>
               <div><h3 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Upholstery Color</h3><div className="flex flex-wrap gap-2">{product.upholsteryColors && product.upholsteryColors.map((color, idx) => (<div key={idx} className="flex items-center space-x-2 border border-slate-200 rounded-lg px-2 py-1 pr-3"><div className="w-4 h-4 rounded-sm border border-slate-200 shadow-sm" style={{ backgroundColor: color }} /><span className="text-xs text-slate-600">{color}</span></div>))}</div></div>
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-3">
               {product.productLink && <a href={product.productLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:underline"><LinkIcon className="w-4 h-4 mr-2" /> Product Webpage</a>}
               {product.attachments && product.attachments.length > 0 && <div className="space-y-1"><h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Downloads</h3>{product.attachments.map((file, idx) => (<a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-slate-600 hover:text-slate-900 p-2 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors"><Paperclip className="w-4 h-4 mr-2 text-slate-400" /> {file.name}</a>))}</div>}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
             <div className="flex space-x-2">
                <button onClick={copyShareLink} className="flex items-center px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">
                   <Share2 className="w-4 h-4 mr-2" /> Share
                </button>
                <button onClick={handleDownloadCard} className="flex items-center px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">
                   <Download className="w-4 h-4 mr-2" /> Card
                </button>
             </div>
             {isAdmin && (<button onClick={onEdit} className="flex items-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"><Edit2 className="w-4 h-4 mr-2" />Edit Data</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductFormModal({ categories, existingData, onClose, onSave, onDelete, isFirebaseAvailable, initialCategory }) {
  const isEditMode = !!existingData;
  const fileInputRef = useRef(null);
  
  const defaultCategory = (initialCategory && initialCategory !== 'ALL' && initialCategory !== 'NEW' && initialCategory !== 'MY_PICK' && initialCategory !== 'DASHBOARD') ? initialCategory : 'EXECUTIVE';

  const [formData, setFormData] = useState({ 
    id: null, name: '', category: defaultCategory, specs: '', designer: '',
    featuresString: '', optionsString: '', materialsString: '',
    bodyColorsString: '', upholsteryColorsString: '', awardsString: '',
    productLink: '',
    isNew: false, launchDate: new Date().toISOString().split('T')[0], images: [], attachments: []
  });
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (existingData) {
      setFormData({ 
        id: existingData.id, 
        name: existingData.name, 
        category: existingData.category, 
        specs: existingData.specs, 
        designer: existingData.designer || '',
        featuresString: existingData.features ? existingData.features.join(', ') : '', 
        optionsString: existingData.options ? existingData.options.join(', ') : '',
        materialsString: existingData.materials ? existingData.materials.join(', ') : '',
        bodyColorsString: existingData.bodyColors ? existingData.bodyColors.join(', ') : '',
        upholsteryColorsString: existingData.upholsteryColors ? existingData.upholsteryColors.join(', ') : '',
        awardsString: existingData.awards ? existingData.awards.join(', ') : '',
        productLink: existingData.productLink || '',
        isNew: existingData.isNew, 
        launchDate: existingData.launchDate || new Date().toISOString().split('T')[0],
        images: existingData.images || [],
        attachments: existingData.attachments || []
      });
    }
  }, [existingData]);

  const processImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; let width = img.width; let height = img.height;
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setIsProcessingImage(true);
      const newImageUrls = [];
      for (const file of files) { try { const resizedImage = await processImage(file); newImageUrls.push(resizedImage); } catch (error) { console.error(error); } }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImageUrls] }));
      setIsProcessingImage(false);
    }
  };

  const handleAttachmentUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 300 * 1024) { alert(`${file.name} is too large (>300KB). Please use external link.`); return; }
      const reader = new FileReader();
      reader.onload = (e) => { setFormData(prev => ({ ...prev, attachments: [...prev.attachments, { name: file.name, url: e.target.result }] })); };
      reader.readAsDataURL(file);
    });
  };

  const handleAddLinkAttachment = () => {
    const url = prompt("Enter file URL (Google Drive, Dropbox, etc):");
    const name = prompt("Enter file display name:");
    if (url && name) { setFormData(prev => ({ ...prev, attachments: [...prev.attachments, { name, url }] })); }
  };

  const removeImage = (idx) => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  const setMainImage = (idx) => setFormData(prev => { const newImgs = [...prev.images]; const [moved] = newImgs.splice(idx, 1); newImgs.unshift(moved); return { ...prev, images: newImgs }; });
  const removeAttachment = (idx) => setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      id: formData.id, name: formData.name, category: formData.category, specs: formData.specs, designer: formData.designer,
      features: formData.featuresString.split(',').map(s => s.trim()).filter(s => s), 
      options: formData.optionsString.split(',').map(s => s.trim()).filter(s => s),
      materials: formData.materialsString.split(',').map(s => s.trim()).filter(s => s),
      bodyColors: formData.bodyColorsString.split(',').map(s => s.trim()).filter(s => s),
      upholsteryColors: formData.upholsteryColorsString.split(',').map(s => s.trim()).filter(s => s),
      awards: formData.awardsString.split(',').map(s => s.trim()).filter(s => s),
      productLink: formData.productLink,
      isNew: formData.isNew, launchDate: formData.launchDate,
      images: formData.images, attachments: formData.attachments
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div><h2 className="text-xl font-bold text-slate-800">{isEditMode ? '제품 데이터 수정' : '신제품 등록'}</h2><p className="text-xs text-slate-500 mt-1">{isFirebaseAvailable ? "Cloud Database Mode" : "Local Storage Mode"}</p></div><button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4"><label className="text-sm font-bold text-slate-900 flex items-center"><ImageIcon className="w-4 h-4 mr-2" /> 제품 이미지 관리</label><button type="button" onClick={() => fileInputRef.current?.click()} disabled={isProcessingImage} className="text-xs flex items-center bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors font-medium text-slate-700">{isProcessingImage ? '처리 중...' : <><Plus className="w-3 h-3 mr-1" /> 이미지 추가</>}</button><input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" /></div>
            <div className="grid grid-cols-4 gap-4">{formData.images.map((img, idx) => (<div key={idx} className="relative group aspect-square bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm"><img src={img} alt="preview" className="w-full h-full object-cover" />{idx === 0 && <div className="absolute top-2 left-2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow-md z-10">대표</div>}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2">{idx !== 0 && <button type="button" onClick={() => setMainImage(idx)} className="px-3 py-1 bg-white/90 text-xs font-bold rounded-full hover:bg-white text-slate-800">대표 설정</button>}<button type="button" onClick={() => removeImage(idx)} className="p-2 bg-red-500/90 rounded-full text-white hover:bg-red-600"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">제품명</label><input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">카테고리</label><select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
             <div><label className="block text-sm font-medium text-slate-700 mb-1">출시일</label><input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.launchDate} onChange={e => setFormData({...formData, launchDate: e.target.value})} /></div>
             <div><label className="block text-sm font-medium text-slate-700 mb-1">디자이너</label><input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.designer} onChange={e => setFormData({...formData, designer: e.target.value})} /></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">상세 사양 (Main Specs)</label><textarea required rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none resize-none" value={formData.specs} onChange={e => setFormData({...formData, specs: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-slate-700 mb-1">마감재 (쉼표 구분)</label><input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.materialsString} onChange={e => setFormData({...formData, materialsString: e.target.value})} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">수상 내역 (Award)</label><input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.awardsString} onChange={e => setFormData({...formData, awardsString: e.target.value})} /></div></div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Link (Web)</label>
               <div className="flex"><div className="bg-slate-200 px-3 py-2 rounded-l-lg text-slate-500"><LinkIcon className="w-4 h-4"/></div><input type="text" className="w-full border border-slate-300 rounded-r-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" placeholder="https://..." value={formData.productLink} onChange={e => setFormData({...formData, productLink: e.target.value})} /></div>
             </div>
             <div>
               <div className="flex justify-between items-center mb-2"><label className="block text-xs font-bold text-slate-500 uppercase">Attachments (PDF/Doc)</label><div className="space-x-2"><button type="button" onClick={() => document.getElementById('file-upload').click()} className="text-[10px] bg-white border px-2 py-1 rounded">File Upload</button><button type="button" onClick={handleAddLinkAttachment} className="text-[10px] bg-white border px-2 py-1 rounded">Add Link</button></div><input id="file-upload" type="file" onChange={handleAttachmentUpload} className="hidden" multiple accept=".pdf,.doc,.docx" /></div>
               <div className="space-y-1">{formData.attachments.map((file, idx) => (<div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-slate-200"><span className="truncate w-3/4">{file.name}</span><button type="button" onClick={() => removeAttachment(idx)} className="text-red-500"><X className="w-4 h-4" /></button></div>))}</div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-slate-700 mb-1">Body Colors</label><input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.bodyColorsString} onChange={e => setFormData({...formData, bodyColorsString: e.target.value})} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Upholstery Colors</label><input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.upholsteryColorsString} onChange={e => setFormData({...formData, upholsteryColorsString: e.target.value})} /></div></div>
          
          <div className="grid grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-slate-700 mb-1">주요 기능 (쉼표 구분)</label><input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.featuresString} onChange={e => setFormData({...formData, featuresString: e.target.value})} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">추가 옵션 (쉼표 구분)</label><input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.optionsString} onChange={e => setFormData({...formData, optionsString: e.target.value})} /></div></div>

          <div className="flex items-center space-x-2 pt-2"><input type="checkbox" id="isNew" checked={formData.isNew} onChange={e => setFormData({...formData, isNew: e.target.checked})} className="w-4 h-4 text-slate-900 rounded border-gray-300" /><label htmlFor="isNew" className="text-sm text-slate-700 font-medium">신제품(NEW) 배지 표시</label></div>
        </form>
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center"><div>{isEditMode && <button type="button" onClick={() => onDelete(formData.id, formData.name)} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center px-2 py-1"><Trash2 className="w-4 h-4 mr-1" /> 제품 삭제</button>}</div><div className="flex space-x-3"><button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white transition-colors">취소</button><button onClick={handleSubmit} disabled={isProcessingImage} className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50">{isProcessingImage ? '이미지 처리 중...' : (isEditMode ? '변경사항 저장' : '제품 등록하기')}</button></div></div>
      </div>
    </div>
  );
}