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
  Star
} from 'lucide-react';

// 초기 샘플 데이터 구조 변경 (image -> images 배열)
const INITIAL_DATA = [
  {
    id: 1,
    name: 'KYLE (카일)',
    category: 'EXECUTIVE',
    images: [], // 첫번째 요소가 대표 이미지
    specs: '천연 가죽, 알루미늄 다이캐스팅 베이스',
    features: ['싱크로나이즈드 틸팅', '멀티 리미티드 틸팅', '좌판 깊이 조절'],
    colors: ['Black', 'Dark Brown', 'Camel'],
    isNew: true,
  },
  {
    id: 2,
    name: 'LIBRA (리브라)',
    category: 'TASK',
    images: [],
    specs: '메쉬 등판, 패브릭 좌판',
    features: ['오토 텐션 틸팅', '요추 지지대', '4D 암레스트'],
    colors: ['Grey', 'Blue', 'Green', 'Black'],
    isNew: false,
  },
  {
    id: 3,
    name: 'FLO (플로)',
    category: 'CONFERENCE',
    images: [],
    specs: '일체형 쉘, 심플한 구조',
    features: ['스태킹 가능', '글라이드/캐스터 선택'],
    colors: ['White', 'Red', 'Mustard', 'Navy'],
    isNew: false,
  },
];

const CATEGORIES = [
  'ALL', 'NEW', 'EXECUTIVE', 'TASK', 'CONFERENCE', 'GUEST', 
  'STOOL', 'LOUNGE', 'PUBLIC', 'HOME', 'TABLE', 'ETC'
];

