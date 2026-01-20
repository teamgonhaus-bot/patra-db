/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Search, X, Check, Tag, Palette, Settings, Image as ImageIcon,
  Upload, Trash2, Edit2, RefreshCw, Cloud, CloudOff, Lock, Unlock,
  Database, Download, Info, ArrowUpDown, ListFilter, Menu, History,
  Copy, ChevronRight, Activity, ShieldAlert, FileJson
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, addDoc, query, orderBy, limit, getDocs 
} from 'firebase/firestore';

// ----------------------------------------------------------------------
// [중요] 배포 시 사용할 실제 Firebase 설정 (본인의 키로 교체 필요)
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
  // Vercel 배포 시 이곳에 본인의 Firebase 프로젝트 설정을 넣으세요.
  // 설정이 비어있으면 로컬 스토리지 모드로 작동합니다.
};

// ----------------------------------------------------------------------
// 상수 및 설정
// ----------------------------------------------------------------------
const APP_VERSION = "v1.4.0"; // Server Sync & Dashboard Update
const BUILD_DATE = "2024.05.23";
const ADMIN_PASSWORD = "adminlcg1"; 

// Firebase 초기화 로직 (Canvas 환경 vs 실제 배포 환경 자동 감지)
let db = null;
let auth = null;
let isFirebaseAvailable = false;
let appId = 'default-app-id';

