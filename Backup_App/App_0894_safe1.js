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
    ArrowLeftRight, SlidersHorizontal, Move, Monitor, Maximize, EyeOff, Type, ExternalLink, Circle, Award, Globe,
    BoxSelect, Component
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
const APP_VERSION = "v0.8.94";
const BUILD_DATE = "2026.01.30";
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
        defaultTags: ['Training room', 'Classroom', 'Library', 'Auditorium']
    },
    {
        id: 'LIFESTYLE', label: 'Lifestyle', icon: Sofa,
        defaultTags: ['Dining', 'Living', 'Study', 'Home office']
    },
    {
        id: 'COMMERCIAL', label: 'Commercial', icon: ShoppingBag,
        defaultTags: ['Cafe', 'Restaurant', 'Lounge', 'Store', 'Healthcare']
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

// V 0.8.92: Scroll lock with main content area locking
// Uses reference counting for nested modals
let scrollLockCount = 0;
let savedScrollY = 0;
let savedMainScrollY = 0;

function useScrollLock() {
    useEffect(() => {
        scrollLockCount++;

        if (scrollLockCount === 1) {
            // First modal - save scroll position and lock
            savedScrollY = window.scrollY;

            // Lock html and body
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${savedScrollY}px`;
            document.body.style.width = '100%';
            document.body.style.height = '100%';

            // V 0.8.92: Also lock the main content scroll area
            const mainContent = document.getElementById('main-scroll-content');
            if (mainContent) {
                savedMainScrollY = mainContent.scrollTop;
                mainContent.style.overflow = 'hidden';
            }
        }

        return () => {
            scrollLockCount--;

            if (scrollLockCount === 0) {
                // Last modal closed - restore scroll
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.height = '';
                window.scrollTo(0, savedScrollY);

                // V 0.8.92: Restore main content scroll
                const mainContent = document.getElementById('main-scroll-content');
                if (mainContent) {
                    mainContent.style.overflow = '';
                    mainContent.scrollTop = savedMainScrollY;
                }
            }
        };
    }, []);
}

// V 0.8.81: Utility to remove undefined values before Firebase save
const sanitizeForFirebase = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForFirebase(item)).filter(item => item !== undefined);
    }
    if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                result[key] = sanitizeForFirebase(value);
            }
        }
        return result;
    }
    return obj;
};

export default function App() {
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [swatches, setSwatches] = useState([]);
    const [awards, setAwards] = useState([]);
    const [activeCategory, setActiveCategory] = useState('DASHBOARD');
    const [previousCategory, setPreviousCategory] = useState('DASHBOARD');
    const [activeSpaceTag, setActiveSpaceTag] = useState('ALL');

    // Search with Tags
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTags, setSearchTags] = useState([]);

    // Sorting & Filtering
    const [sortOption, setSortOption] = useState('manual');
    const [sortDirection, setSortDirection] = useState('desc');
    const [filters, setFilters] = useState({ year: '', color: '', isNew: false });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Selection & Compare (Stacked Modals)
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedScene, setSelectedScene] = useState(null);
    const [selectedSwatch, setSelectedSwatch] = useState(null);
    const [selectedAward, setSelectedAward] = useState(null);
    const [compareList, setCompareList] = useState([]);
    const [hiddenCompareIds, setHiddenCompareIds] = useState([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

    // Edit & Admin
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingSwatchFromModal, setEditingSwatchFromModal] = useState(null);
    const [editingAwardFromModal, setEditingAwardFromModal] = useState(null);
    const [editingScene, setEditingScene] = useState(null); // { isNew, spaceId, tags }

    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminDashboard, setShowAdminDashboard] = useState(false);
    const [activityLogs, setActivityLogs] = useState([]);
    const [toast, setToast] = useState(null);
    const [favorites, setFavorites] = useState([]);

    // UI State
    const [sidebarState, setSidebarState] = useState({ spaces: true, collections: true, materials: true, awards: true });
    const [myPickViewMode, setMyPickViewMode] = useState('grid');
    const [bannerData, setBannerData] = useState({ url: null, logoUrl: null, title: 'Design Lab DB', subtitle: 'Integrated Product Database & Archives' });
    const [appSettings, setAppSettings] = useState({ logo: null, title: 'PATRA', subtitle: 'Design Lab DB' });
    const [spaceContents, setSpaceContents] = useState({});
    const [scenes, setScenes] = useState([]); // V 0.8.82: Individual scene documents

    // Space/Scene Editing
    const [editingSpaceInfoId, setEditingSpaceInfoId] = useState(null);
    // V 0.8.88: Removed managingSpaceProductsId
    // V 0.8.74: Modal Navigation History
    const [modalHistory, setModalHistory] = useState([]); // V 0.8.93 v4: Global Modal History

    const prevFilters = useRef(filters);

    // V 0.8.93 v4: Modal History Logic
    const handleOpenModal = (type, data) => {
        // Push current active modal to history if exists
        let currentModal = null;
        if (selectedProduct) currentModal = { type: 'product', data: selectedProduct };
        else if (selectedScene) currentModal = { type: 'scene', data: selectedScene };
        else if (selectedSwatch) currentModal = { type: 'swatch', data: selectedSwatch };
        else if (selectedAward) currentModal = { type: 'award', data: selectedAward };

        if (currentModal) {
            setModalHistory(prev => [...prev, currentModal]);
        }

        // Close all first to ensure clean switch (optional, but good for z-index reset)
        setSelectedProduct(null);
        setSelectedScene(null);
        setSelectedSwatch(null);
        setSelectedAward(null);

        // Open new
        if (type === 'product') setSelectedProduct(data);
        else if (type === 'scene') setSelectedScene(data);
        else if (type === 'swatch') setSelectedSwatch(data);
        else if (type === 'award') setSelectedAward(data);
    };

    const handleCloseModal = (type) => {
        // Close current
        if (type === 'product') setSelectedProduct(null);
        else if (type === 'scene') setSelectedScene(null);
        else if (type === 'swatch') setSelectedSwatch(null);
        else if (type === 'award') setSelectedAward(null);

        // Check history
        if (modalHistory.length > 0) {
            const last = modalHistory[modalHistory.length - 1];
            setModalHistory(prev => prev.slice(0, -1));

            // Restore last immediately
            if (last.type === 'product') setSelectedProduct(last.data);
            else if (last.type === 'scene') setSelectedScene(last.data);
            else if (last.type === 'swatch') setSelectedSwatch(last.data);
            else if (last.type === 'award') setSelectedAward(last.data);
        }
    };

    const mainContentRef = useRef(null);
    const urlParamHandledRef = useRef(false); // V 0.8.88: Track if URL param has been handled
    const sidebarLogoInputRef = useRef(null);

    // --- Effects ---
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (editingSwatchFromModal) { setEditingSwatchFromModal(null); return; }
                if (editingAwardFromModal) { setEditingAwardFromModal(null); return; }
                if (isFormOpen) { setIsFormOpen(false); setEditingProduct(null); return; }
                if (editingScene) { setEditingScene(null); return; }
                // V 0.8.88: Removed Space Product Manager
                if (editingSpaceInfoId) { setEditingSpaceInfoId(null); return; }
                if (showAdminDashboard) { setShowAdminDashboard(false); return; }

                if (selectedProduct) { handleCloseModal('product'); return; }
                if (selectedSwatch) { handleCloseModal('swatch'); return; }
                if (selectedScene) { handleCloseModal('scene'); return; }
                if (selectedAward) { handleCloseModal('award'); return; }
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [editingSwatchFromModal, editingAwardFromModal, selectedSwatch, selectedProduct, selectedScene, selectedAward, editingScene, isFormOpen, editingSpaceInfoId, showAdminDashboard]);

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
        if (mainContentRef.current) mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const handlePopState = (event) => {
            if (selectedSwatch) {
                setSelectedSwatch(null);
            } else if (selectedProduct) {
                setSelectedProduct(null);
                window.history.replaceState(null, '', window.location.pathname);
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
    }, [selectedProduct, selectedSwatch, activeCategory, previousCategory]);

    // V 0.8.92: Clear URL when modal closes, push when modal opens
    useEffect(() => {
        if (selectedProduct) {
            const url = new URL(window.location);
            url.searchParams.set('id', selectedProduct.id);
            window.history.pushState({ modal: 'product' }, '', url);
        } else {
            // Clear URL when modal closes
            if (window.location.search.includes('id=')) {
                window.history.replaceState(null, '', window.location.pathname);
            }
        }
    }, [selectedProduct]);

    useEffect(() => {
        setActiveSpaceTag('ALL');
    }, [activeCategory]);

    // V 0.8.88: Fix URL param parsing - only handle once to prevent modal reopen on refresh
    useEffect(() => {
        if (urlParamHandledRef.current) return; // Skip if already handled

        const params = new URLSearchParams(window.location.search);
        const sharedId = params.get('id');
        const sharedSpace = params.get('space');

        if (sharedId && products.length > 0) {
            const found = products.find(p => String(p.id) === String(sharedId));
            if (found) {
                setSelectedProduct(found);
                urlParamHandledRef.current = true;
                // Clear URL param to prevent reopen
                window.history.replaceState(null, '', window.location.pathname);
            }
        }
        if (sharedSpace && SPACES.find(s => s.id === sharedSpace)) {
            setActiveCategory(sharedSpace);
            urlParamHandledRef.current = true;
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
            const localAwards = localStorage.getItem('patra_awards');
            setAwards(localAwards ? JSON.parse(localAwards) : []);
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
            const qAwards = collection(db, 'artifacts', appId, 'public', 'data', 'awards');
            const unsubAwards = onSnapshot(qAwards, (snapshot) => {
                const loadedAwards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAwards(loadedAwards);
            });

            const bannerDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'banner');
            onSnapshot(bannerDocRef, (doc) => { if (doc.exists()) setBannerData(prev => ({ ...prev, ...doc.data() })); });
            const appSettingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'app');
            onSnapshot(appSettingsRef, (doc) => { if (doc.exists()) setAppSettings(prev => ({ ...prev, ...doc.data() })); });

            SPACES.forEach(space => {
                onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', space.id), (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        setSpaceContents(prev => ({ ...prev, [space.id]: docSnapshot.data() }));
                    }
                });
            });

            // V 0.8.82: Listen to individual scenes collection
            const qScenes = collection(db, 'artifacts', appId, 'public', 'data', 'scenes');
            const unsubScenes = onSnapshot(qScenes, (snapshot) => {
                const loadedScenes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setScenes(loadedScenes);
            });

            return () => { unsubProducts(); unsubSwatches(); unsubAwards(); unsubScenes(); };
        } else {
            const localBanner = localStorage.getItem('patra_banner_data');
            if (localBanner) setBannerData(JSON.parse(localBanner));
            const localAppSettings = localStorage.getItem('patra_app_settings');
            if (localAppSettings) setAppSettings(JSON.parse(localAppSettings));
            loadFromLocalStorage();
        }
    }, [user]);

    // --- Handlers ---
    const handleHomeClick = () => {
        setActiveCategory('DASHBOARD');
        setSearchTerm('');
        setSearchTags([]);
        setFilters({ year: '', color: '', isNew: false });
        setIsMobileMenuOpen(false);
        window.history.pushState({}, '', window.location.pathname);
    };

    const handleCategoryClick = (catId) => {
        setActiveCategory(catId);
        setSearchTerm('');
        setSearchTags([]);
        setIsMobileMenuOpen(false);
    };

    const handleMyPickToggle = () => {
        if (activeCategory === 'MY_PICK') {
            setActiveCategory(previousCategory || 'DASHBOARD');
        } else {
            setPreviousCategory(activeCategory);
            setActiveCategory('MY_PICK');
        }
        setIsMobileMenuOpen(false);
    };

    const handleNavigateToAward = (awardTitle) => {
        const foundAward = awards.find(a => a.title === awardTitle);
        if (foundAward) {
            setSelectedProduct(null);
            setActiveCategory('AWARDS_ROOT');
            setSelectedAward(foundAward);
        } else {
            showToast("Award details not found.", "error");
        }
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
    const saveAwardsToLocal = (newAwards) => {
        localStorage.setItem('patra_awards', JSON.stringify(newAwards));
        setAwards(newAwards);
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

    const toggleFavorite = (e, itemId) => {
        if (e) e.stopPropagation();
        let newFavs;
        if (favorites.includes(itemId)) {
            newFavs = favorites.filter(id => id !== itemId);
            showToast("MY PICK에서 제거되었습니다.", "info");
        } else {
            newFavs = [...favorites, itemId];
            showToast("MY PICK에 추가되었습니다.");
        }
        setFavorites(newFavs);
        localStorage.setItem('patra_favorites', JSON.stringify(newFavs));
    };

    const toggleCompare = (e, product) => {
        if (e) e.stopPropagation();
        if (compareList.find(p => p.id === product.id)) {
            setCompareList(compareList.filter(p => p.id !== product.id));
            setHiddenCompareIds(prev => prev.filter(id => id !== product.id));
        } else {
            if (compareList.length >= 8) { showToast("비교는 최대 8개까지 가능합니다.", "error"); return; }
            setCompareList([...compareList, product]);
        }
    };

    const handleCompareButtonClick = () => {
        if (activeCategory === 'COMPARE_PAGE') {
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

    const handleSidebarLogoUpload = async (e) => {
        if (!isAdmin) return;
        const file = e.target.files[0];
        if (!file) return;
        try {
            const resized = await processImage(file);
            const newData = { ...appSettings, logo: resized };
            if (isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'app'), newData, { merge: true });
            else { localStorage.setItem('patra_app_settings', JSON.stringify(newData)); setAppSettings(newData); }
            showToast("헤더 로고가 변경되었습니다.");
        } catch (e) { showToast("이미지 처리 실패", "error"); }
    };
    const handleSidebarTitleChange = async () => {
        if (!isAdmin) return;
        const newTitle = prompt("새로운 타이틀을 입력하세요:", appSettings.title);
        if (newTitle !== null) {
            const newData = { ...appSettings, title: newTitle };
            if (isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'app'), newData, { merge: true });
            else { localStorage.setItem('patra_app_settings', JSON.stringify(newData)); setAppSettings(newData); }
        }
    };
    const handleSidebarSubtitleChange = async () => {
        if (!isAdmin) return;
        const newSubtitle = prompt("새로운 서브 타이틀을 입력하세요:", appSettings.subtitle);
        if (newSubtitle !== null) {
            const newData = { ...appSettings, subtitle: newSubtitle };
            if (isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'app'), newData, { merge: true });
            else { localStorage.setItem('patra_app_settings', JSON.stringify(newData)); setAppSettings(newData); }
        }
    };

    const handleSpaceBannerUpload = async (e, spaceId) => { if (!isAdmin) return; const file = e.target.files[0]; if (!file) return; try { const resizedImage = await processImage(file); const currentContent = spaceContents[spaceId] || {}; const newContent = { ...currentContent, banner: resizedImage }; if (isFirebaseAvailable && db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), newContent, { merge: true }); showToast("공간 배너가 업데이트되었습니다."); } catch (error) { showToast("이미지 처리 실패", "error"); } };
    const handleSpaceInfoSave = async (spaceId, info) => { const currentContent = spaceContents[spaceId] || {}; const newContent = { ...currentContent, ...info }; if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', spaceId), newContent, { merge: true }); } showToast("공간 정보가 저장되었습니다."); };

    // V 0.8.82: Completely rewritten to save scenes as individual documents (like swatches/products)
    // This fixes the 1MB document size limit that was causing save failures
    const handleSceneSave = async (targetSpaceId, sceneData) => {
        try {
            const docId = sceneData.id ? String(sceneData.id) : String(Date.now());
            const isEdit = !!sceneData.id;

            const payload = sanitizeForFirebase({
                ...sceneData,
                id: docId,
                spaceId: targetSpaceId,
                updatedAt: Date.now(),
                createdAt: isEdit ? (sceneData.createdAt || Date.now()) : Date.now(),
                orderIndex: isEdit ? (sceneData.orderIndex || Date.now()) : Date.now()
            });

            if (isFirebaseAvailable && db) {
                // Save scene as individual document in 'scenes' collection
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'scenes', docId), payload, { merge: true });
            }

            showToast(isEdit ? "장면이 수정되었습니다." : "장면이 저장되었습니다.");
            setEditingScene(null);
        } catch (e) {
            console.error("Save Scene Error:", e);
            showToast(`저장 실패: ${e.message || '알 수 없는 오류'}`, "error");
        }
    };


    // V 0.8.82: Updated to delete from individual scenes collection
    const handleSceneDelete = async (spaceId, sceneId) => {
        if (!window.confirm("이 장면을 삭제하시겠습니까?")) return;
        if (isFirebaseAvailable && db) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'scenes', String(sceneId)));
        }
        showToast("장면이 삭제되었습니다.");
    };
    const handleSpaceProductToggle = async (spaceId, productId, isAdded) => { const product = products.find(p => p.id === productId); if (!product) return; let newSpaces = product.spaces || []; if (isAdded) { if (!newSpaces.includes(spaceId)) newSpaces.push(spaceId); } else { newSpaces = newSpaces.filter(s => s !== spaceId); } if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', product.id), { spaces: newSpaces }, { merge: true }); } else { const idx = products.findIndex(p => p.id === productId); const newProds = [...products]; newProds[idx] = { ...product, spaces: newSpaces }; saveToLocalStorage(newProds); } };
    const logActivity = async (action, productName, details = "") => { if (!isFirebaseAvailable || !db) return; try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), { action, productName, details, timestamp: Date.now(), adminId: 'admin' }); } catch (e) { console.error(e); } };
    const fetchLogs = async () => { if (!isFirebaseAvailable || !db) return; const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), orderBy('timestamp', 'desc'), limit(100)); onSnapshot(q, (snapshot) => { setActivityLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); }); };
    const handleSaveSwatch = async (swatchData) => { const docId = swatchData.id ? String(swatchData.id) : String(Date.now()); const payload = { ...swatchData, id: docId, updatedAt: Date.now() }; if (isFirebaseAvailable && db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'swatches', docId), payload, { merge: true }); } else { const idx = swatches.findIndex(s => s.id === docId); let newSwatches = [...swatches]; if (idx >= 0) newSwatches[idx] = payload; else newSwatches = [payload, ...newSwatches]; saveSwatchesToLocal(newSwatches); } showToast("마감재가 저장되었습니다."); };
    const handleDeleteSwatch = async (swatchId) => { if (!window.confirm("정말 삭제하시겠습니까?")) return; if (isFirebaseAvailable && db) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'swatches', String(swatchId))); } else { saveSwatchesToLocal(swatches.filter(s => s.id !== swatchId)); } showToast("마감재가 삭제되었습니다."); };

    const handleSaveAward = async (awardData, winners = []) => {
        const docId = awardData.id ? String(awardData.id) : String(Date.now());
        const payload = { ...awardData, id: docId, updatedAt: Date.now() };

        if (isFirebaseAvailable && db) {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'awards', docId), payload, { merge: true });
        } else {
            const idx = awards.findIndex(a => a.id === docId);
            let newAwards = [...awards];
            if (idx >= 0) newAwards[idx] = payload; else newAwards = [payload, ...newAwards];
            saveAwardsToLocal(newAwards);
        }

        if (winners.length > 0) {
            const batch = isFirebaseAvailable && db ? writeBatch(db) : null;
            let localProducts = [...products];
            let hasUpdates = false;

            const winnerMap = {};
            winners.forEach(w => winnerMap[w.id] = w.year);

            for (const p of products) {
                const newYear = winnerMap[p.id];
                const currentHistory = p.awardHistory || [];
                const existingEntry = currentHistory.find(h => h.awardId === docId);

                let newHistory = currentHistory;
                let needsUpdate = false;

                if (newYear) {
                    if (existingEntry) {
                        if (existingEntry.year !== newYear) {
                            newHistory = currentHistory.map(h => h.awardId === docId ? { ...h, year: newYear } : h);
                            needsUpdate = true;
                        }
                    } else {
                        newHistory = [...currentHistory, { awardId: docId, title: payload.title, year: newYear }];
                        needsUpdate = true;
                    }
                } else {
                    if (existingEntry) {
                        newHistory = currentHistory.filter(h => h.awardId !== docId);
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    if (batch) {
                        const pRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id);
                        batch.update(pRef, { awardHistory: newHistory });
                    } else {
                        const idx = localProducts.findIndex(lp => lp.id === p.id);
                        if (idx >= 0) localProducts[idx] = { ...localProducts[idx], awardHistory: newHistory };
                        hasUpdates = true;
                    }
                }
            }

            if (batch) await batch.commit();
            if (!isFirebaseAvailable && hasUpdates) saveToLocalStorage(localProducts);
        }

        if (selectedAward && selectedAward.id === docId) {
            setSelectedAward(payload);
        }

        setEditingAwardFromModal(null);
        showToast("어워드 및 수상작이 저장되었습니다.");
    };

    const handleDeleteAward = async (awardId) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        if (isFirebaseAvailable && db) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'awards', String(awardId)));
        } else {
            saveAwardsToLocal(awards.filter(a => a.id !== awardId));
        }
        showToast("어워드가 삭제되었습니다.");
    };

    const handleSaveProduct = async (inputs) => {
        // V 0.8.93 v8: Strip Base64 images to optimize storage
        const optimize = (list) => list?.map(item => {
            if (typeof item === 'object' && item.image) { const { image, ...rest } = item; return rest; }
            return item;
        });
        const productData = { ...inputs, bodyColors: optimize(inputs.bodyColors), upholsteryColors: optimize(inputs.upholsteryColors) };

        const docId = productData.id ? String(productData.id) : String(Date.now());
        const isEdit = !!productData.id && products.some(p => String(p.id) === docId);

        // V 0.8.93: Mutual Tagging Logic
        // Calculate diff in relatedProductIds to update OTHER products
        const oldProduct = products.find(p => String(p.id) === docId);
        const oldRelated = oldProduct?.relatedProductIds || [];
        const newRelated = productData.relatedProductIds || [];

        // IDs to ADD: Present in new, not in old
        const addedIds = newRelated.filter(id => !oldRelated.includes(id));
        // IDs to REMOVE: Present in old, not in new
        const removedIds = oldRelated.filter(id => !newRelated.includes(id));

        const payload = {
            ...productData,
            id: docId,
            updatedAt: Date.now(),
            createdAt: isEdit ? (oldProduct?.createdAt || Date.now()) : Date.now(),
            orderIndex: isEdit ? (oldProduct?.orderIndex || Date.now()) : Date.now()
        };

        if (isFirebaseAvailable && db) {
            try {
                const batch = writeBatch(db);
                // 1. Save current product
                const sanitizedPayload = sanitizeForFirebase(payload);
                batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'products', docId), sanitizedPayload, { merge: true });

                // 2. Handle Added Mutual Tags
                for (const targetId of addedIds) {
                    const targetProduct = products.find(p => String(p.id) === String(targetId));
                    if (targetProduct) {
                        const targetRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', String(targetId));
                        const targetRelated = targetProduct.relatedProductIds || [];
                        if (!targetRelated.includes(docId)) {
                            batch.update(targetRef, { relatedProductIds: [...targetRelated, docId] });
                        }
                    }
                }

                // 3. Handle Removed Mutual Tags
                for (const targetId of removedIds) {
                    const targetProduct = products.find(p => String(p.id) === String(targetId));
                    if (targetProduct) {
                        const targetRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', String(targetId));
                        const targetRelated = targetProduct.relatedProductIds || [];
                        if (targetRelated.includes(docId)) {
                            batch.update(targetRef, { relatedProductIds: targetRelated.filter(id => String(id) !== docId) });
                        }
                    }
                }

                await batch.commit();
            }
            catch (error) {
                console.error("Product Save Error:", error);
                showToast(`저장 실패: ${error.message || '알 수 없는 오류'}`, "error");
                return;
            }
        } else {
            // Local Storage Mode
            let newProducts = [...products];

            // 1. Update Current Product
            const idx = newProducts.findIndex(p => String(p.id) === docId);
            if (idx >= 0) newProducts[idx] = payload; else newProducts = [payload, ...newProducts];

            // 2. Handle Added Mutual Tags
            addedIds.forEach(targetId => {
                const tIdx = newProducts.findIndex(p => String(p.id) === String(targetId));
                if (tIdx >= 0) {
                    const target = newProducts[tIdx];
                    const targetRelated = target.relatedProductIds || [];
                    if (!targetRelated.includes(docId)) {
                        newProducts[tIdx] = { ...target, relatedProductIds: [...targetRelated, docId] };
                    }
                }
            });

            // 3. Handle Removed Mutual Tags
            removedIds.forEach(targetId => {
                const tIdx = newProducts.findIndex(p => String(p.id) === String(targetId));
                if (tIdx >= 0) {
                    const target = newProducts[tIdx];
                    const targetRelated = target.relatedProductIds || [];
                    if (targetRelated.includes(docId)) {
                        newProducts[tIdx] = { ...target, relatedProductIds: targetRelated.filter(id => String(id) !== docId) };
                    }
                }
            });

            saveToLocalStorage(newProducts);
        }

        setCompareList(prev => prev.map(p => p.id === docId ? payload : p));

        if (selectedProduct && String(selectedProduct.id) === docId) setSelectedProduct(payload);
        setIsFormOpen(false);
        setEditingProduct(null);
        showToast(isEdit ? "수정 완료 (상호 태그 업데이트됨)" : "등록 완료 (상호 태그 업데이트됨)");
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
        setSelectedProduct(null);
        setIsFormOpen(false);
        showToast("삭제되었습니다.");
    };

    const handleDuplicateProduct = async (product) => {
        if (!isAdmin) return;
        const newProduct = { ...product, id: Date.now().toString(), name: `${product.name} (Copy)`, createdAt: Date.now(), updatedAt: Date.now(), orderIndex: Date.now() };
        await handleSaveProduct(newProduct);
        showToast("제품이 복제되었습니다.");
    };

    const handleDuplicateSwatch = async (swatch) => {
        if (!isAdmin) return;
        const newSwatch = { ...swatch, id: Date.now().toString(), name: `${swatch.name} (Copy)`, updatedAt: Date.now() };
        await handleSaveSwatch(newSwatch);
        showToast("스와치가 복제되었습니다.");
    };

    // --- V 0.8.72: Universal Batch Reorder Logic ---
    const handleBatchReorder = async (collectionName, reorderedItems, parentId = null) => {
        if (!isFirebaseAvailable || !db) {
            if (collectionName === 'products') saveToLocalStorage(reorderedItems);
            else if (collectionName === 'swatches') saveSwatchesToLocal(reorderedItems);
            else if (collectionName === 'awards') saveAwardsToLocal(reorderedItems);
            else if (collectionName === 'scenes' && parentId) {
                const newContent = { ...spaceContents[parentId], scenes: reorderedItems };
                setSpaceContents(prev => ({ ...prev, [parentId]: newContent }));
            }
            return;
        }

        const batch = writeBatch(db);

        if (collectionName === 'scenes' && parentId) {
            const spaceRef = doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', parentId);
            batch.update(spaceRef, { scenes: reorderedItems });
        } else {
            reorderedItems.forEach((item, index) => {
                const ref = doc(db, 'artifacts', appId, 'public', 'data', collectionName, item.id);
                batch.update(ref, { orderIndex: index });
            });
        }

        try {
            await batch.commit();
            showToast("순서가 저장되었습니다.");
        } catch (e) {
            console.error("Batch update failed", e);
            showToast("순서 저장 실패", "error");
        }
    };

    // V 0.8.74: Admin Move Item - Fixed to only swap two items
    const handlePairSwap = async (collectionName, itemA, itemB, parentId = null) => {
        if (!isFirebaseAvailable || !db) return;

        const batch = writeBatch(db);
        if (collectionName === 'scenes' && parentId) {
            // For scenes, update the entire scenes array in the parent document
            const content = spaceContents[parentId];
            if (content && content.scenes) {
                const spaceRef = doc(db, 'artifacts', appId, 'public', 'data', 'space_contents', parentId);
                batch.update(spaceRef, { scenes: content.scenes });
            }
        } else {
            const refA = doc(db, 'artifacts', appId, 'public', 'data', collectionName, itemA.id);
            const refB = doc(db, 'artifacts', appId, 'public', 'data', collectionName, itemB.id);
            batch.update(refA, { orderIndex: itemA.orderIndex });
            batch.update(refB, { orderIndex: itemB.orderIndex });
        }

        try {
            await batch.commit();
        } catch (e) {
            console.error("Pair swap failed", e);
            showToast("순서 저장 실패", "error");
        }
    };

    // V 0.8.92: Complete rewrite - use fractional orderIndex for stable positioning
    // V 0.8.92: Complete rewrite - use fractional orderIndex for stable positioning
    // V 0.8.93 v3: Product reorder robustness check + Scene reorder fix (State array sync)
    const handleMoveItem = async (collectionName, items, index, direction, parentId = null) => {
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= items.length) return;

        const itemA = items[index]; // Item being moved
        const itemB = items[targetIndex]; // Item being displaced

        let newOrderA, newOrderB;

        if (direction === 'left') {
            const prevItemOrder = targetIndex > 0 ? (items[targetIndex - 1].orderIndex ?? (targetIndex - 1) * 100) : -100;
            const itemBOrder = itemB.orderIndex ?? targetIndex * 100;
            newOrderA = (prevItemOrder + itemBOrder) / 2;
            newOrderB = itemB.orderIndex ?? targetIndex * 100;

            // V 0.8.93 v3: Robustness check - if precision exhausted, nudge
            if (newOrderA >= itemBOrder) newOrderA = itemBOrder - 0.0001;

        } else {
            const nextItemOrder = targetIndex < items.length - 1 ? (items[targetIndex + 1].orderIndex ?? (targetIndex + 1) * 100) : (targetIndex + 1) * 100;
            const itemBOrder = itemB.orderIndex ?? targetIndex * 100;
            newOrderA = (itemBOrder + nextItemOrder) / 2;
            newOrderB = itemB.orderIndex ?? targetIndex * 100;

            // V 0.8.93 v3: Robustness check
            if (newOrderA <= itemBOrder) newOrderA = itemBOrder + 0.0001;
        }

        // Optimistic Update
        if (collectionName === 'products') {
            const itemA = items[index];
            let itemB;
            if (direction === 'left' || direction === 'up') itemB = items[index - 1];
            else itemB = items[index + 1];

            if (itemB) {
                const orderA = itemA.orderIndex || 0;
                const orderB = itemB.orderIndex || 0;
                let newOrderA = orderB;
                let newOrderB = orderA;

                // Handle index collision
                if (Math.abs(newOrderA - newOrderB) < 0.0001) {
                    if (direction === 'right' || direction === 'down') newOrderA = orderB + 0.001;
                    else newOrderA = orderB - 0.001;
                }

                setProducts(prev => prev.map(p => {
                    if (String(p.id) === String(itemA.id)) return { ...p, orderIndex: newOrderA };
                    if (String(p.id) === String(itemB.id)) return { ...p, orderIndex: newOrderB };
                    return p;
                }));
                await handlePairSwap(collectionName, { ...itemA, orderIndex: newOrderA }, { ...itemB, orderIndex: newOrderB }, parentId);
            }

        } else if (collectionName === 'swatches') {
            setSwatches(prev => prev.map(s => {
                if (s.id === itemA.id) return { ...s, orderIndex: newOrderA };
                return s;
            }));
            await handlePairSwap(collectionName, { ...itemA, orderIndex: newOrderA }, { ...itemB, orderIndex: newOrderB }, parentId);

        } else if (collectionName === 'awards') {
            setAwards(prev => prev.map(a => {
                if (String(a.id) === String(itemA.id)) return { ...a, orderIndex: newOrderA };
                return a;
            }));
            await handlePairSwap(collectionName, { ...itemA, orderIndex: newOrderA }, { ...itemB, orderIndex: newOrderB }, parentId);

        } else if (collectionName === 'scenes' && parentId) {
            // V 0.8.93 v4: Check if item is separate scene document (V 0.8.82)
            const isSeparateScene = scenes.some(s => s.id === itemA.id);

            if (isSeparateScene) {
                // Handle as Separate Collection (fractional index)
                setScenes(prev => prev.map(s => {
                    if (s.id === itemA.id) return { ...s, orderIndex: newOrderA };
                    return s;
                }));
                await handlePairSwap('scenes', { ...itemA, orderIndex: newOrderA }, { ...itemB, orderIndex: newOrderB }, parentId);
            } else {
                // Legacy: Handle as Space Content Array
                setSpaceContents(prev => {
                    const content = { ...prev[parentId] };
                    const spaceScenes = [...(content.scenes || [])];
                    const idxA = spaceScenes.findIndex(s => s.id === itemA.id);
                    const idxB = spaceScenes.findIndex(s => s.id === itemB.id);

                    if (idxA >= 0 && idxB >= 0) {
                        [spaceScenes[idxA], spaceScenes[idxB]] = [spaceScenes[idxB], spaceScenes[idxA]];
                    }

                    handleBatchReorder('scenes', spaceScenes, parentId);

                    return { ...prev, [parentId]: { ...content, scenes: spaceScenes } };
                });
            }
        }
    };

    // V 0.8.93 v3: Wrapper for CategoryRootView navigation to support reordering
    const handleRootNavigate = (actionOrId, item, direction, list) => {
        if (actionOrId === 'move') {
            const index = list.findIndex(i => i.id === item.id);
            if (index !== -1) {
                handleMoveItem('products', list, index, direction);
            }
        } else {
            handleCategoryClick(actionOrId);
        }
    };

    // --- Search Tag Logic ---
    const handleSearchKeyDown = (e) => {
        if (e.key === ',' || e.key === 'Enter') {
            e.preventDefault();
            const val = searchTerm.trim().replace(',', '');
            if (val) {
                setSearchTags([...searchTags, val]);
                setSearchTerm('');
            }
        } else if (e.key === 'Backspace' && searchTerm === '' && searchTags.length > 0) {
            setSearchTags(prev => prev.slice(0, -1));
        }
    };
    const removeSearchTag = (idx) => {
        setSearchTags(searchTags.filter((_, i) => i !== idx));
    };

    // --- Data & Filters ---
    const getProcessedProducts = () => {
        let filtered = products.filter(product => {
            let matchesCategory = true;
            if (activeCategory === 'DASHBOARD' || activeCategory === 'COMPARE_PAGE') matchesCategory = false;
            else if (activeCategory === 'MY_PICK') matchesCategory = favorites.includes(product.id);
            else if (activeCategory === 'ALL') matchesCategory = true;
            else if (activeCategory === 'SPACES_ROOT' || activeCategory === 'COLLECTIONS_ROOT' || activeCategory === 'MATERIALS_ROOT' || activeCategory === 'AWARDS_ROOT') matchesCategory = false;
            else if (SPACES.find(s => s.id === activeCategory)) {
                matchesCategory = product.spaces && product.spaces.includes(activeCategory);
                if (matchesCategory && activeSpaceTag !== 'ALL') { matchesCategory = product.spaceTags && product.spaceTags.includes(activeSpaceTag); }
            }
            else if (SWATCH_CATEGORIES.find(s => s.id === activeCategory)) matchesCategory = false;
            else matchesCategory = product.category === activeCategory;

            const searchFields = [
                product.name,
                product.specs,
                product.designer,
                ...(product.features || []),
                ...(product.options || []),
                ...(product.awards || []).map(a => typeof a === 'object' ? a.label : a),
                ...(product.materials || []),
                ...(product.bodyColors || []).map(c => typeof c === 'object' ? `${c.name} ${c.materialCode} ${c.hex}` : c),
                ...(product.upholsteryColors || []).map(c => typeof c === 'object' ? `${c.name} ${c.materialCode} ${c.hex}` : c)
            ];
            const fullText = searchFields.join(' ').toLowerCase();

            const matchesSearchText = !searchTerm || fullText.includes(searchTerm.toLowerCase());
            const matchesTags = searchTags.every(tag => fullText.includes(tag.toLowerCase()));

            let matchesFilter = true;
            if (filters.isNew && !product.isNew) matchesFilter = false;
            if (filters.year && !product.launchDate?.startsWith(filters.year)) matchesFilter = false;
            if (filters.color) {
                const colorMatch = [...(product.bodyColors || []), ...(product.upholsteryColors || [])].some(c => { const name = typeof c === 'object' ? c.name : c; return name.toLowerCase().includes(filters.color.toLowerCase()); });
                if (!colorMatch) matchesFilter = false;
            }
            return matchesCategory && matchesSearchText && matchesTags && matchesFilter;
        });
        filtered.sort((a, b) => {
            let comparison = 0;
            if (sortOption === 'name') comparison = a.name.localeCompare(b.name);
            else if (sortOption === 'launchDate') comparison = parseInt(a.launchDate || 0) - parseInt(b.launchDate || 0);
            else if (sortOption === 'manual') comparison = (a.orderIndex || 0) - (b.orderIndex || 0);
            else comparison = (a.createdAt || 0) - (b.createdAt || 0);
            return sortDirection === 'asc' ? comparison : -comparison;
        });
        return filtered;
    };
    const processedProducts = getProcessedProducts();

    // V 0.8.9: Merge scenes from both sources (new scenes collection + legacy spaceContents)
    const allScenes = useMemo(() => {
        const scenesMap = new Map();
        // Add legacy scenes from spaceContents (keyed by spaceId)
        SPACES.forEach(space => {
            const content = spaceContents[space.id] || {};
            (content.scenes || []).forEach(s => {
                scenesMap.set(s.id, { ...s, spaceId: space.id });
            });
        });
        // Add/override with new scenes collection (these have spaceId field)
        scenes.forEach(s => scenesMap.set(s.id, s));
        return Array.from(scenesMap.values());
    }, [scenes, spaceContents]);

    // --- Navigation ---
    const handleNavigateNext = () => { if (!selectedProduct) return; const currentIndex = processedProducts.findIndex(p => p.id === selectedProduct.id); if (currentIndex >= 0 && currentIndex < processedProducts.length - 1) { setSelectedProduct(processedProducts[currentIndex + 1]); } };
    const handleNavigatePrev = () => { if (!selectedProduct) return; const currentIndex = processedProducts.findIndex(p => p.id === selectedProduct.id); if (currentIndex > 0) { setSelectedProduct(processedProducts[currentIndex - 1]); } };

    // Import/Export
    const handleExportData = () => { const dataStr = JSON.stringify({ products, swatches, awards, spaces: spaceContents, version: APP_VERSION }, null, 2); const blob = new Blob([dataStr], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `patra_db_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click(); showToast("데이터 백업이 완료되었습니다."); };
    const handleImportData = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (event) => { try { const imported = JSON.parse(event.target.result); if (window.confirm(`총 ${imported.products?.length || 0}개 제품, ${imported.swatches?.length || 0}개 스와치, ${imported.awards?.length || 0}개 어워드를 불러오시겠습니까?`)) { if (!isFirebaseAvailable) { saveToLocalStorage(imported.products || []); saveSwatchesToLocal(imported.swatches || []); saveAwardsToLocal(imported.awards || []); window.location.reload(); } else { setProducts(imported.products || []); setSwatches(imported.swatches || []); setAwards(imported.awards || []); } showToast("데이터 복원 완료 (메모리 로드)"); } } catch (err) { showToast("파일 형식이 올바르지 않습니다.", "error"); } }; reader.readAsText(file); };

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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
                                <div className="absolute right-12 top-6 opacity-0 group-hover/header:opacity-100 transition-opacity flex space-x-1">
                                    <button onClick={(e) => { e.stopPropagation(); sidebarLogoInputRef.current.click() }} className="p-1 bg-zinc-100 rounded hover:bg-zinc-200"><ImageIcon className="w-3 h-3" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleSidebarTitleChange() }} className="p-1 bg-zinc-100 rounded hover:bg-zinc-200"><Type className="w-3 h-3" /></button>
                                    <input type="file" ref={sidebarLogoInputRef} className="hidden" accept="image/*" onChange={handleSidebarLogoUpload} />
                                </div>
                            )}
                        </div>
                        <div className="relative group/subtitle">
                            <span className="text-[10px] font-medium text-zinc-500 tracking-[0.2em] uppercase mt-0.5 block">{appSettings.subtitle}</span>
                            {isAdmin && (
                                <button onClick={(e) => { e.stopPropagation(); handleSidebarSubtitleChange() }} className="absolute -right-4 top-0 p-0.5 opacity-0 group-hover/subtitle:opacity-100 text-zinc-400 hover:text-black"><Edit2 className="w-3 h-3" /></button>
                            )}
                        </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }} className="md:hidden text-zinc-400 hover:text-zinc-600"><X className="w-6 h-6" /></button>
                </div>
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-4 custom-scrollbar">
                    <div className="space-y-1">{CATEGORIES.filter(c => c.isSpecial).map((cat) => (<button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group border ${activeCategory === cat.id ? 'bg-zinc-900 text-white shadow-lg border-zinc-900' : 'bg-white text-zinc-600 border-zinc-100 hover:bg-zinc-50 hover:border-zinc-300'}`}><div className="flex items-center">{cat.id === 'ALL' && <LayoutGrid className="w-4 h-4 mr-3 opacity-70" />}<span className="font-bold tracking-tight">{cat.label}</span></div></button>))}</div>

                    {/* Spaces Group */}
                    <div className="py-2">
                        <div className={`w-full flex items-center rounded-xl border mb-1 shadow-sm transition-all ${activeCategory === 'SPACES_ROOT' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-300'}`}>
                            <button onClick={() => handleCategoryClick('SPACES_ROOT')} className="flex-1 text-left px-4 py-3 text-sm font-bold tracking-tight">SPACES</button>
                            <button onClick={(e) => { e.stopPropagation(); setSidebarState(p => ({ ...p, spaces: !p.spaces })); }} className="px-3 py-3 border-l border-inherit opacity-70 hover:opacity-100">
                                {sidebarState.spaces ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        </div>
                        {sidebarState.spaces && (<div className="space-y-1 mt-2 pl-2 animate-in slide-in-from-top-2 duration-200">{SPACES.map((space) => (<button key={space.id} onClick={() => handleCategoryClick(space.id)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === space.id ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}><div className="flex items-center"><space.icon className={`w-3.5 h-3.5 mr-3 ${activeCategory === space.id ? 'text-white' : 'text-zinc-400'}`} />{space.label}</div>{activeCategory === space.id && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}</button>))}</div>)}
                    </div>

                    {/* Collections Group */}
                    <div className="py-2">
                        <div className={`w-full flex items-center rounded-xl border mb-1 shadow-sm transition-all ${activeCategory === 'COLLECTIONS_ROOT' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-300'}`}>
                            <button onClick={() => handleCategoryClick('COLLECTIONS_ROOT')} className="flex-1 text-left px-4 py-3 text-sm font-bold tracking-tight flex items-center">COLLECTIONS</button>
                            <button onClick={(e) => { e.stopPropagation(); setSidebarState(p => ({ ...p, collections: !p.collections })); }} className="px-3 py-3 border-l border-inherit opacity-70 hover:opacity-100">
                                {sidebarState.collections ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        </div>
                        {sidebarState.collections && (<div className="space-y-0.5 mt-2 pl-2 animate-in slide-in-from-top-2 duration-200">{CATEGORIES.filter(c => !c.isSpecial).map((cat) => (<button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === cat.id ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}>{cat.label}</button>))}</div>)}
                    </div>

                    {/* Materials Group */}
                    <div className="py-2">
                        <div className={`w-full flex items-center rounded-xl border mb-1 shadow-sm transition-all ${activeCategory === 'MATERIALS_ROOT' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-300'}`}>
                            <button onClick={() => handleCategoryClick('MATERIALS_ROOT')} className="flex-1 text-left px-4 py-3 text-sm font-bold tracking-tight">MATERIALS</button>
                            <button onClick={(e) => { e.stopPropagation(); setSidebarState(p => ({ ...p, materials: !p.materials })); }} className="px-3 py-3 border-l border-inherit opacity-70 hover:opacity-100">
                                {sidebarState.materials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        </div>
                        {sidebarState.materials && (<div className="space-y-0.5 mt-2 pl-2 animate-in slide-in-from-top-2 duration-200">{SWATCH_CATEGORIES.map((cat) => (<button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${activeCategory === cat.id ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}>{cat.label}</button>))}</div>)}
                    </div>

                    {/* Awards Group */}
                    <div className="py-2">
                        <div className={`w-full flex items-center rounded-xl border mb-1 shadow-sm transition-all ${activeCategory === 'AWARDS_ROOT' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-300'}`}>
                            <button onClick={() => handleCategoryClick('AWARDS_ROOT')} className="flex-1 text-left px-4 py-3 text-sm font-bold tracking-tight flex items-center">AWARDS</button>
                        </div>
                    </div>

                    <div className="pt-2"><button onClick={handleMyPickToggle} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeCategory === 'MY_PICK' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'text-zinc-400 border-transparent hover:bg-zinc-50 hover:text-zinc-600'}`}><Heart className={`w-4 h-4 ${activeCategory === 'MY_PICK' ? 'fill-yellow-500 text-yellow-500' : ''}`} /><span>My Pick ({favorites.length})</span></button></div>
                </nav>
                <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 space-y-3">
                    {isAdmin && (<button onClick={() => { fetchLogs(); setShowAdminDashboard(true); }} className="w-full text-[10px] text-blue-600 hover:text-blue-800 flex items-center justify-center font-bold py-1 mb-2 bg-blue-50 rounded border border-blue-100"><Settings className="w-3 h-3 mr-1" /> Dashboard</button>)}
                    <button onClick={toggleAdminMode} className={`w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isAdmin ? 'bg-zinc-900 text-white shadow-md' : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100'}`}>{isAdmin ? <Unlock className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2" />}{isAdmin ? "ADMIN MODE" : "VIEWER MODE"}</button>
                    <div className="flex justify-between items-center px-1"><span className="text-[10px] text-zinc-400">{APP_VERSION}</span><span className="text-[10px] text-zinc-300">{BUILD_DATE}</span></div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative print:overflow-visible print:h-auto">
                <header className="h-14 md:h-16 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex items-center justify-between px-4 md:px-8 z-30 flex-shrink-0 sticky top-0 transition-all print:hidden">
                    <div className="flex items-center space-x-3 w-full md:w-auto flex-1 mr-4 min-w-0">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-lg active:scale-95 transition-transform flex-shrink-0"><Menu className="w-6 h-6" /></button>
                        <div className="relative w-full max-w-md group flex items-center gap-2 flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4 group-focus-within:text-zinc-800 transition-colors" />
                            <div className="w-full pl-10 pr-4 py-2 bg-zinc-50/50 border border-transparent focus-within:bg-white focus-within:border-zinc-200 focus-within:ring-4 focus-within:ring-zinc-50 rounded-full text-sm transition-all flex items-center flex-wrap gap-1 overflow-hidden">
                                {searchTags.map((tag, idx) => (
                                    <span key={idx} className="bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded-full text-xs font-bold flex items-center whitespace-nowrap">
                                        {tag} <button onClick={() => removeSearchTag(idx)} className="ml-1 hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    placeholder={searchTags.length > 0 ? "" : "Search..."}
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); if (activeCategory === 'DASHBOARD' && e.target.value) setActiveCategory('ALL'); }}
                                    onKeyDown={handleSearchKeyDown}
                                    className="bg-transparent outline-none flex-1 min-w-[60px]"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0 overflow-visible justify-end">
                        {compareList.length > 0 && <button onClick={handleCompareButtonClick} className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold animate-in fade-in transition-all mr-1 shadow-lg whitespace-nowrap ${activeCategory === 'COMPARE_PAGE' ? 'bg-black text-white ring-2 ring-zinc-200' : 'bg-zinc-900 text-white hover:bg-black'}`}><ArrowLeftRight className="w-3 h-3 md:mr-1.5" /> <span className="hidden md:inline">Compare</span> ({compareList.length})</button>}
                        <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`p-2 rounded-full transition-all flex-shrink-0 ${isFilterOpen ? 'bg-zinc-200 text-black' : 'hover:bg-zinc-100 text-zinc-500'}`} title="Filters"><SlidersHorizontal className="w-5 h-5" /></button>
                        <button onClick={handleMyPickToggle} className={`p-2 rounded-full transition-all items-center space-x-1 flex-shrink-0 ${activeCategory === 'MY_PICK' ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600'}`} title="My Pick"><Heart className={`w-5 h-5 ${activeCategory === 'MY_PICK' ? 'fill-yellow-500 text-yellow-500' : ''}`} /></button>
                        <div className="flex items-center bg-zinc-100 rounded-lg p-1 flex-shrink-0 ml-1">
                            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="bg-transparent text-xs font-bold text-zinc-600 outline-none px-2 py-1 max-w-[80px] md:max-w-none cursor-pointer hidden md:block"><option value="manual">Manual</option><option value="launchDate">Launch</option><option value="createdAt">Added</option><option value="name">Name</option></select>
                            <button onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-zinc-500" title="Sort">{sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}</button>
                        </div>
                        {isAdmin && (<button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 bg-zinc-900 text-white rounded-full hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95 flex-shrink-0 ml-1"><Plus className="w-4 h-4 md:mr-1.5" /><span className="hidden md:inline text-sm font-bold">New</span></button>)}
                    </div>
                </header>

                {isFilterOpen && (
                    <div className="bg-zinc-50 border-b border-zinc-200 p-4 flex gap-4 overflow-x-auto items-center animate-in slide-in-from-top-5">
                        <div className="flex items-center space-x-2"><span className="text-xs font-bold text-zinc-500">Year:</span><input type="number" placeholder="YYYY" className="px-2 py-1 rounded border text-xs" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} /></div>
                        <div className="flex items-center space-x-2"><span className="text-xs font-bold text-zinc-500">Color:</span><input type="text" placeholder="Red, Blue..." className="px-2 py-1 rounded border text-xs" value={filters.color} onChange={e => setFilters({ ...filters, color: e.target.value })} /></div>
                        <label className="flex items-center space-x-2 text-xs font-bold text-zinc-600 cursor-pointer"><input type="checkbox" checked={filters.isNew} onChange={e => setFilters({ ...filters, isNew: e.target.checked })} /> <span>New Only</span></label>
                        <button onClick={() => setFilters({ year: '', color: '', isNew: false })} className="text-xs text-red-500 hover:underline ml-auto">Reset</button>
                    </div>
                )}

                <div id="main-scroll-content" ref={mainContentRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative print:overflow-visible print:p-0 pb-20 md:pb-16">
                    {activeCategory === 'DASHBOARD' && !searchTerm && searchTags.length === 0 && !filters.year && !filters.color ? (
                        <DashboardView
                            products={products}
                            favorites={favorites}
                            awards={awards}
                            swatches={swatches}
                            spaceContents={spaceContents}
                            setActiveCategory={setActiveCategory}
                            setSelectedProduct={setSelectedProduct}
                            setSelectedAward={setSelectedAward}
                            scenes={allScenes}
                            isAdmin={isAdmin}
                            bannerData={bannerData}
                            onBannerUpload={handleBannerUpload}
                            onLogoUpload={handleLogoUpload}
                            onBannerTextChange={handleBannerTextChange}
                            onSaveBannerText={saveBannerText}
                        />
                    ) : activeCategory === 'COMPARE_PAGE' ? (
                        <CompareView
                            products={compareList}
                            hiddenIds={hiddenCompareIds}
                            onToggleVisibility={toggleCompareVisibility}
                            onRemove={(id) => setCompareList(prev => prev.filter(p => p.id !== id))}
                            onEdit={(product) => { setEditingProduct(product); setIsFormOpen(true); }}
                            onProductClick={(product) => setSelectedProduct(product)}
                            isAdmin={isAdmin}
                        />
                    ) : activeCategory === 'MY_PICK' ? (
                        <MyPickView
                            favorites={favorites}
                            products={products}
                            spaces={SPACES}
                            spaceContents={spaceContents}
                            scenes={allScenes}
                            swatches={swatches}
                            awards={awards}
                            onProductClick={(p) => setSelectedProduct(p)}
                            onSceneClick={(s) => setSelectedScene(s)}
                            onSwatchClick={(s) => setSelectedSwatch(s)}
                            onAwardClick={(a) => setSelectedAward(a)}
                            onToggleFavorite={toggleFavorite}
                        />
                    ) : activeCategory === 'ALL' ? (
                        <TotalView
                            products={processedProducts}
                            categories={CATEGORIES.filter(c => !c.isSpecial)}
                            spaces={SPACES}
                            scenes={allScenes}
                            spaceContents={spaceContents}
                            materials={swatches}
                            materialCategories={SWATCH_CATEGORIES}
                            onProductClick={(p) => setSelectedProduct(p)}
                            onSceneClick={(s) => setSelectedScene(s)}
                            onSwatchClick={(s) => setSelectedSwatch(s)}
                            searchTerm={searchTerm}
                            searchTags={searchTags}
                            filters={filters}
                            favorites={favorites}
                            onToggleFavorite={toggleFavorite}
                            onCompareToggle={toggleCompare}
                            compareList={compareList}
                        />
                    ) : activeCategory === 'AWARDS_ROOT' ? (
                        <AwardsManager
                            awards={awards}
                            products={products}
                            isAdmin={isAdmin}
                            onSave={handleSaveAward}
                            onDelete={handleDeleteAward}

                            onSelect={(award) => handleOpenModal('award', award)}
                            searchTerm={searchTerm}
                            searchTags={searchTags}
                            favorites={favorites}
                            onToggleFavorite={toggleFavorite}
                            onReorder={handleMoveItem} // V 0.8.73: Use Button Move
                        />
                    ) : activeCategory.endsWith('_ROOT') ? (
                        <CategoryRootView
                            type={activeCategory}
                            spaces={SPACES}
                            spaceContents={spaceContents}
                            scenes={allScenes}
                            collections={CATEGORIES.filter(c => !c.isSpecial)}
                            materials={SWATCH_CATEGORIES}
                            products={products}
                            swatches={swatches}
                            onNavigate={handleRootNavigate}
                            onProductClick={(p) => handleOpenModal('product', p)}
                            onSwatchClick={(s) => handleOpenModal('swatch', s)}
                            onSceneClick={(s) => handleOpenModal('scene', s)}
                            searchTerm={searchTerm}
                            searchTags={searchTags}
                            filters={filters}
                            onCompareToggle={(e, p) => toggleCompare(e, p)}
                            compareList={compareList}
                            favorites={favorites}
                            onToggleFavorite={toggleFavorite}
                            onOpenModal={handleOpenModal}
                        />
                    ) : (
                        <>
                            {SPACES.find(s => s.id === activeCategory) && (
                                <SpaceDetailView
                                    space={SPACES.find(s => s.id === activeCategory)}
                                    spaceContent={spaceContents[activeCategory] || {}}
                                    additionalScenes={allScenes}
                                    isAdmin={isAdmin}
                                    activeTag={activeSpaceTag}
                                    setActiveTag={setActiveSpaceTag}
                                    onBannerUpload={(e) => handleSpaceBannerUpload(e, activeCategory)}
                                    onEditInfo={() => setEditingSpaceInfoId(activeCategory)}
                                    // V 0.8.88: Removed onManageProducts
                                    // V 0.8.9: Auto-tag scene with active filter
                                    onAddScene={() => setEditingScene({ isNew: true, spaceId: activeCategory, tags: activeSpaceTag !== 'ALL' ? [activeSpaceTag] : [] })}
                                    onViewScene={(scene) => setSelectedScene({ ...scene, spaceId: activeCategory })}
                                    productCount={processedProducts.length}
                                    searchTerm={searchTerm}
                                    searchTags={searchTags}
                                    products={processedProducts}
                                    onProductClick={(p) => handleOpenModal('product', p)}
                                    favorites={favorites}
                                    onToggleFavorite={toggleFavorite}
                                    onCompareToggle={toggleCompare}
                                    compareList={compareList}
                                    onReorder={handleMoveItem} // V 0.8.73: Use Button Move
                                />
                            )}
                            {SWATCH_CATEGORIES.find(s => s.id === activeCategory) && (
                                <SwatchManager
                                    category={SWATCH_CATEGORIES.find(s => s.id === activeCategory)}
                                    swatches={swatches.filter(s => s.category === activeCategory)}
                                    isAdmin={isAdmin}
                                    onSave={handleSaveSwatch}
                                    onDelete={handleDeleteSwatch}
                                    onSelect={(swatch) => handleOpenModal('swatch', swatch)}
                                    onDuplicate={handleDuplicateSwatch}
                                    searchTerm={searchTerm}
                                    searchTags={searchTags}
                                    favorites={favorites}
                                    onToggleFavorite={toggleFavorite}
                                    onReorder={handleMoveItem} // V 0.8.73: Use Button Move
                                />
                            )}
                            {!SWATCH_CATEGORIES.find(s => s.id === activeCategory) && (
                                <>
                                    {isLoading && products.length === 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">{[1, 2, 3, 4].map(n => (<div key={n} className="bg-white rounded-2xl p-4 h-[250px] md:h-[300px] animate-pulse border border-zinc-100"><div className="bg-zinc-100 h-32 md:h-40 rounded-xl mb-4"></div><div className="bg-zinc-100 h-4 w-2/3 rounded mb-2"></div><div className="bg-zinc-100 h-3 w-1/2 rounded"></div></div>))}</div>
                                    ) : (
                                        <>
                                            {!SPACES.find(s => s.id === activeCategory) && (
                                                <div className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-end justify-between px-1 print:hidden">
                                                    <div className="mb-4 md:mb-0">
                                                        <h2 className="text-xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">{activeCategory === 'MY_PICK' ? 'MY PICK' : CATEGORIES.find(c => c.id === activeCategory)?.label || activeCategory}</h2>
                                                        <p className="text-zinc-500 text-xs md:text-sm mt-1 font-medium">{processedProducts.length} items found {!isFirebaseAvailable && <span className="ml-2 text-red-400 bg-red-50 px-2 py-0.5 rounded-full text-xs">Offline Mode</span>}</p>
                                                    </div>
                                                    {activeCategory === 'MY_PICK' && processedProducts.length > 0 && (<div className="flex space-x-2"><div className="flex bg-zinc-100 p-1 rounded-lg"><button onClick={() => setMyPickViewMode('grid')} className={`p-2 rounded-md ${myPickViewMode === 'grid' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400'}`} title="Grid View"><Grid className="w-4 h-4" /></button><button onClick={() => setMyPickViewMode('list')} className={`p-2 rounded-md ${myPickViewMode === 'list' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400'}`} title="List View"><List className="w-4 h-4" /></button></div><button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors"><Printer className="w-4 h-4 mr-2" /> Export</button></div>)}
                                                </div>
                                            )}
                                            {activeCategory === 'MY_PICK' && myPickViewMode === 'list' ? (
                                                <div className="space-y-4 print:space-y-6 pb-32">
                                                    <div className="hidden print:block mb-8"><h1 className="text-4xl font-bold mb-2">MY PICK SELECTION</h1><p className="text-zinc-500">{new Date().toLocaleDateString()} · Patra Design Lab</p></div>
                                                    {processedProducts.map((product) => (<div key={product.id} className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-2xl border border-zinc-200 print:border-zinc-300 print:break-inside-avoid"><div className="w-full md:w-48 h-48 bg-zinc-50 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-100 flex items-center justify-center">{product.images?.[0] ? <img src={typeof product.images[0] === 'object' ? product.images[0].url : product.images[0]} className="w-full h-full object-contain mix-blend-multiply" alt={product.name} /> : <ImageIcon className="w-8 h-8 text-zinc-300" />}</div><div className="flex-1"><div className="flex justify-between items-start"><div><span className="inline-block px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs font-bold rounded mb-2">{product.category}</span><h3 className="text-2xl font-bold text-zinc-900 mb-1">{product.name}</h3><p className="text-zinc-500 font-medium text-sm mb-4">Designed by {product.designer || 'Patra Design Lab'}</p></div><button onClick={(e) => toggleFavorite(e, product.id)} className="print:hidden text-yellow-400 hover:scale-110 transition-transform"><Star className="w-6 h-6 fill-current" /></button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><div className="bg-zinc-50 p-3 rounded-lg"><span className="font-bold block text-xs text-zinc-400 uppercase mb-1">Specs</span>{product.specs}</div><div className="space-y-2"><div><span className="font-bold text-xs text-zinc-400 uppercase">Options</span> <span className="text-zinc-700">{product.options?.join(', ')}</span></div><div><span className="font-bold text-xs text-zinc-400 uppercase block mb-1">Colors</span> <div className="flex gap-2 mb-1"><span className="text-xs text-zinc-400 w-16">Body:</span><div className="flex gap-1">{product.bodyColors?.map((c, i) => <SwatchDisplay key={i} color={c} size="small" />)}</div></div><div className="flex gap-2"><span className="text-xs text-zinc-400 w-16">Upholstery:</span><div className="flex gap-1">{product.upholsteryColors?.map((c, i) => <SwatchDisplay key={i} color={c} size="small" />)}</div></div></div></div></div></div></div>))}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 pb-32 print:grid-cols-3 print:gap-4">
                                                    {processedProducts.map((product, idx) => (
                                                        <div key={product.id}>
                                                            <ProductCard
                                                                product={product}
                                                                onClick={() => setSelectedProduct(product)}
                                                                isAdmin={isAdmin}
                                                                isFavorite={favorites.includes(product.id)}
                                                                onToggleFavorite={(e) => toggleFavorite(e, product.id)}
                                                                onCompareToggle={(e) => toggleCompare(e, product)}
                                                                onDuplicate={(e) => { e.stopPropagation(); handleDuplicateProduct(product); }}
                                                                isCompared={!!compareList.find(p => p.id === product.id)}
                                                                showMoveControls={isAdmin && sortOption === 'manual'}
                                                                onMove={(direction) => handleMoveItem('products', processedProducts, idx, direction)}
                                                            />
                                                        </div>
                                                    ))}
                                                    {isAdmin && activeCategory !== 'MY_PICK' && !SPACES.find(s => s.id === activeCategory) && (<button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px] text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-all group print:hidden"><div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Plus className="w-6 h-6" /></div><span className="text-xs md:text-sm font-bold">Add Product</span></button>)}
                                                </div>
                                            )}
                                            {/* V 0.8.88: Removed Select Products Button */}
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}
                    {showScrollTop && (<button onClick={scrollToTop} className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-10 h-10 md:w-12 md:h-12 bg-black/80 backdrop-blur-md text-white rounded-full shadow-lg flex items-center justify-center hover:bg-black hover:scale-110 transition-all z-40 animate-in fade-in slide-in-from-bottom-4 print:hidden"><ChevronsUp className="w-6 h-6" /></button>)}
                </div>
            </main>

            {toast && <div className="fixed bottom-8 right-8 bg-zinc-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-bottom-10 fade-in z-[250] print:hidden">{toast.type === 'success' ? <Check className="w-5 h-5 text-green-400" /> : <Info className="w-5 h-5 text-red-400" />}<span className="text-sm font-bold tracking-wide">{toast.message}</span></div>}

            {/* Modals are now stacked using conditional rendering with z-index management */}




            {selectedSwatch && (
                <SwatchDetailModal
                    swatch={selectedSwatch}
                    allProducts={products}
                    swatches={swatches}
                    isAdmin={isAdmin}
                    onClose={() => handleCloseModal('swatch')}
                    onNavigateProduct={(product) => handleOpenModal('product', product)}
                    onNavigateSwatch={(swatch) => handleOpenModal('swatch', swatch)}
                    onEdit={() => { setEditingSwatchFromModal(selectedSwatch); }}
                />
            )}



            {/* V 0.8.93 v4: Award Detail Modal - Full Page Scroll Architecture */}
            {selectedAward && (
                <AwardDetailModal
                    award={selectedAward}
                    products={products}
                    onClose={() => handleCloseModal('award')}
                    onNavigateProduct={(p) => handleOpenModal('product', p)}
                    onSaveProduct={handleSaveProduct}
                    isAdmin={isAdmin}
                    onEdit={() => { setEditingAwardFromModal(selectedAward); }}
                />
            )}



            {editingSpaceInfoId && (
                <SpaceInfoEditModal
                    spaceId={editingSpaceInfoId}
                    currentData={spaceContents[editingSpaceInfoId]}
                    defaultTags={SPACES.find(s => s.id === editingSpaceInfoId)?.defaultTags}
                    onClose={() => setEditingSpaceInfoId(null)}
                    onSave={(data) => { handleSpaceInfoSave(editingSpaceInfoId, data); setEditingSpaceInfoId(null); }}
                />
            )}

            {/* V 0.8.88: Removed SpaceProductManager Usage */}

            {editingScene && (
                <SceneEditModal
                    initialData={editingScene}
                    allProducts={products}
                    spaceTags={(spaceContents[editingScene.spaceId]?.tags) || SPACES.find(s => s.id === editingScene.spaceId)?.defaultTags || []}
                    spaceOptions={SPACES}
                    onClose={() => setEditingScene(null)}
                    onSave={(data) => { handleSceneSave(editingScene.spaceId, data); }}
                    onDelete={(id) => { handleSceneDelete(editingScene.spaceId, id); setEditingScene(null); }}
                />
            )}

            {selectedScene && (
                <SpaceSceneModal
                    scene={selectedScene}
                    products={products.filter(p => selectedScene.productIds && selectedScene.productIds.some(id => String(id) === String(p.id)))}
                    allProducts={products}
                    isAdmin={isAdmin}
                    onClose={() => handleCloseModal('scene')}
                    onEdit={() => { setEditingScene({ ...selectedScene, isNew: false }); }}
                    onProductToggle={async (pid, add) => {
                        const newPids = add ? [...(selectedScene.productIds || []), pid] : (selectedScene.productIds || []).filter(id => id !== pid);
                        const updatedScene = { ...selectedScene, productIds: newPids };
                        setSelectedScene(updatedScene);
                        await handleSceneSave(selectedScene.spaceId, updatedScene);
                    }}
                    onNavigateProduct={(p) => handleOpenModal('product', p)}
                    isFavorite={favorites.includes(selectedScene.id)}
                    onToggleFavorite={(e) => toggleFavorite(e, selectedScene.id)}
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
                                <Activity className="w-12 h-12 mb-3 mx-auto text-zinc-300" />
                                <p className="text-lg font-bold text-zinc-600">System Status: Active</p>
                            </div>

                            <div className="w-full max-w-md bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                                <h4 className="text-sm font-bold text-zinc-500 uppercase mb-4 flex items-center"><Database className="w-4 h-4 mr-2" /> Data Management (Backup / Restore)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={handleExportData} className="flex flex-col items-center justify-center p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-400 transition-all hover:shadow-md group">
                                        <FileDown className="w-8 h-8 text-zinc-400 group-hover:text-blue-600 mb-2" />
                                        <span className="text-xs font-bold text-zinc-600">Export Backup (JSON)</span>
                                    </button>
                                    <label className="flex flex-col items-center justify-center p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-400 transition-all hover:shadow-md group cursor-pointer">
                                        <FileUp className="w-8 h-8 text-zinc-400 group-hover:text-red-600 mb-2" />
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

            {/* V 0.8.93 v3: Reordered ProductDetailModal to be last for correct stacking */}
            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    allProducts={products}
                    swatches={swatches}
                    awards={awards}
                    spaceContents={spaceContents}
                    onClose={() => handleCloseModal('product')}
                    onEdit={() => { setEditingProduct(selectedProduct); setIsFormOpen(true); }}
                    isAdmin={isAdmin}
                    showToast={showToast}
                    isFavorite={favorites.includes(selectedProduct.id)}
                    onToggleFavorite={(e) => toggleFavorite(e, selectedProduct.id)}
                    onNavigateNext={handleNavigateNext}
                    onNavigatePrev={handleNavigatePrev}
                    onNavigateSpace={(spaceId) => { setSelectedProduct(null); setActiveCategory(spaceId); }}
                    onNavigateScene={(scene) => handleOpenModal('scene', scene)}
                    onNavigateProduct={(product) => handleOpenModal('product', product)}
                    onNavigateSwatch={(swatch) => handleOpenModal('swatch', swatch)}
                    onNavigateAward={(award) => handleOpenModal('award', award)}
                    onSaveProduct={handleSaveProduct}
                />
            )}

            {isFormOpen && (
                <ProductFormModal
                    categories={CATEGORIES.filter(c => !c.isSpecial)}
                    swatches={swatches}
                    allProducts={products}
                    awards={awards}
                    initialCategory={activeCategory}
                    existingData={editingProduct}
                    onClose={() => { setIsFormOpen(false); setEditingProduct(null); }}
                    onSave={handleSaveProduct}
                    onDelete={handleDeleteProduct}
                    isFirebaseAvailable={isFirebaseAvailable}
                    spaceTags={SPACES.find(s => s.id === activeCategory)?.defaultTags || []}
                />
            )}

            {editingSwatchFromModal && (
                <SwatchFormModal
                    category={SWATCH_CATEGORIES.find(c => c.id === editingSwatchFromModal.category) || SWATCH_CATEGORIES[0]}
                    existingData={editingSwatchFromModal}
                    onClose={() => setEditingSwatchFromModal(null)}
                    onSave={(data) => {
                        handleSaveSwatch(data);
                        setEditingSwatchFromModal(null);
                        setSelectedSwatch(prev => (prev && prev.id === data.id ? { ...prev, ...data } : prev));
                    }}
                />
            )}

            {editingAwardFromModal && (
                <AwardFormModal
                    existingData={editingAwardFromModal}
                    allProducts={products}
                    onClose={() => setEditingAwardFromModal(null)}
                    onSave={(data, winners) => { handleSaveAward(data, winners); }}
                />
            )}
        </div>
    );
}

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------

// V 0.8.91: Conditional margin - mb-12 expanded, mb-4 collapsed for uniform spacing
function CollapsibleSection({ title, count, children, defaultExpanded = true }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    return (
        <div className={isExpanded ? 'mb-12' : 'mb-4'}>
            <div className={`flex items-center border-b border-zinc-100 pb-2 cursor-pointer hover:opacity-70 ${isExpanded ? 'mb-4' : 'mb-2'}`} onClick={() => setIsExpanded(!isExpanded)}>
                <h4 className="text-lg font-bold text-zinc-800">{title}</h4>
                <span className="ml-3 text-xs font-medium text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full">{count}</span>
                <div className="ml-auto">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                </div>
            </div>
            {isExpanded && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    {children}
                </div>
            )}
        </div>
    );
}

// V 0.8.83: Unified Search Logic Helper
// V 0.8.91: Added allProducts param for tagged products search in scenes
const checkSearchMatch = (item, type, searchTerm, searchTags, filters = {}, allProducts = []) => {
    // 1. Text Search Construction
    let textFields = [];
    if (type === 'product' || !type) {
        // V 0.8.84: Include Color Codes in Search
        const colorCodes = [
            ...(item.bodyColors || []).map(c => typeof c === 'object' ? c.materialCode : c),
            ...(item.upholsteryColors || []).map(c => typeof c === 'object' ? c.materialCode : c)
        ].filter(Boolean);

        textFields = [
            item.name, item.category, item.specs, item.materialCode, item.designer,
            ...(item.features || []), ...(item.options || []), ...(item.tags || []),
            item.description, ...colorCodes // Add description and color codes
        ];
    } else if (type === 'scene') {
        // V 0.8.91: Include tagged product names in scene search
        const taggedProductNames = (item.productIds || [])
            .map(pid => allProducts.find(p => String(p.id) === String(pid)))
            .filter(Boolean)
            .map(p => p.name);
        textFields = [item.title, item.description, ...(item.tags || []), ...taggedProductNames];
    } else if (type === 'material' || type === 'swatch') {
        textFields = [item.name, item.materialCode, item.group, item.category, ...(item.tags || [])];
    } else if (type === 'award') {
        textFields = [item.title, item.organization, ...(item.tags || [])];
    }

    const fullText = textFields.filter(Boolean).join(' ').toLowerCase();

    // 2. Search Term Match
    const matchesSearch = !searchTerm || fullText.includes(searchTerm.toLowerCase());

    // 3. Search Tags Match
    const matchesTags = !searchTags || searchTags.length === 0 || searchTags.every(t => fullText.includes(t.toLowerCase()));

    // 4. Product Filters (only if type is product)
    let matchesFilter = true;
    if (type === 'product' && filters) {
        if (filters.isNew && !item.isNew) matchesFilter = false;
        if (filters.year && !item.launchDate?.startsWith(filters.year)) matchesFilter = false;
        if (filters.color) {
            const colorMatch = [...(item.bodyColors || []), ...(item.upholsteryColors || [])].some(c => {
                const name = typeof c === 'object' ? c.name : c;
                return name?.toLowerCase().includes(filters.color.toLowerCase());
            });
            if (!colorMatch) matchesFilter = false;
        }
    }

    return matchesSearch && matchesTags && matchesFilter;
};

function TotalView({ products, categories, spaces, scenes, spaceContents, materials, materialCategories, onProductClick, onSceneClick, onSwatchClick, searchTerm, searchTags, filters, favorites, onToggleFavorite, onCompareToggle, compareList }) {
    // Filter Logic - V 0.8.83: Uses unified checkSearchMatch
    // V 0.8.91: Pass products array for scene tagged products search
    const filterItem = (item, type) => checkSearchMatch(item, type, searchTerm, searchTags, filters, type === 'scene' ? products : []);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 pb-32">
            <div className="mb-8 flex items-center">
                <div className="p-3 bg-zinc-900 text-white rounded-xl mr-4">
                    <LayoutGrid className="w-6 h-6" />
                </div>
                <h2 className="text-4xl font-black text-zinc-900 tracking-tight">Total View</h2>
            </div>

            {/* SPACES SECTION */}
            <div className="mb-16">
                <h3 className="text-2xl font-black text-zinc-900 mb-6 flex items-center"><Briefcase className="w-6 h-6 mr-2" /> SPACES</h3>
                <div className="space-y-4">
                    {spaces.map(space => {
                        // V 0.8.9: Use scenes array for accurate aggregation
                        const spaceScenes = scenes.filter(s => s.spaceId === space.id).filter(s => filterItem(s, 'scene'));
                        if (spaceScenes.length === 0) return null;

                        return (
                            <CollapsibleSection key={space.id} title={space.label} count={spaceScenes.length}>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {spaceScenes.map(scene => (
                                        <div key={scene.id} onClick={() => onSceneClick({ ...scene, spaceId: space.id })} className="group cursor-pointer relative">
                                            <div className="aspect-[4/3] bg-zinc-50 rounded-xl mb-2 overflow-hidden border border-zinc-100 relative">
                                                <img src={scene.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                <button onClick={(e) => onToggleFavorite(e, scene.id)} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-zinc-300 hover:text-yellow-400 hover:scale-110 transition-all z-10">
                                                    <Star className={`w-3.5 h-3.5 ${favorites.includes(scene.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                </button>
                                            </div>
                                            <h4 className="text-xs font-bold text-zinc-900 truncate group-hover:text-blue-600">{scene.title}</h4>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        );
                    })}
                </div>
            </div>

            {/* COLLECTIONS SECTION */}
            <div className="mb-16">
                <h3 className="text-2xl font-black text-zinc-900 mb-6 flex items-center"><Cloud className="w-6 h-6 mr-2" /> COLLECTIONS</h3>
                <div className="space-y-4">
                    {categories.map(cat => {
                        const catProducts = products.filter(p => p.category === cat.id && filterItem(p, 'product'));
                        if (catProducts.length === 0) return null;

                        return (
                            <CollapsibleSection key={cat.id} title={cat.label} count={catProducts.length}>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {catProducts.map(product => (
                                        <div key={product.id}>
                                            <ProductCard
                                                product={product}
                                                onClick={() => onProductClick(product)}
                                                isFavorite={favorites.includes(product.id)}
                                                onToggleFavorite={(e) => onToggleFavorite(e, product.id)}
                                                onCompareToggle={(e) => onCompareToggle(e, product)}
                                                isCompared={!!compareList.find(p => p.id === product.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        );
                    })}
                </div>
            </div>

            {/* MATERIALS SECTION */}
            <div className="mb-16">
                <h3 className="text-2xl font-black text-zinc-900 mb-6 flex items-center"><Palette className="w-6 h-6 mr-2" /> MATERIALS</h3>
                <div className="space-y-4">
                    {materialCategories.map(cat => {
                        const catSwatches = materials.filter(s => s.category === cat.id && filterItem(s, 'material'));
                        if (catSwatches.length === 0) return null;

                        return (
                            <CollapsibleSection key={cat.id} title={cat.label} count={catSwatches.length}>
                                <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                    {catSwatches.map(swatch => (
                                        <div key={swatch.id} onClick={() => onSwatchClick(swatch)} className="group cursor-pointer relative">
                                            <div className="aspect-square bg-zinc-50 rounded-xl mb-2 overflow-hidden border border-zinc-100 relative">
                                                <SwatchDisplay color={swatch} className="w-full h-full rounded-none scale-100" />
                                                <button onClick={(e) => onToggleFavorite(e, swatch.id)} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-zinc-300 hover:text-yellow-400 hover:scale-110 transition-all z-10">
                                                    <Star className={`w-3.5 h-3.5 ${favorites.includes(swatch.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                </button>
                                            </div>
                                            <h4 className="text-xs font-bold text-zinc-900 truncate group-hover:text-blue-600">{swatch.name}</h4>
                                            <p className="text-[10px] text-zinc-400 truncate">{swatch.materialCode}</p>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function CategoryRootView({ type, spaces, spaceContents, scenes, collections, materials, products, swatches, onNavigate, onProductClick, onSwatchClick, onSceneClick, searchTerm, searchTags, filters, onCompareToggle, compareList, favorites, onToggleFavorite }) {
    let title = "";
    let items = [];
    let icon = null;
    let isMaterial = false;

    // Filter Logic
    // Filter Logic - V 0.8.83: Uses unified checkSearchMatch
    const filterItem = (item, itemType) => checkSearchMatch(item, itemType, searchTerm, searchTags, filters);

    if (type === 'SPACES_ROOT') {
        title = "Spaces";
        items = spaces;
        icon = Circle;
    } else if (type === 'COLLECTIONS_ROOT') {
        title = "Collections";
        items = collections;
        icon = Cloud;
    } else if (type === 'MATERIALS_ROOT') {
        title = "Materials";
        items = materials;
        icon = Palette;
        isMaterial = true;
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 pb-32">
            <div className="mb-8 flex items-center">
                <div className="p-3 bg-zinc-900 text-white rounded-xl mr-4">
                    {icon && React.createElement(icon, { className: "w-6 h-6" })}
                </div>
                <h2 className="text-4xl font-black text-zinc-900 tracking-tight">{title}</h2>
            </div>

            <div className="space-y-8">
                {items.map(item => {
                    let subItems = [];
                    let itemType = '';

                    if (type === 'SPACES_ROOT') {
                        // V 0.8.9: Use scenes array for accurate aggregation
                        subItems = scenes.filter(s => s.spaceId === item.id);
                        itemType = 'scene';
                    } else if (type === 'COLLECTIONS_ROOT') {
                        subItems = products.filter(p => p.category === item.id);
                        itemType = 'product';
                    } else if (type === 'MATERIALS_ROOT') {
                        subItems = swatches.filter(s => s.category === item.id);
                        itemType = 'material';
                    }

                    subItems = subItems.filter(i => filterItem(i, itemType));

                    if (subItems.length === 0) return null;

                    return (
                        <CollapsibleSection key={item.id} title={item.label} count={subItems.length}>
                            <div className={`grid gap-4 ${type === 'MATERIALS_ROOT' ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6' : (type === 'SPACES_ROOT' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5')}`}>
                                {subItems.map(sub => {
                                    if (type === 'COLLECTIONS_ROOT') {
                                        return (
                                            <div key={sub.id}>
                                                <ProductCard
                                                    product={sub}
                                                    onClick={() => onProductClick(sub)}
                                                    isFavorite={favorites.includes(sub.id)}
                                                    onToggleFavorite={(e) => onToggleFavorite(e, sub.id)}
                                                    onCompareToggle={(e) => onCompareToggle(e, sub)}
                                                    isCompared={!!compareList.find(p => p.id === sub.id)}
                                                    showMoveControls={true}
                                                    onMove={(direction) => onNavigate('move', sub, direction, subItems)}
                                                />
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={sub.id}
                                            onClick={() => {
                                                if (type === 'SPACES_ROOT') onSceneClick({ ...sub, spaceId: item.id });
                                                else onSwatchClick(sub);
                                            }}
                                            className="group cursor-pointer relative"
                                        >
                                            <div className={`aspect-[4/3] ${isMaterial ? 'rounded-xl aspect-square' : 'rounded-xl'} bg-zinc-50 overflow-hidden border border-zinc-100 relative mb-2 p-0`}>
                                                {type === 'SPACES_ROOT' ? (
                                                    <img src={sub.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                ) : (
                                                    <SwatchDisplay color={sub} className="w-full h-full rounded-none scale-100" />
                                                )}

                                                <button onClick={(e) => onToggleFavorite(e, sub.id)} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-zinc-300 hover:text-yellow-400 hover:scale-110 transition-all z-10">
                                                    <Star className={`w-3.5 h-3.5 ${favorites.includes(sub.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                </button>
                                            </div>
                                            <h4 className="text-sm font-bold text-zinc-900 truncate group-hover:text-blue-600">
                                                {type === 'SPACES_ROOT' ? sub.title : sub.name}
                                            </h4>
                                            {type !== 'MATERIALS_ROOT' && <p className="text-xs text-zinc-400 truncate">{type === 'SPACES_ROOT' ? sub.description : (sub.designer || item.label)}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </CollapsibleSection>
                    );
                })}
            </div>
        </div>
    );
}

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
                            <th className="w-24 md:w-32 bg-zinc-50 border-b border-r border-zinc-100 p-2 md:p-3 text-left text-[10px] md:text-xs font-bold text-zinc-400 uppercase sticky top-0 left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Feature</th>
                            {visibleProducts.map(p => (
                                <th key={p.id} className="w-40 md:w-64 bg-white border-b border-r border-zinc-100 p-2 md:p-3 align-top sticky top-0 z-10">
                                    <div className="relative group">
                                        <h4 className="font-bold text-sm md:text-base text-zinc-900 mb-1 truncate pr-6">{p.name}</h4>
                                        <button onClick={() => onRemove(p.id)} className="absolute top-0 right-0 text-zinc-300 hover:text-red-500"><X className="w-4 h-4" /></button>
                                    </div>
                                </th>
                            ))}
                            {visibleProducts.length < 4 && Array(4 - visibleProducts.length).fill(0).map((_, i) => <th key={`ph-${i}`} className="w-40 md:w-64 bg-zinc-50/10 border-b border-zinc-50"></th>)}
                        </tr>
                    </thead>
                    <tbody className="text-xs md:text-sm">
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-3 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Image</td>
                            {visibleProducts.map(p => (
                                <td key={p.id} className="border-r border-b border-zinc-100 p-0">
                                    <div onClick={() => onProductClick(p)} className="aspect-[4/3] bg-zinc-50 flex items-center justify-center overflow-hidden cursor-pointer relative">
                                        {p.images?.[0] ? <img src={typeof p.images[0] === 'object' ? p.images[0].url : p.images[0]} className="w-full h-full object-contain mix-blend-multiply" /> : <ImageIcon className="text-zinc-300" />}
                                    </div>
                                </td>
                            ))}
                            {visibleProducts.length < 4 && Array(4 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-3 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Category</td>
                            {visibleProducts.map(p => <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-3 text-zinc-700 font-medium truncate">{p.category}</td>)}
                            {visibleProducts.length < 4 && Array(4 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-3 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Designer</td>
                            {visibleProducts.map(p => <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-3 text-zinc-700 truncate">{p.designer || '-'}</td>)}
                            {visibleProducts.length < 4 && Array(4 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-3 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Specs</td>
                            {visibleProducts.map(p => <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-3 text-zinc-600 text-[10px] md:text-xs leading-relaxed whitespace-pre-wrap">{p.specs}</td>)}
                            {visibleProducts.length < 4 && Array(4 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-3 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Options</td>
                            {visibleProducts.map(p => (
                                <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-3">
                                    <div className="flex flex-wrap gap-1">
                                        {p.options?.map((opt, i) => <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] md:text-[10px] font-bold border border-blue-100">{opt}</span>)}
                                    </div>
                                </td>
                            ))}
                            {visibleProducts.length < 4 && Array(4 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-3 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Features</td>
                            {visibleProducts.map(p => (
                                <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-3">
                                    <div className="flex flex-wrap gap-1">
                                        {p.features?.map((ft, i) => <span key={i} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[9px] md:text-[10px] font-medium flex items-center"><Check className="w-2.5 h-2.5 mr-1" />{ft}</span>)}
                                    </div>
                                </td>
                            ))}
                            {visibleProducts.length < 4 && Array(4 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-3 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Body Color</td>
                            {visibleProducts.map(p => (
                                <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-3">
                                    <div className="flex flex-wrap gap-1">
                                        {p.bodyColors?.slice(0, 8).map((c, i) => <SwatchDisplay key={i} color={c} size="small" />)}
                                        {(p.bodyColors?.length > 8) && <span className="text-[9px] text-zinc-400">+</span>}
                                    </div>
                                </td>
                            ))}
                            {visibleProducts.length < 4 && Array(4 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                        <tr>
                            <td className="bg-zinc-50 border-r border-b border-zinc-100 p-2 md:p-3 font-bold text-zinc-500 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Upholstery Color</td>
                            {visibleProducts.map(p => (
                                <td key={p.id} className="border-r border-b border-zinc-100 p-2 md:p-3">
                                    <div className="flex flex-wrap gap-1">
                                        {p.upholsteryColors?.slice(0, 8).map((c, i) => <SwatchDisplay key={i} color={c} size="small" />)}
                                        {(p.upholsteryColors?.length > 8) && <span className="text-[9px] text-zinc-400">+</span>}
                                    </div>
                                </td>
                            ))}
                            {visibleProducts.length < 4 && Array(4 - visibleProducts.length).fill(0).map((_, i) => <td key={i} className="border-b border-zinc-50"></td>)}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 md:left-72 right-0 bg-white border-t border-zinc-200 p-3 flex justify-end gap-3 z-40">
                <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-bold hover:bg-zinc-200"><Printer className="w-4 h-4 mr-2" /> Print / PDF</button>
                <button className="flex items-center px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-black"><Share2 className="w-4 h-4 mr-2" /> Share</button>
            </div>
        </div>
    );
}

// V 0.8.92: Added scenes prop for correct scene favorites
function MyPickView({ favorites, products, spaces, spaceContents, scenes = [], swatches, awards, onProductClick, onSceneClick, onSwatchClick, onAwardClick, onToggleFavorite }) {
    // Group favorites
    const favProducts = products.filter(p => favorites.includes(p.id));
    // V 0.8.92: Use passed scenes (already merged) instead of legacy spaceContents
    const favScenes = scenes.filter(s => favorites.includes(s.id));
    const favSwatches = swatches.filter(s => favorites.includes(s.id));
    const favAwards = awards ? awards.filter(a => favorites.includes(a.id)) : [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 pb-32">
            <div className="mb-8 flex items-center">
                <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl mr-4">
                    <Heart className="w-6 h-6 fill-current" />
                </div>
                <h2 className="text-4xl font-black text-zinc-900 tracking-tight">My Pick</h2>
            </div>

            {favProducts.length > 0 && (
                <CollapsibleSection title="Products" count={favProducts.length}>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {favProducts.map(product => (
                            <div key={product.id} onClick={() => onProductClick(product)} className="group cursor-pointer relative">
                                <div className="aspect-square bg-zinc-50 rounded-xl mb-2 overflow-hidden border border-zinc-100 relative p-0">
                                    {product.images?.[0] ? <img src={typeof product.images[0] === 'object' ? product.images[0].url : product.images[0]} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" /> : <ImageIcon className="w-8 h-8 text-zinc-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                                    <button onClick={(e) => onToggleFavorite(e, product.id)} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-yellow-400 hover:scale-110 transition-all z-10"><Star className="w-3.5 h-3.5 fill-current" /></button>
                                </div>
                                <h4 className="text-xs font-bold text-zinc-900 truncate group-hover:text-blue-600">{product.name}</h4>
                                <p className="text-[10px] text-zinc-400 truncate">{product.category}</p>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {favScenes.length > 0 && (
                <CollapsibleSection title="Scenes" count={favScenes.length}>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {favScenes.map(scene => (
                            <div key={scene.id} onClick={() => onSceneClick(scene)} className="group cursor-pointer relative">
                                <div className="aspect-[4/3] bg-zinc-50 rounded-xl mb-2 overflow-hidden border border-zinc-100 relative">
                                    <img src={scene.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    <button onClick={(e) => onToggleFavorite(e, scene.id)} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-yellow-400 hover:scale-110 transition-all z-10"><Star className="w-3.5 h-3.5 fill-current" /></button>
                                </div>
                                <h4 className="text-xs font-bold text-zinc-900 truncate group-hover:text-blue-600">{scene.title}</h4>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {favSwatches.length > 0 && (
                <CollapsibleSection title="Materials" count={favSwatches.length}>
                    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {favSwatches.map(swatch => (
                            <div key={swatch.id} onClick={() => onSwatchClick(swatch)} className="group cursor-pointer relative">
                                <div className="aspect-square bg-zinc-50 rounded-xl mb-2 overflow-hidden border border-zinc-100 relative">
                                    <SwatchDisplay color={swatch} className="w-full h-full rounded-none scale-100" />
                                    <button onClick={(e) => onToggleFavorite(e, swatch.id)} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-yellow-400 hover:scale-110 transition-all z-10"><Star className="w-3.5 h-3.5 fill-current" /></button>
                                </div>
                                <h4 className="text-xs font-bold text-zinc-900 truncate group-hover:text-blue-600">{swatch.name}</h4>
                                <p className="text-[10px] text-zinc-400 truncate">{swatch.materialCode}</p>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {favAwards.length > 0 && (
                <CollapsibleSection title="Awards" count={favAwards.length}>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {favAwards.map(award => (
                            <div key={award.id} onClick={() => onAwardClick(award)} className="group cursor-pointer relative">
                                <div className="aspect-square bg-zinc-50 rounded-xl mb-2 overflow-hidden border border-zinc-100 relative p-4 flex items-center justify-center">
                                    {award.image ? <img src={award.image} className="w-full h-full object-contain" /> : <Trophy className="w-12 h-12 text-zinc-300" />}
                                    <button onClick={(e) => onToggleFavorite(e, award.id)} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-yellow-400 hover:scale-110 transition-all z-10"><Star className="w-3.5 h-3.5 fill-current" /></button>
                                </div>
                                <h4 className="text-xs font-bold text-zinc-900 truncate group-hover:text-blue-600">{award.title}</h4>
                                <p className="text-[10px] text-zinc-400 truncate">{award.organization}</p>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {favProducts.length === 0 && favScenes.length === 0 && favSwatches.length === 0 && favAwards.length === 0 && (
                <div className="text-center py-20 text-zinc-400">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No favorites added yet.</p>
                </div>
            )}
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

    // Size Logic: If external className is provided (like w-full h-full), we use that instead of fixed size classes
    const hasSize = className.includes('w-') || className.includes('h-');
    const sizeClass = hasSize ? '' : (size === 'large' ? 'w-10 h-10' : size === 'small' ? 'w-4 h-4' : 'w-6 h-6');

    // Check if we need to force square (e.g. for tiles) or round (for swatch dots)
    const roundedClass = className.includes('rounded') ? '' : 'rounded-full';

    // V 0.8.4: Improved Light Color Detection for Border
    const isLight = hex && (
        hex.toLowerCase() === '#ffffff' ||
        hex.toLowerCase() === '#fff' ||
        hex.toLowerCase().startsWith('#f') ||
        hex.toLowerCase().startsWith('#e') ||
        hex.toLowerCase().startsWith('#d') // Added lighter grays
    );

    // CSS Pattern Generation
    const getPatternStyle = (type, pColor) => {
        switch (type) {
            case 'DOT': return { backgroundImage: `radial-gradient(${pColor} 1px, transparent 1px)`, backgroundSize: '4px 4px' };
            case 'DIAGONAL': return { backgroundImage: `repeating-linear-gradient(45deg, ${pColor} 0, ${pColor} 1px, transparent 0, transparent 50%)`, backgroundSize: '6px 6px' };
            case 'GRID': return { backgroundImage: `linear-gradient(${pColor} 1px, transparent 1px), linear-gradient(90deg, ${pColor} 1px, transparent 1px)`, linearGradient: `90deg, ${pColor} 1px, transparent 1px`, backgroundSize: '6px 6px' };
            case 'KNIT': return { backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, ${pColor} 2px, ${pColor} 4px), repeating-linear-gradient(-45deg, transparent, transparent 2px, ${pColor} 2px, ${pColor} 4px)` };
            case 'WEAVE': return { backgroundImage: `linear-gradient(45deg, ${pColor} 25%, transparent 25%, transparent 75%, ${pColor} 75%, ${pColor}), linear-gradient(45deg, ${pColor} 25%, transparent 25%, transparent 75%, ${pColor} 75%, ${pColor})`, backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px' };
            case 'FUR': return { backgroundImage: `repeating-radial-gradient(circle at 50% 50%, ${pColor} 0, transparent 2px)`, backgroundSize: '3px 3px' };
            case 'LEATHER': return { backgroundImage: `radial-gradient(${pColor} 1px, transparent 0)`, backgroundSize: '3px 3px' };
            default: return {};
        }
    };

    // Base Background
    const baseStyle = image ?
        { backgroundImage: `url(${image})`, backgroundSize: 'cover' } :
        (visualType === 'GRADATION' && gradient) ? { background: gradient } : { backgroundColor: hex };

    // Texture Gloss/Matte Effect (Overlay)
    const getTextureOverlay = (type) => {
        if (type === 'GLOSSY') return { background: 'linear-gradient(to bottom right, rgba(255,255,255,0.6) 0%, transparent 40%, transparent 100%)' };
        if (type === 'SEMI_GLOSSY') return { background: 'linear-gradient(to bottom right, rgba(255,255,255,0.3) 0%, transparent 50%, transparent 100%)' };
        if (type === 'MATTE') return { boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' };
        if (type === 'CLEAR') return { opacity: 0.6, border: '1px solid rgba(0,0,0,0.1)' };
        return {};
    };

    // V 0.8.4: Apply border for light colors
    const borderStyle = isLight ? { boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)' } : { boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' };

    return (
        <div className={`group relative inline-block ${sizeClass} ${roundedClass} ${className} ${onClick ? 'cursor-pointer' : ''} overflow-hidden box-border`} title={name} onClick={onClick} style={borderStyle}>
            {/* Layer 1: Base Color/Gradient/Image */}
            <div className="absolute inset-0 w-full h-full" style={baseStyle}></div>

            {/* Layer 2: Pattern Overlay */}
            {!image && pattern !== 'NONE' && (
                <div className="absolute inset-0 w-full h-full" style={getPatternStyle(pattern, patternColor)}></div>
            )}

            {/* Layer 3: Texture/Finish Overlay */}
            <div className="absolute inset-0 w-full h-full pointer-events-none" style={getTextureOverlay(textureType)}></div>
        </div>
    );
}

function SwatchManager({ category, swatches, isAdmin, onSave, onDelete, onSelect, onDuplicate, searchTerm, searchTags, favorites, onToggleFavorite, onReorder }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSwatch, setEditingSwatch] = useState(null);
    const [activeTag, setActiveTag] = useState('ALL');

    const allTags = Array.from(new Set(swatches.flatMap(s => s.tags || []))).sort();

    const handleCardClick = (swatch) => { onSelect(swatch); };
    const handleEditClick = (e, swatch) => { e.stopPropagation(); setEditingSwatch(swatch); setIsModalOpen(true); };

    // Filter Logic including search
    const filteredSwatches = swatches.filter(s => {
        const matchesTag = activeTag === 'ALL' || (s.tags && s.tags.includes(activeTag));
        // V 0.8.83: Unified Search
        const matchesSearch = checkSearchMatch(s, 'swatch', searchTerm, searchTags);

        return matchesTag && matchesSearch;
    });

    // Sort by orderIndex
    filteredSwatches.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    return (
        <div className="p-1 animate-in fade-in pb-24 md:pb-32">
            {/* Adjusted Header Style to match Scenes/Collections */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-extrabold text-zinc-900 flex items-center tracking-tight">
                    <div className="w-3 h-6 mr-3 rounded-full" style={{ backgroundColor: category.color }}></div>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                {filteredSwatches.map((swatch, idx) => (
                    <div
                        key={swatch.id}
                        onClick={() => handleCardClick(swatch)}
                        className="bg-white rounded-xl border border-zinc-200 overflow-hidden group hover:shadow-lg transition-all relative cursor-pointer"
                    >
                        <div className="aspect-square relative bg-zinc-100 flex items-center justify-center overflow-hidden">
                            <SwatchDisplay color={swatch} className="w-full h-full rounded-none scale-100" />

                            <button onClick={(e) => onToggleFavorite(e, swatch.id)} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-zinc-300 hover:text-yellow-400 hover:scale-110 transition-all z-10">
                                <Star className={`w-3.5 h-3.5 ${favorites.includes(swatch.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            </button>

                            {isAdmin && (
                                <>
                                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button onClick={(e) => { e.stopPropagation(); onDuplicate(swatch); }} className="p-1.5 bg-white rounded-full shadow hover:text-green-600"><Layers className="w-3 h-3" /></button>
                                        <button onClick={(e) => handleEditClick(e, swatch)} className="p-1.5 bg-white rounded-full shadow hover:text-blue-600"><Edit2 className="w-3 h-3" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(swatch.id); }} className="p-1.5 bg-white rounded-full shadow hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                    {/* V 0.8.92: Use filteredSwatches with display idx for correct visual swap */}
                                    <div className="absolute bottom-2 left-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); onReorder('swatches', filteredSwatches, idx, 'left') }} className="p-1 bg-white rounded-full shadow hover:bg-black hover:text-white"><ArrowLeft className="w-3 h-3" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); onReorder('swatches', filteredSwatches, idx, 'right') }} className="p-1 bg-white rounded-full shadow hover:bg-black hover:text-white"><ArrowRight className="w-3 h-3" /></button>
                                    </div>
                                </>
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

        // V 0.8.93 v7: Enhanced Material Linkage
        const sName = swatch.name?.toLowerCase().trim();
        const sCode = swatch.materialCode?.toLowerCase().trim();

        // 1. Check 'Materials' string list in Product
        const inMaterials = p.materials?.some(m => {
            const mat = m.toLowerCase().trim();
            return mat === sName || (sCode && mat === sCode);
        });

        // 2. Check Tag Linkage: Swatch Tags vs Product Name/Tags
        // If Swatch has tags (e.g. "Eco"), check if Product Name contains "Eco" or Product 'materials' contains "Eco"
        const inTags = swatch.tags?.some(tag => {
            const t = tag.toLowerCase().trim();
            if (!t) return false;
            return p.name.toLowerCase().includes(t) ||
                p.materials?.some(m => m.toLowerCase().includes(t));
        }) || false;

        return inBody || inUph || inMaterials || inTags;
    });

    const handleShareImage = async () => { /* Placeholder */ };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-0 md:p-4 animate-in zoom-in-95 duration-300">
            <div className="bg-white w-full h-full md:h-auto md:max-w-4xl rounded-none md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row md:max-h-[90vh] relative">
                <div className="absolute top-4 right-4 z-[100] flex gap-2">
                    {isAdmin && <button onClick={onEdit} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><Edit3 className="w-6 h-6 text-zinc-900" /></button>}
                    <button onClick={onClose} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><X className="w-6 h-6 text-zinc-900" /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row h-full pb-safe print:overflow-visible print:h-auto">
                    <div className="w-full md:w-5/12 bg-zinc-50 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-zinc-100 md:sticky md:top-0 print:static print:bg-white print:border-none min-h-[40vh]">
                        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full shadow-2xl overflow-hidden border-4 border-white ring-1 ring-black/5 flex items-center justify-center bg-white">
                            <SwatchDisplay color={swatch} size="large" className="w-full h-full scale-100 rounded-full" />
                        </div>
                    </div>

                    <div className="w-full md:w-7/12 bg-white p-6 md:p-10 flex flex-col pb-24 md:pb-10">
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
                                <span className="w-3 h-3 rounded-full mr-2 border border-zinc-200" style={{ backgroundColor: swatch.hex }}></span>
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

                            {/* Share & Print - V 0.8.85: Match Material Modal Design - V 0.8.87: More space on desktop */}
                            <div className="pt-8 border-t border-zinc-100 flex gap-3 print:hidden mb-safe mb-2 md:mb-10">
                                <button onClick={handleShareImage} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 flex items-center justify-center"><ImgIcon className="w-4 h-4 mr-2" /> Share</button>
                                <button onClick={() => window.print()} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 flex items-center justify-center"><Printer className="w-4 h-4 mr-2" /> PDF</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SwatchFormModal({ category, existingData, onClose, onSave }) {
    useScrollLock(); // V 0.8.74: Added scroll lock
    const [data, setData] = useState({
        id: null, name: '', category: category.id, hex: '#000000', image: null,
        description: '', materialCode: '', tags: '', textureType: 'SOLID',
        visualType: 'SOLID', gradient: 'linear-gradient(to right, #000, #fff)',
        pattern: 'NONE', patternColor: '#00000033'
    });

    // For gradient UI helpers
    const [gradientColors, setGradientColors] = useState(['#000000', '#ffffff']);

    const fileRef = useRef(null);

    useEffect(() => {
        if (existingData) {
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
            // Try to parse gradient colors if possible (simple parse)
            if (existingData.visualType === 'GRADATION' && existingData.gradient) {
                // very basic extraction for UI sync
                const matches = existingData.gradient.match(/#[0-9a-fA-F]{3, 6}/g);
                if (matches && matches.length >= 2) setGradientColors([matches[0], matches[1]]);
            }
        }
    }, [existingData]);

    useEffect(() => {
        if (data.visualType === 'GRADATION') {
            setData(prev => ({ ...prev, gradient: `linear-gradient(to right, ${gradientColors[0]}, ${gradientColors[1]})` }));
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
        if (file) {
            try { const url = await processImage(file); setData(p => ({ ...p, image: url })); } catch (e) { }
        }
    };

    const handleDeleteImage = () => setData(p => ({ ...p, image: null }));

    const handleSubmit = () => {
        onSave({
            ...data,
            tags: data.tags.split(',').map(t => t.trim()).filter(Boolean)
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1060] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="px-5 py-4 border-b border-zinc-100 font-bold text-lg flex-shrink-0">
                    {existingData ? 'Edit Material' : 'Add Material'}
                </div>
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar pb-safe">
                    {/* Preview */}
                    <div className="flex justify-center mb-4">
                        <div onClick={() => fileRef.current.click()} className="w-24 h-24 rounded-full shadow-md border-4 border-white cursor-pointer overflow-hidden relative group bg-zinc-100 flex items-center justify-center">
                            <SwatchDisplay color={data} size="large" className="w-full h-full scale-100 rounded-none" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-6 h-6 text-white" /></div>
                        </div>
                        <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleUpload} />
                    </div>

                    {data.image && (
                        <button onClick={handleDeleteImage} className="w-full py-1 text-xs text-red-500 font-bold border border-red-100 rounded bg-red-50 hover:bg-red-100 mb-2">Delete Image</button>
                    )}

                    {/* Visual Settings Group - Tighter UI */}
                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 space-y-2">
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Visual Settings</h4>
                        <div>
                            <div className="flex gap-1">
                                <button onClick={() => setData({ ...data, visualType: 'SOLID' })} className={`flex-1 py-1.5 text-[10px] font-bold rounded border ${data.visualType === 'SOLID' ? 'bg-zinc-900 text-white' : 'bg-white'}`}>Solid</button>
                                <button onClick={() => setData({ ...data, visualType: 'GRADATION' })} className={`flex-1 py-1.5 text-[10px] font-bold rounded border ${data.visualType === 'GRADATION' ? 'bg-zinc-900 text-white' : 'bg-white'}`}>Gradation</button>
                            </div>
                        </div>

                        {data.visualType === 'SOLID' ? (
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Color (Hex)</label>
                                <div className="flex gap-2">
                                    <input type="color" value={data.hex} onChange={e => setData({ ...data, hex: e.target.value })} className="h-7 w-10 p-0 border rounded overflow-hidden" />
                                    <input value={data.hex} onChange={e => setData({ ...data, hex: e.target.value })} className="flex-1 border rounded p-1 text-xs outline-none" />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Gradient Colors</label>
                                <div className="flex gap-2 mb-1">
                                    <input type="color" value={gradientColors[0]} onChange={e => setGradientColors([e.target.value, gradientColors[1]])} className="h-6 w-full rounded border" />
                                    <input type="color" value={gradientColors[1]} onChange={e => setGradientColors([gradientColors[0], e.target.value])} className="h-6 w-full rounded border" />
                                </div>
                                <input value={data.gradient} onChange={e => setData({ ...data, gradient: e.target.value })} className="w-full border rounded p-1 text-[10px] outline-none bg-white text-zinc-400" readOnly />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Pattern</label>
                                <select value={data.pattern} onChange={e => setData({ ...data, pattern: e.target.value })} className="w-full border rounded p-1 text-xs outline-none bg-white">
                                    {PATTERN_TYPES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Pattern Color</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={data.patternColor?.substring(0, 7) || '#000000'} onChange={e => setData({ ...data, patternColor: e.target.value })} className="h-6 w-6 rounded border p-0 overflow-hidden" />
                                    <span className="text-[10px] text-zinc-400">{data.patternColor}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Finish Type</label>
                            <select value={data.textureType} onChange={e => setData({ ...data, textureType: e.target.value })} className="w-full border rounded p-1 text-xs outline-none bg-white">
                                {TEXTURE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Material Code</label>
                        <input value={data.materialCode} onChange={e => setData({ ...data, materialCode: e.target.value })} className="w-full border rounded-lg p-2 text-sm outline-none font-mono font-bold" />
                    </div>

                    <div>
                        <input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="w-full border rounded-lg p-2 text-sm outline-none" />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Description</label>
                        <textarea rows={3} value={data.description} onChange={e => setData({ ...data, description: e.target.value })} className="w-full border rounded-lg p-2 text-sm outline-none" />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Tags</label>
                        <input value={data.tags} onChange={e => setData({ ...data, tags: e.target.value })} className="w-full border rounded-lg p-2 text-sm outline-none" />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Category</label>
                        <select value={data.category} onChange={e => setData({ ...data, category: e.target.value })} className="w-full border rounded-lg p-2 text-sm outline-none bg-white">
                            {SWATCH_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                    </div>
                </div>
                <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end space-x-2 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold shadow-md hover:bg-black">Save</button>
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
                    const opacity = (hoveredIndex !== null && hoveredIndex !== idx) || (selectedIndex !== null && selectedIndex !== idx) ? 0.3 : 1;
                    const strokeWidth = isSelected ? 0.22 : 0.2;

                    return (
                        <React.Fragment key={item.id}>
                            <path
                                d={pathData}
                                fill="none"
                                stroke={item.color}
                                strokeWidth={strokeWidth}
                                opacity={opacity}
                                className="transition-all duration-300 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : idx); }}
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            />
                        </React.Fragment>
                    );
                })}
            </svg>

            {/* Labels with Connecting Lines - V 0.8.88: Mobile optimized - closer labels, all categories shown */}
            {(() => {
                // V 0.8.88: Pre-calculate all label positions to prevent overlap
                const labelPositions = data.map((item, idx) => {
                    let prevPercent = 0;
                    for (let i = 0; i < idx; i++) prevPercent += data[i].count / total;
                    const percent = item.count / total;
                    const midPercent = prevPercent + percent / 2;
                    const angleRad = (midPercent * 2 * Math.PI) - (Math.PI / 2);
                    return { item, idx, percent, angleRad };
                });

                return labelPositions.map(({ item, idx, percent, angleRad }) => {
                    const isSelected = selectedIndex === idx;

                    // Coordinates for Guide Line - closer to ring
                    const rSlice = 0.82;
                    const x1 = Math.cos(angleRad) * rSlice;
                    const y1 = Math.sin(angleRad) * rSlice;

                    // V 0.8.93 Refined: Responsive Spacing
                    const isMobile = window.innerWidth < 768; // Simple check
                    const rLabel = isMobile ? 0.85 : 0.95; // Closer on mobile
                    const x2 = Math.cos(angleRad) * rLabel;
                    const y2 = Math.sin(angleRad) * rLabel;

                    // Text Offset
                    // Mobile: 0.95 (Very close), Desktop: 1.08 (Standard)
                    const offsetMult = isMobile ? 0.95 : 1.08;
                    const tx = Math.cos(angleRad) * offsetMult;
                    const ty = Math.sin(angleRad) * offsetMult;

                    // Dynamic font size
                    const fontSize = percent < 0.05 ? 'text-[9px] md:text-[10px]' : 'text-[10px] md:text-xs';

                    return (
                        <React.Fragment key={`label-group-${item.id}`}>
                            {/* Connecting Line - shorter for small slices */}
                            {/* Connecting Line - Removed V 0.8.88 */}

                            {/* Label - V 0.8.88: Responsive positioning - No Guide Lines */}
                            <div
                                className={`absolute ${fontSize} font-bold pointer-events-none whitespace-nowrap transition-all duration-300`}
                                style={{
                                    left: '50%', top: '50%',
                                    color: item.color,
                                    transform: `translate(calc(-50% + ${tx * 155}px), calc(-50% + ${ty * 155}px))`,
                                    opacity: isSelected || selectedIndex === null ? 1 : 0.4
                                }}
                            >
                                {item.label}
                            </div>
                        </React.Fragment>
                    );
                });
            })()}

            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none transition-all duration-300">
                {selectedIndex !== null ? (
                    <>
                        <span className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-widest">{data[selectedIndex].label}</span>
                        <span className="text-3xl md:text-4xl font-black text-zinc-900" style={{ color: data[selectedIndex].color }}>{data[selectedIndex].count}</span>
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

// V 0.8.5: Compact Stats Bar Component
// V 0.8.89: Compact Stats Bar Component with Navigation
function CompactStatsBar({ spacesCount, productsCount, materialsCount, awardsCount, onNavigate }) {
    return (
        <div className="grid grid-cols-4 gap-2 md:gap-4 mb-6">
            <div onClick={() => onNavigate && onNavigate('SPACES_ROOT')} className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50 transition-colors group">
                <span className="text-[10px] text-zinc-400 uppercase font-bold mb-1 group-hover:text-zinc-600 transition-colors">Spaces</span>
                <span className="text-lg md:text-xl font-black text-zinc-900">{spacesCount}</span>
            </div>
            <div onClick={() => onNavigate && onNavigate('COLLECTIONS_ROOT')} className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50 transition-colors group">
                {/* V 0.8.89: Renamed Products to Collections */}
                <span className="text-[10px] text-zinc-400 uppercase font-bold mb-1 group-hover:text-zinc-600 transition-colors">Collections</span>
                <span className="text-lg md:text-xl font-black text-zinc-900">{productsCount}</span>
            </div>
            <div onClick={() => onNavigate && onNavigate('MATERIALS_ROOT')} className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50 transition-colors group">
                <span className="text-[10px] text-zinc-400 uppercase font-bold mb-1 group-hover:text-zinc-600 transition-colors">Materials</span>
                <span className="text-lg md:text-xl font-black text-zinc-900">{materialsCount}</span>
            </div>
            <div onClick={() => onNavigate && onNavigate('AWARDS_ROOT')} className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50 transition-colors group">
                <span className="text-[10px] text-zinc-400 uppercase font-bold mb-1 group-hover:text-zinc-600 transition-colors">Awards</span>
                <span className="text-lg md:text-xl font-black text-zinc-900">{awardsCount}</span>
            </div>
        </div>
    );
}

function DashboardView({ products, favorites, awards, swatches, spaceContents, scenes, setActiveCategory, setSelectedProduct, setSelectedAward, isAdmin, bannerData, onBannerUpload, onLogoUpload, onBannerTextChange, onSaveBannerText }) {
    const totalCount = products.length; const newCount = products.filter(p => p.isNew).length; const pickCount = favorites.length;
    const categoryCounts = []; let totalStandardProducts = 0;
    CATEGORIES.filter(c => !c.isSpecial).forEach(c => { const count = products.filter(p => p.category === c.id).length; if (count > 0) { categoryCounts.push({ ...c, count }); totalStandardProducts += count; } });

    const donutColors = ['#2563eb', '#0891b2', '#7c3aed', '#db2777', '#059669', '#d97706', '#ea580c', '#475569', '#9ca3af'];
    const chartData = categoryCounts.map((item, idx) => ({ ...item, color: donutColors[idx % donutColors.length] }));

    const recentUpdates = [...products].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 6);
    const fileInputRef = useRef(null);
    const logoInputRef = useRef(null);

    const [selectedSlice, setSelectedSlice] = useState(null);
    // V 0.8.83: Dropdown states for dashboard report items
    const [openReportDropdown, setOpenReportDropdown] = useState(null); // 'PRODUCTS', 'NEW', 'AWARDS', 'LAUNCH'
    const [isListExpanded, setIsListExpanded] = useState(false);
    const [expandedAwardId, setExpandedAwardId] = useState(null);

    // Helper for Selected Slice Data
    const getSelectedSliceDetails = () => {
        if (selectedSlice === null) return { count: 0, products: [], uniqueColors: [], awardCount: 0, years: '', top3Years: '', hasMoreYears: false };
        const data = chartData[selectedSlice];
        const subset = products.filter(p => p.category === data.id);
        const uniqueColors = [...new Set([
            ...subset.flatMap(p => p.bodyColors || []),
            ...subset.flatMap(p => p.upholsteryColors || [])
        ].filter(c => typeof c === 'object').map(c => c.materialCode).filter(Boolean))];

        const awardCount = subset.reduce((acc, p) => acc + (p.awardHistory?.length || p.awards?.length || 0), 0);

        // V 0.8.87: Make Year - Descending Sort
        const yearCounts = {};
        subset.forEach(p => {
            const y = p.launchDate?.substring(0, 4);
            if (y) yearCounts[y] = (yearCounts[y] || 0) + 1;
        });

        // Sort descending (b - a)
        const sortedYears = Object.entries(yearCounts).sort((a, b) => Number(b[0]) - Number(a[0]));

        // Format strings
        const fullYears = sortedYears.map(([y, c]) => `${y} (${c})`).join(', ');
        const top3Years = sortedYears.slice(0, 3).map(([y, c]) => `${y} (${c})`).join(', ');

        return {
            count: data.count,
            products: subset,
            uniqueColors,
            awardCount,
            years: fullYears,
            top3Years: top3Years, // For preview
            hasMoreYears: sortedYears.length > 3
        };
    };

    const sliceDetails = getSelectedSliceDetails();

    // V 0.8.2: Calculate Award Stats for Dashboard
    const awardStats = useMemo(() => {
        return awards.map(award => {
            const winners = products.filter(p => {
                // Check both simple tags and detailed history
                const hasTag = p.awards?.includes(award.title);
                const hasHistory = p.awardHistory?.some(h => h.awardId === award.id);
                return hasTag || hasHistory;
            });
            return { ...award, winners };
        }).filter(a => a.winners.length > 0);
    }, [awards, products]);

    // V 0.8.5: Calculate Counts for Stats Bar - V 0.8.9: Use allScenes for accurate count
    const spacesCount = scenes.length;
    const materialsCount = swatches.length;
    const totalAwardWinners = awardStats.reduce((acc, stat) => acc + stat.winners.length, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 print:hidden" onClick={() => setSelectedSlice(null)}>

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
                                        <button onClick={() => logoInputRef.current.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover/logo:opacity-100 rounded"><Edit2 className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <button onClick={() => logoInputRef.current.click()} className="text-xs text-white bg-white/20 px-3 py-1 rounded hover:bg-white/40">+ Upload Logo</button>
                                )}
                                <input type="text" value={bannerData.title} onChange={(e) => onBannerTextChange('title', e.target.value)} onBlur={onSaveBannerText} className="bg-transparent text-3xl md:text-5xl font-black text-white tracking-tighter w-full outline-none placeholder-zinc-500 border-b border-transparent hover:border-zinc-500 transition-colors" placeholder="Main Title" />
                            </div>
                            <input type="text" value={bannerData.subtitle} onChange={(e) => onBannerTextChange('subtitle', e.target.value)} onBlur={onSaveBannerText} className="bg-transparent text-zinc-300 font-medium text-sm md:text-xl w-full outline-none placeholder-zinc-500 border-b border-transparent hover:border-zinc-500 transition-colors" placeholder="Subtitle" />
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={onLogoUpload} />
                        </div>
                    ) : (
                        <>
                            {/* V 0.8.5: Typography Adjustment (font-black -> font-bold) */}
                            {bannerData.logoUrl ? <img src={bannerData.logoUrl} className="h-16 md:h-24 w-auto object-contain mb-4" alt="Logo" /> : <h2 className="text-3xl md:text-6xl font-bold text-white mb-2">{bannerData.title}</h2>}
                            <p className="text-zinc-300 font-medium text-sm md:text-xl opacity-90">{bannerData.subtitle}</p>
                        </>
                    )}
                </div>
                {isAdmin && (<><button onClick={() => fileInputRef.current.click()} className="absolute top-4 right-4 z-30 p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100" title="Change Banner Image"><Camera className="w-5 h-5" /></button><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onBannerUpload} /></>)}
            </div>

            {/* V 0.8.5: Compact Stats Bar */}
            <CompactStatsBar
                spacesCount={spacesCount}
                productsCount={totalCount}
                materialsCount={materialsCount}
                awardsCount={totalAwardWinners}
                onNavigate={setActiveCategory}
            />

            {/* V 0.8.5: Reordered - Category Contribution First */}
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
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: chartData[selectedSlice].color }}></div>
                                        <h4 className="text-2xl font-black text-zinc-900 hover:text-blue-600 cursor-pointer" onClick={() => setActiveCategory(chartData[selectedSlice].id)}>{chartData[selectedSlice].label}</h4>
                                        <button onClick={() => setActiveCategory(chartData[selectedSlice].id)} className="ml-auto text-xs font-bold text-blue-600 hover:underline flex items-center">Explore <ArrowRight className="w-3 h-3 ml-1" /></button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 relative group cursor-pointer" onClick={() => setOpenReportDropdown(openReportDropdown === 'PRODUCTS' ? null : 'PRODUCTS')}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Products</span>
                                                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${openReportDropdown === 'PRODUCTS' ? 'rotate-180' : ''}`} />
                                            </div>
                                            <span className="text-xl font-black text-zinc-900">{chartData[selectedSlice].count}</span>
                                            {openReportDropdown === 'PRODUCTS' && (
                                                <div className="absolute top-full left-0 w-full bg-white border border-zinc-200 shadow-xl rounded-lg p-2 z-20 text-xs mt-1 max-h-48 overflow-y-auto custom-scrollbar">
                                                    {sliceDetails.products.map(p => (
                                                        <div key={p.id} className="p-1 hover:bg-zinc-100 rounded truncate cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }}>{p.name}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 relative group cursor-pointer" onClick={() => setOpenReportDropdown(openReportDropdown === 'NEW' ? null : 'NEW')}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">New</span>
                                                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${openReportDropdown === 'NEW' ? 'rotate-180' : ''}`} />
                                            </div>
                                            <span className="text-xl font-black text-zinc-900">{sliceDetails.products.filter(p => p.isNew).length}</span>
                                            {openReportDropdown === 'NEW' && (
                                                <div className="absolute top-full left-0 w-full bg-white border border-zinc-200 shadow-xl rounded-lg p-2 z-20 text-xs mt-1 max-h-48 overflow-y-auto custom-scrollbar">
                                                    {sliceDetails.products.filter(p => p.isNew).length > 0 ? sliceDetails.products.filter(p => p.isNew).map(p => (
                                                        <div key={p.id} className="p-1 hover:bg-zinc-100 rounded truncate cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }}>{p.name}</div>
                                                    )) : <div className="text-zinc-400 p-1">No new items</div>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 relative group cursor-pointer" onClick={() => setOpenReportDropdown(openReportDropdown === 'AWARDS' ? null : 'AWARDS')}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Awards</span>
                                                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${openReportDropdown === 'AWARDS' ? 'rotate-180' : ''}`} />
                                            </div>
                                            <span className="text-xl font-black text-zinc-900">{sliceDetails.awardCount}</span>
                                            {openReportDropdown === 'AWARDS' && (
                                                <div className="absolute top-full left-0 w-full bg-white border border-zinc-200 shadow-xl rounded-lg p-2 z-20 text-xs mt-1 max-h-48 overflow-y-auto custom-scrollbar">
                                                    {sliceDetails.products.filter(p => p.awards?.length || p.awardHistory?.length).length > 0 ? sliceDetails.products.filter(p => p.awards?.length || p.awardHistory?.length).map(p => (
                                                        <div key={p.id} className="p-1 hover:bg-zinc-100 rounded truncate cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }}>{p.name} ({p.awards?.length || p.awardHistory?.length})</div>
                                                    )) : <div className="text-zinc-400 p-1">No awards</div>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 relative group cursor-pointer" onClick={() => setOpenReportDropdown(openReportDropdown === 'LAUNCH' ? null : 'LAUNCH')}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Make Year</span>
                                                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${openReportDropdown === 'LAUNCH' ? 'rotate-180' : ''}`} />
                                            </div>
                                            <span className="text-xs font-bold text-zinc-900 truncate block mt-1">{sliceDetails.top3Years}{sliceDetails.hasMoreYears ? '...' : ''}</span>
                                            {openReportDropdown === 'LAUNCH' && (
                                                <div className="absolute top-full left-0 w-full bg-white border border-zinc-200 shadow-xl rounded-lg p-2 z-20 text-xs mt-1 max-h-48 overflow-y-auto custom-scrollbar">
                                                    {sliceDetails.years}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <span className="text-xs text-zinc-400 uppercase font-bold block mb-2">Palette Preview</span>
                                        <div className="flex flex-wrap gap-1">
                                            {sliceDetails.uniqueColors.slice(0, 10).map((c, i) => (
                                                <div key={i}><SwatchDisplay color={c} size="small" /></div>
                                            ))}
                                            {sliceDetails.uniqueColors.length > 10 && <span className="text-[9px] text-zinc-400">+{sliceDetails.uniqueColors.length - 10}</span>}
                                        </div>
                                    </div>

                                    {/* Product List - Dropdown Style (Scrollable) */}
                                    <div className="flex-1 bg-zinc-50 p-3 rounded-xl border border-zinc-100 transition-all">
                                        <div className="flex justify-between items-center mb-2 sticky top-0 bg-zinc-50 pb-1 border-b border-zinc-100 cursor-pointer" onClick={() => setIsListExpanded(!isListExpanded)}>
                                            <span className="text-[10px] text-zinc-400 uppercase font-bold">Product List ({sliceDetails.products.length})</span>
                                            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isListExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                        <div className={`grid grid-cols-2 gap-1 overflow-y-auto custom-scrollbar transition-all ${isListExpanded ? 'max-h-60' : 'max-h-24'}`}>
                                            {sliceDetails.products.map(p => (
                                                <div key={p.id} className="text-[11px] truncate text-zinc-600 hover:text-black cursor-pointer p-1 hover:bg-zinc-100 rounded font-medium" onClick={() => setSelectedProduct(p)}>• {p.name}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                                    {chartData.map((item) => {
                                        const percent = Math.round((item.count / totalStandardProducts) * 100);
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

            {/* V 0.8.71: Awards Section moved after Category Contribution - Mobile 2-col Grid */}
            {awardStats.length > 0 && (
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-zinc-900 flex items-center"><Trophy className="w-6 h-6 mr-3 text-yellow-500" /> Award Achievements</h3>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {awardStats.map(stat => (
                            <div key={stat.id} onClick={() => setSelectedAward(stat)} className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 cursor-pointer hover:border-zinc-300 hover:bg-zinc-100 transition-all group">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center min-w-0">
                                        {stat.image ? <img src={stat.image} className="w-8 h-8 object-contain mr-2 flex-shrink-0" /> : <Trophy className="w-8 h-8 text-zinc-300 mr-2 flex-shrink-0" />}
                                        <div className="min-w-0">
                                            <h4 className="text-xs md:text-sm font-bold text-zinc-900 truncate">{stat.title}</h4>
                                            <span className="text-[9px] md:text-[10px] text-zinc-500 truncate block">{stat.organization}</span>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black text-zinc-900 ml-2">{stat.winners.length}</span>
                                </div>

                                {/* Dropdown for Winners */}
                                <div className="border-t border-zinc-200 pt-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setExpandedAwardId(expandedAwardId === stat.id ? null : stat.id); }}
                                        className="w-full flex justify-between items-center text-[10px] font-bold text-zinc-500 hover:text-zinc-800"
                                    >
                                        <span>View Winners</span>
                                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedAwardId === stat.id ? 'rotate-180' : ''}`} />
                                    </button>

                                    {expandedAwardId === stat.id && (
                                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                            {stat.winners.map(winner => (
                                                <div key={winner.id} onClick={() => setSelectedProduct(winner)} className="flex items-center p-1.5 hover:bg-white rounded cursor-pointer transition-colors group">
                                                    <div className="w-6 h-6 rounded bg-zinc-200 overflow-hidden mr-2 flex-shrink-0">
                                                        {winner.images?.[0] && <img src={typeof winner.images[0] === 'object' ? winner.images[0].url : winner.images[0]} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <span className="text-[10px] font-medium text-zinc-600 group-hover:text-blue-600 truncate">{winner.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-zinc-900 flex items-center"><Clock className="w-6 h-6 mr-3 text-zinc-400" /> Recent Updates</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {recentUpdates.length > 0 ? recentUpdates.map(product => (
                        <div key={product.id} onClick={() => setSelectedProduct(product)} className="flex flex-col p-3 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer transition-all group">
                            <div className="aspect-[4/3] bg-zinc-100 rounded-lg flex items-center justify-center overflow-hidden border border-zinc-200 mb-2 relative">
                                {/* Multiple Mix Blend Mode Overlay */}
                                <div className="absolute inset-0 bg-zinc-100/50 mix-blend-multiply z-10 pointer-events-none"></div>
                                {product.images?.[0] ? <img src={typeof product.images[0] === 'object' ? product.images[0].url : product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" /> : <ImageIcon className="w-6 h-6 text-zinc-300" />}
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

function SpaceDetailView({ space, spaceContent, additionalScenes = [], activeTag, setActiveTag, isAdmin, onBannerUpload, onEditInfo, onManageProducts, onAddScene, onViewScene, productCount, searchTerm, searchTags, products, onProductClick, favorites, onToggleFavorite, onCompareToggle, compareList, onReorder }) {
    const banner = spaceContent.banner;
    const description = spaceContent.description || "No description provided.";
    const trend = spaceContent.trend || "";
    // V 0.8.82: Merge scenes from old space_contents and new individual scenes collection
    const oldScenes = spaceContent.scenes || [];
    const newScenes = additionalScenes.filter(s => s.spaceId === space.id);
    // Merge and deduplicate by id (prefer new scenes)
    const scenesMap = new Map();
    oldScenes.forEach(s => scenesMap.set(s.id, s));
    newScenes.forEach(s => scenesMap.set(s.id, s));
    const scenes = Array.from(scenesMap.values()).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const tags = spaceContent.tags || space.defaultTags || [];

    // Filter Scenes based on Tag AND Search - V 0.8.83: Unified unified checkSearchMatch
    // V 0.8.91: Pass products for tagged products search
    const filteredScenes = scenes.filter(s => {
        const matchesTag = activeTag === 'ALL' || (s.tags && s.tags.includes(activeTag));
        // V 0.8.91: Include products for tagged product name search
        const matchesSearch = checkSearchMatch(s, 'scene', searchTerm, searchTags, {}, products);
        return matchesTag && matchesSearch;
    });

    const copySpaceLink = () => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?space=${space.id}`); window.alert("공간 공유 링크가 복사되었습니다."); };

    // V 0.8.73: Unique Products Logic to prevent duplicates in the list
    const uniqueProducts = useMemo(() => {
        const seen = new Set();
        return products.filter(p => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
        });
    }, [products]);

    return (
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-0">
            <div className="relative rounded-3xl overflow-hidden h-72 md:h-96 shadow-lg group mb-8 bg-zinc-900 print:hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10"></div>
                {banner ? <img src={banner} className="w-full h-full object-cover transition-transform duration-1000" alt="Space Banner" /> : <div className="w-full h-full flex items-center justify-center opacity-30"><span className="text-white text-4xl font-bold uppercase">{space.label}</span></div>}
                <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 z-20 text-white max-w-3xl">
                    <div className="flex items-center space-x-3 mb-3"><div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">{React.createElement(space.icon, { className: "w-6 h-6" })}</div></div>
                    <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight leading-tight">{space.label}</h2>
                    <p className="text-zinc-200 text-sm md:text-lg leading-relaxed font-light">{description}</p>
                    {trend && (<div className="mt-6 pl-4 border-l-2 border-indigo-500"><p className="text-indigo-300 text-xs font-bold uppercase mb-1">Design Trend</p><p className="text-zinc-300 text-sm italic">"{trend}"</p></div>)}
                </div>
                <div className="absolute top-6 right-6 z-30 flex space-x-3">
                    <button onClick={copySpaceLink} className="p-2.5 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-all"><Share2 className="w-5 h-5" /></button>
                    {isAdmin && (<><label className="p-2.5 bg-black/40 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-all cursor-pointer"><Camera className="w-5 h-5" /><input type="file" className="hidden" accept="image/*" onChange={onBannerUpload} /></label><button onClick={onEditInfo} className="p-2.5 bg-black/40 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-all"><Edit3 className="w-5 h-5" /></button></>)}
                </div>
            </div>



            <div className={`${filteredScenes.length === 0 ? '' : 'mb-12'} print:hidden`}>
                <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-extrabold text-zinc-900 flex items-center"><ImageIcon className="w-6 h-6 mr-2 text-indigo-500" /> Space Scenes ({filteredScenes.length})</h3>{isAdmin && (<button onClick={onAddScene} className="flex items-center text-sm font-bold bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors shadow-lg"><Plus className="w-4 h-4 mr-2" /> Add Scene</button>)}</div>

                {/* V 0.8.89: Space Tags Filter */}
                <div className="mb-8 flex flex-wrap gap-2">
                    <button onClick={() => setActiveTag('ALL')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTag === 'ALL' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white text-zinc-500 hover:text-zinc-900'}`}>All Scenes</button>
                    {(spaceContent.tags || space.defaultTags || []).map(tag => (
                        <button key={tag} onClick={() => setActiveTag(tag)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTag === tag ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white text-zinc-500 hover:text-zinc-900'}`}>{tag}</button>
                    ))}
                </div>
                {filteredScenes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredScenes.map((scene, idx) => (
                            <div key={scene.id} className="relative group">
                                <ProductCard
                                    product={{ ...scene, name: scene.label || scene.title, images: [scene.image], category: scene.tags ? scene.tags.join(', ') : 'Scene' }}
                                    onClick={() => onViewScene(scene)}
                                    showMoveControls={isAdmin && activeTag === 'ALL' && !searchTerm}
                                    onMove={(direction) => onReorder('scenes', filteredScenes, idx, direction, space.id)}
                                    isFavorite={favorites.includes(scene.id)}
                                    onToggleFavorite={(e) => onToggleFavorite(e, scene.id)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (<div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-zinc-400"><ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">No scenes registered.</p></div>)}
            </div>

            {/* V 0.8.73: Fix duplicate product list and remove margin if empty */}
            {/* V 0.8.83: Removed All Curated Products List & Margin Adjustment */}
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

                {/* V 0.8.73: Admin Move Controls (Button based) */}
                {/* V 0.8.73: Admin Move Controls (Button based) - V 0.8.84: Fixed Event Propagation */}
                {showMoveControls && (
                    <div className="absolute bottom-1 md:bottom-2 left-0 right-0 flex justify-center gap-2 z-20 print:hidden">
                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); onMove('left') }} className="p-1 md:p-1.5 bg-white/90 rounded-full shadow hover:bg-black hover:text-white text-zinc-700 transition-colors"><ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); onMove('right') }} className="p-1 md:p-1.5 bg-white/90 rounded-full shadow hover:bg-black hover:text-white text-zinc-700 transition-colors"><ArrowRight className="w-3 h-3 md:w-4 md:h-4" /></button>
                    </div>
                )}
            </div>

            <div className="p-4 flex-1 flex flex-col bg-white">
                <h3 className="text-sm font-extrabold text-zinc-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">{product.name}</h3>

                <div className="flex justify-between items-end mt-auto pt-2 border-t border-zinc-50">
                    <span className="text-[10px] font-medium text-zinc-400 truncate max-w-[60%]">{product.designer || 'Patra Design'}</span>
                    <span className="text-[9px] font-bold text-zinc-500 bg-zinc-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{product.category}</span>
                </div>
            </div>
        </div>
    );
}

function ProductDetailModal({ product, allProducts, swatches, spaceContents, awards, onClose, onEdit, isAdmin, showToast, isFavorite, onToggleFavorite, onNavigateSpace, onNavigateScene, onNavigateNext, onNavigatePrev, onNavigateProduct, onNavigateSwatch, onNavigateAward, onSaveProduct }) {
    useScrollLock();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const canvasRef = useRef(null);
    const [swatchPopup, setSwatchPopup] = useState(null);

    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
    const [tagFilter, setTagFilter] = useState('');

    const [isAwardManagerOpen, setIsAwardManagerOpen] = useState(false);
    const [selectedAwardId, setSelectedAwardId] = useState('');
    const [awardYear, setAwardYear] = useState(new Date().getFullYear().toString());

    const images = product.images || [];
    const currentImageEntry = images.length > 0 ? images[currentImageIndex] : null;
    const currentImageUrl = currentImageEntry ? (typeof currentImageEntry === 'object' ? currentImageEntry.url : currentImageEntry) : null;
    const currentImageCaption = currentImageEntry && typeof currentImageEntry === 'object' ? currentImageEntry.caption : '';

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                if (currentImageIndex > 0) setCurrentImageIndex(prev => prev - 1);
            } else if (e.key === 'ArrowRight') {
                if (currentImageIndex < images.length - 1) setCurrentImageIndex(prev => prev + 1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentImageIndex, images.length]);

    useEffect(() => {
        const closePopup = () => setSwatchPopup(null);
        window.addEventListener('click', closePopup);
        return () => window.removeEventListener('click', closePopup);
    }, []);

    if (!product) return null;

    const contentImages = product.contentImages || [];

    const relatedSpaces = SPACES.filter(s => product.spaces && product.spaces.includes(s.id));
    const relatedScenes = [];
    if (spaceContents) {
        Object.keys(spaceContents).forEach(spaceId => {
            const content = spaceContents[spaceId];
            if (content && content.scenes) {
                content.scenes.forEach(scene => {
                    if (scene.productIds && scene.productIds.some(id => String(id) === String(product.id))) {
                        relatedScenes.push({ ...scene, spaceId });
                    }
                });
            }
        });
    }

    const relatedItems = allProducts.filter(p => product.relatedProductIds?.includes(p.id));

    const copyToClipboard = () => { navigator.clipboard.writeText(`[${product.name}]\n${product.specs}`); showToast("Copied to clipboard"); };
    const launchYear = product.launchDate ? product.launchDate.substring(0, 4) : '';

    // V 0.8.73: Swatch Popup Logic Update - Show Material Code
    const handleSwatchClick = (e, color) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();

        let code = 'NO CODE';
        let name = '';
        let swatchId = null;

        if (typeof color === 'object') {
            swatchId = color.id;
            const globalSwatch = swatches.find(s => s.id === swatchId);

            if (globalSwatch && globalSwatch.materialCode) code = globalSwatch.materialCode;
            else if (color.materialCode) code = color.materialCode;

            name = color.name || '';
        } else {
            code = color;
        }

        const foundSwatch = swatches.find(s => s.id === swatchId) || (typeof color === 'object' ? color : null);

        const centerX = rect.left + rect.width / 2;
        const topY = rect.top;

        setSwatchPopup({
            x: centerX,
            y: topY,
            code: code,
            name: name,
            swatchObj: foundSwatch
        });
    };

    const navigateToSwatch = () => {
        if (swatchPopup && swatchPopup.swatchObj && swatchPopup.swatchObj.id) {
            const fullSwatch = swatches.find(s => s.id === swatchPopup.swatchObj.id);
            if (fullSwatch) onNavigateSwatch(fullSwatch);
            else onNavigateSwatch(swatchPopup.swatchObj);
            setSwatchPopup(null);
        }
    };

    const handleShareImage = async () => { /* ... */ };

    // V 0.8.92: Bidirectional related products tagging
    const toggleRelatedProduct = async (pid) => {
        const currentIds = product.relatedProductIds || [];
        const isRemoving = currentIds.includes(pid);
        const newIds = isRemoving ? currentIds.filter(id => id !== pid) : [...currentIds, pid];

        // Update current product
        const updatedProduct = { ...product, relatedProductIds: newIds };
        await onSaveProduct(updatedProduct);

        // V 0.8.92: Bidirectional update - update target product too
        const targetProduct = allProducts.find(p => String(p.id) === String(pid));
        if (targetProduct) {
            const targetIds = targetProduct.relatedProductIds || [];
            const updatedTargetIds = isRemoving
                ? targetIds.filter(id => String(id) !== String(product.id))
                : targetIds.some(id => String(id) === String(product.id)) ? targetIds : [...targetIds, product.id];
            if (JSON.stringify(targetIds) !== JSON.stringify(updatedTargetIds)) {
                await onSaveProduct({ ...targetProduct, relatedProductIds: updatedTargetIds });
            }
        }
    };

    const handleAddAward = async () => {
        if (!selectedAwardId) return;
        const awardObj = awards.find(a => a.id === selectedAwardId);
        if (!awardObj) return;

        const currentAwards = product.awards || [];
        const newAwards = currentAwards.includes(awardObj.title) ? currentAwards : [...currentAwards, awardObj.title];

        const currentHistory = product.awardHistory || [];
        const filteredHistory = currentHistory.filter(h => h.awardId !== awardObj.id);
        const newHistory = [...filteredHistory, { awardId: awardObj.id, title: awardObj.title, year: awardYear }];

        const updatedProduct = {
            ...product,
            awards: newAwards,
            awardHistory: newHistory
        };
        await onSaveProduct(updatedProduct);
        setIsAwardManagerOpen(false);
    };

    const handleRemoveAward = async (awardId, awardTitle) => {
        const newAwards = (product.awards || []).filter(t => t !== awardTitle);
        const newHistory = (product.awardHistory || []).filter(h => h.awardId !== awardId);
        await onSaveProduct({ ...product, awards: newAwards, awardHistory: newHistory });
    };

    return (
        <div key={product.id} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-0 md:p-4 animate-in fade-in zoom-in-95 duration-300 print:fixed print:inset-0 print:z-[100] print:bg-white print:h-auto print:overflow-visible">
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {isZoomed && currentImageUrl && (
                <div className="fixed inset-0 z-[220] bg-black flex items-center justify-center p-0 cursor-zoom-out" onClick={() => setIsZoomed(false)}>
                    <img src={currentImageUrl} className="w-full h-full object-contain max-w-none max-h-none" style={{ maxWidth: '100vw', maxHeight: '100vh' }} alt="Full Screen" />
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white"><X className="w-10 h-10" /></button>
                </div>
            )}

            {swatchPopup && (
                <div
                    className="fixed z-[210] bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-black/80 transition-colors border border-white/10 pointer-events-auto"
                    style={{
                        top: swatchPopup.y - 10,
                        left: swatchPopup.x,
                        transform: 'translate(-50%, -100%)'
                    }}
                    onClick={(e) => { e.stopPropagation(); navigateToSwatch(); }}
                >
                    <div className="text-sm font-bold tracking-tight leading-none mb-0.5 text-center">{swatchPopup.code}</div>
                    {swatchPopup.name && <div className="text-[10px] font-medium text-white/80 text-center">{swatchPopup.name}</div>}
                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-black/60 backdrop-blur-sm border-r border-b border-white/10 rotate-45"></div>
                </div>
            )}

            <div className="bg-white w-full h-full md:h-[90vh] md:w-full md:max-w-6xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative print:h-auto print:overflow-visible print:shadow-none print:rounded-none">

                <div className="absolute top-4 right-4 z-[100] flex gap-2">
                    {isAdmin && <button onClick={onEdit} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><Edit3 className="w-6 h-6 text-zinc-900" /></button>}
                    <button onClick={onClose} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><X className="w-6 h-6 text-zinc-900" /></button>
                </div>

                <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-100 bg-white sticky top-0 z-50 print:hidden">
                    <div className="flex items-center">
                        <button onClick={onToggleFavorite}><Star className={`w-6 h-6 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`} /></button>
                        <span className="font-bold text-sm truncate max-w-[200px] ml-3">{product.name}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row h-full pb-safe print:overflow-visible print:h-auto">
                    <div className="w-full md:w-1/2 bg-zinc-50 p-6 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-zinc-100 md:sticky md:top-0 print:static print:bg-white print:border-none">
                        <div className="flex-1 w-full bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 overflow-hidden p-8 mb-4 relative group min-h-[300px] print:shadow-none print:border-zinc-200 cursor-zoom-in" onClick={() => setIsZoomed(true)}>
                            {currentImageUrl ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img src={currentImageUrl} alt="Main" className="w-full h-full object-contain mix-blend-multiply" />
                                </div>
                            ) : <ImageIcon className="w-20 h-20 opacity-20 text-zinc-400" />}
                            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(e); }} className="absolute top-4 left-4 p-3 bg-white rounded-full shadow-sm border border-zinc-100 hover:border-zinc-300 transition-all hidden md:flex print:hidden"><Star className={`w-5 h-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`} /></button>

                            {images.length > 1 && (
                                <>
                                    <button onClick={(e) => { e.stopPropagation(); if (currentImageIndex > 0) setCurrentImageIndex(prev => prev - 1) }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white rounded-full backdrop-blur-sm disabled:opacity-0 transition-all" disabled={currentImageIndex === 0}><ChevronLeft className="w-6 h-6 text-zinc-800" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); if (currentImageIndex < images.length - 1) setCurrentImageIndex(prev => prev + 1) }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white rounded-full backdrop-blur-sm disabled:opacity-0 transition-all" disabled={currentImageIndex === images.length - 1}><ChevronRight className="w-6 h-6 text-zinc-800" /></button>
                                </>
                            )}
                        </div>
                        {currentImageCaption && (
                            <div className="text-center text-sm font-medium text-black mb-4 px-4">
                                {currentImageCaption}
                            </div>
                        )}

                        {images.length > 0 && (<div className="flex space-x-2 md:space-x-3 overflow-x-auto custom-scrollbar pb-1 px-1 print:hidden">{images.map((img, idx) => (<button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`flex-shrink-0 w-10 h-10 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-zinc-900 ring-2 ring-zinc-200' : 'border-transparent opacity-60 hover:opacity-100 bg-white'}`}><img src={typeof img === 'object' ? img.url : img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" /></button>))}</div>)}
                    </div>
                    <div className="w-full md:w-1/2 p-6 md:p-12 bg-white pb-12 print:pb-0">
                        <div className="mb-6 md:mb-10">
                            <div className="mb-2">
                                <span className="inline-block px-2.5 py-0.5 bg-zinc-900 text-white text-[10px] font-extrabold rounded uppercase tracking-widest">{product.category}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3 items-center">
                                {product.awardHistory && product.awardHistory.length > 0 ? (
                                    product.awardHistory.map((h, i) => (
                                        <button
                                            key={i}
                                            onClick={() => onNavigateAward(h.title)}
                                            className="inline-flex items-center px-2.5 py-0.5 bg-yellow-400/20 text-yellow-700 border border-yellow-400/30 text-[10px] font-bold rounded uppercase tracking-wide group relative hover:bg-yellow-400/40 transition-colors"
                                        >
                                            <Trophy className="w-3 h-3 mr-1" /> {h.title} <span className="ml-1 text-yellow-800/70">'{h.year.slice(2)}</span>
                                            {isAdmin && <span onClick={(e) => { e.stopPropagation(); handleRemoveAward(h.awardId, h.title) }} className="ml-1.5 hover:text-red-600 hidden group-hover:inline-block"><X className="w-3 h-3" /></span>}
                                        </button>
                                    ))
                                ) : (
                                    product.awards?.map(award => (
                                        <button
                                            key={award}
                                            onClick={() => onNavigateAward(award)}
                                            className="inline-flex items-center px-2.5 py-0.5 bg-yellow-400/20 text-yellow-700 border border-yellow-400/30 text-[10px] font-bold rounded uppercase tracking-wide hover:bg-yellow-400/40 transition-colors"
                                        >
                                            <Trophy className="w-3 h-3 mr-1" /> {award}
                                        </button>
                                    ))
                                )}

                                {isAdmin && (
                                    <button onClick={() => setIsAwardManagerOpen(!isAwardManagerOpen)} className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 border border-dashed border-zinc-300 px-2 py-0.5 rounded hover:border-zinc-400">+ Add Award</button>
                                )}
                            </div>

                            {isAdmin && isAwardManagerOpen && (
                                <div className="mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-200 animate-in slide-in-from-top-2">
                                    <div className="flex gap-2 mb-2">
                                        <select className="flex-1 text-xs p-2 rounded border" value={selectedAwardId} onChange={e => setSelectedAwardId(e.target.value)}>
                                            <option value="">Select Award...</option>
                                            {awards?.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                        </select>
                                        <input type="number" className="w-20 text-xs p-2 rounded border" value={awardYear} onChange={e => setAwardYear(e.target.value)} placeholder="Year" />
                                        <button onClick={handleAddAward} className="bg-zinc-900 text-white text-xs px-3 rounded font-bold">Add</button>
                                    </div>
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
                            {product.options?.length > 0 && (<div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Options</h3><div className="flex flex-wrap gap-2">{product.options.map((opt, idx) => (<span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold print:border-gray-300 print:text-black">{opt}</span>))}</div></div>)}
                            {product.features?.length > 0 && (<div><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Features</h3><div className="flex flex-wrap gap-2">{product.features.map((ft, idx) => (<span key={idx} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium flex items-center print:bg-transparent"><Check className="w-3 h-3 mr-1.5" /> {ft}</span>))}</div></div>)}
                            <div className="grid grid-cols-2 gap-4 md:gap-8">
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Body Color</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {product.bodyColors?.map((rawC, i) => {
                                            const c = (typeof rawC === 'object' && rawC.id) ? (swatches.find(s => s.id === rawC.id) || rawC) : rawC;
                                            return (
                                                <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer" onClick={(e) => handleSwatchClick(e, c)}>
                                                    <div className="transition-transform group-hover:scale-110"><SwatchDisplay color={c} size="medium" /></div>
                                                    <span className="text-[9px] font-mono text-zinc-400 group-hover:text-black transition-colors">{typeof c === 'object' ? c.materialCode : ''}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Upholstery Color</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {product.upholsteryColors?.map((rawC, i) => {
                                            const c = (typeof rawC === 'object' && rawC.id) ? (swatches.find(s => s.id === rawC.id) || rawC) : rawC;
                                            return (
                                                <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer" onClick={(e) => handleSwatchClick(e, c)}>
                                                    <div className="transition-transform group-hover:scale-110"><SwatchDisplay color={c} size="medium" /></div>
                                                    <span className="text-[9px] font-mono text-zinc-400 group-hover:text-black transition-colors">{typeof c === 'object' ? c.materialCode : ''}</span>
                                                </div>
                                            );
                                        })}
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
                                                        <img src={scene.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Scene" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-zinc-900 truncate">{scene.title}</div>
                                                        <div className="text-[10px] text-zinc-500 truncate flex items-center"><ImageIcon className="w-3 h-3 mr-1" /> View Scene</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 border-t border-zinc-100">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Related Products</h3>
                                    {isAdmin && (
                                        <button onClick={() => setIsTagManagerOpen(!isTagManagerOpen)} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
                                            {isTagManagerOpen ? 'Done' : '+ Manage Tags'}
                                        </button>
                                    )}
                                </div>

                                {isAdmin && isTagManagerOpen && (
                                    <div className="mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-200 animate-in slide-in-from-top-2">
                                        <input
                                            type="text"
                                            placeholder="Search products to tag..."
                                            className="w-full text-xs p-2 bg-white rounded-lg border border-zinc-200 mb-2 outline-none focus:border-indigo-500"
                                            value={tagFilter}
                                            onChange={(e) => setTagFilter(e.target.value)}
                                        />
                                        <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                                            {allProducts.filter(p => p.id !== product.id && p.name.toLowerCase().includes(tagFilter.toLowerCase())).map(p => {
                                                const isTagged = product.relatedProductIds?.includes(p.id);
                                                return (
                                                    <div key={p.id} onClick={() => toggleRelatedProduct(p.id)} className={`flex items-center p-1.5 rounded cursor-pointer ${isTagged ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-white'}`}>
                                                        <div className={`w-3 h-3 border rounded mr-2 flex items-center justify-center ${isTagged ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-300 bg-white'}`}>
                                                            {isTagged && <Check className="w-2 h-2 text-white" />}
                                                        </div>
                                                        <span className="text-xs truncate">{p.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {relatedItems.length > 0 ? (
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
                                ) : (
                                    <div className="text-xs text-zinc-400 italic">No related products tagged.</div>
                                )}
                            </div>

                            {contentImages.length > 0 && (<div className="pt-8 border-t border-zinc-100 space-y-4"><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Detail View</h3><div className="flex flex-col gap-4">{contentImages.map((img, idx) => (
                                <div key={idx} className="relative">
                                    <img src={typeof img === 'object' ? img.url : img} alt={`Detail ${idx + 1}`} className="w-full h-auto rounded-xl border border-zinc-100 print:border-none cursor-zoom-in" onClick={() => setIsZoomed(typeof img === 'object' ? img.url : img)} />
                                    {typeof img === 'object' && img.caption && <div className="text-center text-sm font-medium text-black mt-2">{img.caption}</div>}
                                </div>
                            ))}</div></div>)}

                            <div className="md:hidden pt-4 border-t border-zinc-100 flex gap-3 print:hidden mb-safe mb-2">
                                <button onClick={handleShareImage} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 flex items-center justify-center"><ImgIcon className="w-4 h-4 mr-2" /> Share</button>
                                <button onClick={() => window.print()} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 flex items-center justify-center"><Printer className="w-4 h-4 mr-2" /> PDF</button>
                            </div>

                        </div>

                        <div className="hidden md:flex pt-6 border-t border-zinc-100 justify-end gap-3 print:hidden mb-10">
                            <button onClick={handleShareImage} className="px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors shadow-sm flex items-center"><ImgIcon className="w-4 h-4 mr-2" /> Share</button>
                            <button onClick={() => window.print()} className="px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors shadow-sm flex items-center"><Printer className="w-4 h-4 mr-2" /> PDF</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SpaceInfoEditModal({ spaceId, currentData = {}, defaultTags, onClose, onSave }) {
    useScrollLock(); // V 0.8.74: Added scroll lock
    const [data, setData] = useState({ description: '', trend: '', tags: [] });
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        const tags = currentData.tags || defaultTags || [];
        setData({
            description: currentData.description || '',
            trend: currentData.trend || '',
            tags: tags
        });
    }, [currentData, defaultTags]);

    const handleSave = () => {
        onSave(data);
    };

    const addTag = () => {
        if (tagInput.trim()) {
            setData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
            setTagInput('');
        }
    };

    const removeTag = (idx) => {
        setData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== idx) }));
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1050] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center"><h3 className="text-lg font-bold text-zinc-900">Edit Space Info</h3><button onClick={onClose}><X className="w-5 h-5 text-zinc-400" /></button></div>
                <div className="p-6 space-y-4">
                    <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Description</label><textarea className="w-full border border-zinc-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" rows={4} value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} /></div>
                    <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Design Trend Keywords</label><input type="text" className="w-full border border-zinc-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={data.trend} onChange={(e) => setData({ ...data, trend: e.target.value })} placeholder="e.g. Minimalist, Eco-friendly, Open Plan" /></div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Space Tags</label>
                        <div className="flex gap-2 mb-2">
                            <input type="text" className="flex-1 border border-zinc-300 rounded-xl p-2 text-sm outline-none" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add new tag..." onKeyDown={e => e.key === 'Enter' && addTag()} />
                            <button onClick={addTag} className="bg-zinc-900 text-white px-4 rounded-xl text-xs font-bold">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {data.tags.map((tag, idx) => (
                                <span key={idx} className="bg-zinc-100 text-zinc-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center">
                                    {tag}
                                    <button onClick={() => removeTag(idx)} className="ml-2 text-zinc-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end"><button onClick={handleSave} className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-black shadow-lg">Save Changes</button></div>
            </div>
        </div>
    );
}

function ProductFormModal({ categories, swatches = [], allProducts = [], awards = [], existingData, onClose, onSave, onDelete, isFirebaseAvailable, initialCategory, spaceTags = [] }) {
    useScrollLock(); // V 0.8.74: Added scroll lock
    const isEditMode = !!existingData;
    const fileInputRef = useRef(null);
    const contentInputRef = useRef(null);
    const defaultCategory = (initialCategory && !['ALL', 'NEW', 'MY_PICK', 'DASHBOARD', 'COMPARE_PAGE', 'AWARDS_ROOT'].includes(initialCategory) && !SPACES.find(s => s.id === initialCategory)) ? initialCategory : 'EXECUTIVE';

    const [formData, setFormData] = useState({
        id: null, name: '', category: defaultCategory, specs: '', designer: '',
        featuresString: '', optionsString: '', materialsString: '', awardsString: '',
        productLink: '', isNew: false, launchDate: new Date().getFullYear().toString(),
        images: [], attachments: [], contentImages: [], spaces: [], spaceTags: [],
        bodyColors: [], upholsteryColors: [], relatedProductIds: [], awardHistory: []
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
                launchDate: existingData.launchDate ? existingData.launchDate.substring(0, 4) : new Date().getFullYear().toString(),
                images: normalizeImages(existingData.images || []),
                attachments: existingData.attachments || [],
                contentImages: normalizeImages(existingData.contentImages || []),
                spaces: existingData.spaces || [], spaceTags: existingData.spaceTags || [],
                spaces: existingData.spaces || [], spaceTags: existingData.spaceTags || [],
                bodyColors: existingData.bodyColors?.map(c => (typeof c === 'object' && c.id && swatches.find(s => s.id === c.id)) ? { ...c, image: swatches.find(s => s.id === c.id).image } : c) || [],
                upholsteryColors: existingData.upholsteryColors?.map(c => (typeof c === 'object' && c.id && swatches.find(s => s.id === c.id)) ? { ...c, image: swatches.find(s => s.id === c.id).image } : c) || [],
                relatedProductIds: existingData.relatedProductIds || [],
                awardHistory: existingData.awardHistory || []
            });
        }
    }, [existingData]);

    const processImage = (file) => { return new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const MAX_WIDTH = 1000; let width = img.width; let height = img.height; if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.8)); }; img.src = e.target.result; }; reader.readAsDataURL(file); }); };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setIsProcessingImage(true);
            const newImgs = [];
            for (const file of files) { try { newImgs.push({ url: await processImage(file), caption: '' }); } catch (e) { } }
            setFormData(prev => ({ ...prev, images: [...prev.images, ...newImgs] }));
            setIsProcessingImage(false);
        }
    };
    const handleContentImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setIsProcessingImage(true);
            const newImgs = [];
            for (const file of files) { try { newImgs.push({ url: await processImage(file), caption: '' }); } catch (e) { } }
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

    const handleAttachmentUpload = (e) => { const files = Array.from(e.target.files); files.forEach(file => { if (file.size > 300 * 1024) return window.alert("Too large"); const reader = new FileReader(); reader.onload = (e) => setFormData(p => ({ ...p, attachments: [...p.attachments, { name: file.name, url: e.target.result }] })); reader.readAsDataURL(file); }); };
    const handleAddLinkAttachment = () => { const url = window.prompt("URL:"); const name = window.prompt("Name:"); if (url && name) setFormData(p => ({ ...p, attachments: [...p.attachments, { name, url }] })); };
    const removeImage = (i) => setFormData(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));
    const removeContentImage = (i) => setFormData(p => ({ ...p, contentImages: p.contentImages.filter((_, idx) => idx !== i) }));
    const setMainImage = (i) => setFormData(p => { const imgs = [...p.images]; const [m] = imgs.splice(i, 1); imgs.unshift(m); return { ...p, images: imgs }; });
    const removeAttachment = (i) => setFormData(p => ({ ...p, attachments: p.attachments.filter((_, idx) => idx !== i) }));
    const toggleSpace = (spaceId) => { setFormData(prev => { const currentSpaces = prev.spaces || []; if (currentSpaces.includes(spaceId)) { return { ...prev, spaces: currentSpaces.filter(id => id !== spaceId) }; } else { return { ...prev, spaces: [...currentSpaces, spaceId] }; } }); };
    const toggleSpaceTag = (tag) => { setFormData(prev => { const currentTags = prev.spaceTags || []; if (currentTags.includes(tag)) return { ...prev, spaceTags: currentTags.filter(t => t !== tag) }; else return { ...prev, spaceTags: [...currentTags, tag] }; }); };

    const toggleRelatedProduct = (pid) => {
        setFormData(prev => {
            const ids = prev.relatedProductIds || [];
            if (ids.includes(pid)) return { ...prev, relatedProductIds: ids.filter(id => id !== pid) };
            else return { ...prev, relatedProductIds: [...ids, pid] };
        });
    };

    const toggleAwardTag = (award) => {
        setFormData(prev => {
            const currentAwards = prev.awardsString.split(',').map(s => s.trim()).filter(Boolean);
            const currentHistory = prev.awardHistory || [];

            let newAwards;
            let newHistory;

            if (currentAwards.includes(award.title)) {
                newAwards = currentAwards.filter(t => t !== award.title);
                newHistory = currentHistory.filter(h => h.awardId !== award.id);
            } else {
                newAwards = [...currentAwards, award.title];
                newHistory = [...currentHistory, { awardId: award.id, title: award.title, year: new Date().getFullYear().toString() }];
            }
            return { ...prev, awardsString: newAwards.join(', '), awardHistory: newHistory };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            launchDate: formData.launchDate,
            features: formData.featuresString.split(',').map(s => s.trim()).filter(Boolean),
            options: formData.optionsString.split(',').map(s => s.trim()).filter(Boolean),
            materials: formData.materialsString.split(',').map(s => s.trim()).filter(Boolean),
            awards: formData.awardsString.split(',').map(s => s.trim()).filter(Boolean),
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1050] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-4 duration-200">
                <div className="px-8 py-5 border-b border-zinc-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-zinc-900">{isEditMode ? 'Edit Product' : 'New Product'}</h2>
                    <button onClick={onClose}><X className="w-6 h-6 text-zinc-400 hover:text-zinc-900" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 pb-safe">
                    <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
                        <div className="flex justify-between mb-4"><span className="font-bold text-sm">Product Images (Main)</span><div className="space-x-2"><button type="button" onClick={() => fileInputRef.current.click()} className="text-xs bg-white border px-3 py-1 rounded-lg font-medium hover:bg-zinc-100">Upload</button></div><input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleImageUpload} accept="image/*" /></div>
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
                                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                                    {i === 0 && <span className="absolute top-1 left-1 bg-black text-white text-[9px] px-1 rounded">MAIN</span>}
                                    {i !== 0 && <button type="button" onClick={() => setMainImage(i)} className="absolute top-1 left-1 bg-white text-black text-[9px] px-1 rounded opacity-0 group-hover:opacity-100">Set Main</button>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
                        <div className="flex justify-between mb-4"><span className="font-bold text-sm">Detailed Content Images (Vertical Scroll)</span><div className="space-x-2"><button type="button" onClick={() => contentInputRef.current.click()} className="text-xs bg-white border px-3 py-1 rounded-lg font-medium hover:bg-zinc-100">Upload</button></div><input ref={contentInputRef} type="file" multiple className="hidden" onChange={handleContentImageUpload} accept="image/*" /></div>
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
                                    <button type="button" onClick={() => removeContentImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Related Spaces</label>
                        <div className="flex flex-wrap gap-2 mb-2">{SPACES.map(space => (<button key={space.id} type="button" onClick={() => toggleSpace(space.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center ${formData.spaces.includes(space.id) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}>{formData.spaces.includes(space.id) && <Check className="w-3 h-3 mr-1.5" />}{space.label}</button>))}</div>
                        {spaceTags.length > 0 && (<div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100"><label className="block text-[10px] font-bold text-zinc-400 uppercase mb-2">Detailed Space Tags</label><div className="flex flex-wrap gap-2">{spaceTags.map(tag => (<button key={tag} type="button" onClick={() => toggleSpaceTag(tag)} className={`px-2 py-1 rounded text-[10px] font-bold border ${formData.spaceTags.includes(tag) ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-zinc-500 border-zinc-200'}`}>{tag}</button>))}</div></div>)}
                    </div>

                    <div className="grid grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Name</label><input required className="w-full border p-2 rounded-lg" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label><select className="w-full border p-2 rounded-lg" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div></div>

                    <div className="grid grid-cols-2 gap-6">
                        <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Launch Year</label><input type="number" min="1900" max="2099" step="1" className="w-full border p-2 rounded-lg" value={formData.launchDate} onChange={e => setFormData({ ...formData, launchDate: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Designer</label><input className="w-full border p-2 rounded-lg" value={formData.designer} onChange={e => setFormData({ ...formData, designer: e.target.value })} /></div>
                    </div>

                    <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Specs</label><textarea required rows={2} className="w-full border p-2 rounded-lg" value={formData.specs} onChange={e => setFormData({ ...formData, specs: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Options (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.optionsString} onChange={e => setFormData({ ...formData, optionsString: e.target.value })} /></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Features (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.featuresString} onChange={e => setFormData({ ...formData, featuresString: e.target.value })} /></div></div>

                    <div className="grid grid-cols-2 gap-6">
                        <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Materials (comma)</label><input className="w-full border p-2 rounded-lg" value={formData.materialsString} onChange={e => setFormData({ ...formData, materialsString: e.target.value })} /></div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Awards (Select & Year)</label>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {awards.map(award => {
                                    const isSelected = formData.awardsString.includes(award.title);
                                    return (
                                        <button key={award.id} type="button" onClick={() => toggleAwardTag(award)} className={`px-2 py-1 rounded text-[10px] font-bold border ${isSelected ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-white text-zinc-500 border-zinc-200'}`}>
                                            {award.title}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="space-y-1">
                                {formData.awardHistory.map((h, idx) => (
                                    <div key={idx} className="flex items-center text-xs bg-yellow-50 p-1.5 rounded border border-yellow-100">
                                        <Trophy className="w-3 h-3 text-yellow-600 mr-2" />
                                        <span className="font-bold text-yellow-800 mr-2">{h.title}</span>
                                        <input
                                            type="number"
                                            className="w-16 p-0.5 text-[10px] border rounded bg-white text-center"
                                            value={h.year}
                                            onChange={(e) => {
                                                const newHistory = [...formData.awardHistory];
                                                newHistory[idx].year = e.target.value;
                                                setFormData({ ...formData, awardHistory: newHistory });
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                        <SwatchSelector
                            label="Body Colors"
                            selected={formData.bodyColors}
                            swatches={swatches}
                            onChange={(newColors) => setFormData({ ...formData, bodyColors: newColors })}
                        />
                        <SwatchSelector
                            label="Upholstery Colors"
                            selected={formData.upholsteryColors}
                            swatches={swatches}
                            onChange={(newColors) => setFormData({ ...formData, upholsteryColors: newColors })}
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
                                            <div className={`w-3 h-3 border rounded mr-2 flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-300'}`}>{isSelected && <Check className="w-2 h-2 text-white" />}</div>
                                            <span className="truncate">{p.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Link</label><input className="w-full border p-2 rounded-lg" placeholder="https://..." value={formData.productLink} onChange={e => setFormData({ ...formData, productLink: e.target.value })} /></div><div className="flex justify-between"><label className="block text-xs font-bold text-zinc-500 uppercase">Attachments</label><div className="space-x-2"><button type="button" onClick={() => document.getElementById('doc-upload').click()} className="text-xs border px-2 py-1 rounded bg-white">File</button><button type="button" onClick={handleAddLinkAttachment} className="text-xs border px-2 py-1 rounded bg-white">Link</button></div><input id="doc-upload" type="file" multiple className="hidden" onChange={handleAttachmentUpload} /></div><div className="space-y-1">{formData.attachments.map((f, i) => <div key={i} className="flex justify-between text-xs bg-zinc-50 p-2 rounded"><span>{f.name}</span><button type="button" onClick={() => removeAttachment(i)} className="text-red-500"><X className="w-3 h-3" /></button></div>)}</div></div>
                    <div className="flex items-center space-x-2"><input type="checkbox" checked={formData.isNew} onChange={e => setFormData({ ...formData, isNew: e.target.checked })} /><label className="text-sm font-bold">Mark as New Arrival</label></div>
                </form>
                <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50 flex justify-between">
                    {isEditMode && <button type="button" onClick={() => onDelete(formData.id, formData.name)} className="text-red-500 font-bold text-sm flex items-center"><Trash2 className="w-4 h-4 mr-2" /> Delete</button>}
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
        if (!selected.find(s => (typeof s === 'object' ? s.id === swatch.id : false))) {
            onChange([...selected, snapshot]);
        }
        // V 0.8.84: Enable multiple selection (don't close on select)
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
        if (hex) onChange([...selected, hex]);
    };

    // V 0.8.81: Allow searching by materialCode as well as name
    const filteredSwatches = swatches.filter(s => {
        if (activeTab !== 'ALL' && s.category !== activeTab) return false;
        const searchLower = filter.toLowerCase();
        const matchesName = s.name?.toLowerCase().includes(searchLower);
        const matchesMaterialCode = s.materialCode?.toLowerCase().includes(searchLower);
        return matchesName || matchesMaterialCode || !filter;
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
                            <button type="button" onClick={() => handleMove(idx, -1)} className="p-1 hover:bg-zinc-100"><ChevronLeft size={10} /></button>
                            <button type="button" onClick={() => handleRemove(idx)} className="p-1 hover:bg-zinc-100 text-red-500"><X size={10} /></button>
                            <button type="button" onClick={() => handleMove(idx, 1)} className="p-1 hover:bg-zinc-100"><ChevronRight size={10} /></button>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={() => setIsOpen(true)} className="w-6 h-6 rounded-full border border-dashed border-zinc-400 flex items-center justify-center text-zinc-400 hover:border-zinc-900 hover:text-zinc-900"><Plus className="w-3 h-3" /></button>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 z-[60] mt-2 w-full md:w-[320px] bg-white rounded-xl shadow-2xl border border-zinc-200 p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-sm">Select Material</h4>
                        <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 text-zinc-400 hover:text-black" /></button>
                    </div>

                    <div className="flex gap-1 overflow-x-auto pb-2 mb-2 custom-scrollbar">
                        <button type="button" onClick={() => setActiveTab('ALL')} className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${activeTab === 'ALL' ? 'bg-black text-white' : 'bg-zinc-100'}`}>ALL</button>
                        {SWATCH_CATEGORIES.map(c => (
                            <button key={c.id} type="button" onClick={() => setActiveTab(c.id)} className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${activeTab === c.id ? 'bg-black text-white' : 'bg-zinc-100'}`}>{c.label}</button>
                        ))}
                    </div>

                    <input placeholder="Search materials..." value={filter} onChange={e => setFilter(e.target.value)} className="w-full text-xs p-2 bg-zinc-50 rounded border mb-3 outline-none" />

                    <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredSwatches.map(s => (
                            <button key={s.id} type="button" onClick={() => handleSelect(s)} className="flex flex-col items-center group">
                                <div className="w-8 h-8 rounded-full border overflow-hidden relative">
                                    {s.image ? <img src={s.image} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ backgroundColor: s.hex }}></div>}
                                    <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center"><Plus className="w-4 h-4 text-white" /></div>
                                </div>
                                <span className="text-[9px] text-zinc-500 truncate w-full text-center mt-1">{s.materialCode || s.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// V 0.8.88: Removed SpaceProductManager Component Definition

function SceneEditModal({ initialData, allProducts, spaceTags = [], spaceOptions = [], onClose, onSave, onDelete }) {
    useScrollLock(); // V 0.8.74: Added scroll lock
    const [data, setData] = useState({ id: null, title: '', description: '', image: null, images: [], productIds: [], tags: [], spaceId: '' });
    const [filter, setFilter] = useState('');
    const mainInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const normalizeImages = (imgs) => imgs.map(img => typeof img === 'string' ? { url: img, caption: '' } : img);

    useEffect(() => {
        if (initialData) {
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
        if (files.length > 0) {
            const newUrls = [];
            for (const file of files) { try { newUrls.push({ url: await processImage(file), caption: '' }); } catch (e) { } }
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

    // V 0.8.73: Handle Space Change - Update Tags & Redirect Logic
    const handleSpaceChange = (newSpaceId) => {
        const targetSpace = spaceOptions.find(s => s.id === newSpaceId);
        const newTags = targetSpace ? targetSpace.defaultTags : [];
        setData(prev => ({ ...prev, spaceId: newSpaceId, tags: [] })); // Reset tags or set to default? Let's reset to allow fresh selection
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-white z-10">
                    <h3 className="text-lg font-bold text-zinc-900">{!initialData.id ? 'New Scene' : 'Edit Scene'}</h3>
                    <div className="flex gap-2">
                        {!(!initialData.id) && <button onClick={() => onDelete(data.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></button>}
                        <button onClick={onClose} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><X className="w-5 h-5 text-zinc-400 hover:text-black" /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-zinc-50">
                    <div className="space-y-4">
                        <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Main Image</label><div onClick={() => mainInputRef.current.click()} className="w-full h-48 bg-white rounded-xl flex items-center justify-center cursor-pointer border border-dashed border-zinc-300 overflow-hidden relative hover:border-zinc-400 transition-colors shadow-sm">{data.image ? <img src={data.image} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-zinc-400"><ImagePlus className="w-8 h-8 mb-2" /><span className="text-xs">Upload Main</span></div>}</div><input type="file" ref={mainInputRef} className="hidden" accept="image/*" onChange={handleMainImage} /></div>

                        {spaceOptions.length > 0 && (
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Belongs To Space</label>
                                <select className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm bg-white" value={data.spaceId} onChange={e => handleSpaceChange(e.target.value)}>
                                    {spaceOptions.map(s => (
                                        <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}



                        <div>
                            <div className="flex justify-between items-center mb-2"><label className="block text-xs font-bold text-zinc-500 uppercase">Additional Images</label><button type="button" onClick={() => galleryInputRef.current.click()} className="text-[10px] bg-white border px-2 py-1 rounded hover:bg-zinc-100">+ Add</button><input type="file" ref={galleryInputRef} multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} /></div>
                            {data.images.length > 0 && <div className="grid grid-cols-5 gap-2">{data.images.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border border-zinc-200">
                                    <img src={img.url || img} className="w-full h-full object-cover" />
                                    <input className="absolute bottom-0 w-full text-[8px] bg-white/90 p-1 opacity-0 group-hover:opacity-100" value={img.caption || ''} onChange={e => handleCaptionChange(i, e.target.value)} placeholder="Caption" />
                                    <button onClick={() => setData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                                </div>
                            ))}</div>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Scene Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {spaceTags.map(tag => (
                                    <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${data.tags?.includes(tag) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}>{tag}</button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Title</label><input className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} placeholder="e.g. Modern Office Lounge" /></div>
                            <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label><textarea className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-zinc-900 outline-none" rows={2} value={data.description} onChange={e => setData({ ...data, description: e.target.value })} placeholder="Short description..." /></div>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-zinc-200">
                        <div className="flex justify-between items-end mb-3"><div><h4 className="text-sm font-bold text-zinc-900">Related Products</h4><p className="text-[10px] text-zinc-500">Select products visible in this scene</p></div><span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{data.productIds.length} selected</span></div>
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                            <div className="p-2 border-b border-zinc-100 bg-zinc-50/50"><div className="flex items-center bg-white border border-zinc-200 rounded-lg px-2"><Search className="w-4 h-4 text-zinc-400 mr-2" /><input className="w-full py-2 text-xs outline-none bg-transparent" placeholder="Search product name..." value={filter} onChange={e => setFilter(e.target.value)} /></div></div>
                            {/* V 0.8.73: Fix Thumbnail Rendering in Scene Edit */}
                            <div className="h-48 overflow-y-auto p-2 space-y-1 custom-scrollbar">{allProducts.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())).map(p => {
                                const isSelected = data.productIds.includes(p.id);
                                const thumbUrl = p.images?.[0] ? (typeof p.images[0] === 'object' ? p.images[0].url : p.images[0]) : null;
                                return (
                                    <div key={p.id} onClick={() => toggleProduct(p.id)} className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-zinc-50 border border-transparent'}`}>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 flex-shrink-0 ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-zinc-300'}`}>{isSelected && <Check className="w-2 h-2 text-white" />}</div>
                                        {thumbUrl && <img src={thumbUrl} className="w-8 h-8 rounded object-cover mr-3 bg-zinc-100" />}
                                        <div className="min-w-0"><div className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-zinc-700'}`}>{p.name}</div><div className="text-[10px] text-zinc-400 truncate">{p.category}</div></div>
                                    </div>
                                )
                            })}</div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-zinc-100 bg-white flex justify-end items-center z-10 gap-3">
                    <button onClick={onClose} className="px-4 py-2 border border-zinc-300 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50">Cancel</button>
                    <button onClick={() => onSave(data)} className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-black shadow-md">Save Scene</button>
                </div>
            </div>
        </div>
    );
}

function SpaceSceneModal({ scene, products, allProducts, isAdmin, onClose, onEdit, onProductToggle, onNavigateProduct, isFavorite, onToggleFavorite }) {
    useScrollLock();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = scene.images ? [scene.image, ...scene.images] : [scene.image];
    const [isProductManagerOpen, setProductManagerOpen] = useState(false);
    const [productFilter, setProductFilter] = useState('');
    const [isZoomed, setIsZoomed] = useState(false);

    const currentImgObj = images[currentImageIndex];
    const currentImgUrl = typeof currentImgObj === 'object' ? currentImgObj.url : currentImgObj;
    const currentImgCaption = typeof currentImgObj === 'object' ? currentImgObj.caption : '';

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                if (currentImageIndex > 0) setCurrentImageIndex(prev => prev - 1);
            } else if (e.key === 'ArrowRight') {
                if (currentImageIndex < images.length - 1) setCurrentImageIndex(prev => prev + 1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentImageIndex, images.length]);

    const handleNext = () => { if (currentImageIndex < images.length - 1) setCurrentImageIndex(currentImageIndex + 1); };
    const handlePrev = () => { if (currentImageIndex > 0) setCurrentImageIndex(currentImageIndex - 1); };

    const handleShareImage = async () => { /* Placeholder */ };

    const uniqueProducts = useMemo(() => {
        const uniqueIds = new Set();
        const uniqueList = [];
        products.forEach(p => {
            if (!uniqueIds.has(p.id)) {
                uniqueIds.add(p.id);
                uniqueList.push(p);
            }
        });
        return uniqueList;
    }, [products]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-0 md:p-6 animate-in zoom-in-95 duration-300 print:hidden">
            {isZoomed && currentImgUrl && (<div className="fixed inset-0 z-[120] bg-black flex items-center justify-center p-0 cursor-zoom-out print:hidden" onClick={() => setIsZoomed(false)}><img src={currentImgUrl} className="w-full h-full object-contain max-w-none max-h-none" style={{ maxWidth: '100vw', maxHeight: '100vh' }} alt="Zoomed" /><button className="absolute top-6 right-6 text-white/50 hover:text-white"><X className="w-10 h-10" /></button></div>)}

            <div className="bg-white w-full h-[100dvh] md:h-[90vh] md:max-w-6xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
                <div className="absolute top-4 right-4 z-[100] flex gap-2">
                    {isAdmin && <button onClick={onEdit} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><Edit3 className="w-6 h-6 text-zinc-900" /></button>}
                    <button onClick={onClose} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><X className="w-6 h-6 text-zinc-900" /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row h-full pb-safe print:overflow-visible print:h-auto">
                    <div className="w-full md:w-2/3 bg-black relative flex flex-col justify-center shrink-0 md:sticky md:top-0 md:h-full min-h-[40vh]">
                        <div className="relative w-full h-full min-h-[40vh] md:min-h-0">
                            <img src={currentImgUrl} className="w-full h-full object-contain cursor-zoom-in" alt="Scene" onClick={() => setIsZoomed(true)} />
                            <button onClick={onToggleFavorite} className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur rounded-full text-white hover:text-yellow-400 z-30"><Star className={`w-6 h-6 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} /></button>
                        </div>
                        {currentImgCaption && <div className="absolute bottom-20 left-0 right-0 text-center text-white/90 text-sm bg-black/40 backdrop-blur-sm p-2 mx-auto max-w-md rounded-xl z-20">{currentImgCaption}</div>}
                        {images.length > 1 && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); handlePrev() }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/30 rounded-full text-white backdrop-blur-sm disabled:opacity-30" disabled={currentImageIndex === 0}><ChevronLeft className="w-6 h-6" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleNext() }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/30 rounded-full text-white backdrop-blur-sm disabled:opacity-30" disabled={currentImageIndex === images.length - 1}><ChevronRight className="w-6 h-6" /></button>
                            </>
                        )}
                        {images.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 px-4 overflow-x-auto custom-scrollbar z-20">
                                {images.map((img, idx) => (
                                    <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${currentImageIndex === idx ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                                        <img src={typeof img === 'object' ? img.url : img} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-1/3 bg-white flex flex-col border-l border-zinc-100 md:h-auto relative pb-24 md:pb-0">
                        <div className="p-6 md:p-8 border-b border-zinc-50 pt-8 flex-shrink-0">
                            <div className="mb-4">
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-900 mb-2">{scene.title}</h2>
                                <p className="text-zinc-500 text-sm leading-relaxed">{scene.description}</p>
                            </div>
                        </div>
                        <div className="flex-1 p-6 md:p-8 custom-scrollbar bg-zinc-50/50">
                            <div className="flex justify-between items-center mb-4"><h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tagged Products</h3>{isAdmin && <button onClick={() => setProductManagerOpen(!isProductManagerOpen)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">+ Add Tag</button>}</div>
                            {isAdmin && isProductManagerOpen && (
                                <div className="mb-4 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm animate-in slide-in-from-top-2">
                                    <input type="text" placeholder="Search to tag..." className="w-full text-xs p-2 bg-zinc-50 rounded-lg border border-zinc-200 mb-2 outline-none focus:border-indigo-500" value={productFilter} onChange={(e) => setProductFilter(e.target.value)} />
                                    <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">{allProducts.filter(p => p.name.toLowerCase().includes(productFilter.toLowerCase())).map(p => { const isTagged = scene.productIds?.some(id => String(id) === String(p.id)); return (<div key={p.id} onClick={() => onProductToggle(p.id, !isTagged)} className={`flex items-center p-1.5 rounded cursor-pointer ${isTagged ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-zinc-50'}`}><div className={`w-3 h-3 border rounded mr-2 flex items-center justify-center ${isTagged ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-300'}`}>{isTagged && <Check className="w-2 h-2 text-white" />}</div><span className="text-xs truncate">{p.name}</span></div>) })}</div>
                                </div>
                            )}

                            {uniqueProducts.length > 0 ? (
                                <div className="space-y-3 mb-8">
                                    {uniqueProducts.map(product => (
                                        <div key={product.id} onClick={() => onNavigateProduct(product)} className="flex items-center p-3 bg-white rounded-xl border border-zinc-100 shadow-sm hover:border-zinc-300 transition-all cursor-pointer group">
                                            <div className="w-12 h-12 bg-zinc-50 rounded-lg flex-shrink-0 flex items-center justify-center mr-3 overflow-hidden">
                                                {product.images?.[0] ? <img src={typeof product.images[0] === 'object' ? product.images[0].url : product.images[0]} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-zinc-300" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-zinc-900 truncate group-hover:text-blue-600">{product.name}</h4>
                                                <p className="text-xs text-zinc-500">{product.category}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-zinc-400 text-xs">No related products.</div>
                            )}

                            {/* V 0.8.85: Match Material Modal Design and Spacing */}
                            <div className="pt-4 border-t border-zinc-100 flex gap-3 print:hidden mb-safe mb-2 md:mb-10">
                                <button onClick={handleShareImage} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 flex items-center justify-center"><ImgIcon className="w-4 h-4 mr-2" /> Share</button>
                                <button onClick={() => window.print()} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 flex items-center justify-center"><Printer className="w-4 h-4 mr-2" /> PDF</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AwardsManager({ awards, products, isAdmin, onSave, onDelete, onSelect, searchTerm, searchTags, favorites, onToggleFavorite, onReorder }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAward, setEditingAward] = useState(null);
    const [activeTag, setActiveTag] = useState('ALL');

    const allTags = Array.from(new Set(awards.flatMap(a => a.tags || []))).sort();

    const handleCardClick = (award) => { onSelect(award); };

    // Filter Logic
    const filteredAwards = awards.filter(a => {
        const matchesTag = activeTag === 'ALL' || (a.tags && a.tags.includes(activeTag));
        const fullText = [a.title, a.organization, ...(a.tags || [])].join(' ').toLowerCase();
        const matchesSearch = !searchTerm || fullText.includes(searchTerm.toLowerCase());
        const matchesSearchTags = searchTags.every(t => fullText.includes(t.toLowerCase()));
        return matchesTag && matchesSearch && matchesSearchTags;
    });

    // Sort by orderIndex
    filteredAwards.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    return (
        <div className="p-1 animate-in fade-in pb-32">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-extrabold text-zinc-900 flex items-center tracking-tight">
                    <Trophy className="w-6 h-6 mr-3 text-yellow-500" />
                    Awards
                </h3>
                {isAdmin && (
                    <button onClick={() => { setEditingAward(null); setIsModalOpen(true); }} className="px-4 py-2 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all flex items-center shadow-lg whitespace-nowrap">
                        <Plus className="w-4 h-4 mr-2" /> Add Award
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredAwards.map((award, idx) => (
                    <div
                        key={award.id}
                        onClick={() => handleCardClick(award)}
                        className="bg-white rounded-xl border border-zinc-200 overflow-hidden group hover:shadow-lg transition-all relative cursor-pointer flex flex-col"
                    >
                        <div className="aspect-square relative bg-white flex items-center justify-center overflow-hidden">
                            {award.image ? <img src={award.image} className="w-full h-full object-cover" alt={award.title} /> : <Trophy className="w-12 h-12 text-zinc-300" />}
                            <button onClick={(e) => onToggleFavorite(e, award.id)} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-zinc-300 hover:text-yellow-400 hover:scale-110 transition-all z-10">
                                <Star className={`w-3.5 h-3.5 ${favorites.includes(award.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            </button>
                            {/* V 0.8.8: Admin Controls - Edit, Delete, Move */}
                            {isAdmin && (
                                <>
                                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingAward(award); setIsModalOpen(true); }} className="p-1.5 bg-white rounded-full shadow hover:text-blue-600"><Edit2 className="w-3 h-3" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(award.id); }} className="p-1.5 bg-white rounded-full shadow hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                    {/* V 0.8.92: Use filteredAwards with display idx for correct visual swap */}
                                    <div className="absolute bottom-2 left-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); onReorder('awards', filteredAwards, idx, 'left') }} className="p-1 bg-white rounded-full shadow hover:bg-black hover:text-white"><ArrowLeft className="w-3 h-3" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); onReorder('awards', filteredAwards, idx, 'right') }} className="p-1 bg-white rounded-full shadow hover:bg-black hover:text-white"><ArrowRight className="w-3 h-3" /></button>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-3 border-t border-zinc-100 flex-1 flex flex-col justify-center bg-zinc-50/30">
                            <h4 className="font-bold text-xs md:text-sm truncate mb-0.5">{award.title}</h4>
                            <p className="text-[10px] md:text-xs text-zinc-500 truncate">{award.organization}</p>
                        </div>
                    </div>
                ))}
                {filteredAwards.length === 0 && (
                    <div className="col-span-full py-20 text-center text-zinc-400 border-2 border-dashed border-zinc-100 rounded-xl">
                        <Trophy className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        No awards found.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <AwardFormModal
                    existingData={editingAward}
                    allProducts={products}
                    onClose={() => setIsModalOpen(false)}
                    onSave={(data, winners) => { onSave(data, winners); setIsModalOpen(false); }}
                />
            )}
        </div>
    );
}

function AwardDetailModal({ award, products, onClose, onNavigateProduct, onSaveProduct, isAdmin, onEdit }) {
    useScrollLock();
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [productFilter, setProductFilter] = useState('');
    const [awardYear, setAwardYear] = useState(new Date().getFullYear().toString());

    const relatedProducts = products.filter(p => {
        const hasTag = p.awards?.includes(award.title);
        const hasHistory = p.awardHistory?.some(h => h.awardId === award.id);
        return hasTag || hasHistory;
    });

    const addProductToAward = async (product) => {
        if (!product) return;

        // 1. Add to Product History
        const historyItem = { awardId: award.id, year: awardYear };
        const newHistory = [...(product.awardHistory || [])];
        if (!newHistory.some(h => h.awardId === award.id)) {
            newHistory.push(historyItem);
            await onSaveProduct({ ...product, awardHistory: newHistory });
        }

        // 2. Add tag if missing (legacy support)
        if (!product.awards?.includes(award.title)) {
            // allow legacy tag update via saveProduct if needed, but history is primary now
            // For now, history update is sufficient for this View to reflect it (line 4436)
        }
        setIsAddingProduct(false);
    }

    return (
        <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-8 animate-in zoom-in-95 duration-200">
            <div className="bg-white w-full h-full md:h-[90vh] md:w-full md:max-w-6xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">

                <div className="absolute top-4 right-4 z-[100] flex gap-2">
                    {isAdmin && <button onClick={onEdit} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><Edit3 className="w-6 h-6 text-zinc-900" /></button>}
                    <button onClick={onClose} className="p-2 bg-white/50 hover:bg-zinc-100 rounded-full backdrop-blur shadow-sm"><X className="w-6 h-6 text-zinc-900" /></button>
                </div>

                <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-100 bg-white sticky top-0 z-50 print:hidden">
                    <span className="font-bold text-sm truncate max-w-[200px]">{award.title}</span>
                </div>

                <div className="flex-1 flex flex-col md:flex-row h-full pb-safe items-start md:overflow-hidden overflow-y-auto custom-scrollbar">

                    <div className="w-full md:w-5/12 bg-zinc-50 flex items-center justify-center border-b md:border-b-0 md:border-r border-zinc-100 min-h-[40vh] md:h-full shrink-0">
                        <div className="w-full h-full flex items-center justify-center p-8">
                            {award.image ? <img src={award.image} className="max-w-full max-h-[40vh] md:max-h-[60vh] object-contain mix-blend-multiply" /> : <Trophy className="w-32 h-32 text-zinc-200" />}
                        </div>
                    </div>

                    <div className="w-full md:w-7/12 bg-white p-8 md:p-12 pb-24 md:h-full md:overflow-y-auto custom-scrollbar">
                        <div className="mb-8">
                            <div className="flex gap-2 mb-3">
                                {award.tags?.map(t => <span key={t} className="inline-block px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold rounded uppercase tracking-widest">{t}</span>)}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tighter mb-2">{award.title}</h2>
                            <p className="text-xl font-bold text-zinc-500 mb-4">{award.organization}</p>
                            {award.link && (
                                <a href={award.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs font-bold text-blue-600 hover:underline">
                                    <ExternalLink className="w-3 h-3 mr-1" /> Official Website
                                </a>
                            )}
                        </div>

                        <div className="mb-10">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">About Award</h3>
                            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                                {award.description || "No description provided."}
                            </p>
                        </div>

                        <div className="pt-8 border-t border-zinc-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center">
                                    Winners Gallery
                                    <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-[10px] ml-2">{relatedProducts.length}</span>
                                </h3>
                                {isAdmin && (
                                    <button onClick={() => setIsAddingProduct(!isAddingProduct)} className="text-[10px] font-bold text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors">
                                        {isAddingProduct ? 'Done' : '+ Add Winner'}
                                    </button>
                                )}
                            </div>
                            {isAdmin && isAddingProduct && (
                                <div className="mb-6 bg-zinc-50 p-4 rounded-xl border border-zinc-200 animate-in slide-in-from-top-2">
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            className="flex-1 text-xs p-2 bg-white rounded-lg border border-zinc-200 outline-none"
                                            value={productFilter}
                                            onChange={(e) => setProductFilter(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            className="w-20 text-xs p-2 bg-white rounded-lg border border-zinc-200 outline-none text-center"
                                            value={awardYear}
                                            onChange={(e) => setAwardYear(e.target.value)}
                                            placeholder="Year"
                                        />
                                    </div>
                                    <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                        {products.filter(p => p.name.toLowerCase().includes(productFilter.toLowerCase())).map(p => {
                                            const isAdded = p.awardHistory?.some(h => h.awardId === award.id);
                                            return (
                                                <div key={p.id} onClick={() => !isAdded && addProductToAward(p)} className={`flex items-center p-2 rounded cursor-pointer ${isAdded ? 'opacity-50 cursor-default' : 'hover:bg-white'}`}>
                                                    <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${isAdded ? 'bg-zinc-300 border-zinc-300' : 'border-zinc-300 bg-white'}`}>
                                                        {isAdded && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="text-xs font-bold text-zinc-700">{p.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {relatedProducts.length > 0 ? relatedProducts.map(p => {
                                    const historyItem = p.awardHistory?.find(h => h.awardId === award.id);
                                    const year = historyItem ? historyItem.year : (p.launchDate?.substring(0, 4) || '-');
                                    return (
                                        <button key={p.id} onClick={() => onNavigateProduct(p)} className="flex flex-col p-3 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all text-left group bg-white shadow-sm">
                                            <div className="aspect-[4/3] w-full rounded-lg bg-zinc-50 overflow-hidden mb-3 flex items-center justify-center">
                                                {p.images?.[0] ? <img src={typeof p.images[0] === 'object' ? p.images[0].url : p.images[0]} className="w-full h-full object-contain mix-blend-multiply" /> : <div className="w-full h-full bg-zinc-200"></div>}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-zinc-900 truncate group-hover:text-blue-600">{p.name}</div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[10px] text-zinc-400 uppercase">{p.category}</span>
                                                    <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">{year}</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                }) : (
                                    <div className="col-span-full text-center py-12 text-zinc-300 text-sm border-2 border-dashed border-zinc-100 rounded-xl">No winners yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AwardFormModal({ existingData, allProducts = [], onClose, onSave }) {
    useScrollLock(); // V 0.8.74: Added scroll lock
    const [data, setData] = useState({
        id: null, title: '', organization: '', description: '', image: null, link: '', tags: []
    });
    const [tagInput, setTagInput] = useState('');
    const [winners, setWinners] = useState([]);
    const [productFilter, setProductFilter] = useState('');
    const fileRef = useRef(null);

    useEffect(() => {
        if (existingData) {
            setData({ ...existingData, link: existingData.link || '' });
            const currentWinners = allProducts.filter(p => {
                const hasTag = p.awards?.includes(existingData.title);
                const hasHistory = p.awardHistory?.some(h => h.awardId === existingData.id);
                return hasTag || hasHistory;
            }).map(p => {
                const historyItem = p.awardHistory?.find(h => h.awardId === existingData.id);
                return {
                    id: p.id,
                    name: p.name,
                    image: p.images?.[0],
                    year: historyItem ? historyItem.year : (p.launchDate?.substring(0, 4) || new Date().getFullYear().toString())
                };
            });
            setWinners(currentWinners);
        }
    }, [existingData, allProducts]);

    const processImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 800;
                    let w = img.width; let h = img.height;
                    if (w > MAX) { h *= MAX / w; w = MAX; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try { const url = await processImage(file); setData(p => ({ ...p, image: url })); } catch (e) { }
        }
    };

    const addTag = () => {
        if (tagInput.trim()) {
            setData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
            setTagInput('');
        }
    };

    const removeTag = (idx) => {
        setData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== idx) }));
    };

    const toggleWinner = (product) => {
        if (winners.some(w => w.id === product.id)) {
            setWinners(winners.filter(w => w.id !== product.id));
        } else {
            setWinners([...winners, {
                id: product.id,
                name: product.name,
                image: product.images?.[0],
                year: new Date().getFullYear().toString()
            }]);
        }
    };

    const updateWinnerYear = (id, year) => {
        setWinners(winners.map(w => w.id === id ? { ...w, year } : w));
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-zinc-100 font-bold text-lg flex-shrink-0 flex justify-between items-center">
                    <span>{existingData ? 'Edit Award' : 'Add Award'}</span>
                    <button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-black" /></button>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    <div className="w-full md:w-1/3 p-6 overflow-y-auto custom-scrollbar border-r border-zinc-100">
                        <div className="flex justify-center mb-6">
                            <div onClick={() => fileRef.current.click()} className="w-32 h-32 rounded-xl shadow-md border-2 border-dashed border-zinc-300 cursor-pointer overflow-hidden relative group bg-zinc-50 flex items-center justify-center">
                                {data.image ? <img src={data.image} className="w-full h-full object-contain" /> : <ImagePlus className="w-8 h-8 text-zinc-300" />}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-6 h-6 text-white" /></div>
                            </div>
                            <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleUpload} />
                        </div>
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Award Title</label><input value={data.title} onChange={e => setData({ ...data, title: e.target.value })} className="w-full border rounded-lg p-2 text-sm outline-none" placeholder="e.g. Red Dot" /></div>
                            <div><label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Organization</label><input value={data.organization} onChange={e => setData({ ...data, organization: e.target.value })} className="w-full border rounded-lg p-2 text-sm outline-none" /></div>
                            <div><label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Official Link</label><input value={data.link} onChange={e => setData({ ...data, link: e.target.value })} className="w-full border rounded-lg p-2 text-sm outline-none" /></div>
                            <div><label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Description</label><textarea rows={4} value={data.description} onChange={e => setData({ ...data, description: e.target.value })} className="w-full border rounded-lg p-2 text-sm outline-none" /></div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Tags</label>
                                <div className="flex gap-2 mb-2"><input value={tagInput} onChange={e => setTagInput(e.target.value)} className="flex-1 border rounded p-1.5 text-xs" placeholder="Add tag" onKeyDown={e => e.key === 'Enter' && addTag()} /><button onClick={addTag} className="bg-zinc-900 text-white px-3 rounded text-xs font-bold">Add</button></div>
                                <div className="flex flex-wrap gap-1">{data.tags?.map((tag, idx) => (<span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center">{tag} <button onClick={() => removeTag(idx)} className="ml-1 hover:text-red-500"><X className="w-3 h-3" /></button></span>))}</div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-2/3 p-6 flex flex-col bg-zinc-50/50">
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-zinc-900 mb-2 flex justify-between">Manage Winners <span className="bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full text-xs">{winners.length} selected</span></h3>
                            <input type="text" placeholder="Search products to add..." className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-sm outline-none focus:border-zinc-400" value={productFilter} onChange={(e) => setProductFilter(e.target.value)} />
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar border border-zinc-200 rounded-xl bg-white">
                            {productFilter && (
                                <div className="p-2 border-b border-zinc-100 bg-blue-50/30">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase px-2">Search Results</span>
                                    <div className="grid grid-cols-2 gap-2 mt-1">{allProducts.filter(p => p.name.toLowerCase().includes(productFilter.toLowerCase()) && !winners.some(w => w.id === p.id)).map(p => (<div key={p.id} onClick={() => toggleWinner(p)} className="flex items-center p-2 hover:bg-blue-50 cursor-pointer rounded-lg transition-colors border border-transparent hover:border-blue-100"><Plus className="w-4 h-4 text-blue-500 mr-2" /><div className="w-8 h-8 bg-zinc-100 rounded overflow-hidden mr-2">{p.images?.[0] && <img src={typeof p.images[0] === 'object' ? p.images[0].url : p.images[0]} className="w-full h-full object-cover" />}</div><span className="text-xs font-bold truncate">{p.name}</span></div>))}</div>
                                </div>
                            )}
                            <div className="p-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase px-2 block mb-2">Selected Winners</span>
                                <div className="space-y-2">{winners.map(winner => (<div key={winner.id} className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg border border-zinc-100"><div className="flex items-center flex-1 min-w-0"><div className="w-10 h-10 bg-white rounded-md overflow-hidden border border-zinc-200 mr-3 flex-shrink-0">{winner.image && <img src={typeof winner.image === 'object' ? winner.image.url : winner.image} className="w-full h-full object-cover" />}</div><div className="truncate mr-2"><div className="text-xs font-bold text-zinc-900 truncate">{winner.name}</div></div></div><div className="flex items-center gap-2"><div className="flex items-center bg-white border border-zinc-200 rounded px-2 py-1"><span className="text-[10px] text-zinc-400 mr-1">Year:</span><input type="number" className="w-12 text-xs font-bold text-center outline-none" value={winner.year} onChange={(e) => updateWinnerYear(winner.id, e.target.value)} /></div><button onClick={() => toggleWinner(winner)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button></div></div>))}
                                    {winners.length === 0 && <div className="text-center py-8 text-zinc-300 text-xs">No winners selected.</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-zinc-100 bg-white flex justify-end space-x-3 flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50">Cancel</button>
                    <button onClick={() => onSave(data, winners)} className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-black hover:scale-105 transition-all">Save Changes</button>
                </div>
            </div>
        </div>
    );
}