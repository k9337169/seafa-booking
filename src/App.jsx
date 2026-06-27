import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { 
  Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Users, User, Phone, Mail, 
  CheckCircle2, Waves, Info, ArrowLeft, Settings, Plus, LayoutDashboard, Trash2, 
  BookOpen, UsersRound, Map, CalendarDays, X, Database, Pencil, Award, Star, 
  Sparkles, Ticket, Plane, FileText, Search, Receipt, ShieldCheck, 
  Image as ImageIcon, CreditCard, Banknote, ToggleLeft, ToggleRight, Ban, 
  AlertCircle, Tag, Sunset, Globe, MessageCircle, Instagram, Camera, Lock, 
  LogOut, Shield, UserCog, Key
} from 'lucide-react';

// ==========================================
// 🌟 【上架部署替換區】 🌟
// ⚠️ 注意：請「只替換引號裡面的字」，千萬不要刪除或覆蓋到左邊的變數名稱！
// ==========================================
const myFirebaseConfig = {
  apiKey: "AIzaSyBNciR4vCeqHZoJWQnu0o_IzFK_e3dlHZY",
  authDomain: "seafa-booking.firebaseapp.com",
  projectId: "seafa-booking",
  storageBucket: "seafa-booking.firebasestorage.app",
  messagingSenderId: "724643313917",
  appId: "1:724643313917:web:93c612461e82cdeb622694"
};

// --- 系統自動判斷環境與防呆檢查 (絕對不要動這裡的程式碼喔) ---
const isPreviewEnv = typeof __firebase_config !== 'undefined';
const finalFirebaseConfig = isPreviewEnv ? JSON.parse(__firebase_config) : myFirebaseConfig;
const isConfigMissing = !isPreviewEnv && (!finalFirebaseConfig.apiKey || finalFirebaseConfig.apiKey === "請貼上您的_apiKey");

let app, auth, db;
if (!isConfigMissing) {
  try {
    app = initializeApp(finalFirebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase 初始化失敗:", e);
  }
}
// 您的專屬資料庫空間 ID
const appId = isPreviewEnv && typeof __app_id !== 'undefined' ? __app_id : 'seafa-mermaid-app'; 

// --- 自定義視覺元素 ---
const MermaidTailIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s-8-4.5-8-11.5c0-4.5 3-7.5 8-7.5s8 3 8 7.5c0 7-8 11.5-8 11.5z" />
    <path d="M12 10.5c1.5 0 3-1 3-2.5s-1.5-2.5-3-2.5-3 1-3 2.5 1.5 2.5 3 2.5z" />
    <path d="M7 16c0-1.5 2-2.5 5-2.5s5 1 5 2.5" />
  </svg>
);

const FreedivingFinIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8.5 2C8.5 2 7 8 7 14c0 4.4 2.2 8 5 8s5-3.6 5-8c0-6-1.5-12-1.5-12H8.5z" />
    <path d="M9 6c0 1.7 1.3 3 3 3s3-1.3 3-3" />
  </svg>
);

const SunsetWave = ({ className = "" }) => (
  <svg className={`absolute w-full h-24 sm:h-32 ${className}`} preserveAspectRatio="none" viewBox="0 0 1440 320">
    <path fill="currentColor" fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,165.3C672,171,768,208,864,213.3C960,219,1056,192,1152,176C1248,160,1344,155,1392,152L1440,149.3L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
  </svg>
);

// --- 系統初始預設資料 (同步於 Firebase 前使用) ---
const INITIAL_USERS = [
  { id: 'u1', username: 'admin', password: 'admin', role: 'superadmin', name: '總管理員' },
  { id: 'u2', username: 'coach1', password: '1234', role: 'coach', name: 'Ariel 教練' }
];

const INITIAL_PAYMENTS = [
  { id: 'transfer', name: '銀行匯款/轉帳', enabled: true, requiresProof: true, instructions: '請將款項匯至以下帳戶：\n銀行：玉山銀行 (808)\n帳號：1234-567-890123\n戶名：SeaFa 人魚俱樂部\n\n匯款完成後，請填寫您的帳號後五碼以利對帳。' },
  { id: 'credit', name: '線上刷卡', enabled: true, requiresProof: false, instructions: '報名送出後，系統將自動引導您至金流平台進行安全付款。' },
  { id: 'onsite', name: '現場繳費', enabled: true, requiresProof: false, instructions: '僅限已與教練達成協議之學員使用。請於活動當日以現金繳納。' }
];

const INITIAL_COURSES = [
  { id: 'c1', name: 'PADI 基礎人魚課程', desc: '適合初學者的基礎證照課程。', days: '1 天', system: 'PADI', price: 12000, prerequisites: '年滿 10 歲，具備基礎游泳能力。', includes: '全套人魚裝備借用、PADI 證照申請費。', content: '平潛、轉身、安全觀念。' },
  { id: 'c2', name: 'PADI 進階人魚課程', desc: '進階技巧與深度訓練。', days: '2 天', system: 'PADI', price: 15000, prerequisites: '持有 PADI 基礎人魚證照。', includes: '人魚裝備借用、場地費。', content: '動態平潛、躬身下潛、開放水域。' },
  { id: 'c3', name: 'SeaFa 基礎人魚體驗', desc: '輕鬆體驗水下人魚的樂趣。', days: '半天', system: '無證照', price: 2500, prerequisites: '不怕水，無特殊疾病。', includes: '裝備租借、側拍。', content: '基礎踢動、拍照留念。' }
];

const INITIAL_COACHES = [
  { id: 't1', name: 'Ariel 教練', desc: '專長：PADI 人魚教學、水下表演' },
  { id: 't2', name: 'Ken 教練', desc: '專長：進階人魚下潛、動態平潛' },
  { id: 't3', name: '海神 攝影師', desc: '專長：水下人像攝影、動態錄影' }
];

const INITIAL_LOCATIONS = [
  { id: 'l1', name: '成大新建泳池', region: '台南', desc: '校園標準池，適合平靜水域練習。', regularPrice: 600, studentPrice: 500, includesTicket: true, availableTimes: '禮拜一 08:00-12:00 17:30-19:30\n禮拜二 08:00-10:00 17:30-19:30\n禮拜三 08:00-10:00 17:30-19:30\n禮拜四 08:00-10:00 13:00-15:00 17:30-19:30\n禮拜五 08:00-10:00 15:00-17:00 17:30-19:30\n六日要提前問校方預約' },
  { id: 'l2', name: '臺中潛立方', region: '台中', desc: '亞洲最深潛水池，水溫舒適。', regularPrice: 1700, studentPrice: 1450, includesTicket: true, availableTimes: '09:00-10:30 10:30-12:00 12:00-13:30\n13:30-15:00 15:00-16:30 16:30-18:00\n18:00-19:30 19:30-21:00' },
  { id: 'l3', name: '臺中北區', region: '台中', desc: '標準深水池。', regularPrice: 1000, studentPrice: 850, includesTicket: true, availableTimes: '10:00-12:00 14:00-16:00\n16:30-18:30 19:00-21:00' },
  { id: 'l4', name: '臺北松運 (不含門票)', region: '台北', desc: '北部熱門深水池。', regularPrice: 800, studentPrice: 650, includesTicket: false, availableTimes: '08:00-10:00 10:00-12:00\n12:00-14:00 14:00-16:00\n16:00-18:00 18:00-20:00' },
  { id: 'l5', name: '臺北南港', region: '台北', desc: '北部深水池。', regularPrice: 1100, studentPrice: 950, includesTicket: true, availableTimes: '07:00-09:00 09:00-11:00 11:00-13:00\n13:00-15:00 15:00-17:00 17:00-19:00\n19:00-21:00' },
  { id: 'l6', name: '小琉球', region: '屏東', desc: '自然海域。', regularPrice: 1800, studentPrice: 1550, includesTicket: false, availableTimes: '一堂2小時\n(不含個人裝備、交通、食宿)' }
];

const DEFAULT_RULES = `【 SeaFa 課程及團練規範 】\n\n一、報名與取消政策\n1. 報名後請於規定期限內完成繳費並回傳證明，逾期系統將自動取消名額。\n2. 活動日前 7 天取消，全額退費；前 3-6 天取消退還 50%；活動前 2 日內及當天未出席者，恕不退費。\n3. 若因天候因素（如颱風發布海上警報、海象不佳等）經教練判斷不宜下水，可全額退費或免費延期。\n\n二、健康與安全聲明\n1. 參加者須確認自身無心血管疾病、氣喘、癲癇、近期手術或懷孕等不適合水下活動之情形。若有隱瞞，需自行承擔相關風險。\n2. 活動期間請絕對聽從教練或領隊之指示，切勿擅自脫隊或進行危險動作。\n\n三、裝備與場地\n1. 租借之裝備請小心愛護，若有惡意損壞或遺失，需照價賠償。\n2. 潛點/泳池之額外門票或場地費用，除課程已註明包含外，須由學員於現場自行支付。\n\n同意上述條款方可送出報名。期待與您一同安全、愉快地下潛！`;

