/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  Check, 
  Tag, 
  Palette, 
  Settings,
  Image as ImageIcon,
  Upload,
  Trash2,
  Edit2,
  RefreshCw,
  Cloud,
  CloudOff,
  Lock,
  Unlock,
  Database,
  Download,
  Info
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

// ----------------------------------------------------------------------
// 상수 및 설정
// ----------------------------------------------------------------------
const APP_VERSION = "v1.1.0"; // 빌드 버전 표시
const BUILD_DATE = "2024.05.21";

// Firebase 초기화 (Hybrid Mode)
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
} catch (e) {
  console.warn("Firebase config not found. Falling back to Local Storage.");
}

// 카테고리 정의 ('ALL'을 'MAJOR'로 표현)
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
  
  // 상태 관리
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 관리자 모드 & DB 정보
  const [isAdmin, setIsAdmin] = useState(false); // 기본은 뷰어 모드
  const [showDbInfo, setShowDbInfo] = useState(false);
  const [toast, setToast] = useState(null); // 토스트 메시지 { message, type }

  // 1. 초기화
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
        }
      } else {
        loadFromLocalStorage();
        setUser({ uid: 'local-user', isAnonymous: true });
      }
    };
    initApp();
  }, []);

  // 2. 데이터 동기화
  useEffect(() => {
    if (isFirebaseAvailable && user && db) {
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'products');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        loadedProducts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setProducts(loadedProducts);
        setIsLoading(false);
      }, (error) => {
        console.error("Data Fetch Error:", error);
        setIsLoading(false);
      });
      return () => unsubscribe();
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

  // 토스트 메시지 표시 함수
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 데이터 내보내기 (JSON 다운로드)
  const handleExportData = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `patra_db_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("데이터베이스가 JSON 파일로 다운로드되었습니다.");
  };

  // 필터링
  const filteredProducts = products.filter(product => {
    const matchesCategory = 
      activeCategory === 'ALL' ? true :
      activeCategory === 'NEW' ? product.isNew :
      product.category === activeCategory;
    
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.specs.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // 저장/수정
  const handleSaveProduct = async (productData) => {
    const docId = productData.id ? String(productData.id) : String(Date.now());
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
      } catch (error) {
        showToast("클라우드 저장 실패", "error");
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
    showToast(editingProduct ? "제품 정보가 수정되었습니다." : "새 제품이 등록되었습니다.");
  };

  // 삭제
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    if (isFirebaseAvailable && db) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', String(productId));
        await deleteDoc(docRef);
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
      
      {/* 사이드바 */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10 flex-shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">P</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">PATRA <span className="text-xs font-normal text-slate-500 block">Design Lab DB</span></h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <div className="text-xs font-semibold text-slate-400 mb-2 px-2 flex justify-between items-center">
             <span>COLLECTIONS</span>
          </div>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
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
           {/* 관리자 모드 토글 */}
           <button 
             onClick={() => setIsAdmin(!isAdmin)}
             className={`w-full flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
               isAdmin ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-500 hover:bg-slate-100'
             }`}
           >
             {isAdmin ? <Unlock className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2" />}
             {isAdmin ? "ADMIN MODE ON" : "VIEWER MODE"}
           </button>

           {/* DB 정보 및 버전 */}
           <div className="flex justify-between items-end">
              <button 
                onClick={() => setShowDbInfo(true)}
                className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center"
              >
                <Database className="w-3 h-3 mr-1" />
                Data Info
              </button>
              <div className="text-[10px] text-slate-300 text-right">
                <p>{APP_VERSION}</p>
                <p>{BUILD_DATE}</p>
              </div>
           </div>
        </div>
      </aside>

      {/* 메인 영역 */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* 헤더 */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center space-x-4 w-1/3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Find Products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-slate-300 rounded-full text-sm transition-all outline-none focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setIsFormOpen(true);
                }}
                className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-300/50 animate-in fade-in"
              >
                <Plus className="w-4 h-4" />
                <span>신제품 등록</span>
              </button>
            )}
          </div>
        </header>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {CATEGORIES.find(c => c.id === activeCategory)?.label}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">Total {filteredProducts.length} items</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onClick={() => setSelectedProduct(product)} 
                  />
                ))}
                
                {/* Admin일 때만 추가 카드 표시 */}
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

              {filteredProducts.length === 0 && !isLoading && (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Cloud className="w-12 h-12 mb-4 opacity-20" />
                    <p>등록된 데이터가 없습니다.</p>
                 </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* 토스트 알림 */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-in slide-in-from-bottom-5 fade-in z-[60]">
          {toast.type === 'success' ? <Check className="w-5 h-5 text-green-400" /> : <Info className="w-5 h-5 text-red-400" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* 모달: DB 정보 */}
      {showDbInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold flex items-center"><Database className="w-5 h-5 mr-2" /> Database Status</h3>
               <button onClick={() => setShowDbInfo(false)}><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             
             <div className="space-y-4 text-sm text-slate-600">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="flex justify-between mb-1">
                    <span className="font-semibold">Status:</span> 
                    <span className={isFirebaseAvailable ? "text-green-600 font-bold" : "text-orange-500"}>
                      {isFirebaseAvailable ? "Connected (Cloud)" : "Local Only"}
                    </span>
                  </p>
                  <p className="flex justify-between mb-1">
                    <span className="font-semibold">Provider:</span> 
                    <span>{isFirebaseAvailable ? "Google Firestore" : "LocalStorage"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-semibold">Total Records:</span> 
                    <span>{products.length}</span>
                  </p>
                </div>
                
                <div className="text-xs text-slate-500">
                  <p className="mb-2">⚠️ 클라우드 DB 주소는 보안상 노출되지 않습니다. 데이터 백업이 필요하면 아래 버튼을 사용하여 JSON 파일로 내보내세요.</p>
                </div>

                <button 
                  onClick={handleExportData}
                  className="w-full py-2 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" /> Export Data (JSON)
                </button>
             </div>
          </div>
        </div>
      )}

      {/* 상세 보기 모달 */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onEdit={() => {
            setEditingProduct(selectedProduct);
            setIsFormOpen(true);
          }}
          isAdmin={isAdmin}
        />
      )}

      {/* 등록/수정 폼 모달 */}
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
// 하위 컴포넌트
// ----------------------------------------------------------------------

function ProductCard({ product, onClick }) {
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-slate-100 flex flex-col h-full animate-in fade-in duration-500"
    >
      <div className="relative h-64 overflow-hidden bg-slate-50 p-6 flex items-center justify-center">
        {product.isNew && (
          <span className="absolute top-4 left-4 bg-black text-white text-[10px] font-bold px-2 py-1 rounded-sm z-10">NEW</span>
        )}
        <div className="w-full h-full rounded-lg flex items-center justify-center text-slate-400 overflow-hidden relative">
            {mainImage ? (
              <img 
                src={mainImage} 
                alt={product.name} 
                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
             <div className="text-center opacity-50">
                <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                <span className="text-xs">{product.name}</span>
             </div>
            )}
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wide">{product.category}</span>
          {product.images && product.images.length > 1 && (
             <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded">+{product.images.length - 1}</span>
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{product.name}</h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{product.specs}</p>
        
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
          <div className="flex -space-x-1">
            {product.colors && product.colors.slice(0, 3).map((color, i) => (
              <div key={i} className="w-4 h-4 rounded-full border border-white ring-1 ring-slate-100 bg-slate-400" title={color} />
            ))}
          </div>
          <span className="text-xs text-blue-600 font-semibold group-hover:translate-x-1 transition-transform flex items-center">
            View Details
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductDetailModal({ product, onClose, onEdit, isAdmin }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images.length > 0 ? images[currentImageIndex] : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-slate-100 rounded-full z-10 transition-colors"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>

        {/* Left: Image Gallery */}
        <div className="w-full md:w-1/2 bg-slate-50 p-8 flex flex-col border-r border-slate-100">
          <div className="flex-1 w-full bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm overflow-hidden p-4 mb-4 relative">
             {currentImage ? (
                <img src={currentImage} alt="Main View" className="w-full h-full object-contain" />
             ) : (
                <ImageIcon className="w-16 h-16 opacity-30" />
             )}
          </div>
          
          {images.length > 0 && (
            <div className="h-20 flex space-x-2 overflow-x-auto custom-scrollbar pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === idx ? 'border-slate-900 ring-2 ring-slate-200' : 'border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info Area */}
        <div className="w-full md:w-1/2 p-10 overflow-y-auto bg-white">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                {product.category}
              </span>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">{product.name}</h2>
              {product.isNew && <span className="text-red-500 text-sm font-semibold tracking-wide">● NEW ARRIVAL</span>}
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
                <Settings className="w-4 h-4 mr-2" /> Specifications
              </h3>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl text-sm border border-slate-100">
                {product.specs}
              </p>
            </div>

            <div>
              <h3 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
                <Tag className="w-4 h-4 mr-2" /> Key Features
              </h3>
              <ul className="grid grid-cols-1 gap-2">
                {product.features && product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm text-slate-600">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
                <Palette className="w-4 h-4 mr-2" /> Color Options
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.colors && product.colors.map((color, idx) => (
                  <span key={idx} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-400 transition-colors cursor-default">
                    {color}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100 flex justify-end space-x-3">
             {isAdmin && (
               <button 
                 onClick={onEdit}
                 className="flex items-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
               >
                 <Edit2 className="w-4 h-4 mr-2" />
                 Edit Data
               </button>
             )}
             <button className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
               Download Spec Sheet
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductFormModal({ categories, existingData, onClose, onSave, onDelete, isFirebaseAvailable }) {
  const isEditMode = !!existingData;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    id: isEditMode ? existingData.id : null,
    name: '',
    category: categories[0]?.id || 'EXECUTIVE',
    specs: '',
    featuresString: '',
    colorsString: '',
    isNew: false,
    images: [],
  });
  
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (existingData) {
      setFormData({
        id: existingData.id,
        name: existingData.name,
        category: existingData.category,
        specs: existingData.specs,
        featuresString: existingData.features ? existingData.features.join(', ') : '',
        colorsString: existingData.colors ? existingData.colors.join(', ') : '',
        isNew: existingData.isNew,
        images: existingData.images || [],
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
          const MAX_WIDTH = 800; 
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
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
      for (const file of files) {
        try {
          const resizedImage = await processImage(file);
          newImageUrls.push(resizedImage);
        } catch (error) {
          console.error("Image processing failed", error);
        }
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImageUrls] }));
      setIsProcessingImage(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== indexToRemove) }));
  };

  const setMainImage = (indexToMain) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const [movedImage] = newImages.splice(indexToMain, 1);
      newImages.unshift(movedImage);
      return { ...prev, images: newImages };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = {
      id: formData.id,
      name: formData.name,
      category: formData.category,
      specs: formData.specs,
      features: formData.featuresString.split(',').map(s => s.trim()).filter(s => s),
      colors: formData.colorsString.split(',').map(s => s.trim()).filter(s => s),
      isNew: formData.isNew,
      images: formData.images,
    };
    onSave(productData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in slide-in-from-bottom-4 duration-200">
        
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isEditMode ? '제품 데이터 수정' : '신제품 등록'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isFirebaseAvailable ? "Cloud Database Mode" : "Local Storage Mode"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-slate-900 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" /> 제품 이미지 관리
              </label>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="text-xs flex items-center bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors font-medium text-slate-700"
              >
                {isProcessingImage ? '처리 중...' : <><Plus className="w-3 h-3 mr-1" /> 이미지 추가</>}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
            </div>

            <div className="grid grid-cols-4 gap-4">
               {formData.images.map((img, idx) => (
                 <div key={idx} className="relative group aspect-square bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                   <img src={img} alt={`img-${idx}`} className="w-full h-full object-cover" />
                   {idx === 0 && (
                     <div className="absolute top-2 left-2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow-md z-10">대표</div>
                   )}
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2">
                      {idx !== 0 && (
                        <button type="button" onClick={() => setMainImage(idx)} className="px-3 py-1 bg-white/90 text-xs font-bold rounded-full hover:bg-white text-slate-800">대표 설정</button>
                      )}
                      <button type="button" onClick={() => removeImage(idx)} className="p-2 bg-red-500/90 rounded-full text-white hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>
                   </div>
                 </div>
               ))}
               <div onClick={() => !isProcessingImage && fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-slate-500 hover:text-slate-600 transition-colors bg-white">
                 <Upload className="w-6 h-6 mb-1" />
                 <span className="text-[10px] font-medium">{isProcessingImage ? '압축 중...' : 'Add Image'}</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">제품명</label>
              <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">카테고리</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">상세 사양</label>
            <textarea required rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none resize-none" value={formData.specs} onChange={e => setFormData({...formData, specs: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">주요 기능 (쉼표 구분)</label>
              <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.featuresString} onChange={e => setFormData({...formData, featuresString: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">컬러 옵션 (쉼표 구분)</label>
              <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.colorsString} onChange={e => setFormData({...formData, colorsString: e.target.value})} />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <input type="checkbox" id="isNew" checked={formData.isNew} onChange={e => setFormData({...formData, isNew: e.target.checked})} className="w-4 h-4 text-slate-900 rounded border-gray-300 focus:ring-slate-900" />
            <label htmlFor="isNew" className="text-sm text-slate-700 font-medium select-none cursor-pointer">신제품(NEW) 배지 표시</label>
          </div>
        </form>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            {isEditMode && (
              <button type="button" onClick={() => onDelete(formData.id)} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center px-2 py-1">
                <Trash2 className="w-4 h-4 mr-1" /> 제품 삭제
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white transition-colors">취소</button>
            <button onClick={handleSubmit} disabled={isProcessingImage} className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50">
              {isProcessingImage ? '이미지 처리 중...' : (isEditMode ? '변경사항 저장' : '제품 등록하기')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}