export default function App() {
  const [products, setProducts] = useState(INITIAL_DATA);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 모달 상태 관리
  const [selectedProduct, setSelectedProduct] = useState(null); // 상세 보기용
  const [isFormOpen, setIsFormOpen] = useState(false); // 등록/수정 폼 열림 여부
  const [editingProduct, setEditingProduct] = useState(null); // 수정 모드일 때 데이터 담음

  // 필터링 로직
  const filteredProducts = products.filter(product => {
    const matchesCategory = 
      activeCategory === 'ALL' ? true :
      activeCategory === 'NEW' ? product.isNew :
      product.category === activeCategory;
    
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.specs.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // 제품 추가/수정 핸들러
  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      // 수정 모드
      setProducts(products.map(p => p.id === productData.id ? productData : p));
      // 상세 보고 있던 창도 업데이트
      if (selectedProduct && selectedProduct.id === productData.id) {
        setSelectedProduct(productData);
      }
    } else {
      // 신규 추가 모드
      setProducts([productData, ...products]);
    }
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  // 제품 삭제 핸들러
  const handleDeleteProduct = (productId) => {
    if (window.confirm('정말 이 제품 데이터를 삭제하시겠습니까?')) {
      setProducts(products.filter(p => p.id !== productId));
      setSelectedProduct(null);
      setIsFormOpen(false);
    }
  };

  // 수정 버튼 클릭 시
  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  // 등록 버튼 클릭 시
  const openAddModal = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* 사이드바 */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">P</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">PATRA <span className="text-xs font-normal text-slate-500 block">Design Lab DB</span></h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <div className="text-xs font-semibold text-slate-400 mb-2 px-2">BROWSE</div>
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group
                ${activeCategory === category 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              {category}
              {category === 'NEW' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* 메인 영역 */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* 헤더 */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center space-x-4 w-1/3">
            <div className="relative w-full">
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

          <div className="flex items-center space-x-4">
            <button 
              onClick={openAddModal}
              className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-300/50"
            >
              <Plus className="w-4 h-4" />
              <span>신제품 등록</span>
            </button>
          </div>
        </header>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{activeCategory} Collections</h2>
              <p className="text-slate-500 text-sm mt-1">총 {filteredProducts.length}개의 제품이 표시되었습니다.</p>
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
            
            {/* 추가 카드 (Placeholder) */}
            <button 
              onClick={openAddModal}
              className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center min-h-[300px] text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all group bg-white/50"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-slate-200 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium">Add New Product</span>
            </button>
          </div>
        </div>
      </main>

      {/* 상세 보기 모달 */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onEdit={() => openEditModal(selectedProduct)}
        />
      )}

      {/* 등록/수정 폼 모달 */}
      {isFormOpen && (
        <ProductFormModal 
          categories={CATEGORIES.filter(c => c !== 'ALL' && c !== 'NEW')}
          existingData={editingProduct}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 컴포넌트: ProductCard (리스트 아이템)
// ----------------------------------------------------------------------
function ProductCard({ product, onClick }) {
  // 대표 이미지 (배열의 첫번째)
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-slate-100 flex flex-col h-full"
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
                className="w-full h-full object-contain mix-blend-multiply"
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
          {product.images.length > 1 && (
             <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded">+{product.images.length - 1} images</span>
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{product.name}</h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{product.specs}</p>
        
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
          <div className="flex -space-x-1">
            {product.colors.slice(0, 3).map((color, i) => (
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

// ----------------------------------------------------------------------
// 컴포넌트: ProductDetailModal (상세 보기 + 수정 진입)
// ----------------------------------------------------------------------
function ProductDetailModal({ product, onClose, onEdit }) {
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
          {/* Main Image View */}
          <div className="flex-1 w-full bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm overflow-hidden p-4 mb-4 relative">
             {currentImage ? (
                <img src={currentImage} alt="Main View" className="w-full h-full object-contain" />
             ) : (
                <ImageIcon className="w-16 h-16 opacity-30" />
             )}
          </div>
          
          {/* Thumbnails */}
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
                {product.features.map((feature, idx) => (
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
                {product.colors.map((color, idx) => (
                  <span key={idx} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-400 transition-colors cursor-default">
                    {color}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100 flex justify-end space-x-3">
             <button 
               onClick={onEdit}
               className="flex items-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
             >
               <Edit2 className="w-4 h-4 mr-2" />
               Edit Data
             </button>
             <button className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
               Download Spec Sheet
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 컴포넌트: ProductFormModal (등록 및 수정 겸용, 멀티 이미지 지원)
// ----------------------------------------------------------------------
function ProductFormModal({ categories, existingData, onClose, onSave, onDelete }) {
  const isEditMode = !!existingData;
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    id: isEditMode ? existingData.id : Date.now(),
    name: '',
    category: categories[0],
    specs: '',
    featuresString: '',
    colorsString: '',
    isNew: false,
    images: [],
  });

  useEffect(() => {
    if (existingData) {
      setFormData({
        id: existingData.id,
        name: existingData.name,
        category: existingData.category,
        specs: existingData.specs,
        featuresString: existingData.features.join(', '),
        colorsString: existingData.colors.join(', '),
        isNew: existingData.isNew,
        images: existingData.images || [],
      });
    }
  }, [existingData]);

  // 이미지 추가 핸들러 (멀티 업로드 지원)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImageUrls = files.map(file => URL.createObjectURL(file));
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls]
      }));
    }
  };

  // 이미지 삭제
  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // 대표 이미지 설정 (배열 맨 앞으로 이동)
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
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isEditMode ? '제품 데이터 수정' : '신제품 등록'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">필요한 정보를 입력하고 이미지를 관리하세요.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Scrollable Form Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* Image Management Section */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-slate-900 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" /> 제품 이미지 관리
              </label>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs flex items-center bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors font-medium text-slate-700"
              >
                <Plus className="w-3 h-3 mr-1" /> 이미지 추가
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                multiple 
                className="hidden" 
              />
            </div>

            {/* Image List */}
            <div className="grid grid-cols-4 gap-4">
               {formData.images.map((img, idx) => (
                 <div key={idx} className="relative group aspect-square bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                   <img src={img} alt={`img-${idx}`} className="w-full h-full object-cover" />
                   
                   {/* Badge for Main Image */}
                   {idx === 0 && (
                     <div className="absolute top-2 left-2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow-md z-10">
                       대표
                     </div>
                   )}

                   {/* Hover Actions */}
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2">
                      {idx !== 0 && (
                        <button 
                          type="button" 
                          onClick={() => setMainImage(idx)}
                          className="px-3 py-1 bg-white/90 text-xs font-bold rounded-full hover:bg-white text-slate-800"
                        >
                          대표 설정
                        </button>
                      )}
                      <button 
                        type="button" 
                        onClick={() => removeImage(idx)}
                        className="p-2 bg-red-500/90 rounded-full text-white hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                 </div>
               ))}

               {/* Add Button Placeholder (Always visible if list is short) */}
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-slate-500 hover:text-slate-600 transition-colors bg-white"
               >
                 <Upload className="w-6 h-6 mb-1" />
                 <span className="text-[10px] font-medium">Add Image</span>
               </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 text-right">* 첫 번째 이미지가 리스트에 대표 이미지로 노출됩니다. 드래그 앤 드롭 미지원 (버튼 사용).</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">제품명 (Model Name)</label>
              <input 
                required
                type="text" 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">카테고리</label>
              <select 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">상세 사양 (Specifications)</label>
            <textarea 
              required
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none resize-none"
              placeholder="소재, 마감, 베이스 타입 등 상세 스펙 입력"
              value={formData.specs}
              onChange={e => setFormData({...formData, specs: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">주요 기능 (쉼표 구분)</label>
              <input 
                type="text" 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                placeholder="틸팅, 럼버서포트, 암레스트..."
                value={formData.featuresString}
                onChange={e => setFormData({...formData, featuresString: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">컬러 옵션 (쉼표 구분)</label>
              <input 
                type="text" 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                placeholder="Black, Grey, Blue..."
                value={formData.colorsString}
                onChange={e => setFormData({...formData, colorsString: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <input 
              type="checkbox" 
              id="isNew"
              checked={formData.isNew}
              onChange={e => setFormData({...formData, isNew: e.target.checked})}
              className="w-4 h-4 text-slate-900 rounded border-gray-300 focus:ring-slate-900"
            />
            <label htmlFor="isNew" className="text-sm text-slate-700 font-medium select-none cursor-pointer">
              신제품(NEW) 배지 표시
            </label>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            {isEditMode && (
              <button 
                type="button"
                onClick={() => onDelete(formData.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center px-2 py-1"
              >
                <Trash2 className="w-4 h-4 mr-1" /> 제품 삭제
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white transition-colors"
            >
              취소
            </button>
            <button 
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
              {isEditMode ? '변경사항 저장' : '제품 등록하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}