const ACTIVITY_TYPES = {
  course: { label: '證照課程', short: '課程', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  practice: { label: '教練團練', short: '團練', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  need_one: { label: '缺一成團', short: '缺一', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  trip: { label: '潛水旅遊', short: '潛旅', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  unavailable: { label: '無法開團', short: '停開', color: 'bg-slate-100 text-slate-500 border-slate-300' }
};

const PAYMENT_ICONS = {
  transfer: Receipt,
  credit: CreditCard,
  onsite: Banknote
};

const Badge = ({ type }) => {
  const config = ACTIVITY_TYPES[type] || { label: '未分類', short: '其他', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  return <span className={`px-2.5 py-1.5 rounded-lg text-xs font-black tracking-widest border shadow-sm ${config.color}`}>{config.label}</span>;
};

const OFFICIAL_SITE = "https://sites.google.com/view/sea-fa/%E5%93%81%E7%89%8C%E4%BB%8B%E7%B4%B9?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAdGRleARnuKlleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAadzrz4-SbdXN_hk8Z3tir5FkMWKz9tKQ9cxOd_2_NgJySmC8qp6wm6A6_6sAw_aem_y3YYo6ZDEh2cwP7UnVBBxA";
const LINE_LINK = "https://line.me/R/ti/p/@022ocuil";
const INSTAGRAM_LINK = "https://www.instagram.com/sea.fa0301?igsh=ZHRiMGp0anNrcXo4";
const PORTFOLIO_LINK = "https://www.instagram.com/sea.fa0301/"; 

// --- 錯誤捕捉防護機制 (Error Boundary) ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-6 font-sans text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-lg w-full border border-rose-100 relative z-10">
            <AlertCircle size={64} className="text-rose-500 mx-auto mb-6" />
            <h1 className="text-2xl font-black text-rose-700 mb-4 tracking-wide">系統發生未預期錯誤</h1>
            <p className="text-rose-600/80 font-bold leading-relaxed mb-6">
              應用程式無法正常渲染。如果您剛上架到 GitHub Pages，請確認 Firebase 設定是否正確，或開啟瀏覽器開發者工具 (F12) 查看 Console 詳細錯誤原因。
            </p>
            <div className="bg-slate-50 p-5 rounded-2xl text-left text-[11px] font-mono text-slate-600 overflow-auto border border-slate-200 custom-scrollbar max-h-48">
              {this.state.error?.toString()}
            </div>
            <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-rose-100 text-rose-600 rounded-xl font-black hover:bg-rose-200 transition-colors">
              重新載入頁面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- 根元件 (包含防呆介面) ---
export default function App() {
  if (isConfigMissing) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6 font-sans text-center relative overflow-hidden">
        <SunsetWave className="absolute bottom-0 opacity-20 text-orange-400 pointer-events-none" />
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-lg w-full border border-orange-100 relative z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/50 rounded-full blur-3xl opacity-50"></div>
          <AlertCircle size={64} className="text-orange-500 mx-auto mb-6 animate-pulse relative z-10" />
          <h1 className="text-2xl font-black text-indigo-900 mb-4 relative z-10 tracking-widest">部署準備就緒！</h1>
          <p className="text-indigo-900/70 font-bold leading-relaxed mb-3 relative z-10 text-lg">
            系統偵測到您目前正在外部環境，但尚未填寫 Firebase 金鑰。<br/>
          </p>
          <p className="text-sm text-indigo-900/50 font-bold leading-relaxed mb-6 relative z-10">
            請回到程式碼 <code>App.jsx</code> (約第 18 行) 的 <code>myFirebaseConfig</code> 區塊，將裡面引號的值換成真實金鑰並儲存，就可以開始運作囉！
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

// --- 主要應用程式邏輯 ---
function MainApp() {
  // 系統核心狀態
  const [activities, setActivities] = useState({});
  const [registrations, setRegistrations] = useState([]);
  const [wishlists, setWishlists] = useState([]);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [rulesText, setRulesText] = useState(DEFAULT_RULES);
  const [courseList, setCourseList] = useState(INITIAL_COURSES);
  const [coachList, setCoachList] = useState(INITIAL_COACHES);
  const [locationList, setLocationList] = useState(INITIAL_LOCATIONS);
  const [paymentMethods, setPaymentMethods] = useState(INITIAL_PAYMENTS);
  const [welcomeConfig, setWelcomeConfig] = useState({ title: '潛入深藍，探索水下世界', desc: '請點選左側月曆日期，查看最新人魚與自潛課程、團練及潛旅梯次。' });
  const [announcementText, setAnnouncementText] = useState('【 團練報名注意事項 】\n非本中心學生須出示「人魚證照」即可報名參加團練。\n若未過課，需先報名「訓練潛」評估安全潛水能力，通過後可報名團練。');

  // Firebase Auth State
  const [authUser, setAuthUser] = useState(null);

  // UI 互動狀態
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [step, setStep] = useState('calendar');
  const [discountState, setDiscountState] = useState({ code: '', applied: false, amount: 0, error: '' });
  const [isRulesRead, setIsRulesRead] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const rulesRef = useRef(null);
  const sessionListRef = useRef(null); 
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [formData, setFormData] = useState({ tailSize: 'M', paymentMethod: 'transfer' });
  const [wishlistData, setWishlistData] = useState({ nickname: '', name: '', phone: '', email: '', wishType: 'course', wishContent: '', wishTime: 'morning' });

  // 後台專屬狀態
  const [currentUser, setCurrentUser] = useState(null);
  const [userManageModal, setUserManageModal] = useState({ isOpen: false, mode: 'add', item: null });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: '', mode: 'add', item: null });
  const [activeAdminTab, setActiveAdminTab] = useState('activities');
  const [activeInfoTab, setActiveInfoTab] = useState('courses');
  const [editingActivity, setEditingActivity] = useState(null);
  const [wishToActData, setWishToActData] = useState(null);
  const [activityFormType, setActivityFormType] = useState('course');
  const [timeInput, setTimeInput] = useState(''); // 新增：用於控制時間時段的輸入與快速選擇

  // --- Firebase 初始化與資料綁定 ---
  useEffect(() => {
    // 預防未初始化 db
    if (!auth || !db) return;

    const initAuth = async () => {
      // 在預覽環境中會使用平台提供的 Token，在您的公開網站則會自動使用匿名登入
      if (isPreviewEnv && typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setAuthUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser || !db) return;

    const actsRef = collection(db, 'artifacts', appId, 'public', 'data', 'activities');
    const regsRef = collection(db, 'artifacts', appId, 'public', 'data', 'registrations');
    const wishRef = collection(db, 'artifacts', appId, 'public', 'data', 'wishlists');
    const settingsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'system_settings', 'config');

    const unsubActs = onSnapshot(actsRef, (snap) => {
      // 若資料庫全空，自動塞入一筆範例課程與許願 (防止首次載入畫面全空)
      if (snap.empty && !window.__acts_seeded) {
         window.__acts_seeded = true;
         const dStr = formatDateString(new Date().getFullYear(), new Date().getMonth(), 10);
         const mockAct = { id: 'act_mock1', date: dStr, time: '09:00 - 12:00', title: 'PADI 基礎人魚課程', instructor: 'Ariel 教練', spots: 4, totalSpots: 8, minSpots: 4, price: 12000, type: 'course', location: '小琉球 威尼斯沙灘', discountCode: 'SEAFA2026', discountAmount: 1000 };
         setDoc(doc(actsRef, mockAct.id), mockAct);
      }
      const data = {};
      snap.forEach(d => {
        const act = d.data();
        if (!data[act.date]) data[act.date] = [];
        data[act.date].push(act);
      });
      setActivities(data);
    }, console.error);

    const unsubRegs = onSnapshot(regsRef, (snap) => setRegistrations(snap.docs.map(d => d.data())), console.error);
    const unsubWish = onSnapshot(wishRef, (snap) => setWishlists(snap.docs.map(d => d.data())), console.error);

    const unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.courseList) setCourseList(data.courseList);
        if (data.coachList) setCoachList(data.coachList);
        if (data.locationList) setLocationList(data.locationList);
        if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
        if (data.users) setUsers(data.users);
        if (data.rulesText) setRulesText(data.rulesText);
        if (data.announcementText !== undefined) setAnnouncementText(data.announcementText);
        if (data.welcomeConfig) setWelcomeConfig(data.welcomeConfig);
      } else {
        // 初始化 Firebase 系統設定
        setDoc(settingsDocRef, {
          courseList: INITIAL_COURSES, coachList: INITIAL_COACHES, locationList: INITIAL_LOCATIONS,
          paymentMethods: INITIAL_PAYMENTS, users: INITIAL_USERS, rulesText: DEFAULT_RULES,
          announcementText: '【 團練報名注意事項 】\n非本中心學生須出示「人魚證照」即可報名參加團練。\n若未過課，需先報名「訓練潛」評估安全潛水能力，通過後可報名團練。',
          welcomeConfig: { title: '潛入深藍，探索水下世界', desc: '請點選左側月曆日期，查看最新人魚與自潛課程、團練及潛旅梯次。' }
        });
      }
    }, console.error);

    return () => { unsubActs(); unsubRegs(); unsubWish(); unsubSettings(); };
  }, [authUser]);

  // 同步搜尋結果
  useEffect(() => {
    if (searchPhone && searchResults) {
      setSearchResults(registrations.filter(r => r.phone === searchPhone));
    }
  }, [registrations]);

  useEffect(() => {
    if (step === 'form') {
      setIsRulesRead(false); 
      setIsAgreed(false);
      const timer = setTimeout(() => {
        if (rulesRef.current) {
          const { scrollHeight, clientHeight } = rulesRef.current;
          if (clientHeight > 0 && scrollHeight <= clientHeight + 5) {
            setIsRulesRead(true);
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, selectedSession, rulesText]);

  // --- Helpers ---
  const saveSettings = async (updates) => {
    if (!authUser || !db) return;
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'system_settings', 'config');
    await setDoc(settingsRef, updates, { merge: true });
  };

  const getDaysInMonth = (date) => {
    const y = date.getFullYear(), m = date.getMonth();
    return { daysInMonth: new Date(y, m + 1, 0).getDate(), firstDayOfMonth: new Date(y, m, 1).getDay(), year: y, month: m };
  };

  const { daysInMonth, firstDayOfMonth, year, month } = getDaysInMonth(currentDate);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const formatDateString = (y, m, d) => `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

  const getActivityById = (actId, dateHint) => {
    if (dateHint && activities[dateHint]) {
      const act = activities[dateHint].find(a => a.id === actId);
      if (act) return act;
    }
    for (const [date, acts] of Object.entries(activities)) {
      const act = acts.find(a => a.id === actId);
      if (act) return { ...act, date };
    }
    return null;
  };

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm('確定要刪除此項目嗎？刪除後無法復原。')) return;
    const currentList = type === 'course' ? courseList : type === 'coach' ? coachList : locationList;
    const newList = currentList.filter(i => i.id !== id);
    await saveSettings({ [type + 'List']: newList });
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    let newItem = { id: modalConfig.mode === 'add' ? 'id_' + Date.now() : modalConfig.item.id, name: fd.get('name'), desc: fd.get('desc') };

    if (modalConfig.type === 'course') {
      newItem = { ...newItem, days: fd.get('days') || '', system: fd.get('system') || '', price: parseInt(fd.get('price')) || 0, prerequisites: fd.get('prerequisites') || '', includes: fd.get('includes') || '', content: fd.get('content') || '' };
    } else if (modalConfig.type === 'location') {
       newItem = { ...newItem, region: fd.get('region') || '', regularPrice: parseInt(fd.get('regularPrice')) || 0, studentPrice: parseInt(fd.get('studentPrice')) || 0, includesTicket: fd.get('includesTicket') === 'true', availableTimes: fd.get('availableTimes') || '' };
    }

    const currentList = modalConfig.type === 'course' ? courseList : modalConfig.type === 'coach' ? coachList : locationList;
    const newList = modalConfig.mode === 'add' ? [...currentList, newItem] : currentList.map(i => i.id === newItem.id ? newItem : i);
    await saveSettings({ [modalConfig.type + 'List']: newList });
    setIsModalOpen(false);
  };

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        sessionListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  const handleSelectSession = (session) => {
    setSelectedSession(session);
    setDiscountState({ code: '', applied: false, amount: 0, error: '' });
    setStep('form');
  };

  const updatePaymentProof = async (id, proof) => {
    const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'registrations', id);
    await setDoc(regRef, { paymentProof: proof }, { merge: true });
    alert('✅ 繳款證明回傳成功！我們將盡快為您對帳。');
  };

  // --- 視圖: 1. 月曆與活動列表 ---
  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="min-h-[6rem] sm:min-h-[9rem] border border-orange-50/50 bg-orange-50/20"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateString(year, month, d);
      const dayTypes = Array.from(new Set((activities[dateStr] || []).map(act => act.type)));
      const hasActs = dayTypes.length > 0;
      const isSel = selectedDate === dateStr;

      days.push(
        <div 
          key={d} 
          onClick={() => handleDateClick(dateStr)} 
          className={`min-h-[6rem] sm:min-h-[9rem] border border-orange-50/50 p-1.5 sm:p-3 flex flex-col transition-all duration-200 cursor-pointer 
          ${hasActs ? 'hover:bg-orange-50/60' : 'hover:bg-slate-50/80'} 
          ${isSel ? (hasActs ? 'bg-orange-50/80 border-orange-300 ring-2 ring-inset ring-orange-400 shadow-inner' : 'bg-rose-50/50 ring-2 ring-inset ring-rose-200') : 'bg-white/90'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`text-base sm:text-lg font-black px-3 py-1.5 rounded-br-xl shadow-sm tracking-wide ${isSel ? (hasActs ? 'text-orange-700 bg-orange-100 border border-orange-200' : 'text-rose-700 bg-rose-100 border border-rose-200') : 'text-indigo-900/60 bg-white/50 border border-transparent'}`}>{d}</span>
          </div>
          {hasActs && (
             <div className="flex flex-col gap-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mt-1.5 px-1 pb-1">
               {dayTypes.map(type => {
                 const config = ACTIVITY_TYPES[type];
                 return (
                   <div key={type} className={`px-2 sm:px-2.5 py-1.5 rounded-lg border flex justify-center items-center shadow-sm w-full ${config?.color}`}>
                     <span className="text-xs font-black tracking-widest hidden sm:block truncate leading-none">{config?.label}</span>
                     <span className="text-[10px] font-black tracking-wider sm:hidden leading-none">{config?.short}</span>
                   </div>
                 );
               })}
             </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-xl border border-orange-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 sm:p-6 bg-gradient-to-br from-indigo-900 via-purple-800 to-orange-500 text-white relative overflow-hidden rounded-t-[2rem]">
          <div className="absolute -bottom-12 -right-10 w-48 h-48 bg-orange-400 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-rose-500 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
          <SunsetWave className="bottom-0 text-white/10" />
          
          <button onClick={handlePrevMonth} className="p-2.5 hover:bg-white/20 rounded-full transition-colors relative z-10 text-white"><ChevronLeft size={24} /></button>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-3 relative z-10 tracking-widest drop-shadow-md">
            <Sunset className="text-orange-200" size={28}/>
            {year} 年 {month + 1} 月
          </h2>
          <button onClick={handleNextMonth} className="p-2.5 hover:bg-white/20 rounded-full transition-colors relative z-10 text-white"><ChevronRight size={24} /></button>
        </div>
        <div className="grid grid-cols-7 border-b border-orange-100/50 bg-orange-50/30">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (<div key={day} className="py-3 text-center text-xs sm:text-sm font-black text-indigo-900/50 tracking-widest">{day}</div>))}
        </div>
        <div className="grid grid-cols-7 bg-white/60">{days}</div>
      </div>
    );
  };

  const renderSessionList = () => {
    if (!selectedDate) return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-orange-50/80 via-rose-50/40 to-teal-50/40 rounded-[2rem] border border-orange-100 shadow-md relative overflow-hidden group min-h-[400px]">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-b from-orange-300 to-rose-300 rounded-full blur-2xl opacity-50 group-hover:scale-110 group-hover:opacity-70 transition-all duration-1000 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-teal-100/40 to-transparent pointer-events-none"></div>
        <SunsetWave className="bottom-0 text-teal-600/5" />

        <div className="relative mb-8 mt-4">
          <div className="w-32 h-32 bg-white/80 backdrop-blur-sm rounded-full border-4 border-white shadow-xl flex items-center justify-center relative z-10 overflow-hidden group-hover:-translate-y-2 transition-transform duration-500">
             <div className="flex -space-x-3 items-center justify-center">
                <Sunset size={44} className="text-orange-500 drop-shadow-md z-10" />
                <Waves size={36} className="text-teal-600 drop-shadow-md translate-y-3 -translate-x-2 opacity-90" />
             </div>
          </div>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-indigo-900 mb-4 tracking-widest relative z-10 whitespace-pre-wrap">
          {welcomeConfig.title}
        </h3>
        <p className="text-indigo-900/60 mb-10 max-w-[280px] leading-relaxed font-bold relative z-10 whitespace-pre-wrap">
          {welcomeConfig.desc}
        </p>
        
        <button 
          onClick={() => setStep('wishlist_form')}
          className="relative z-10 flex items-center justify-center px-8 py-4 bg-white hover:bg-orange-50 rounded-2xl text-base font-black text-orange-600 shadow-md border border-orange-100 transition-all hover:scale-105 group/btn"
        >
          <Sparkles size={20} className="mr-2 text-orange-400 group-hover/btn:animate-spin" /> 
          找不到時段？點我許願開團！
        </button>
      </div>
    );

    const dayActs = activities[selectedDate] || [];
    const hasActs = dayActs.length > 0;

    return (
      <div ref={sessionListRef} className="h-full flex flex-col bg-white/90 backdrop-blur-sm rounded-[2rem] p-6 sm:p-8 border border-orange-100 shadow-xl scroll-mt-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-orange-300 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        
        <div className="mb-6 border-b border-orange-100/50 pb-4 relative z-10">
          <h3 className="text-2xl font-black text-indigo-900 flex items-center gap-2">
            {selectedDate.replace(/-/g, '/')} {hasActs ? '活動梯次' : '無排定活動'}
          </h3>
          <p className="text-sm text-indigo-900/60 mt-2 font-bold">{hasActs ? '點擊您想報名的時段卡片。' : '這天教練可能在休息或出國潛旅囉！'}</p>
        </div>
        
        <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6 relative z-10">
          {hasActs ? (
            <>
              {dayActs.map((session) => {
                const isUnavailable = session.type === 'unavailable';
                const isFull = session.spots === 0 && !isUnavailable;
                const currentRegs = session.totalSpots - session.spots;
                const minSpots = session.minSpots || 1;
                const isGrouped = currentRegs >= minSpots;
                const isAlmostGrouped = currentRegs === minSpots - 1 && !isGrouped && !isUnavailable;

                return (
                  <div key={session.id} className={`p-7 sm:p-8 rounded-[2.5rem] border-2 transition-all group/session ${isUnavailable ? 'bg-slate-50 border-slate-200 opacity-90' : isFull ? 'bg-orange-50/30 border-orange-100 opacity-80' : 'bg-white border-orange-100 hover:border-orange-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer'}`} onClick={() => !isFull && !isUnavailable && handleSelectSession(session)}>
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <Badge type={session.type} />
                      {session.initiator && !isUnavailable && <span className="text-[11px] font-black tracking-widest text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm flex items-center gap-1.5">✨ 許願人：{session.initiator}</span>}
                      {isAlmostGrouped && <span className="text-[11px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 shadow-sm animate-pulse flex items-center gap-1.5">🔥 僅差一人成團！</span>}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
                      <h4 className={`text-2xl sm:text-3xl font-black leading-relaxed transition-colors tracking-wide ${isUnavailable ? 'text-slate-500 line-through decoration-slate-300' : 'text-indigo-900 group-hover/session:text-orange-600'}`}>
                        {session.title}
                      </h4>
                      {!isUnavailable && (
                        <div className="text-left sm:text-right shrink-0 bg-rose-50/50 px-5 py-3 rounded-2xl border border-rose-100/50 shadow-sm">
                          <span className="text-[12px] font-black text-rose-400 uppercase tracking-widest block mb-1">單人費用</span>
                          <span className="text-3xl sm:text-4xl font-black text-rose-600 tracking-tight">NT$ {session.price.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 text-base sm:text-lg font-bold p-6 sm:p-7 rounded-[2rem] border ${isUnavailable ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-orange-50/40 border-orange-100/50 text-indigo-900/80'}`}>
                      <div className="flex items-center gap-4 col-span-1 sm:col-span-2 bg-white/70 p-4 rounded-xl shadow-sm"><Clock size={24} className={`${isUnavailable ? 'text-slate-400' : 'text-orange-500'} shrink-0`} /><span className="tracking-wider">{session.time}</span></div>
                      {!isUnavailable && <div className="flex items-center gap-4 bg-white/70 p-4 rounded-xl shadow-sm"><MapPin size={24} className="text-orange-500 shrink-0" /><span className="truncate tracking-wide">{session.location}</span></div>}
                      <div className="flex items-center gap-4 bg-white/70 p-4 rounded-xl shadow-sm"><User size={24} className={`${isUnavailable ? 'text-slate-400' : 'text-orange-500'} shrink-0`} /><span className="tracking-wide">{session.instructor}</span></div>
                    </div>
                    
                    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-8 mt-8 border-t ${isUnavailable ? 'border-slate-200' : 'border-orange-100'}`}>
                      {!isUnavailable ? (
                        <div className="flex flex-col">
                          <div className="flex items-end gap-3 text-lg font-black mb-2">
                            <Users size={28} className={`mb-1.5 ${isFull ? 'text-orange-300' : 'text-orange-500'}`} />
                            <span className={isFull ? 'text-orange-400' : 'text-indigo-900 tracking-wider'}>
                              剩餘名額 <span className="text-5xl font-black text-orange-500 mx-2 leading-none">{session.spots}</span> <span className="text-lg text-indigo-900/50">/ {session.totalSpots}</span>
                            </span>
                          </div>
                          <div className="text-sm text-indigo-900/50 font-bold ml-10 tracking-wide">最低成團限制：{minSpots} 人</div>
                        </div>
                      ) : (
                        <div className="text-lg font-black text-slate-500 flex items-center gap-2">
                           <Ban size={24}/> 該時段不開放預約
                        </div>
                      )}
                      <button disabled={isFull || isUnavailable} className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-md shrink-0 tracking-widest ${isUnavailable ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : isFull ? 'bg-orange-100 text-orange-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:shadow-lg hover:shadow-orange-500/30 group-hover/session:-translate-y-1'}`}>
                        {isUnavailable ? '無法報名' : isFull ? '已額滿' : '立即報名'}
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="mt-8 pt-8 border-t-2 border-dashed border-orange-200/50 relative">
                <div className="relative bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 rounded-[2rem] p-8 text-center border border-orange-200/50 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 -mr-6 -mt-6 text-orange-500/10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                    <Sparkles size={120} />
                  </div>
                  <div className="absolute bottom-0 left-0 -ml-4 -mb-4 text-rose-500/5 group-hover:-rotate-12 transition-transform duration-700 pointer-events-none">
                    <MermaidTailIcon size={100} />
                  </div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center bg-white w-14 h-14 rounded-full shadow-sm mb-4 border border-orange-100 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                      <Sparkles size={26} className="text-orange-500 animate-pulse" />
                    </div>
                    <h4 className="text-xl font-black text-indigo-900 mb-2 tracking-wide">沒有適合您的梯次嗎？</h4>
                    <p className="text-sm text-indigo-900/70 mb-6 font-bold leading-relaxed">找不到理想的時間或地點？<br/>告訴我們您的需求，教練幫您專屬湊班開團！</p>
                    <button onClick={() => setStep('wishlist_form')} className="w-full py-4 bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white rounded-2xl font-black text-lg shadow-[0_4px_15px_rgb(249,115,22,-0.3)] hover:shadow-[0_6px_20px_rgb(249,115,22,-0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                      立即許願開團 <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 relative overflow-hidden bg-gradient-to-b from-white to-orange-50/40 rounded-[2.5rem] border border-orange-50/50 shadow-sm">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-100/40 via-transparent to-transparent pointer-events-none"></div>
              
              <div className="relative z-10 w-full max-w-sm mx-auto">
                <div className="relative w-28 h-28 mx-auto mb-8">
                  <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-20"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-orange-100 to-rose-100 rounded-full flex items-center justify-center shadow-inner border-4 border-white">
                    <Sunset size={48} className="text-orange-500 drop-shadow-sm" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-white px-3 py-1 rounded-full shadow-md border border-orange-100 transform rotate-12">
                    <span className="text-[11px] font-black text-rose-500 flex items-center gap-1 tracking-widest"><CheckCircle2 size={12}/> 高成團率</span>
                  </div>
                </div>

                <h3 className="text-3xl font-black text-indigo-900 mb-4 tracking-widest">這天想下水嗎？</h3>
                
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-orange-100/50 shadow-sm mb-8 relative">
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-orange-300"><MermaidTailIcon size={24}/></div>
                   <p className="text-indigo-900/70 font-bold leading-relaxed mt-2 text-[15px]">
                     不管是 <span className="text-indigo-600 font-black">PADI 證照課程</span>、<span className="text-teal-600 font-black">教練團練</span>，<br/>
                     或是好玩的 <span className="text-rose-600 font-black">國內外潛旅</span>，<br/>
                     只要告訴我們需求，都能幫您湊班開團！
                   </p>
                </div>

                <button onClick={() => setStep('wishlist_form')} className="w-full py-4 bg-gradient-to-r from-orange-400 via-rose-500 to-orange-500 text-white rounded-2xl font-black text-lg transition-all shadow-[0_8px_25px_rgb(249,115,22,-0.3)] hover:shadow-[0_10px_30px_rgb(249,115,22,-0.4)] hover:-translate-y-1 flex items-center justify-center gap-2 group">
                  <Sparkles size={22} className="group-hover:animate-spin" />
                  填寫許願單
                  <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- 報名表單 ---
  const handleApplyDiscount = () => {
    if (!discountState.code) return;
    if (selectedSession.discountCode && discountState.code === selectedSession.discountCode) {
      setDiscountState(prev => ({ ...prev, applied: true, amount: selectedSession.discountAmount || 0, error: '' }));
    } else {
      setDiscountState(prev => ({ ...prev, applied: false, amount: 0, error: '折扣碼無效或不適用此梯次' }));
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (!isAgreed) return alert("請閱讀並勾選同意課程與團練規範");

    const currentRegs = selectedSession.totalSpots - selectedSession.spots;
    const minSpots = selectedSession.minSpots || 1;
    const willBeGrouped = (currentRegs + 1) >= minSpots;

    const pMethod = willBeGrouped ? formData.paymentMethod : 'wait_group';
    const pProof = willBeGrouped ? (fd.get('paymentProof') || '') : '';
    const regStatus = willBeGrouped ? 'pending' : 'pending_group';
    const finalAmount = Math.max(0, selectedSession.price - discountState.amount);

    const newReg = {
      id: 'reg_' + Date.now(),
      activityId: selectedSession.id,
      date: selectedDate,
      name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email'),
      certifications: fd.get('certifications'), maxDepth: fd.get('maxDepth'), apneaStat: fd.get('apneaStat'),
      recentDiveDate: fd.get('recentDiveDate') || '無', recentDiveDepth: fd.get('recentDiveDepth') || '無',
      tailSize: formData.tailSize, paymentMethod: pMethod,
      paymentProof: pProof,
      agreeMediaUsage: fd.get('agreeMediaUsage') || 'yes',
      appliedDiscountCode: discountState.applied ? discountState.code : '',
      amount: finalAmount, status: regStatus, createdAt: new Date().toISOString()
    };

    const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'registrations', newReg.id);
    await setDoc(regRef, newReg);

    const actRef = doc(db, 'artifacts', appId, 'public', 'data', 'activities', selectedSession.id);
    await setDoc(actRef, { spots: Math.max(0, selectedSession.spots - 1) }, { merge: true });

    setStep('success');
  };

  const renderForm = () => {
    const enabledPayments = paymentMethods.filter(p => p.enabled);
    const currentPayment = enabledPayments.find(p => p.id === formData.paymentMethod) ? formData.paymentMethod : (enabledPayments[0]?.id || '');
    const selectedPaymentInfo = paymentMethods.find(p => p.id === currentPayment);

    const currentRegs = selectedSession.totalSpots - selectedSession.spots;
    const minSpots = selectedSession.minSpots || 1;
    const willBeGrouped = (currentRegs + 1) >= minSpots;
    const finalPrice = Math.max(0, selectedSession.price - discountState.amount);

    return (
      <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-100 overflow-hidden animate-in fade-in relative">
        <SunsetWave className="top-0 opacity-10 text-orange-500 rotate-180 pointer-events-none" />
        <div className="p-6 md:p-10 relative z-10">
          <button onClick={() => setStep('calendar')} className="flex items-center gap-2 text-indigo-900/60 hover:text-orange-600 mb-8 font-bold transition-colors"><ArrowLeft size={20}/> 返回重選梯次</button>
          
          <div className="bg-gradient-to-r from-orange-50 to-rose-50 p-6 rounded-2xl border border-orange-100 mb-10 flex flex-col md:flex-row justify-between gap-6 shadow-sm">
            <div className="flex-1">
              <h2 className="text-xl font-black text-indigo-900 mb-2">{selectedSession.title}</h2>
              <div className="text-sm text-indigo-900/70 space-y-1 font-medium">
                <p><Clock size={16} className="inline mr-2 text-orange-500"/>{selectedDate} | {selectedSession.time}</p>
                <p><MapPin size={16} className="inline mr-2 text-orange-500"/>{selectedSession.location}</p>
              </div>
            </div>
            
            <div className="md:text-right flex flex-col justify-center items-start md:items-end">
              <div className="flex items-center gap-2 mb-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-48">
                  <Tag size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${discountState.applied ? 'text-emerald-500' : 'text-orange-400'}`}/>
                  <input 
                    type="text" 
                    value={discountState.code} 
                    onChange={e => setDiscountState({...discountState, code: e.target.value.toUpperCase(), error: ''})} 
                    placeholder="輸入學生專屬折扣碼" 
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-orange-200 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 font-bold bg-white uppercase"
                    disabled={discountState.applied}
                  />
                </div>
                {!discountState.applied ? (
                  <button type="button" onClick={handleApplyDiscount} className="px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 rounded-lg text-sm font-black transition-colors shadow-sm">套用</button>
                ) : (
                  <button type="button" onClick={() => setDiscountState({code:'', applied:false, amount:0, error:''})} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm font-black transition-colors border border-rose-100">取消</button>
                )}
              </div>
              
              {discountState.error && <p className="text-rose-500 text-xs font-bold mb-2 animate-in fade-in">{discountState.error}</p>}
              {discountState.applied && <p className="text-emerald-600 text-sm font-black mb-2 flex items-center gap-1 animate-in fade-in"><CheckCircle2 size={14}/> 已折抵 NT$ {discountState.amount}</p>}

              <div className="text-sm text-indigo-900/60 font-bold mb-1 mt-2">應繳總額</div>
              <div className="text-3xl font-black text-rose-600 leading-none">NT$ {finalPrice.toLocaleString()}</div>
            </div>
          </div>

          <form className="space-y-12" onSubmit={handleBookingSubmit}>
            <section>
              <h3 className="text-2xl font-black text-indigo-900 mb-8 flex items-center gap-3 tracking-wide"><User className="text-orange-500" size={28}/> 1. 學員聯絡資訊</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-orange-50/30 p-8 rounded-[2rem] border border-orange-50 shadow-sm">
                <div><label className="block text-[15px] font-black text-indigo-900 mb-3 tracking-wide">真實姓名 *</label><input required name="name" type="text" className="w-full px-5 py-4 rounded-xl border border-orange-100 outline-none focus:ring-2 focus:ring-orange-400 bg-white shadow-sm font-bold text-base" placeholder="如：林小魚"/></div>
                <div><label className="block text-[15px] font-black text-indigo-900 mb-3 tracking-wide">聯絡電話 (供查詢用) *</label><input required name="phone" type="tel" className="w-full px-5 py-4 rounded-xl border border-orange-100 outline-none focus:ring-2 focus:ring-orange-400 bg-white shadow-sm font-bold text-base" placeholder="0912345678"/></div>
                <div className="md:col-span-2"><label className="block text-[15px] font-black text-indigo-900 mb-3 tracking-wide">電子郵件 *</label><input required name="email" type="email" className="w-full px-5 py-4 rounded-xl border border-orange-100 outline-none focus:ring-2 focus:ring-orange-400 bg-white shadow-sm font-bold text-base" placeholder="your@email.com"/></div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-black text-indigo-900 mb-8 flex items-center gap-3 tracking-wide"><Waves className="text-teal-500" size={28}/> 2. 程度與狀況評估 (供教練參考)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-teal-50/30 p-8 rounded-[2rem] border border-teal-100/50 shadow-sm">
                <div className="md:col-span-2">
                  <label className="block text-[15px] font-black text-indigo-900 mb-3 tracking-wide">目前持有自由潛水 / 人魚證照 *</label>
                  <select required name="certifications" className="w-full px-5 py-4 rounded-xl border border-teal-100 outline-none focus:ring-2 focus:ring-teal-400 bg-white shadow-sm font-bold text-indigo-900/80 text-base">
                    <option value="">請選擇您的證照級別</option>
                    <option value="無潛水經驗">無潛水經驗</option>
                    <option value="PADI 基礎人魚 (Basic Mermaid)">PADI 基礎人魚 (Basic Mermaid)</option>
                    <option value="PADI 人魚 (Mermaid)">PADI 人魚 (Mermaid)</option>
                    <option value="PADI 進階人魚 (Advanced Mermaid)">PADI 進階人魚 (Advanced Mermaid)</option>
                    <option value="AIDA 1 / AIDA 2">AIDA 1 / AIDA 2</option>
                    <option value="AIDA 3 以上">AIDA 3 以上</option>
                    <option value="其他系統證照">其他系統證照</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[15px] font-black text-indigo-900 mb-3 tracking-wide">自我評估：最大下潛深度 *</label>
                  <select required name="maxDepth" className="w-full px-5 py-4 rounded-xl border border-teal-100 outline-none focus:ring-2 focus:ring-teal-400 bg-white shadow-sm font-bold text-indigo-900/80 text-base">
                    <option value="">請選擇深度範圍</option>
                    <option value="0m (無經驗)">0m (無經驗)</option>
                    <option value="1 - 5m">1 - 5m</option>
                    <option value="6 - 10m">6 - 10m</option>
                    <option value="11 - 15m">11 - 15m</option>
                    <option value="16m 以上">16m 以上</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[15px] font-black text-indigo-900 mb-3 tracking-wide">自我評估：動態閉氣狀態 *</label>
                  <select required name="apneaStat" className="w-full px-5 py-4 rounded-xl border border-teal-100 outline-none focus:ring-2 focus:ring-teal-400 bg-white shadow-sm font-bold text-indigo-900/80 text-base">
                    <option value="">請選擇閉氣時間</option>
                    <option value="無經驗">無經驗</option>
                    <option value="30秒以內">30秒以內</option>
                    <option value="30秒 - 1分鐘">30秒 - 1分鐘</option>
                    <option value="1分鐘 - 2分鐘">1分鐘 - 2分鐘</option>
                    <option value="2分鐘以上">2分鐘以上</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[15px] font-black text-indigo-900 mb-3 tracking-wide">最近一次下水(自潛/人魚)日期 *</label>
                  <input required type="date" name="recentDiveDate" className="w-full px-5 py-4 rounded-xl border border-teal-100 outline-none focus:ring-2 focus:ring-teal-400 bg-white shadow-sm font-bold text-indigo-900/80 text-base" />
                </div>
                <div>
                  <label className="block text-[15px] font-black text-indigo-900 mb-3 tracking-wide">最近一次下水深度 *</label>
                  <input required type="text" name="recentDiveDepth" placeholder="如：5m, 10m 或 無" className="w-full px-5 py-4 rounded-xl border border-teal-100 outline-none focus:ring-2 focus:ring-teal-400 bg-white shadow-sm font-bold text-indigo-900/80 text-base" />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-black text-indigo-900 mb-8 flex items-center gap-3 tracking-wide"><MermaidTailIcon className="text-orange-500" size={28}/> 3. 裝備租借與尺寸</h3>
              <div className="bg-orange-50/30 p-8 rounded-[2rem] border border-orange-50 shadow-sm">
                <label className="block text-[15px] font-black text-indigo-900 mb-5 tracking-wide">人魚尾巴/服裝尺寸 (或選擇自備) *</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                  {['S', 'M', 'L', 'XL', '自備'].map(size => (
                    <button key={size} type="button" onClick={() => setFormData({...formData, tailSize: size})} className={`py-4 rounded-2xl font-black text-lg transition-all border-2 shadow-sm tracking-widest ${formData.tailSize === size ? (size === '自備' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-orange-500 bg-orange-50 text-orange-700 hover:-translate-y-1') : 'border-orange-100 text-indigo-900/50 hover:border-orange-300 bg-white hover:text-orange-600 hover:-translate-y-1'}`}>
                      {size}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="tailSize" value={formData.tailSize} />
              </div>
            </section>

            <section>
              <h3 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-2"><Receipt className="text-rose-500"/> 4. 繳款與確認</h3>
              {!willBeGrouped ? (
                <div className="bg-amber-50/80 p-8 rounded-3xl border border-amber-200 shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-3 text-amber-600 mb-4">
                    <Clock size={24} className="animate-pulse"/> 
                    <h4 className="font-black text-xl">待成團，成團後通知繳費</h4>
                  </div>
                  <p className="text-sm text-amber-900/80 font-bold leading-relaxed">
                    此活動最低成團人數為 <span className="font-black text-amber-900">{minSpots}</span> 人，目前尚缺 <span className="font-black text-rose-600">{minSpots - currentRegs}</span> 人。<br/><br/>
                    請放心先送出報名表單以保留您的名額。<span className="text-rose-600 bg-rose-50 px-2 py-1 rounded">待確定成團後，系統將會主動通知您</span>，屆時請至「查詢與繳費狀態」功能中完成繳費並回傳證明即可。
                  </p>
                  <input type="hidden" name="paymentMethod" value="wait_group" />
                </div>
              ) : (
                <div className="bg-rose-50/30 p-6 rounded-2xl border border-rose-100/50 space-y-6">
                  {currentRegs + 1 === minSpots && (
                     <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl font-black text-sm flex items-center gap-2 border border-emerald-200 shadow-sm">
                        <Sparkles size={18}/> 🎉 恭喜！加上您報名後即達成團條件，請直接選擇繳費方式保留名額。
                     </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-indigo-900 mb-4">選擇繳款方式 *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {enabledPayments.map(p => {
                        const Icon = PAYMENT_ICONS[p.id];
                        return (
                          <label key={p.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${currentPayment === p.id ? 'border-rose-400 bg-rose-50' : 'border-rose-100/50 bg-white hover:border-rose-300'}`}>
                            <input type="radio" name="paymentMethod" value={p.id} checked={currentPayment === p.id} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="hidden" />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${currentPayment === p.id ? 'border-rose-500' : 'border-gray-300'}`}>
                              {currentPayment === p.id && <div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div>}
                            </div>
                            {Icon && <Icon size={18} className={currentPayment === p.id ? 'text-rose-600' : 'text-indigo-900/40'}/>}
                            <span className={`font-bold text-sm ${currentPayment === p.id ? 'text-rose-700' : 'text-indigo-900/70'}`}>{p.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {selectedPaymentInfo && (
                    <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm animate-in fade-in">
                      <div className="text-sm text-indigo-900/80 leading-relaxed whitespace-pre-wrap mb-4 font-medium p-4 bg-orange-50/50 rounded-lg border border-orange-100/50">
                        {selectedPaymentInfo.instructions}
                      </div>
                      {selectedPaymentInfo.requiresProof && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t pt-6 border-orange-50">
                          <div>
                            <label className="block text-sm font-bold text-indigo-900 mb-2">匯款帳號後五碼 (可於報名後補傳)</label>
                            <input type="text" name="paymentProof" placeholder="例如：12345 (若尚未轉帳可留空)" className="w-full px-4 py-3 rounded-lg border border-orange-100 outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-orange-50/30 focus:bg-white font-bold"/>
                            <p className="text-xs text-orange-600 font-bold mt-2">※ 若目前不方便回傳，可先送出表單，之後再透過「查詢與繳費狀態」功能補傳。</p>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-indigo-900 mb-2">明細截圖上傳 (選填)</label>
                            <label className="flex items-center justify-center w-full px-4 py-3 rounded-lg border-2 border-dashed border-orange-200 bg-orange-50/30 hover:bg-orange-50 hover:border-orange-400 cursor-pointer text-sm text-indigo-900/60 transition-colors font-bold">
                              <ImageIcon size={18} className="mr-2 text-orange-400"/> 點此上傳對帳明細
                              <input type="file" className="hidden" accept="image/*" />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-2"><ImageIcon className="text-orange-500"/> 5. 肖像權同意授權</h3>
              <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-50">
                <label className="block text-sm font-bold text-indigo-900 mb-4">是否同意上課時所拍攝照片、影片，提供給官方作為行銷與花絮分享使用？ *</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-orange-100 bg-white cursor-pointer hover:border-orange-300 transition-colors has-[:checked]:border-orange-400 has-[:checked]:bg-orange-50">
                    <input required type="radio" name="agreeMediaUsage" value="yes" className="w-5 h-5 text-orange-500 focus:ring-orange-500" defaultChecked />
                    <span className="font-bold text-indigo-900">同意，樂意分享美照</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-orange-100 bg-white cursor-pointer hover:border-orange-300 transition-colors has-[:checked]:border-orange-400 has-[:checked]:bg-orange-50">
                    <input required type="radio" name="agreeMediaUsage" value="no" className="w-5 h-5 text-orange-500 focus:ring-orange-500" />
                    <span className="font-bold text-indigo-900">不同意，請保留個人隱私</span>
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-2"><ShieldCheck className="text-teal-600"/> 6. 課程及團練規範</h3>
              <div className="border border-teal-100/50 rounded-2xl overflow-hidden mb-6 shadow-sm">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-5 py-4 border-b border-teal-100/50 flex items-center gap-2 font-black text-teal-900">
                  <ShieldCheck size={20} className="text-teal-600"/> 報名須知 (請閱讀至底端)
                </div>
                <div 
                  ref={rulesRef}
                  onScroll={(e) => {
                    const { scrollTop, scrollHeight, clientHeight } = e.target;
                    if (scrollTop + clientHeight >= scrollHeight - 15) {
                      setIsRulesRead(true);
                    }
                  }}
                  className="p-6 bg-white h-56 overflow-y-auto text-sm text-indigo-900/70 whitespace-pre-wrap leading-relaxed custom-scrollbar font-medium"
                >
                  {rulesText}
                </div>
              </div>
              <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all shadow-sm ${isRulesRead ? 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/80 cursor-pointer' : 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-80'}`}>
                <input 
                  required 
                  name="agreeRules" 
                  type="checkbox" 
                  disabled={!isRulesRead} 
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="w-6 h-6 mt-0.5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed" 
                />
                <div className="flex flex-col">
                  <span className="text-base font-bold text-amber-900 leading-relaxed">我已詳細閱讀並同意《SeaFa 課程及團練規範》。</span>
                  {!isRulesRead && <span className="text-sm font-bold text-rose-500 mt-2">※ 請將上方規範滑動閱讀至最底，以啟用同意選項。</span>}
                </div>
              </label>
            </section>

            <div className="border-t border-orange-100 pt-8 flex justify-end">
              <button 
                type="submit" 
                disabled={!isAgreed}
                className={`w-full md:w-auto px-16 py-5 rounded-2xl font-black text-lg shadow-xl transition-all ${isAgreed ? 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white hover:scale-105' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                確認無誤，送出報名
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleQuery = (e) => {
    e.preventDefault();
    setSearchResults(registrations.filter(r => r.phone === searchPhone));
  };

  const handleApplyQueryDiscount = async (e, regId, act) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const code = fd.get('queryDiscountCode').toUpperCase();
    if (code === act.discountCode && act.discountCode) {
      const discountAmt = act.discountAmount || 0;
      const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'registrations', regId);
      await setDoc(regRef, { appliedDiscountCode: code, amount: Math.max(0, act.price - discountAmt) }, { merge: true });
      if (searchResults) {
         setSearchResults(prev => prev.map(r => r.id === regId ? { ...r, appliedDiscountCode: code, amount: Math.max(0, act.price - discountAmt) } : r));
      }
      alert('✅ 折扣碼套用成功！金額已更新。');
    } else {
      alert('❌ 折扣碼無效或不適用此梯次。');
    }
  };

  const renderQueryPage = () => {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500 relative">
        <div className="text-center mb-10 relative z-10"><h1 className="text-3xl font-black text-indigo-900 mb-4">查詢與繳費狀態</h1><p className="text-indigo-900/60 font-bold">請輸入您報名時留下的聯絡電話，以查詢活動梯次與繳費狀態。</p></div>
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-orange-100 p-8 mb-8 relative z-10">
          <form onSubmit={handleQuery} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input required type="tel" value={searchPhone} onChange={e => setSearchPhone(e.target.value)} placeholder="0912345678" className="flex-1 px-5 py-4 rounded-xl border-2 border-orange-100 outline-none focus:border-orange-400 font-bold text-lg text-indigo-900 transition-colors" />
            <button type="submit" className="px-8 py-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:from-orange-600 hover:to-rose-600 transition-colors text-lg shadow-md"><Search size={20} /> 查詢紀錄</button>
          </form>
        </div>
        {searchResults !== null && (
          <div className="space-y-6 relative z-10">
            <h3 className="text-xl font-black text-indigo-900 mb-6 border-l-4 border-orange-500 pl-4">查詢結果 ({searchResults.length} 筆)</h3>
            {searchResults.length === 0 ? (
              <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-dashed border-orange-200 text-orange-400 font-bold">
                找不到此號碼的紀錄，請確認號碼是否輸入正確。
              </div>
            ) : (
              searchResults.map(reg => {
                const act = getActivityById(reg.activityId, reg.date);
                const paymentObj = paymentMethods.find(p => p.id === reg.paymentMethod);
                const isWaitGroup = reg.paymentMethod === 'wait_group';
                const isMissingProof = !isWaitGroup && paymentObj?.requiresProof && !reg.paymentProof;
                
                const currentRegs = act ? (act.totalSpots - act.spots) : 0;
                const minSpots = act ? (act.minSpots || 1) : 1;
                const actIsGroupedNow = currentRegs >= minSpots;

                return (
                  <div key={reg.id} className="bg-white/90 backdrop-blur-sm p-8 sm:p-10 rounded-[2rem] border border-orange-100 shadow-sm flex flex-col md:flex-row justify-between gap-10 hover:shadow-lg transition-shadow">
                    <div className="flex-1">
                      <div className="flex gap-3 mb-6">
                        <span className={`px-4 py-2 text-sm font-black rounded-xl border tracking-widest shadow-sm ${
                          reg.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          reg.status === 'pending_group' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          狀態：{
                            reg.status === 'confirmed' ? '報名成功 / 已收款' : 
                            reg.status === 'pending_group' ? '待成團 (未繳費)' : '處理中 / 待對帳'
                          }
                        </span>
                      </div>
                      <h4 className="text-3xl font-black text-indigo-900 mb-4 leading-relaxed tracking-wide">{act ? act.title : '未知活動'}</h4>
                      <p className="text-indigo-900/60 font-bold flex items-center gap-3 text-lg"><Clock size={20} className="text-orange-500"/> {reg.date} | {act ? act.time : ''}</p>
                    </div>
                    <div className="bg-orange-50/50 p-8 rounded-3xl text-base min-w-[320px] border border-orange-100/50 flex flex-col justify-center shadow-sm">
                      <div className="space-y-5">
                        <div className="flex justify-between items-center"><span className="text-indigo-900/60 font-bold tracking-wider">學員姓名</span><span className="font-black text-indigo-900 text-lg">{reg.name}</span></div>
                        <div className="flex justify-between items-center">
                          <span className="text-indigo-900/60 font-bold tracking-wider">繳款方式</span>
                          <span className={`font-bold ${isWaitGroup ? 'text-indigo-600' : 'text-indigo-900'}`}>
                            {isWaitGroup ? '待成團後繳費' : (paymentObj ? paymentObj.name : '未知')}
                          </span>
                        </div>
                        <div className="flex justify-between items-end mt-4 pt-5 border-t-2 border-dashed border-orange-200/50">
                          <span className="text-indigo-900/60 font-bold tracking-wider mb-1">應付總額</span>
                          <div className="text-right">
                            {reg.appliedDiscountCode && <div className="text-emerald-600 text-sm font-black mb-1.5 flex items-center justify-end gap-1"><CheckCircle2 size={16}/> 已套用折扣: {reg.appliedDiscountCode}</div>}
                            <span className="font-black text-rose-600 text-3xl tracking-tight">NT$ {reg.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {!reg.appliedDiscountCode && reg.status !== 'confirmed' && act?.discountCode && (
                        <form onSubmit={(e) => handleApplyQueryDiscount(e, reg.id, act)} className="mt-4 flex gap-2">
                           <input required name="queryDiscountCode" type="text" placeholder="輸入學生專屬折扣碼" className="flex-1 px-3 py-2 rounded-xl border border-orange-200 outline-none text-sm font-bold focus:border-rose-400 bg-white shadow-inner uppercase" />
                           <button type="submit" className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-black rounded-xl text-sm transition-colors border border-rose-100 shadow-sm whitespace-nowrap">套用</button>
                        </form>
                      )}

                      {isWaitGroup && (
                         <div className="mt-5 pt-4 border-t border-amber-200">
                           {actIsGroupedNow ? (
                             <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 animate-in fade-in shadow-inner">
                               <h5 className="text-emerald-700 font-black mb-3 text-sm flex items-center gap-1.5"><Sparkles size={16}/> 活動已成團！請完成繳費</h5>
                               <form onSubmit={async (e) => {
                                  e.preventDefault();
                                  const fd = new FormData(e.target);
                                  const pm = fd.get('payMethod');
                                  const pf = fd.get('newProof') || '';
                                  const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'registrations', reg.id);
                                  await setDoc(regRef, { paymentMethod: pm, paymentProof: pf, status: 'pending' }, { merge: true });
                                  if (searchResults) {
                                     setSearchResults(prev => prev.map(r => r.id === reg.id ? { ...r, paymentMethod: pm, paymentProof: pf, status: 'pending' } : r));
                                  }
                                  alert('✅ 已成功更新繳費資訊，我們將盡快為您對帳！');
                               }} className="space-y-4">
                                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                                     {paymentMethods.filter(p=>p.enabled).map(p => (
                                        <label key={p.id} className="flex items-center gap-1.5 text-xs font-black text-emerald-900 cursor-pointer bg-white px-2.5 py-2 rounded-lg border border-emerald-100 shadow-sm hover:border-emerald-300 transition-colors">
                                           <input required type="radio" name="payMethod" value={p.id} className="text-emerald-500 focus:ring-emerald-500" />
                                           {p.name}
                                        </label>
                                     ))}
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-emerald-100/50">
                                     <input type="text" name="newProof" placeholder="若選匯款，請填帳號後五碼" className="flex-1 px-3 py-2.5 rounded-lg border border-emerald-200 outline-none text-xs font-bold focus:border-emerald-400 bg-white" />
                                     <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs shadow-sm transition-colors whitespace-nowrap">送出證明</button>
                                  </div>
                               </form>
                             </div>
                           ) : (
                             <div className="text-amber-600 text-xs font-black flex items-center gap-1.5">
                               <Clock size={14} /> 尚未成團，請耐心等候通知喔！(差 {minSpots - currentRegs} 人)
                             </div>
                           )}
                         </div>
                      )}
                      
                      {isMissingProof && (
                        <div className="mt-5 pt-4 border-t border-amber-200 animate-in fade-in">
                          {paymentObj?.instructions && (
                             <div className="mb-4 bg-white/80 p-4 rounded-xl border border-amber-100 text-xs text-indigo-900/70 leading-relaxed shadow-sm">
                               <div className="font-black text-orange-600 mb-2 flex items-center gap-1.5"><AlertCircle size={14}/> 匯款 / 繳費資訊：</div>
                               <div className="whitespace-pre-wrap font-bold">{paymentObj.instructions}</div>
                             </div>
                          )}

                          <div className="text-amber-600 text-xs font-black mb-3 flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            尚未回傳繳款證明，請盡速補傳！
                          </div>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.target);
                            updatePaymentProof(reg.id, fd.get('newProof'));
                          }} className="flex gap-2">
                            <input required name="newProof" type="text" placeholder="輸入帳號後五碼" className="flex-1 px-3 py-2.5 rounded-xl border border-amber-200 outline-none text-sm font-bold focus:border-amber-400 bg-white shadow-inner" />
                            <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-xl text-sm shadow-md hover:scale-105 transition-transform">送出</button>
                          </form>
                        </div>
                      )}

                      {!isWaitGroup && !isMissingProof && paymentObj?.requiresProof && (
                        <div className="mt-4 pt-4 border-t border-orange-200/50 flex justify-between items-center">
                          <span className="text-indigo-900/60 font-bold">繳款證明</span>
                          <span className="font-mono text-orange-600 font-black tracking-widest">{reg.paymentProof}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="max-w-2xl mx-auto text-center py-16 px-8 bg-white/90 backdrop-blur-md rounded-[3rem] shadow-xl border border-orange-100 relative overflow-hidden animate-in zoom-in-95 duration-500">
      <SunsetWave className="top-0 opacity-10 text-orange-500 rotate-180 pointer-events-none" />
      <div className="w-28 h-28 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10 shadow-inner">
        <CheckCircle2 size={56} className="text-emerald-500" />
      </div>
      <h2 className="text-4xl font-black text-indigo-900 mb-6 relative z-10">報名資料已送出！</h2>
      <p className="text-indigo-900/70 mb-10 text-base leading-relaxed font-bold max-w-md mx-auto relative z-10 bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
        我們已收到您的報名資訊。<br/><br/>
        <span className="text-amber-600 font-black">【重要提醒】</span><br/>
        若您尚未回傳繳款證明，或活動<span className="text-indigo-600">目前尚未成團</span>，請隨時留意通知，並透過「查詢與繳費狀態」功能查看進度與補傳證明喔！<br/><br/>
        待小幫手核對款項後，您的狀態將會更新為「已確認收款」。
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
        <button onClick={() => setStep('query_page')} className="px-10 py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl font-black transition-all shadow-lg hover:scale-105">
          前往查詢與繳費狀態
        </button>
        <button onClick={() => setStep('calendar')} className="px-10 py-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-2xl font-black transition-all border border-orange-200">
          返回月曆首頁
        </button>
      </div>
    </div>
  );

  const renderWishlistSuccess = () => (
    <div className="max-w-2xl mx-auto text-center py-20 px-8 bg-white/90 backdrop-blur-md rounded-[3rem] shadow-xl border border-amber-100 relative overflow-hidden animate-in zoom-in-95 duration-500">
      <SunsetWave className="top-0 opacity-10 text-amber-500 rotate-180 pointer-events-none" />
      <div className="w-28 h-28 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10 shadow-inner">
        <Sparkles size={56} className="text-amber-500" />
      </div>
      <h2 className="text-4xl font-black text-amber-900 mb-6 relative z-10">許願成功！</h2>
      <p className="text-amber-900/70 mb-12 text-lg leading-relaxed font-bold max-w-md mx-auto relative z-10">
        我們已經收到您的許願。<br/>小幫手會盡快為您安排教練與湊團，並透過您留下的聯絡方式通知您後續結果。
      </p>
      <button onClick={() => setStep('calendar')} className="px-12 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl font-black transition-all shadow-lg hover:scale-105 relative z-10">
        返回首頁繼續探索
      </button>
    </div>
  );

  const renderWishlistForm = () => {
    const handleWishSubmit = async (e) => {
      e.preventDefault();
      const newWish = { ...wishlistData, id: 'wish_' + Date.now(), status: 'pending', createdAt: new Date().toISOString() };
      const wishRef = doc(db, 'artifacts', appId, 'public', 'data', 'wishlists', newWish.id);
      await setDoc(wishRef, newWish);
      setStep('wishlist_success');
    };

    return (
      <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border border-amber-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        <SunsetWave className="top-0 opacity-10 text-amber-500 rotate-180 pointer-events-none" />
        <div className="p-8 md:p-10 relative z-10">
          <button onClick={() => setStep('calendar')} className="flex items-center gap-2 text-amber-900/50 hover:text-amber-600 mb-8 font-black transition-colors"><ArrowLeft size={20} /> 返回月曆</button>
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Sparkles size={40} className="text-amber-500" /></div>
            <h2 className="text-4xl font-black text-amber-900 mb-3 tracking-wider">許願開團池</h2>
            <p className="text-amber-900/60 font-bold text-lg">許願日期：<span className="font-black text-amber-600 mx-1">{selectedDate?.replace(/-/g, '/')}</span><br/>留下您的需求，湊齊人數我們馬上通知您！</p>
          </div>

          <form className="space-y-8" onSubmit={handleWishSubmit}>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-3xl border border-amber-100 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-black text-amber-900 mb-3">想許願的活動類型 *</label>
                <select required value={wishlistData.wishType} onChange={(e) => setWishlistData({...wishlistData, wishType: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold text-amber-900/80 shadow-sm">
                  <option value="course">PADI 證照課程</option><option value="experience">基礎人魚體驗</option><option value="practice">教練帶領團練</option><option value="trip">國內外潛水旅遊 (潛旅)</option><option value="photo">水下攝影拍攝</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-black text-amber-900 mb-3">希望的地點或課程名稱？</label>
                <input type="text" value={wishlistData.wishContent} onChange={(e) => setWishlistData({...wishlistData, wishContent: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-amber-900/80 shadow-sm" placeholder="例如：想去薄荷島潛旅，或是想上 PADI 基礎人魚" />
              </div>
              <div>
                <label className="block text-sm font-black text-amber-900 mb-3">偏好時段</label>
                <div className="grid grid-cols-3 gap-4">
                  {[{ id: 'morning', label: '上午' }, { id: 'afternoon', label: '下午' }, { id: 'anytime', label: '皆可/多天' }].map(time => (
                    <div key={time.id} onClick={() => setWishlistData({...wishlistData, wishTime: time.id})} className={`text-center py-3 px-4 rounded-xl border-2 cursor-pointer transition-all font-black ${wishlistData.wishTime === time.id ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-amber-900/60 border-amber-100 hover:border-amber-300'}`}>
                      {time.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-2 border-l-4 border-amber-400 pl-4">您的聯絡資訊</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-orange-50/30 p-8 rounded-3xl border border-orange-100/50">
                <div className="md:col-span-2">
                  <label className="block text-sm font-black text-indigo-900 mb-2">您的稱呼 / 暱稱 (將顯示於開團卡片) *</label>
                  <input required type="text" value={wishlistData.nickname} onChange={(e) => setWishlistData({...wishlistData, nickname: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-orange-100 outline-none focus:ring-2 focus:ring-amber-400 font-bold" placeholder="如：美美" />
                </div>
                <div><label className="block text-sm font-black text-indigo-900 mb-2">真實姓名 (僅供核對) *</label><input required type="text" value={wishlistData.name} onChange={(e) => setWishlistData({...wishlistData, name: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-orange-100 outline-none focus:ring-2 focus:ring-amber-400 font-bold" placeholder="如：林小魚" /></div>
                <div><label className="block text-sm font-black text-indigo-900 mb-2">聯絡電話 *</label><input required type="tel" value={wishlistData.phone} onChange={(e) => setWishlistData({...wishlistData, phone: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-orange-100 outline-none focus:ring-2 focus:ring-amber-400 font-bold" placeholder="0912-345-678" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-black text-indigo-900 mb-2">Line ID / Email *</label><input required type="text" value={wishlistData.email} onChange={(e) => setWishlistData({...wishlistData, email: e.target.value})} className="w-full px-5 py-4 rounded-xl border border-orange-100 outline-none focus:ring-2 focus:ring-amber-400 font-bold" placeholder="方便我們聯絡您開團結果" /></div>
              </div>
            </div>

            <div className="border-t border-orange-100 pt-8 mt-8 flex justify-end">
              <button type="submit" className="w-full md:w-auto px-16 py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-2xl font-black text-xl shadow-[0_8px_25px_rgb(245,158,11,-0.3)] transition-all hover:scale-105">送出許願單</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderCoursesPage = () => (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-indigo-900 mb-6 tracking-widest flex items-center justify-center gap-4">
          <MermaidTailIcon size={40} className="text-orange-500"/> 人魚課程與體驗
        </h1>
        <p className="text-indigo-900/60 max-w-2xl mx-auto text-lg leading-relaxed font-bold">採用世界頂尖 PADI 教學系統，從零開始，探索水下最優雅的運動。我們同時也提供輕鬆的無證照體驗活動。</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {courseList.map(course => (
          <div key={course.id} className="bg-white/90 backdrop-blur-sm rounded-[2.5rem] shadow-lg border border-orange-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col">
            <div className="h-56 bg-gradient-to-br from-orange-200 via-rose-100 to-teal-100 relative flex items-center justify-center overflow-hidden">
              <Waves size={120} className="text-white absolute -bottom-4 w-full opacity-50 group-hover:scale-110 transition-transform duration-1000" />
              {course.system && (<div className="absolute top-6 right-6 px-5 py-2 bg-white/90 backdrop-blur-md text-indigo-900 text-xs font-black tracking-widest rounded-full shadow-md uppercase">{course.system} SYSTEM</div>)}
            </div>
            <div className="p-10 flex-1 flex flex-col">
              <h3 className="text-3xl font-black text-indigo-900 mb-4">{course.name}</h3>
              <p className="text-indigo-900/60 mb-8 flex-1 text-base leading-relaxed font-bold">{course.desc}</p>
              
              <div className="space-y-5 bg-orange-50/50 p-6 rounded-3xl text-sm border border-orange-50 mb-8">
                <div className="flex items-start gap-4">
                  <Clock size={20} className="text-orange-500 shrink-0 mt-0.5" />
                  <div><span className="font-black text-indigo-900 block mb-1">課程天數</span><span className="text-indigo-900/70 font-bold">{course.days || '請洽詢'}</span></div>
                </div>
                <div className="flex items-start gap-4">
                  <Info size={20} className="text-orange-500 shrink-0 mt-0.5" />
                  <div><span className="font-black text-indigo-900 block mb-1">報名要求 / 先決條件</span><span className="text-indigo-900/70 leading-relaxed font-bold">{course.prerequisites || '無特殊限制'}</span></div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 size={20} className="text-orange-500 shrink-0 mt-0.5" />
                  <div><span className="font-black text-indigo-900 block mb-1">費用包含項目</span><span className="text-indigo-900/70 leading-relaxed font-bold">{course.includes || '依行前通知為主'}</span></div>
                </div>
                <div className="flex items-start gap-4">
                  <BookOpen size={20} className="text-orange-500 shrink-0 mt-0.5" />
                  <div><span className="font-black text-indigo-900 block mb-1">課程大綱內容</span><span className="text-indigo-900/70 leading-relaxed font-bold">{course.content || '詳細內容請參考報名頁面'}</span></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-8 border-t border-orange-100 mt-auto">
                <div className="text-4xl font-black text-rose-600">NT$ {course.price ? course.price.toLocaleString() : '---'}</div>
                <button onClick={() => setStep('calendar')} className="px-8 py-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-2xl hover:from-orange-600 hover:to-rose-600 transition-colors font-black shadow-md hover:shadow-xl hover:-translate-y-1">查看開課日期</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCoachesPage = () => (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-indigo-900 mb-6 tracking-widest flex items-center justify-center gap-4">
          <UsersRound size={40} className="text-orange-500"/> 專業教練團隊
        </h1>
        <p className="text-indigo-900/60 max-w-2xl mx-auto text-lg leading-relaxed font-bold">嚴選 PADI 認證專業師資，陪伴您安全、優雅地下潛，為您記錄最動人的水下時刻。</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {coachList.map(coach => (
          <div key={coach.id} className="bg-white/90 backdrop-blur-sm rounded-[2.5rem] shadow-lg border border-orange-100 text-center hover:shadow-2xl transition-all group overflow-hidden">
            <div className="pt-10 pb-6 bg-gradient-to-b from-orange-50/80 to-white/0">
              <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-md border-4 border-orange-50 group-hover:scale-110 transition-transform duration-500">
                <User size={56} className="text-orange-300" />
              </div>
            </div>
            <div className="p-8 pt-0">
              <h3 className="text-2xl font-black text-indigo-900 mb-2">{coach.name}</h3>
              <div className="flex justify-center gap-1 mb-6 text-amber-400">
                <Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/>
              </div>
              <p className="text-sm text-indigo-900/70 bg-orange-50/50 p-6 rounded-3xl leading-relaxed font-bold h-32 flex items-center justify-center border border-orange-50">{coach.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLocationsPage = () => {
    const grouped = locationList.reduce((acc, loc) => { 
      acc[loc.region || '其他'] = [...(acc[loc.region || '其他'] || []), loc]; 
      return acc; 
    }, {});

    return (
      <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-indigo-900 mb-6 tracking-widest flex items-center justify-center gap-4">
            <MapPin size={40} className="text-orange-500"/> 精選開團地點
          </h1>
          <p className="text-indigo-900/60 max-w-2xl mx-auto text-lg leading-relaxed font-bold">我們嚴選全台最適合人魚與自潛的優質海域與深水池。以下為各潛點環境簡介與場地費參考。</p>
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-[3rem] shadow-xl border border-orange-100 overflow-hidden">
          {Object.entries(grouped).map(([region, locs], regionIndex, arr) => (
            <div key={region} className={`${regionIndex !== arr.length - 1 ? 'border-b-[12px] border-orange-50/50' : ''}`}>
              <div className="bg-gradient-to-r from-orange-50 to-white/0 px-8 sm:px-10 py-6 border-b border-orange-100/50">
                <h2 className="text-2xl font-black text-indigo-900 flex items-center gap-3">
                  <MapPin className="text-orange-500" size={28} />
                  {region}
                </h2>
              </div>
              
              <div className="flex flex-col divide-y divide-orange-50">
                {locs.map(loc => (
                  <div key={loc.id} className="px-8 sm:px-10 py-8 hover:bg-orange-50/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-8 group">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-3xl font-black text-indigo-900 group-hover:text-orange-600 transition-colors">{loc.name}</h3>
                        {loc.includesTicket && (
                          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-black tracking-widest rounded-lg flex items-center gap-1 border border-indigo-100 uppercase">
                            <Ticket size={14} /> 含門票
                          </span>
                        )}
                      </div>
                      <p className="text-base text-indigo-900/60 leading-relaxed font-bold max-w-3xl mb-4">{loc.desc}</p>
                      {loc.availableTimes && (
                        <div className="mt-4 bg-white/60 p-4 sm:p-5 rounded-2xl border border-orange-100/50 shadow-sm w-fit min-w-[280px]">
                          <div className="flex items-center gap-2 text-orange-600 text-sm font-black mb-3 border-b border-orange-100/50 pb-2">
                            <Clock size={16} /> 可以預約時間
                          </div>
                          <div className="flex flex-col gap-2.5">
                            {loc.availableTimes.split('\n').map((line, i) => (
                              <div key={i} className="flex flex-wrap items-center gap-2 text-sm font-bold text-indigo-900/80">
                                {line.split(' ').map((part, j) => {
                                  if (!part) return null;
                                  if (/[0-9]{1,2}:[0-9]{2}/.test(part) && part.includes('-')) {
                                    return <span key={j} className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg border border-orange-200 tracking-wide text-xs shadow-sm">{part}</span>;
                                  }
                                  return <span key={j} className="py-1">{part}</span>;
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-row gap-8 shrink-0 bg-white border border-orange-100 shadow-sm p-6 rounded-3xl items-center w-full lg:w-auto justify-between lg:justify-start">
                      <div className="flex flex-col">
                        <span className="text-xs text-indigo-900/40 font-bold mb-1 tracking-widest uppercase">一般收費</span>
                        <span className="text-xl font-bold text-indigo-900">NT$ {loc.regularPrice || 0}</span>
                      </div>
                      <div className="w-px h-12 bg-orange-100"></div>
                      <div className="flex flex-col">
                        <span className="text-xs text-rose-600 font-bold mb-1 tracking-widest uppercase">學員優惠</span>
                        <span className="text-xl font-black text-rose-600">NT$ {loc.studentPrice || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- 後台管理 (登入、儀表板與各子頁) ---
  const handleLogin = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const un = fd.get('username');
    const pw = fd.get('password');
    const user = users.find(u => u.username === un && u.password === pw);
    if (user) {
      setCurrentUser(user);
      setStep('admin_dashboard');
      setActiveAdminTab('activities');
    } else {
      alert('❌ 帳號或密碼錯誤，請重新輸入！');
    }
  };

  const renderAdminLogin = () => (
    <div className="max-w-md mx-auto mt-10 bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-orange-100 overflow-hidden animate-in fade-in zoom-in-95 relative">
      <SunsetWave className="top-0 opacity-10 text-orange-500 rotate-180 pointer-events-none" />
      <div className="p-10 relative z-10">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-indigo-500">
          <Lock size={40} />
        </div>
        <h2 className="text-3xl font-black text-center text-indigo-900 mb-2">系統管理後台</h2>
        <p className="text-center text-indigo-900/50 font-bold mb-8 text-sm">請輸入您的教練或管理員帳號密碼</p>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-black text-indigo-900 mb-2">登入帳號</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" />
              <input required name="username" type="text" className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-indigo-100 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-indigo-50/30 focus:bg-white font-bold transition-all text-indigo-900" placeholder="輸入帳號 (預設: admin)" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-black text-indigo-900 mb-2">登入密碼</label>
            <div className="relative">
              <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" />
              <input required name="password" type="password" className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-indigo-100 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-indigo-50/30 focus:bg-white font-bold transition-all text-indigo-900" placeholder="輸入密碼 (預設: admin)" />
            </div>
          </div>
          <button type="submit" className="w-full py-4 mt-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2">
            登入系統 <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );

  const renderAdminUsersTab = () => {
    const handleUserSubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const updatedUser = {
        id: userManageModal.mode === 'add' ? 'u_' + Date.now() : userManageModal.item.id,
        username: fd.get('username'),
        password: userManageModal.mode === 'add' ? fd.get('password') : (fd.get('password') || userManageModal.item.password),
        role: fd.get('role'),
        name: fd.get('name')
      };
      
      if (userManageModal.mode === 'add' && users.some(u => u.username === updatedUser.username)) {
        return alert('❌ 帳號名稱已存在，請更換！');
      }

      const newList = userManageModal.mode === 'add' ? [...users, updatedUser] : users.map(u => u.id === updatedUser.id ? updatedUser : u);
      await saveSettings({ users: newList });
      
      if (currentUser.id === updatedUser.id) setCurrentUser(updatedUser);
      setUserManageModal({ isOpen: false, mode: 'add', item: null });
      alert('✅ 帳號權限已成功更新！');
    };

    const handleDeleteUser = async (id) => {
      if (id === currentUser.id) return alert('❌ 無法刪除自己目前的登入帳號！');
      if (window.confirm('確定要刪除此帳號嗎？此操作無法復原。')) {
        const newList = users.filter(u => u.id !== id);
        await saveSettings({ users: newList });
      }
    };

    return (
      <div className="animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h3 className="text-2xl font-black text-indigo-900 flex items-center gap-3"><UserCog className="text-teal-500" size={28}/> 帳號與權限管理</h3>
          <button onClick={() => setUserManageModal({ isOpen: true, mode: 'add', item: null })} className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 text-sm shadow-md transition-colors"><Plus size={18} /> 新增後台帳號</button>
        </div>
        
        <div className="bg-teal-50/50 p-5 rounded-2xl border border-teal-100 mb-8 flex items-start gap-3 shadow-sm">
           <AlertCircle className="text-teal-600 shrink-0 mt-0.5" size={18} />
           <div className="text-sm text-teal-800 font-bold leading-relaxed">
             <span className="font-black">權限說明：</span><br/>
             1. <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">系統管理員 (Super Admin)</span>：擁有所有功能操作權限，包含修改首頁設定、管理其他教練帳號。<br/>
             2. <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">一般教練 (Coach)</span>：僅能管理「活動排程」、「報名清單」與「許願池」，無法更改系統與帳號設定。
           </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-orange-100 shadow-sm">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-orange-50/50 text-indigo-900/60 text-xs tracking-widest uppercase">
                <th className="py-5 px-6 font-black w-1/3">使用者姓名 (教練)</th>
                <th className="py-5 px-6 font-black">登入帳號</th>
                <th className="py-5 px-6 font-black">權限身分</th>
                <th className="py-5 px-6 font-black text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50 bg-white">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="py-5 px-6 font-black text-indigo-900 text-lg flex items-center gap-2">
                    {u.name}
                    {u.id === currentUser.id && <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-md border border-rose-200">自己</span>}
                  </td>
                  <td className="py-5 px-6 font-bold text-indigo-900/60 font-mono">{u.username}</td>
                  <td className="py-5 px-6">
                    {u.role === 'superadmin' ? 
                      <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-black shadow-sm flex items-center w-max gap-1.5"><Shield size={14}/> 系統管理員</span> : 
                      <span className="bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg text-xs font-black shadow-sm flex items-center w-max gap-1.5"><User size={14}/> 一般教練</span>
                    }
                  </td>
                  <td className="py-5 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setUserManageModal({ isOpen: true, mode: 'edit', item: u })} title="編輯帳號" className="p-2.5 bg-orange-50 text-indigo-900/50 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors"><Pencil size={18} /></button>
                      <button onClick={() => handleDeleteUser(u.id)} disabled={u.id === currentUser.id} title={u.id === currentUser.id ? "無法刪除自己" : "刪除帳號"} className={`p-2.5 rounded-full transition-colors ${u.id === currentUser.id ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100'}`}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 使用者編輯 Modal */}
        {userManageModal.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-indigo-950/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg my-8 overflow-hidden animate-in zoom-in-95 duration-200 relative">
              <div className="flex justify-between items-center p-6 border-b border-teal-100/50 bg-gradient-to-r from-teal-500 to-emerald-500 text-white relative z-10">
                <h3 className="text-2xl font-black flex items-center gap-2"><UserCog size={24}/> {userManageModal.mode === 'add' ? '新增後台帳號' : '編輯帳號權限'}</h3>
                <button type="button" onClick={() => setUserManageModal({ isOpen: false, mode: 'add', item: null })} className="text-white/70 hover:text-white p-2 rounded-xl transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleUserSubmit} className="p-8 space-y-6 relative z-10">
                <div><label className="block text-sm font-black text-indigo-900 mb-2">使用者姓名 / 教練稱呼 *</label><input required type="text" name="name" defaultValue={userManageModal.item?.name} className="w-full px-5 py-3.5 rounded-xl bg-teal-50/30 border-2 border-transparent outline-none focus:border-teal-400 focus:bg-white font-bold transition-colors text-indigo-900" placeholder="如：Ken 教練" /></div>
                <div><label className="block text-sm font-black text-indigo-900 mb-2">登入帳號 (Username) *</label><input required type="text" name="username" defaultValue={userManageModal.item?.username} disabled={userManageModal.mode === 'edit'} className="w-full px-5 py-3.5 rounded-xl bg-teal-50/30 border-2 border-transparent outline-none focus:border-teal-400 focus:bg-white font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-mono text-indigo-900" placeholder="限英文數字組合" /></div>
                <div>
                  <label className="block text-sm font-black text-indigo-900 mb-2">{userManageModal.mode === 'edit' ? '重設密碼 (若不更改請留空)' : '登入密碼 *'}</label>
                  <input required={userManageModal.mode === 'add'} type="password" name="password" className="w-full px-5 py-3.5 rounded-xl bg-teal-50/30 border-2 border-transparent outline-none focus:border-teal-400 focus:bg-white font-bold transition-colors text-indigo-900" placeholder={userManageModal.mode === 'edit' ? "留空代表不修改密碼" : "設定高強度密碼"} />
                </div>
                <div>
                  <label className="block text-sm font-black text-indigo-900 mb-2">系統操作權限 *</label>
                  <select required name="role" defaultValue={userManageModal.item?.role || 'coach'} className="w-full px-5 py-3.5 rounded-xl bg-teal-50/30 border-2 border-transparent outline-none focus:border-teal-400 focus:bg-white font-bold transition-colors text-indigo-900">
                    <option value="coach">一般教練 (管排程/報名/許願)</option>
                    <option value="superadmin">系統管理員 (擁全權限)</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-teal-50">
                  <button type="button" onClick={() => setUserManageModal({ isOpen: false, mode: 'add', item: null })} className="px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-black hover:bg-slate-200 transition-colors">取消</button>
                  <button type="submit" className="px-8 py-3.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-black shadow-lg transition-colors">確認儲存</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAdminDashboard = () => {
    if (!currentUser) return null; // 未登入安全阻擋
    const isSuper = currentUser.role === 'superadmin';

    return (
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 animate-in fade-in relative z-10">
        <div className="w-full md:w-64 bg-white/95 backdrop-blur-md p-6 rounded-[2rem] border border-orange-100 shadow-lg h-fit shrink-0">
          <div className="flex justify-between items-center mb-6 px-1">
             <h2 className="text-xl font-black text-indigo-900 flex items-center gap-3"><Settings size={24} className="text-orange-500"/> 控制台</h2>
          </div>
          
          <div className="bg-indigo-50/60 p-4 rounded-xl mb-6 border border-indigo-100/50 flex items-center gap-3 shadow-sm">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isSuper ? 'bg-indigo-200 text-indigo-700' : 'bg-orange-200 text-orange-700'}`}>
                {isSuper ? <Shield size={20}/> : <User size={20}/>}
             </div>
             <div className="overflow-hidden">
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1.5">{isSuper ? '系統管理員' : '一般教練'}</div>
                <div className="text-sm font-black text-indigo-900 truncate">{currentUser.name}</div>
             </div>
          </div>

          <div className="space-y-2">
            <button onClick={() => setActiveAdminTab('activities')} className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeAdminTab==='activities'?'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md':'text-indigo-900/60 hover:bg-orange-50 hover:text-orange-600'}`}>排程管理</button>
            <button onClick={() => setActiveAdminTab('registrations')} className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeAdminTab==='registrations'?'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md':'text-indigo-900/60 hover:bg-orange-50 hover:text-orange-600'}`}>報名清單管理</button>
            <button onClick={() => setActiveAdminTab('wishlists')} className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeAdminTab==='wishlists'?'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md':'text-indigo-900/60 hover:bg-amber-50 hover:text-amber-600'}`}>許願池清單</button>
            
            {isSuper && (
              <>
                <button onClick={() => setActiveAdminTab('info')} className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeAdminTab==='info'?'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md':'text-indigo-900/60 hover:bg-indigo-50 hover:text-indigo-700'}`}>基本資訊與設定</button>
                <button onClick={() => setActiveAdminTab('users')} className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeAdminTab==='users'?'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md':'text-indigo-900/60 hover:bg-teal-50 hover:text-teal-700'}`}>帳號與權限管理</button>
              </>
            )}
          </div>
          <div className="mt-8 pt-6 border-t border-orange-100 space-y-3">
            <button onClick={() => { setCurrentUser(null); setStep('calendar'); }} className="w-full py-3.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-black hover:bg-rose-100 transition-colors flex justify-center items-center gap-2 shadow-sm"><LogOut size={16}/> 登出系統</button>
            <button onClick={() => setStep('calendar')} className="w-full py-3.5 bg-slate-50 text-slate-500 rounded-xl text-sm font-black hover:bg-slate-100 transition-colors flex justify-center items-center gap-2"><ArrowLeft size={16}/> 返回前台</button>
          </div>
        </div>

        <div className="flex-1 bg-white/95 backdrop-blur-md p-8 md:p-10 rounded-[2.5rem] border border-orange-100 shadow-lg min-h-[700px] overflow-hidden">
          {activeAdminTab === 'activities' && renderActivitiesTab()}
          {activeAdminTab === 'registrations' && renderRegistrationsTab()}
          {activeAdminTab === 'wishlists' && renderWishlistsTab()}
          {isSuper && activeAdminTab === 'users' && renderAdminUsersTab()}
          {isSuper && activeAdminTab === 'info' && (
            <div>
              <div className="flex gap-8 border-b-2 border-orange-100 mb-8 overflow-x-auto custom-scrollbar pb-1">
                {['courses', 'coaches', 'locations', 'rules', 'payments', 'homepage'].map(tab => {
                  const labels = { courses: '課程管理', coaches: '教練管理', locations: '地點管理', rules: '規範設定', payments: '繳款設定', homepage: '首頁設定' };
                  return (
                    <button key={tab} onClick={() => setActiveInfoTab(tab)} className={`pb-4 font-black text-base whitespace-nowrap transition-colors relative ${activeInfoTab===tab ? 'text-indigo-600' : 'text-indigo-900/40 hover:text-indigo-900/70'}`}>
                      {labels[tab]}
                      {activeInfoTab===tab && <div className="absolute bottom-[-2px] left-0 w-full h-1 bg-indigo-600 rounded-t-full"></div>}
                    </button>
                  )
                })}
              </div>
              {activeInfoTab === 'rules' && renderRulesAdmin()}
              {activeInfoTab === 'payments' && renderPaymentsAdmin()}
              {activeInfoTab === 'homepage' && renderHomepageAdmin()}
              {['courses', 'coaches', 'locations'].includes(activeInfoTab) && renderInfoList()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActivitiesTab = () => {
    const allActivities = Object.entries(activities).flatMap(([date, acts]) => acts.map(act => ({ ...act, date }))).sort((a, b) => new Date(a.date) - new Date(b.date));
    return (
      <div className="animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h3 className="text-2xl font-black text-indigo-900 flex items-center gap-3"><CalendarDays className="text-orange-500" size={28}/> 活動排程管理</h3>
          <button onClick={() => { setEditingActivity(null); setActivityFormType('course'); setTimeInput(''); setStep('admin_add'); }} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl font-bold flex items-center gap-2 text-sm shadow-md transition-colors"><Plus size={18} /> 新增排程</button>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-orange-100 shadow-sm">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-orange-50/50 text-indigo-900/60 text-xs tracking-widest uppercase">
                <th className="py-5 px-6 font-black">日期 / 時間</th>
                <th className="py-5 px-6 font-black w-1/3">活動名稱</th>
                <th className="py-5 px-6 font-black">教練</th>
                <th className="py-5 px-6 font-black">名額與折扣</th>
                <th className="py-5 px-6 font-black text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50 bg-white">
              {allActivities.map((act) => {
                const isUnavailable = act.type === 'unavailable';
                const currentRegs = isUnavailable ? 0 : act.totalSpots - act.spots;
                return (
                  <tr key={act.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="py-5 px-6">
                      <div className="font-black text-indigo-900 text-base">{act.date}</div>
                      <div className="text-sm text-indigo-900/60 font-bold mt-1">{act.time}</div>
                    </td>
                    <td className="py-5 px-6">
                      <div className={`font-black text-lg flex items-center gap-2 ${isUnavailable ? 'text-slate-500 line-through decoration-slate-300' : 'text-indigo-900'}`}>
                        {act.title}
                        {act.initiator && !isUnavailable && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded tracking-widest border border-amber-200">許願人:{act.initiator}</span>}
                      </div>
                      <div className="mt-2"><Badge type={act.type} /></div>
                    </td>
                    <td className={`py-5 px-6 font-bold ${isUnavailable ? 'text-slate-400' : 'text-indigo-900/70'}`}>{act.instructor}</td>
                    <td className="py-5 px-6">
                      {isUnavailable ? (
                        <span className="text-slate-400 font-bold">-</span>
                      ) : (
                        <>
                          <div className="font-black text-indigo-900 text-sm">已報：<span className="text-orange-600 text-base">{currentRegs}</span> 人</div>
                          <div className="text-indigo-900/50 font-bold text-xs mt-1 bg-orange-50 inline-block px-2 py-0.5 rounded mb-1">成團:{act.minSpots || 1} / 滿團:{act.totalSpots}</div>
                          {act.discountCode && <div className="text-[10px] text-emerald-600 font-black flex items-center gap-1"><Tag size={12}/> 折扣碼: {act.discountCode} (-${act.discountAmount})</div>}
                        </>
                      )}
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingActivity({ ...act }); setActivityFormType(act.type || 'course'); setTimeInput(act.time || ''); setStep('admin_add'); }} title="編輯活動" className="p-2.5 bg-orange-50 text-indigo-900/50 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors"><Pencil size={18} /></button>
                        <button onClick={async () => { if(window.confirm('確定刪除？')) { const actRef = doc(db, 'artifacts', appId, 'public', 'data', 'activities', act.id); await deleteDoc(actRef); } }} title="刪除活動" className="p-2.5 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-full transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRegistrationsTab = () => {
    const groupedRegs = registrations.reduce((acc, reg) => {
      const key = `${reg.date}_${reg.activityId}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(reg);
      return acc;
    }, {});

    const updateStatus = async (regId, newStatus) => {
      const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'registrations', regId);
      await setDoc(regRef, { status: newStatus }, { merge: true });
    };

    return (
      <div className="animate-in fade-in">
        <h3 className="text-2xl font-black text-indigo-900 mb-8 flex items-center gap-3"><UsersRound className="text-orange-500" size={28}/> 報名清單管理</h3>
        {Object.keys(groupedRegs).length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold">目前尚無報名紀錄。</div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedRegs).map(([key, regs]) => {
              const actHint = getActivityById(regs[0].activityId, regs[0].date);
              const minSpots = actHint ? (actHint.minSpots || 1) : 1;
              const isActGrouped = regs.length >= minSpots;

              return (
                <div key={key} className="border border-orange-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-orange-50/80 to-white p-6 border-b border-orange-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h4 className="font-black text-indigo-900 text-xl mb-1 flex items-center gap-2">
                        {actHint ? actHint.title : '未知活動'}
                        {isActGrouped ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-200">✅ 已達成團人數</span> : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg border border-amber-200">⏳ 未成團</span>}
                      </h4>
                      <p className="text-sm text-indigo-900/60 font-bold flex items-center gap-1.5 mt-2"><Clock size={14} className="text-orange-500"/> {regs[0].date} | {actHint ? actHint.time : ''}</p>
                    </div>
                    <span className="text-sm font-black tracking-widest text-orange-700 bg-orange-100 border border-orange-200 px-4 py-2.5 rounded-xl uppercase shadow-sm">目前報名：{regs.length} 人</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[900px]">
                      <thead className="bg-orange-50/30 border-b border-orange-100">
                        <tr className="text-indigo-900/50 text-xs tracking-widest uppercase">
                          <th className="py-4 px-6 w-1/4 font-black">學員資訊 / 程度評估</th>
                          <th className="py-4 px-6 w-[15%] font-black">服裝 / 裝備</th>
                          <th className="py-4 px-6 w-1/4 font-black">繳款方式 / 證明明細</th>
                          <th className="py-4 px-6 w-[15%] font-bold">當前狀態</th>
                          <th className="py-4 px-6 text-right font-black">操作管理</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-50 bg-white">
                        {regs.map(r => (
                          <tr key={r.id} className="hover:bg-orange-50/20 transition-colors">
                            <td className="py-5 px-6">
                              <div className="flex items-center gap-2 mb-1.5">
                                <User size={14} className="text-indigo-900/40 shrink-0"/>
                                <span className="font-black text-indigo-900 text-base">{r.name}</span>
                                {r.agreeMediaUsage === 'yes' ? 
                                  <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded-md tracking-widest whitespace-nowrap">肖像✓</span> : 
                                  <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md tracking-widest whitespace-nowrap">肖像✗</span>
                                }
                              </div>
                              <div className="flex items-center gap-2 text-indigo-900/60 text-xs mb-3 font-bold">
                                <Phone size={12} className="text-indigo-900/40 shrink-0"/> {r.phone}
                              </div>
                              <div className="inline-flex flex-col gap-1.5 items-start" title={`深度:${r.maxDepth} | 閉氣:${r.apneaStat} | 最近下水:${r.recentDiveDate} (${r.recentDiveDepth})`}>
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-md text-[10px] font-black tracking-wider line-clamp-1 shadow-sm">
                                  {r.certifications ? (r.certifications === '無潛水經驗' ? '無經驗' : r.certifications.split(' ')[0]) : '無'} / {r.maxDepth ? r.maxDepth.split(' ')[0] : '0m'}
                                </span>
                                <span className="text-[10px] text-indigo-900/50 font-bold bg-orange-50 px-2 py-0.5 rounded-md">
                                  近期下水：{r.recentDiveDate}
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <span className={`font-black px-3 py-1.5 rounded-lg text-xs border shadow-sm ${r.tailSize==='自備'?'bg-amber-50 text-amber-700 border-amber-200':'bg-teal-50 text-teal-700 border-teal-200'}`}>
                                尾巴: {r.tailSize}
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <div className={`font-bold ${r.paymentMethod === 'wait_group' ? 'text-indigo-600' : 'text-indigo-900/80'}`}>
                                {r.paymentMethod === 'wait_group' ? '待成團後補繳' : (paymentMethods.find(p=>p.id===r.paymentMethod)?.name || '未知')}
                              </div>
                              {r.paymentMethod !== 'wait_group' && (
                                <div className="text-xs text-indigo-900/60 mt-2 font-bold bg-orange-50/50 p-2 rounded-lg inline-block border border-orange-100/50">
                                  證明: <span className={`font-mono font-black ml-1 ${r.paymentProof ? 'text-orange-600' : 'text-amber-500'}`}>{r.paymentProof || '未回傳'}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-5 px-6">
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap border shadow-sm ${
                                r.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                                r.status === 'pending_group' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                'bg-amber-50 text-amber-600 border-amber-200'
                              }`}>
                                {r.status === 'confirmed' ? '✓ 已收款' : r.status === 'pending_group' ? '待成團(未繳)' : '待對帳'}
                              </span>
                            </td>
                            <td className="py-5 px-6 text-right">
                              {r.status === 'pending' && <button onClick={() => updateStatus(r.id, 'confirmed')} className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-xl font-bold whitespace-nowrap shadow-sm hover:bg-indigo-700 transition-colors">確認收款</button>}
                              {r.status === 'confirmed' && <button onClick={() => updateStatus(r.id, 'pending')} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs rounded-xl font-bold whitespace-nowrap hover:bg-slate-200 transition-colors">改待對帳</button>}
                              {r.status === 'pending_group' && (
                                <div className="flex flex-col gap-2 items-end">
                                  <span className="text-[11px] text-indigo-900/40 font-bold bg-orange-50 px-3 py-1.5 rounded-lg inline-block w-full text-center">等候補繳</span>
                                  <button onClick={() => updateStatus(r.id, 'confirmed')} className="w-full px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs rounded-lg font-bold transition-colors">已手動收款</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderWishlistsTab = () => {
    const updateWishStatus = async (id, newStatus) => {
      const wishRef = doc(db, 'artifacts', appId, 'public', 'data', 'wishlists', id);
      await setDoc(wishRef, { status: newStatus }, { merge: true });
    };

    const deleteWish = async (id) => { 
      if(window.confirm('確定刪除此許願紀錄？')) {
        const wishRef = doc(db, 'artifacts', appId, 'public', 'data', 'wishlists', id);
        await deleteDoc(wishRef);
      }
    };

    return (
      <div className="animate-in fade-in">
        <h3 className="text-2xl font-black text-indigo-900 mb-8 flex items-center gap-3"><Sparkles className="text-amber-500" size={28}/> 許願池清單管理</h3>
        {wishlists.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold">目前尚無許願紀錄。</div>
        ) : (
          <div className="overflow-x-auto border border-orange-100 rounded-2xl shadow-sm">
            <table className="w-full text-left text-sm min-w-[1000px]">
              <thead className="bg-orange-50/50 border-b border-orange-100">
                <tr className="text-indigo-900/50 text-xs tracking-widest uppercase">
                  <th className="py-5 px-6 w-1/4 font-black">許願日期 / 聯絡人</th>
                  <th className="py-5 px-6 w-1/3 font-black">許願類型 / 內容</th>
                  <th className="py-5 px-6 font-black">偏好時段</th>
                  <th className="py-5 px-6 font-black">狀態</th>
                  <th className="py-5 px-6 font-black text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50 bg-white">
                {wishlists.map(w => {
                  const typeLabel = w.wishType === 'course' ? 'PADI 證照課程' : w.wishType === 'experience' ? '基礎人魚體驗' : w.wishType === 'practice' ? '教練帶領團練' : w.wishType === 'trip' ? '潛旅' : '水下攝影';
                  return (
                    <tr key={w.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-5 px-6">
                        <div className="font-black text-indigo-900 text-base mb-1.5 flex items-center gap-2">
                          {w.name}
                          {w.nickname && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-200 shadow-sm">稱呼: {w.nickname}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-indigo-900/60 text-xs font-bold mb-1"><Phone size={12} className="text-indigo-900/40"/> {w.phone}</div>
                        <div className="flex items-center gap-2 text-indigo-900/60 text-xs font-bold mb-3"><Mail size={12} className="text-indigo-900/40"/> {w.email}</div>
                        <div className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-1.5 rounded-lg inline-flex items-center gap-1 border border-amber-100"><Clock size={12}/> 許願日: {new Date(w.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="font-black tracking-wider text-amber-700 bg-amber-100/50 px-3 py-1.5 rounded-lg inline-block text-xs border border-amber-100 mb-3">{typeLabel}</div>
                        <div className="text-sm text-indigo-900/80 font-bold leading-relaxed bg-orange-50/50 p-3 rounded-xl border border-orange-100/50">{w.wishContent || '無特別指定'}</div>
                      </td>
                      <td className="py-5 px-6 text-indigo-900/70 font-bold">
                        {w.wishTime === 'morning' ? '上午' : w.wishTime === 'afternoon' ? '下午' : '皆可 / 彈性'}
                      </td>
                      <td className="py-5 px-6">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap border shadow-sm ${w.status === 'opened' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : w.status === 'contacted' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                          {w.status === 'opened' ? '🚀 已轉開團' : w.status === 'contacted' ? '✓ 已聯絡' : '待處理'}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          {w.status !== 'opened' && (
                            <button onClick={() => { setWishToActData(w); setTimeInput(w.wishTime === 'morning' ? '09:00 - 12:00' : w.wishTime === 'afternoon' ? '13:30 - 16:30' : '全天'); setStep('admin_wish_to_act'); }} title="將此許願轉為正式開團" className="px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-xs rounded-xl font-bold shadow-sm transition-all hover:scale-105 whitespace-nowrap">轉開團</button>
                          )}
                          {w.status === 'pending' && (
                            <button onClick={() => updateWishStatus(w.id, 'contacted')} title="標記為已聯絡" className="px-3 py-2 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 text-xs rounded-xl font-bold transition-colors whitespace-nowrap">已聯絡</button>
                          )}
                          <button onClick={() => deleteWish(w.id)} title="刪除許願" className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-100 rounded-xl transition-colors"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderAdminWishToActModal = () => {
    const w = wishToActData;
    if (!w) return null;

    const handleGenerateCode = () => {
      document.getElementById('wishToActDiscountCode').value = Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleWishToAct = async (e) => {
      e.preventDefault();
      try {
        const fd = new FormData(e.target);
        const newAct = {
           id: 'act_' + Date.now(),
           date: fd.get('date'),
           time: fd.get('time'), title: fd.get('title'), instructor: fd.get('instructor'),
           spots: parseInt(fd.get('totalSpots'), 10) || 0, 
           totalSpots: parseInt(fd.get('totalSpots'), 10) || 0,
           minSpots: parseInt(fd.get('minSpots'), 10) || 1,
           price: parseInt(fd.get('price'), 10) || 0,
           type: fd.get('type'), location: fd.get('location'),
           initiator: w.nickname || w.name,
           discountCode: fd.get('discountCode')?.toUpperCase() || '',
           discountAmount: parseInt(fd.get('discountAmount'), 10) || 0
        };
        
        const actRef = doc(db, 'artifacts', appId, 'public', 'data', 'activities', newAct.id);
        await setDoc(actRef, newAct);

        const wishRef = doc(db, 'artifacts', appId, 'public', 'data', 'wishlists', w.id);
        await setDoc(wishRef, { status: 'opened' }, { merge: true });

        setWishToActData(null);
        setStep('admin_dashboard');
        setActiveAdminTab('activities');
        alert('✅ 已成功將許願轉為正式排程開團！');
      } catch (err) {
        console.error("轉開團失敗:", err);
        alert('❌ 儲存失敗，請檢查輸入的資料格式是否正確：' + err.message);
      }
    };

    return (
      <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-orange-100 overflow-hidden animate-in fade-in relative">
        <div className="bg-gradient-to-r from-orange-500 to-rose-600 px-10 py-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 relative z-10">
            <Sparkles size={32} className="text-amber-200"/> 將許願轉為正式開團
          </h2>
        </div>
        <div className="px-10 pt-8 pb-4">
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex flex-col sm:flex-row gap-6">
             <div className="flex-1">
               <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-1 rounded tracking-widest uppercase mb-2 inline-block">許願人稱呼</span>
               <div className="text-lg font-black text-amber-900">{w.nickname || w.name}</div>
             </div>
             <div className="flex-[2]">
               <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-1 rounded tracking-widest uppercase mb-2 inline-block">許願內容參考</span>
               <div className="text-sm font-bold text-amber-900 leading-relaxed">{w.wishContent || '無'}</div>
             </div>
          </div>
        </div>
        <form onSubmit={handleWishToAct} className="p-10 pt-4 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div><label className="block text-sm font-black text-indigo-900 mb-3">開團日期 *</label><input required type="date" name="date" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" /></div>
            <div>
              <label className="block text-sm font-black text-indigo-900 mb-3">時間時段 (可點選常用或自訂) *</label>
              <input required type="text" name="time" value={timeInput} onChange={e => setTimeInput(e.target.value)} placeholder="如：09:00 - 12:00" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors mb-3" />
              <div className="flex flex-wrap gap-2">
                 {['08:00 - 10:00', '09:00 - 12:00', '13:00 - 15:00', '13:30 - 16:30', '18:00 - 20:00', '19:00 - 21:00', '全天'].map(t => (
                   <button type="button" key={t} onClick={() => setTimeInput(t)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black hover:bg-indigo-100 hover:text-indigo-700 transition-colors border border-indigo-100/50">{t}</button>
                 ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-black text-indigo-900 mb-3">活動名稱 *</label>
              <input required type="text" name="title" defaultValue={w.wishContent} list="c-opts" placeholder="請確認或修改課程名稱" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" />
              <datalist id="c-opts">{courseList.map(c => <option key={c.id} value={c.name}/>)}</datalist>
            </div>
            <div>
              <label className="block text-sm font-black text-indigo-900 mb-3">帶團教練 *</label>
              <input required type="text" name="instructor" list="t-opts" placeholder="請輸入或選擇教練" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" />
              <datalist id="t-opts">{coachList.map(c => <option key={c.id} value={c.name}/>)}</datalist>
            </div>
            <div>
              <label className="block text-sm font-black text-indigo-900 mb-3">活動類型分類 *</label>
              <select required name="type" defaultValue={w.wishType} className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors">
                <option value="course">課程</option><option value="practice">團練</option><option value="trip">潛旅</option><option value="need_one">缺一成團</option>
              </select>
            </div>
            <div><label className="block text-sm font-black text-indigo-900 mb-3">滿團人數 (最大值) *</label><input required type="number" min="1" name="totalSpots" placeholder="如：8" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" /></div>
            <div><label className="block text-sm font-black text-indigo-900 mb-3">成團人數 (最低限制) *</label><input required type="number" min="1" name="minSpots" placeholder="如：4" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" /></div>
            <div><label className="block text-sm font-black text-indigo-900 mb-3">單人報名費用 (NT$) *</label><input required type="number" min="0" name="price" placeholder="如：12000" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" /></div>
            <div>
              <label className="block text-sm font-black text-indigo-900 mb-3">活動集合地點 *</label>
              <input required type="text" name="location" list="l-opts" placeholder="請確認開團地點" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" />
              <datalist id="l-opts">{locationList.map(l => <option key={l.id} value={l.name}/>)}</datalist>
            </div>
            
            {/* 折扣碼設定 */}
            <div className="sm:col-span-2 pt-6 border-t border-orange-100 mt-2"><h4 className="text-lg font-black text-rose-600 mb-2">專屬折扣設定 (選填)</h4></div>
            <div>
              <label className="block text-sm font-black text-indigo-900 mb-3">學生專屬折扣碼 (僅限此梯次)</label>
              <div className="flex gap-2">
                <input id="wishToActDiscountCode" type="text" name="discountCode" placeholder="如：STU500" className="flex-1 px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-rose-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors uppercase" />
                <button type="button" onClick={handleGenerateCode} className="px-5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-2xl font-black text-sm transition-colors whitespace-nowrap">隨機產生</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-black text-indigo-900 mb-3">折扣折抵金額 (NT$)</label>
              <input type="number" min="0" name="discountAmount" placeholder="如：500" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-rose-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" />
            </div>

          </div>
          <div className="border-t border-orange-100 pt-8 flex justify-end gap-4">
            <button type="button" onClick={() => { setWishToActData(null); setStep('admin_dashboard'); }} className="px-10 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-lg transition-colors">取消</button>
            <button type="submit" className="px-12 py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl font-black text-lg shadow-lg hover:scale-105 transition-all">確認轉換開團</button>
          </div>
        </form>
      </div>
    );
  };

  const renderAdminAddPanel = () => {
    const isEdit = !!editingActivity;
    // 使用頂層的 activityFormType 避免 React Hook 順序錯亂
    const isUnavailable = activityFormType === 'unavailable';

    const handleGenerateCode = () => {
      document.getElementById('adminDiscountCode').value = Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleAdd = async (e) => {
      e.preventDefault();
      try {
        const fd = new FormData(e.target);
        const dStr = fd.get('date');
        const actType = fd.get('type');
        const isUnavail = actType === 'unavailable';

        const totalSpots = isUnavail ? 0 : (parseInt(fd.get('totalSpots'), 10) || 0);
        const minSpots = isUnavail ? 0 : (parseInt(fd.get('minSpots'), 10) || 1);
        const price = isUnavail ? 0 : (parseInt(fd.get('price'), 10) || 0);
        const loc = isUnavail ? '無' : fd.get('location');
        const discountCode = isUnavail ? '' : (fd.get('discountCode')?.toUpperCase() || '');
        const discountAmount = isUnavail ? 0 : (parseInt(fd.get('discountAmount'), 10) || 0);
        
        const spots = isEdit && !isUnavail ? Math.max(0, (parseInt(fd.get('totalSpots'), 10) || 0) - (editingActivity.totalSpots - editingActivity.spots)) : totalSpots;

        const newAct = { 
          id: isEdit ? editingActivity.id : 'act_' + Date.now(), 
          date: dStr,
          time: fd.get('time') || '', 
          title: fd.get('title') || '', 
          instructor: fd.get('instructor') || '', 
          spots, totalSpots, minSpots, price, type: actType, location: loc,
          initiator: isEdit ? (editingActivity.initiator || null) : null,
          discountCode, discountAmount
        };

        const actRef = doc(db, 'artifacts', appId, 'public', 'data', 'activities', newAct.id);
        await setDoc(actRef, newAct);

        // 若編輯時更改了日期，刪除舊有日期的活動紀錄
        if (isEdit && editingActivity.date !== dStr) {
           const oldActRef = doc(db, 'artifacts', appId, 'public', 'data', 'activities', editingActivity.id);
           await deleteDoc(oldActRef);
        }

        setStep('admin_dashboard');
      } catch (err) {
        console.error("儲存活動失敗:", err);
        alert('❌ 儲存失敗，請檢查輸入的數值格式是否正確：' + err.message);
      }
    };

    return (
      <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-orange-100 overflow-hidden animate-in fade-in">
        <div className="bg-gradient-to-r from-orange-500 to-rose-500 px-10 py-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 relative z-10">
            {isEdit ? <Pencil size={32}/> : <Plus size={32}/>}
            {isEdit ? '編輯活動排程' : '教練直接新增排程'}
          </h2>
        </div>
        <form onSubmit={handleAdd} className="p-10 space-y-8">
          {isUnavailable && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold flex items-center gap-2 mb-4 shadow-sm">
              <Info size={18}/> 選擇「休假 / 停開」時，人數與費用將自動設為 0，且該時段不開放學員報名。
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div><label className="block text-sm font-black text-indigo-900 mb-3">日期 *</label><input required type="date" name="date" defaultValue={editingActivity?.date} className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" /></div>
            <div>
              <label className="block text-sm font-black text-indigo-900 mb-3">時間時段 (可點選常用或自訂) *</label>
              <input required type="text" name="time" value={timeInput} onChange={e => setTimeInput(e.target.value)} placeholder="如：09:00 - 12:00" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors mb-3" />
              <div className="flex flex-wrap gap-2">
                 {['08:00 - 10:00', '09:00 - 12:00', '13:00 - 15:00', '13:30 - 16:30', '18:00 - 20:00', '19:00 - 21:00', '全天'].map(t => (
                   <button type="button" key={t} onClick={() => setTimeInput(t)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black hover:bg-indigo-100 hover:text-indigo-700 transition-colors border border-indigo-100/50">{t}</button>
                 ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-black text-indigo-900 mb-3">{isUnavailable ? '休假/事由名稱 *' : '活動名稱 *'}</label>
              <input required type="text" name="title" defaultValue={editingActivity?.title} list="c-opts" placeholder={isUnavailable ? "如：教練進修、場地維護" : "請輸入或選擇課程名稱"} className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" />
              <datalist id="c-opts">{courseList.map(c => <option key={c.id} value={c.name}/>)}</datalist>
            </div>
            <div>
              <label className="block text-sm font-black text-indigo-900 mb-3">帶團教練 / 休假教練 *</label>
              <input required type="text" name="instructor" defaultValue={editingActivity?.instructor} list="t-opts" placeholder="請輸入或選擇教練" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" />
              <datalist id="t-opts">{coachList.map(c => <option key={c.id} value={c.name}/>)}</datalist>
            </div>
            <div>
              <label className="block text-sm font-black text-indigo-900 mb-3">活動類型分類 *</label>
              <select required name="type" value={activityFormType} onChange={e => setActivityFormType(e.target.value)} className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors">
                <option value="course">課程</option><option value="practice">團練</option><option value="trip">潛旅</option><option value="need_one">缺一成團</option><option value="unavailable">休假 / 停開</option>
              </select>
            </div>
            {!isUnavailable && (
              <>
                <div><label className="block text-sm font-black text-indigo-900 mb-3">滿團人數 (最大值) *</label><input required type="number" min="1" name="totalSpots" defaultValue={editingActivity?.totalSpots} placeholder="如：8" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" /></div>
                <div><label className="block text-sm font-black text-indigo-900 mb-3">成團人數 (最低限制) *</label><input required type="number" min="1" name="minSpots" defaultValue={editingActivity?.minSpots || 1} placeholder="如：4" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" /></div>
                <div><label className="block text-sm font-black text-indigo-900 mb-3">單人報名費用 (NT$) *</label><input required type="number" min="0" name="price" defaultValue={editingActivity?.price} placeholder="如：12000" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" /></div>
                <div>
                  <label className="block text-sm font-black text-indigo-900 mb-3">活動集合地點 *</label>
                  <input required type="text" name="location" defaultValue={editingActivity?.location} list="l-opts" placeholder="請輸入或選擇地點" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" />
                  <datalist id="l-opts">{locationList.map(l => <option key={l.id} value={l.name}/>)}</datalist>
                </div>
                
                {/* 折扣碼設定 */}
                <div className="sm:col-span-2 pt-6 border-t border-orange-100 mt-2"><h4 className="text-lg font-black text-rose-600 mb-2">專屬折扣設定 (選填)</h4></div>
                <div>
                  <label className="block text-sm font-black text-indigo-900 mb-3">學生專屬折扣碼 (僅限此梯次)</label>
                  <div className="flex gap-2">
                    <input id="adminDiscountCode" type="text" name="discountCode" defaultValue={editingActivity?.discountCode} placeholder="如：STU500" className="flex-1 px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-rose-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors uppercase" />
                    <button type="button" onClick={handleGenerateCode} className="px-5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-2xl font-black text-sm transition-colors whitespace-nowrap">隨機產生</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-indigo-900 mb-3">折扣折抵金額 (NT$)</label>
                  <input type="number" min="0" name="discountAmount" defaultValue={editingActivity?.discountAmount} placeholder="如：500" className="w-full px-5 py-4 bg-orange-50/50 border-2 border-transparent focus:border-rose-400 focus:bg-white rounded-2xl outline-none font-bold transition-colors" />
                </div>
              </>
            )}
          </div>
          <div className="border-t border-orange-100 pt-8 flex justify-end gap-4">
            <button type="button" onClick={() => setStep('admin_dashboard')} className="px-10 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-lg transition-colors">取消</button>
            <button type="submit" className="px-12 py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl font-black text-lg shadow-lg hover:scale-105 transition-all">確認儲存上架</button>
          </div>
        </form>
      </div>
    );
  };

  const renderPaymentsAdmin = () => {
    // 改用獨立 Local State 以避免 Firebase OnSnapshot 中斷使用者輸入
    const [localPayments, setLocalPayments] = useState(paymentMethods);
    useEffect(() => { setLocalPayments(paymentMethods); }, [paymentMethods]);

    const togglePayment = (id) => setLocalPayments(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
    const updateInst = (id, text) => setLocalPayments(prev => prev.map(p => p.id === id ? { ...p, instructions: text } : p));

    const handleSave = async () => {
      await saveSettings({ paymentMethods: localPayments });
      alert('✅ 繳款設定已儲存！');
    };
    
    return (
      <div className="animate-in fade-in space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-2xl font-black text-indigo-900 flex items-center gap-3 mb-2"><Receipt className="text-orange-500" size={28}/> 繳款方式設定</h3>
            <p className="text-sm text-indigo-900/60 font-bold">啟用或停用繳款方式，並可自訂學員在報名時看到的匯款帳號或繳款指引。</p>
          </div>
          <button onClick={handleSave} className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-black shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 whitespace-nowrap">儲存所有設定</button>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {localPayments.map(method => {
            const Icon = PAYMENT_ICONS[method.id];
            return (
              <div key={method.id} className={`p-8 rounded-3xl border-2 transition-all ${method.enabled ? 'border-orange-100 bg-white shadow-sm' : 'border-slate-100 bg-slate-50 opacity-70'}`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${method.enabled ? 'bg-orange-50 text-orange-500' : 'bg-slate-200 text-slate-500'}`}>
                      {Icon && <Icon size={28} />}
                    </div>
                    <h4 className="font-black text-xl text-indigo-900">{method.name}</h4>
                  </div>
                  <button onClick={() => togglePayment(method.id)} className="flex items-center gap-2 text-sm font-black transition-colors focus:outline-none bg-white px-4 py-2 rounded-xl border border-orange-100 shadow-sm">
                    {method.enabled ? <><span className="text-orange-600">目前為開放狀態</span><ToggleRight size={32} className="text-orange-500"/></> : <><span className="text-slate-500">目前為停用狀態</span><ToggleLeft size={32} className="text-slate-400"/></>}
                  </button>
                </div>
                {method.enabled && (
                  <div className="mt-4 border-t border-orange-100/50 pt-6">
                    <label className="block text-sm font-black text-indigo-900 mb-3">請設定報名時顯示的繳款指引或匯款帳號資訊：</label>
                    <textarea 
                      value={method.instructions} 
                      onChange={(e) => updateInst(method.id, e.target.value)}
                      className="w-full h-32 p-5 border-2 border-orange-100 rounded-2xl outline-none focus:border-orange-400 text-sm font-bold text-indigo-900/80 custom-scrollbar bg-orange-50/30 focus:bg-white transition-colors"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  const renderHomepageAdmin = () => {
    return (
      <div className="animate-in fade-in space-y-8">
        <div>
          <h3 className="text-2xl font-black text-indigo-900 flex items-center gap-3 mb-2"><LayoutDashboard className="text-orange-500" size={28}/> 首頁歡迎詞設定</h3>
          <p className="text-sm text-indigo-900/60 font-bold">自訂首頁月曆旁尚未點選日期時，顯示的歡迎標題與提示說明文字。</p>
        </div>
        <form onSubmit={async (e) => { 
          e.preventDefault(); 
          await saveSettings({ 
             welcomeConfig: { title: e.target.title.value, desc: e.target.desc.value },
             announcementText: e.target.announcement.value
          });
          alert('✅ 首頁設定已成功更新！'); 
        }} className="bg-white p-8 rounded-3xl border-2 border-orange-100 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-black text-indigo-900 mb-3">歡迎標題 *</label>
            <input required name="title" defaultValue={welcomeConfig.title} className="w-full px-5 py-4 rounded-xl border-2 border-orange-100 outline-none focus:border-orange-400 bg-orange-50/30 focus:bg-white font-black transition-colors text-lg text-indigo-900" placeholder="如：潛入深藍，探索水下世界" />
          </div>
          <div>
            <label className="block text-sm font-black text-indigo-900 mb-3">提示說明文字 *</label>
            <textarea required name="desc" defaultValue={welcomeConfig.desc} className="w-full h-32 px-5 py-4 rounded-xl border-2 border-orange-100 outline-none focus:border-orange-400 bg-orange-50/30 focus:bg-white font-medium transition-colors custom-scrollbar resize-none leading-relaxed text-base text-indigo-900/80" placeholder="如：請點選左側月曆日期，查看最新課程..." />
          </div>
          
          <div className="pt-6 border-t border-orange-100/50 mt-6">
            <h4 className="text-lg font-black text-indigo-900 mb-4 flex items-center gap-2"><AlertCircle className="text-amber-500" size={20}/> 首頁公告 / 注意事項區塊</h4>
            <label className="block text-sm font-black text-indigo-900 mb-3">公告文字內容 (支援換行) *</label>
            <textarea required name="announcement" defaultValue={announcementText} className="w-full h-32 px-5 py-4 rounded-xl border-2 border-amber-200 outline-none focus:border-amber-400 bg-amber-50/50 focus:bg-white font-bold transition-colors custom-scrollbar resize-none leading-relaxed text-base text-amber-900" placeholder="輸入公告或報名注意事項..." />
          </div>

          <div className="flex justify-end pt-4 border-t border-orange-100/50">
            <button type="submit" className="px-10 py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl font-black shadow-md transition-all hover:scale-105">儲存設定</button>
          </div>
        </form>
      </div>
    );
  };

  const renderRulesAdmin = () => {
    return (
      <div className="animate-in fade-in">
        <h3 className="text-2xl font-black text-indigo-900 mb-2 flex items-center gap-3"><ShieldCheck className="text-orange-500" size={28}/> 課程及團練規範設定</h3>
        <p className="text-sm text-indigo-900/60 mb-8 font-bold">請於下方文字框編輯您的規範內容。這些文字將會顯示在「報名前的同意條款」中，學員必須滑動閱讀完畢並勾選同意才能完成報名。</p>
        <form onSubmit={async (e) => { 
          e.preventDefault(); 
          await saveSettings({ rulesText: e.target.rules.value });
          alert('✅ 規範內容已成功更新！前台報名表單將立即套用新版規範。'); 
        }}>
          <div className="bg-orange-50/30 p-6 rounded-[2rem] border border-orange-100 mb-6">
            <textarea name="rules" required defaultValue={rulesText} className="w-full h-[400px] p-6 border-2 border-orange-100 bg-white rounded-2xl outline-none focus:border-orange-400 text-sm font-bold leading-relaxed custom-scrollbar transition-colors text-indigo-900/80" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-12 py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-black text-lg rounded-2xl shadow-lg transition-colors hover:scale-105">儲存規範變更</button>
          </div>
        </form>
      </div>
    );
  };

  const renderInfoList = () => {
    const list = activeInfoTab === 'courses' ? courseList : activeInfoTab === 'coaches' ? coachList : locationList;
    const itemType = activeInfoTab === 'courses' ? 'course' : activeInfoTab === 'coaches' ? 'coach' : 'location';
    
    return (
      <div className="animate-in fade-in">
        <div className="flex justify-end mb-6">
          <button onClick={() => { setModalConfig({ type: itemType, mode: 'add', item: {} }); setIsModalOpen(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus size={18}/> 新增項目
          </button>
        </div>
        <div className="space-y-4">
          {list.map(i => (
            <div key={i.id} className="p-6 border border-orange-100 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-orange-300 transition-colors shadow-sm bg-white group">
              <div className="pr-4">
                <h4 className="font-black text-lg text-indigo-900 group-hover:text-orange-600 transition-colors">{i.name}</h4>
                <p className="text-sm text-indigo-900/60 mt-2 font-bold">{i.desc}</p>
              </div>
              <div className="flex gap-3 shrink-0 self-end sm:self-center">
                <button onClick={()=>{setModalConfig({type: itemType, mode:'edit', item:i});setIsModalOpen(true);}} className="p-3 text-indigo-900/40 bg-orange-50 hover:text-orange-600 hover:bg-orange-100 rounded-xl transition-colors"><Pencil size={20}/></button>
                <button onClick={()=>handleDeleteItem(itemType, i.id)} className="p-3 text-indigo-900/40 bg-orange-50 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-colors"><Trash2 size={20}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAdminModal = () => {
    if (!isModalOpen) return null;
    const typeLabels = { course: '課程介紹', coach: '教練資訊', location: '開團地點' };
    const isEdit = modalConfig.mode === 'edit';
    const isCourse = modalConfig.type === 'course';
    const isLocation = modalConfig.type === 'location';

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center p-8 border-b border-orange-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
            <h3 className="text-2xl font-black text-indigo-900">{isEdit ? '編輯' : '新增'} {typeLabels[modalConfig.type]}</h3>
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-indigo-900/40 hover:bg-orange-50 hover:text-orange-600 p-2 rounded-xl transition-colors"><X size={24} /></button>
          </div>
          <form onSubmit={handleModalSubmit} className="p-8 space-y-8">
            <div><label className="block text-sm font-black text-indigo-900 mb-3">顯示名稱 *</label><input required type="text" name="name" defaultValue={modalConfig.item?.name} className="w-full px-5 py-4 rounded-xl bg-orange-50/50 border-2 border-transparent outline-none focus:border-orange-400 focus:bg-white font-bold transition-colors" placeholder="請輸入標題名稱" /></div>
            
            {isCourse && (
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 space-y-6">
                <h4 className="font-black text-indigo-900 text-lg flex items-center gap-2"><BookOpen size={20} className="text-indigo-500"/> 課程詳細設定區塊</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div><label className="block text-xs font-bold text-indigo-900/60 mb-2 uppercase tracking-widest">證照系統</label><input type="text" name="system" defaultValue={modalConfig.item?.system} placeholder="如：PADI" className="w-full px-4 py-3 rounded-xl bg-white border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-sm" /></div>
                  <div><label className="block text-xs font-bold text-indigo-900/60 mb-2 uppercase tracking-widest">課程天數</label><input type="text" name="days" defaultValue={modalConfig.item?.days} placeholder="如：2 天" className="w-full px-4 py-3 rounded-xl bg-white border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-sm" /></div>
                  <div className="sm:col-span-2"><label className="block text-xs font-bold text-indigo-900/60 mb-2 uppercase tracking-widest">預設費用 (NT$)</label><input type="number" name="price" defaultValue={modalConfig.item?.price} placeholder="供前台展示參考" className="w-full px-4 py-3 rounded-xl bg-white border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-sm" /></div>
                  <div className="sm:col-span-2"><label className="block text-xs font-bold text-indigo-900/60 mb-2 uppercase tracking-widest">報名要求 / 先決條件</label><textarea name="prerequisites" defaultValue={modalConfig.item?.prerequisites} placeholder="如：需年滿 10 歲，無特殊疾病..." className="w-full px-4 py-3 rounded-xl bg-white border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-sm h-20 resize-none custom-scrollbar" /></div>
                  <div className="sm:col-span-2"><label className="block text-xs font-bold text-indigo-900/60 mb-2 uppercase tracking-widest">費用包含項目</label><textarea name="includes" defaultValue={modalConfig.item?.includes} placeholder="如：全套裝備、證照費、場地費..." className="w-full px-4 py-3 rounded-xl bg-white border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-sm h-20 resize-none custom-scrollbar" /></div>
                  <div className="sm:col-span-2"><label className="block text-xs font-bold text-indigo-900/60 mb-2 uppercase tracking-widest">課程大綱內容</label><textarea name="content" defaultValue={modalConfig.item?.content} placeholder="簡述課程教學重點" className="w-full px-4 py-3 rounded-xl bg-white border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-sm h-24 resize-none custom-scrollbar" /></div>
                </div>
              </div>
            )}

            {isLocation && (
              <div className="bg-teal-50/30 p-6 rounded-2xl border border-teal-100/50 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2"><label className="block text-xs font-bold text-teal-900/60 mb-2 uppercase tracking-widest">所在地區分類</label><input type="text" name="region" defaultValue={modalConfig.item?.region} placeholder="如：小琉球、台中" className="w-full px-4 py-3 rounded-xl bg-white border border-teal-100 outline-none focus:ring-2 focus:ring-teal-400 font-bold text-sm" /></div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-teal-900/60 mb-2 uppercase tracking-widest flex items-center gap-1"><Clock size={14}/> 可選擇時間區間</label>
                  <p className="text-xs text-teal-800/60 mb-2 font-bold">※ 提示：每個時段請用「空格」隔開，系統會自動轉換為標籤樣式。支援換行。</p>
                  <textarea name="availableTimes" defaultValue={modalConfig.item?.availableTimes} placeholder="如：\n禮拜一 08:00-12:00 17:30-19:30\n禮拜二 08:00-10:00\n六日要提前問校方預約" className="w-full px-4 py-3 rounded-xl bg-white border border-teal-100 outline-none focus:ring-2 focus:ring-teal-400 font-bold text-sm h-32 resize-none custom-scrollbar" />
                </div>
                <div><label className="block text-xs font-bold text-teal-900/60 mb-2 uppercase tracking-widest">一般收費 (NT$)</label><input type="number" name="regularPrice" defaultValue={modalConfig.item?.regularPrice} className="w-full px-4 py-3 rounded-xl bg-white border border-teal-100 outline-none focus:ring-2 focus:ring-teal-400 font-bold text-sm" /></div>
                <div><label className="block text-xs font-bold text-teal-900/60 mb-2 uppercase tracking-widest">學員優惠價 (NT$)</label><input type="number" name="studentPrice" defaultValue={modalConfig.item?.studentPrice} className="w-full px-4 py-3 rounded-xl bg-white border border-teal-100 outline-none focus:ring-2 focus:ring-teal-400 font-bold text-sm" /></div>
                <div className="sm:col-span-2 pt-4 border-t border-teal-100/50"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="includesTicket" value="true" defaultChecked={modalConfig.item?.includesTicket} className="w-6 h-6 rounded text-teal-500 focus:ring-teal-500 border-gray-300" /><span className="text-base font-bold text-teal-900">上述費用是否已包含場地門票？</span></label></div>
              </div>
            )}

            <div><label className="block text-sm font-black text-indigo-900 mb-3">簡短介紹 / 描述備註 *</label><textarea required name="desc" defaultValue={modalConfig.item?.desc} className="w-full px-5 py-4 rounded-xl bg-orange-50/50 border-2 border-transparent outline-none focus:border-orange-400 focus:bg-white font-bold text-sm h-32 resize-none custom-scrollbar transition-colors" placeholder="請輸入對此項目的描述" /></div>
            
            <div className="pt-6 border-t border-orange-100/50 flex justify-end gap-4 sticky bottom-0 bg-white">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-black hover:bg-slate-200 transition-colors">取消</button>
              <button type="submit" className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg transition-colors">確認儲存</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/60 via-rose-50/40 to-teal-50/30 font-sans flex flex-col relative overflow-x-hidden">
      {/* Background Decorative Sunset Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-300/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-300/20 rounded-full blur-[100px] pointer-events-none"></div>

      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-orange-100 shadow-sm overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setStep('calendar')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-rose-600 rounded-xl flex items-center justify-center shadow-inner">
              <MermaidTailIcon className="text-white" size={20} />
            </div>
            <div className="flex-col hidden sm:flex">
              <span className="text-xl sm:text-2xl font-black text-indigo-900 tracking-widest leading-none">SeaFa</span>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 text-sm font-bold text-indigo-900/60 items-center">
            <div className="hidden lg:flex items-center gap-4 mr-2 pr-4 border-r border-orange-200">
               <a href={OFFICIAL_SITE} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-orange-600 transition-colors">
                  <Globe size={16}/> 官方網站
               </a>
               <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#E1306C] transition-colors">
                  <Instagram size={16}/> IG
               </a>
               <a href={LINE_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#00C300] transition-colors">
                  <MessageCircle size={16}/> @022ocuil
               </a>
            </div>
            {step !== 'calendar' && !step.startsWith('admin') && (
              <button onClick={() => setStep('calendar')} className="px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all bg-orange-50/50 hover:bg-orange-100 hover:text-orange-600 border border-orange-50">
                <ArrowLeft size={16}/><span className="hidden sm:inline">返回首頁</span>
              </button>
            )}
            <button onClick={() => {
                if (currentUser) {
                  setStep('admin_dashboard');
                } else {
                  setStep('admin_login');
                }
              }} className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all border ${step.startsWith('admin')?'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm':'border-transparent hover:bg-orange-50 hover:text-orange-600'}`}>
              <Settings size={16}/><span className="hidden sm:inline">管理後台</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-12 relative z-10 pb-24">
        {step === 'admin_login' && renderAdminLogin()}
        {step === 'calendar' && (
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
              <button onClick={() => setStep('courses_page')} className="flex flex-col items-center p-6 sm:p-8 bg-white/90 backdrop-blur-sm rounded-[2rem] border border-orange-100 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-50 to-rose-50 rounded-[1.5rem] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen size={36} className="text-orange-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-indigo-900 group-hover:text-orange-600 transition-colors">課程介紹</h3>
                <p className="text-xs text-indigo-900/40 mt-2 font-bold hidden sm:block">PADI 證照與體驗</p>
              </button>

              <button onClick={() => setStep('coaches_page')} className="flex flex-col items-center p-6 sm:p-8 bg-white/90 backdrop-blur-sm rounded-[2rem] border border-orange-100 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-50 to-rose-50 rounded-[1.5rem] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UsersRound size={36} className="text-orange-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-indigo-900 group-hover:text-orange-600 transition-colors">關於教練</h3>
                <p className="text-xs text-indigo-900/40 mt-2 font-bold hidden sm:block">專業師資陣容</p>
              </button>

              <button onClick={() => setStep('locations_page')} className="flex flex-col items-center p-6 sm:p-8 bg-white/90 backdrop-blur-sm rounded-[2rem] border border-orange-100 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-50 to-rose-50 rounded-[1.5rem] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MapPin size={36} className="text-orange-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-indigo-900 group-hover:text-orange-600 transition-colors">開團地點</h3>
                <p className="text-xs text-indigo-900/40 mt-2 font-bold hidden sm:block">精選潛點與場地</p>
              </button>

              <button onClick={() => setStep('query_page')} className="flex flex-col items-center p-6 sm:p-8 bg-white/90 backdrop-blur-sm rounded-[2rem] border border-orange-100 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-50 to-rose-50 rounded-[1.5rem] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Search size={36} className="text-orange-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-indigo-900 group-hover:text-orange-600 transition-colors">查詢與繳費狀態</h3>
                <p className="text-xs text-indigo-900/40 mt-2 font-bold hidden sm:block">確認狀態與繳費</p>
              </button>

              <a href={PORTFOLIO_LINK} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-6 sm:p-8 bg-white/90 backdrop-blur-sm rounded-[2rem] border border-orange-100 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all group col-span-2 md:col-span-1">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-50 to-rose-50 rounded-[1.5rem] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Camera size={36} className="text-orange-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-indigo-900 group-hover:text-orange-600 transition-colors">精選作品集</h3>
                <p className="text-xs text-indigo-900/40 mt-2 font-bold hidden sm:block">水下人像與寫真</p>
              </a>
            </div>

            {announcementText && (
              <div className="mb-10 bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/60 rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><AlertCircle size={100}/></div>
                <div className="bg-white p-3.5 rounded-2xl shrink-0 text-amber-500 shadow-sm border border-amber-100 relative z-10">
                  <AlertCircle size={28} />
                </div>
                <div className="flex-1 relative z-10">
                  <h3 className="text-lg font-black text-amber-900 mb-2">最新公告與注意事項</h3>
                  <div className="text-amber-900/80 font-bold leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                    {announcementText}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
              <div className="lg:col-span-2">{renderCalendar()}</div>
              <div className="lg:col-span-1">{renderSessionList()}</div>
            </div>

            {/* --- 新增：官方連結與 LINE 區塊 --- */}
            <div className="mt-12 bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-orange-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-300/30 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex items-center gap-5 relative z-10 w-full xl:w-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg text-white shrink-0">
                  <Waves size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-indigo-900 mb-1.5 tracking-wide">探索更多 SeaFa 精彩內容</h3>
                  <p className="text-sm font-bold text-indigo-900/60 leading-relaxed">了解品牌故事、最新活動資訊，<br className="sm:hidden" />或加入 LINE 官方帳號與客服一對一諮詢。</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 w-full xl:w-auto relative z-10">
                <a href={OFFICIAL_SITE} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-orange-100 text-orange-600 rounded-2xl font-black shadow-sm hover:border-orange-300 hover:bg-orange-50 hover:-translate-y-1 transition-all text-base whitespace-nowrap">
                  <Globe size={20} /> 前往官方網站
                </a>
                <a href={PORTFOLIO_LINK} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-teal-400 to-emerald-500 text-white rounded-2xl font-black shadow-md hover:shadow-lg hover:-translate-y-1 transition-all text-base whitespace-nowrap">
                  <Camera size={20} /> 作品集
                </a>
                <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white rounded-2xl font-black shadow-md hover:shadow-lg hover:-translate-y-1 transition-all text-base whitespace-nowrap">
                  <Instagram size={20} /> Instagram
                </a>
                <a href={LINE_LINK} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#00C300] text-white rounded-2xl font-black shadow-md hover:bg-[#00A000] hover:shadow-lg hover:shadow-[#00C300]/30 hover:-translate-y-1 transition-all text-base whitespace-nowrap">
                  <MessageCircle size={20} /> LINE 客服
                </a>
              </div>
            </div>
          </div>
        )}
        {step === 'courses_page' && renderCoursesPage()}
        {step === 'coaches_page' && renderCoachesPage()}
        {step === 'locations_page' && renderLocationsPage()}
        {step === 'form' && renderForm()}
        {step === 'query_page' && renderQueryPage()}
        {step === 'success' && renderSuccess()}
        {step === 'wishlist_form' && renderWishlistForm()}
        {step === 'wishlist_success' && renderWishlistSuccess()}
        {step === 'admin_dashboard' && renderAdminDashboard()}
        {step === 'admin_add' && renderAdminAddPanel()}
        {step === 'admin_wish_to_act' && renderAdminWishToActModal()}
      </main>

      <footer className="bg-indigo-950 pt-20 pb-16 mt-auto relative overflow-hidden">
        <SunsetWave className="-top-1 text-white/5 opacity-10" />
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6 relative z-10">
          <div className="flex justify-center items-center gap-4 text-indigo-800">
            <Waves size={24} />
            <MermaidTailIcon size={32} className="text-orange-400" />
            <Waves size={24} />
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-6 mt-4 relative z-10 pb-4 border-b border-indigo-900/50">
             <a href={OFFICIAL_SITE} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-300 hover:text-orange-400 transition-colors font-bold text-sm">
                <Globe size={18} /> SeaFa 官方網站
             </a>
             <a href={PORTFOLIO_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-300 hover:text-teal-400 transition-colors font-bold text-sm">
                <Camera size={18} /> 作品集
             </a>
             <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-300 hover:text-[#E1306C] transition-colors font-bold text-sm">
                <Instagram size={18} /> Instagram
             </a>
             <a href={LINE_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-300 hover:text-[#00C300] transition-colors font-bold text-sm">
                <MessageCircle size={18} /> LINE 客服: @022ocuil
             </a>
          </div>

          <div>
            <p className="font-black text-orange-50 text-lg mb-2 tracking-widest">SeaFa Mermaid Diving Club</p>
            <p className="text-indigo-400/80 font-bold text-sm">© 2026 帶您安全、優雅地探索水下世界. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {renderAdminModal()}
    </div>
  );
}