try {
  // 1순위: Canvas 환경 변수 사용
  if (typeof __firebase_config !== 'undefined') {
    const firebaseConfig = JSON.parse(__firebase_config);
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    isFirebaseAvailable = true;
  } 
  // 2순위: 사용자가 입력한 설정 사용 (Vercel 배포용)
  else if (YOUR_FIREBASE_CONFIG.apiKey) {
    const app = initializeApp(YOUR_FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = 'patra-production'; // 배포용 ID
    isFirebaseAvailable = true;
  }
} catch (e) {
  console.warn("Firebase Init Failed. Falling back to Local Storage.", e);
}

const CATEGORIES = [
  { id: 'ALL', label: 'MAJOR PRODUCTS' },
  { id: 'NEW', label: 'NEW ARRIVALS' },
  { id: 'EXECUTIVE', label: 'EXECUTIVE' },
  { id: 'TASK', label: 'TASK' },
  { id: 'CONFERENCE', label: 'CONFERENCE' },
  { id: 'GUEST', label: 'GUEST' },
  { id: 'LOUNGE', label: 'LOUNGE' },
  { id: 'HOME', label: 'HOME' },
  { id: 'TABLE', label: 'TABLE' },
  { id: 'ETC', label: 'ETC' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  
  // UI 상태
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 관리자 & 대시보드
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [toast, setToast] = useState(null);

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
          // 인증 실패 시 로컬로 전환
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
        setUser({ uid: 'local-user', isAnonymous: true });
      }
    };
    initApp();
  }, []);

  // 2. 실시간 데이터 동기화 (핵심 기능)
  useEffect(() => {
    if (isFirebaseAvailable && user && db) {
      // Products Listener
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

  // 로컬 스토리지 헬퍼
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

  // 관리자 토글
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

  // 로그 기록 (DB 저장)
  const logActivity = async (action, productName, details = "") => {
    if (!isFirebaseAvailable || !db) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), {
        action,
        productName,
        details,
        timestamp: Date.now(),
        adminId: 'admin' // 실제로는 user.uid 등을 사용
      });
    } catch (e) {
      console.error("Logging failed", e);
    }
  };

  // 로그 불러오기 (Admin Dashboard용)
  const fetchLogs = async () => {
    if (!isFirebaseAvailable || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), orderBy('timestamp', 'desc'), limit(100));
    onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivityLogs(logs);
    });
  };

  // 데이터 전체 백업 (JSON 다운로드)
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
    link.download = `PATRA_DB_FULL_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("전체 데이터 백업이 완료되었습니다.");
  };

  // 필터링 및 정렬
  const getProcessedProducts = () => {
    let filtered = products.filter(product => {
      const matchesCategory = 
        activeCategory === 'ALL' ? true :
        activeCategory === 'NEW' ? product.isNew :
        product.category === activeCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            product.specs.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    if (sortOption === 'newest') {
      filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (sortOption === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  };
  const processedProducts = getProcessedProducts();

  // 저장 로직
  const handleSaveProduct = async (productData) => {
    const docId = productData.id ? String(productData.id) : String(Date.now());
    const isEdit = !!productData.id && products.some(p => String(p.id) === docId);
    
    const payload = {
      ...productData,
      id: docId,
      createdAt: productData.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    if (isFirebaseAvailable && db) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', docId);
        await setDoc(docRef, payload, { merge: true });
        await logActivity(isEdit ? "UPDATE" : "CREATE", productData.name, isEdit ? "제품 사양 수정됨" : "신규 제품 DB 등록");
      } catch (error) {
        showToast("클라우드 저장 실패: " + error.message, "error");
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
    showToast(isEdit ? "업데이트가 완료되었습니다." : "서버에 저장되었습니다.");
  };

  // 삭제 로직
  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    if (isFirebaseAvailable && db) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', String(productId));
        await deleteDoc(docRef);
        await logActivity("DELETE", productName, "제품 데이터 영구 삭제");
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
    showToast("제품이 삭제되었습니다.");
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      
      {/* 모바일 메뉴 오버레이 */}
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
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">P</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">PATRA <span className="text-xs font-normal text-slate-500 block">Design Lab DB</span></h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <div className="text-xs font-semibold text-slate-400 mb-2 px-2 flex justify-between items-center">
             <span>COLLECTIONS</span>
             {isFirebaseAvailable ? 
                <Cloud className="w-3 h-3 text-green-500" title="Server Online" /> : 
                <CloudOff className="w-3 h-3 text-red-400" title="Local Mode" />
             }
          </div>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group
                ${activeCategory === cat.id 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              {cat.label}
              {cat.id === 'NEW' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
            </button>
          ))}
        </nav>
        
        {/* 하단 정보 영역 */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
           <button 
             onClick={toggleAdminMode}
             className={`w-full flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
               isAdmin ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-500 hover:bg-slate-100'
             }`}
           >
             {isAdmin ? <Unlock className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2" />}
             {isAdmin ? "ADMIN CONSOLE" : "VIEWER ACCESS"}
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center space-x-4 w-full md:w-1/2">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="제품명, 사양 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-slate-300 rounded-full text-sm transition-all outline-none focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
             <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-1">
                <button onClick={() => setSortOption('newest')} className={`p-1.5 rounded-md transition-all ${sortOption === 'newest' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`} title="Newest"><ListFilter className="w-4 h-4" /></button>
                <button onClick={() => setSortOption('name')} className={`p-1.5 rounded-md transition-all ${sortOption === 'name' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`} title="Name (A-Z)"><ArrowUpDown className="w-4 h-4" /></button>
             </div>

            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setIsFormOpen(true);
                }}
                className="flex items-center space-x-2 bg-slate-900 text-white px-3 py-2 md:px-4 md:py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-300/50"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">신제품 등록</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          {isLoading && products.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {[1,2,3,4].map(n => (
                 <div key={n} className="bg-white rounded-2xl p-4 h-[350px] animate-pulse border border-slate-100">
                    <div className="bg-slate-200 h-48 rounded-lg mb-4"></div>
                    <div className="bg-slate-200 h-6 w-3/4 rounded mb-2"></div>
                    <div className="bg-slate-200 h-4 w-1/2 rounded"></div>
                 </div>
               ))}
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                    {CATEGORIES.find(c => c.id === activeCategory)?.label}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Total {processedProducts.length} items 
                    {!isFirebaseAvailable && <span className="ml-2 text-red-400 text-xs font-bold">(Local Mode)</span>}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {processedProducts.map(product => (
                  <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
                ))}
                
                {isAdmin && (
                  <button 
                    onClick={() => {
                      setEditingProduct(null);
                      setIsFormOpen(true);
                    }}
                    className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center min-h-[300px] text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all group bg-white/50"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-slate-200 transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-medium">Add New Product</span>
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
        </div>
      </main>

      {/* 통합 관리자 대시보드 */}
      {showAdminDashboard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="text-lg font-bold flex items-center"><ShieldAlert className="w-5 h-5 mr-2" /> Admin Dashboard</h3>
              <button onClick={() => setShowAdminDashboard(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
               {/* Dashboard Sidebar */}
               <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-4 space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                     <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Server Status</h4>
                     <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isFirebaseAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-bold text-slate-700">{isFirebaseAvailable ? 'Online (Firebase)' : 'Offline (Local)'}</span>
                     </div>
                     <p className="text-[10px] text-slate-400 mt-1">
                       {isFirebaseAvailable ? '모든 기기 동기화 중' : '내 컴퓨터에만 저장됨'}
                     </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                     <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Data Management</h4>
                     <button 
                        onClick={handleFullBackup}
                        className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center hover:bg-slate-200 mb-2"
                     >
                        <FileJson className="w-4 h-4 mr-2" /> Full Backup (JSON)
                     </button>
                  </div>
               </div>

               {/* Log Viewer */}
               <div className="flex-1 flex flex-col bg-white">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                     <h4 className="font-bold text-slate-800 flex items-center"><Activity className="w-4 h-4 mr-2 text-blue-500" /> Recent Activity Logs</h4>
                     <button onClick={fetchLogs} className="text-xs text-blue-500 hover:underline">Refresh</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                    {activityLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <History className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs">기록된 활동이 없습니다.</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Action</th>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3 hidden md:table-cell">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activityLogs.map((log, idx) => (
                            <tr key={log.id || idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                  log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                                  log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-800">{log.productName}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{log.details}</td>
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

      {/* 토스트 알림 */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900/90 backdrop-blur text-white px-4 py-3 rounded-lg shadow-2xl flex items-center space-x-3 animate-in slide-in-from-bottom-5 fade-in z-[80]">
          {toast.type === 'success' ? <Check className="w-5 h-5 text-green-400" /> : <Info className="w-5 h-5 text-red-400" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* 상세 보기 및 폼 모달은 기존 유지 */}
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
        />
      )}

      {isFormOpen && (
        <ProductFormModal 
          categories={CATEGORIES.filter(c => c.id !== 'ALL' && c.id !== 'NEW')}
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
// 하위 컴포넌트 (디자인 변경 없음, 기능 유지)
// ----------------------------------------------------------------------

function ProductCard({ product, onClick }) {
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;
  return (
    <div onClick={onClick} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-slate-100 flex flex-col h-full animate-in fade-in duration-500">
      <div className="relative h-56 md:h-64 overflow-hidden bg-slate-50 p-6 flex items-center justify-center">
        {product.isNew && <span className="absolute top-4 left-4 bg-black text-white text-[10px] font-bold px-2 py-1 rounded-sm z-10">NEW</span>}
        <div className="w-full h-full rounded-lg flex items-center justify-center text-slate-400 overflow-hidden relative">
            {mainImage ? <img src={mainImage} alt={product.name} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" /> : <div className="text-center opacity-50"><ImageIcon className="w-8 h-8 mx-auto mb-2" /><span className="text-xs">{product.name}</span></div>}
        </div>
      </div>
      <div className="p-4 md:p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2"><span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wide">{product.category}</span></div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{product.name}</h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{product.specs}</p>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
          <div className="flex -space-x-1">
            {product.colors && product.colors.slice(0, 5).map((color, i) => (<div key={i} className="w-4 h-4 rounded-full border border-white ring-1 ring-slate-100 shadow-sm" style={{ backgroundColor: color }} title={color} />))}
            {product.colors && product.colors.length > 5 && (<div className="w-4 h-4 rounded-full border border-white ring-1 ring-slate-100 bg-slate-100 flex items-center justify-center text-[8px] text-slate-500">+</div>)}
          </div>
          <span className="text-xs text-blue-600 font-semibold group-hover:translate-x-1 transition-transform flex items-center">View <ChevronRight className="w-3 h-3 ml-0.5" /></span>
        </div>
      </div>
    </div>
  );
}

function ProductDetailModal({ product, onClose, onEdit, isAdmin, showToast }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  if (!product) return null;
  const images = product.images || [];
  const currentImage = images.length > 0 ? images[currentImageIndex] : null;
  const copyToClipboard = () => {
    const text = `[${product.name}]\n- Category: ${product.category}\n- Specs: ${product.specs}\n- Features: ${product.features?.join(', ')}`;
    navigator.clipboard.writeText(text);
    showToast("제품 정보가 클립보드에 복사되었습니다.");
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-slate-100 rounded-full z-10 transition-colors"><X className="w-5 h-5 text-slate-600" /></button>
        <div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 flex flex-col border-r border-slate-100">
          <div className="flex-1 w-full bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm overflow-hidden p-4 mb-4 relative">
             {currentImage ? <img src={currentImage} alt="Main View" className="w-full h-full object-contain" /> : <ImageIcon className="w-16 h-16 opacity-30" />}
          </div>
          {images.length > 0 && (<div className="h-16 md:h-20 flex space-x-2 overflow-x-auto custom-scrollbar pb-2">{images.map((img, idx) => (<button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-slate-900 ring-2 ring-slate-200' : 'border-slate-200 opacity-60 hover:opacity-100'}`}><img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" /></button>))}</div>)}
        </div>
        <div className="w-full md:w-1/2 p-6 md:p-10 overflow-y-auto bg-white">
          <div className="mb-6 md:mb-8 flex justify-between items-start">
            <div><span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-full mb-3 uppercase tracking-wider">{product.category}</span><h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{product.name}</h2>{product.isNew && <span className="text-red-500 text-sm font-semibold tracking-wide">● NEW ARRIVAL</span>}</div>
          </div>
          <div className="space-y-6 md:space-y-8">
            <div className="relative group"><h3 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wide mb-3"><Settings className="w-4 h-4 mr-2" /> Specifications<button onClick={copyToClipboard} className="ml-2 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3 h-3" /></button></h3><p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl text-sm border border-slate-100">{product.specs}</p></div>
            <div><h3 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wide mb-3"><Tag className="w-4 h-4 mr-2" /> Key Features</h3><ul className="grid grid-cols-1 gap-2">{product.features && product.features.map((feature, idx) => (<li key={idx} className="flex items-center text-sm text-slate-600"><Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />{feature}</li>))}</ul></div>
            <div><h3 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wide mb-3"><Palette className="w-4 h-4 mr-2" /> Color Options</h3><div className="flex flex-wrap gap-2">{product.colors && product.colors.map((color, idx) => (<div key={idx} className="flex items-center space-x-2 border border-slate-200 rounded-lg px-2 py-1"><div className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: color }} /><span className="text-sm text-slate-600">{color}</span></div>))}</div></div>
          </div>
          <div className="mt-12 pt-6 border-t border-slate-100 flex justify-end space-x-3">{isAdmin && (<button onClick={onEdit} className="flex items-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"><Edit2 className="w-4 h-4 mr-2" />Edit Data</button>)}<button className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">Download Spec Sheet</button></div>
        </div>
      </div>
    </div>
  );
}

function ProductFormModal({ categories, existingData, onClose, onSave, onDelete, isFirebaseAvailable }) {
  const isEditMode = !!existingData;
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({ id: isEditMode ? existingData.id : null, name: '', category: categories[0]?.id || 'EXECUTIVE', specs: '', featuresString: '', colorsString: '', isNew: false, images: [] });
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (existingData) {
      setFormData({ id: existingData.id, name: existingData.name, category: existingData.category, specs: existingData.specs, featuresString: existingData.features ? existingData.features.join(', ') : '', colorsString: existingData.colors ? existingData.colors.join(', ') : '', isNew: existingData.isNew, images: existingData.images || [] });
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

  const removeImage = (idx) => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  const setMainImage = (idx) => setFormData(prev => { const newImgs = [...prev.images]; const [moved] = newImgs.splice(idx, 1); newImgs.unshift(moved); return { ...prev, images: newImgs }; });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: formData.id, name: formData.name, category: formData.category, specs: formData.specs, features: formData.featuresString.split(',').map(s => s.trim()).filter(s => s), colors: formData.colorsString.split(',').map(s => s.trim()).filter(s => s), isNew: formData.isNew, images: formData.images });
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
          <div className="grid grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-slate-700 mb-1">제품명</label><input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">카테고리</label><select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">상세 사양</label><textarea required rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none resize-none" value={formData.specs} onChange={e => setFormData({...formData, specs: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-slate-700 mb-1">주요 기능</label><input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.featuresString} onChange={e => setFormData({...formData, featuresString: e.target.value})} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">컬러 옵션</label><input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.colorsString} onChange={e => setFormData({...formData, colorsString: e.target.value})} /></div></div>
          <div className="flex items-center space-x-2 pt-2 bg-slate-50 p-3 rounded-lg border border-slate-100"><input type="checkbox" id="isNew" checked={formData.isNew} onChange={e => setFormData({...formData, isNew: e.target.checked})} className="w-4 h-4 text-slate-900 rounded border-gray-300 focus:ring-slate-900" /><label htmlFor="isNew" className="text-sm text-slate-700 font-medium select-none cursor-pointer">신제품(NEW) 배지 표시</label></div>
        </form>
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center"><div>{isEditMode && <button type="button" onClick={() => onDelete(formData.id, formData.name)} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center px-2 py-1"><Trash2 className="w-4 h-4 mr-1" /> 제품 삭제</button>}</div><div className="flex space-x-3"><button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white transition-colors">취소</button><button onClick={handleSubmit} disabled={isProcessingImage} className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50">{isProcessingImage ? '이미지 처리 중...' : (isEditMode ? '변경사항 저장' : '제품 등록하기')}</button></div></div>
      </div>
    </div>
  );
}