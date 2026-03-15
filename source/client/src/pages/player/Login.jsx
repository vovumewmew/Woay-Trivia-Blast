import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMoneyBillWave } from 'react-icons/fa';

const SESSION_TOKEN_KEY = 'woay_session_token';
const SESSION_USER_KEY = 'woay_session_user';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- DANH SÁCH NHÂN VẬT (Avatars) ---
const AVATARS = [
  { id: 'lan', icon: '🦁' },
  { id: 'rong', icon: '🐉' },
  { id: 'meo', icon: '🐱' },
  { id: 'ngua', icon: '🐴' },
  { id: 'ho', icon: '🐯' },
  { id: 'chuot', icon: '🐭' },
  { id: 'heo', icon: '🐷' },
  { id: 'ga', icon: '🐔' },
  { id: 'cho', icon: '🐶' },
  { id: 'khi', icon: '🐵' },
  { id: 'ran', icon: '🐍' },
  { id: 'de', icon: '🐐' },
  { id: 'trau', icon: '🐮' },
  { id: 'tho', icon: '🐰' },
  { id: 'gau', icon: '🐻' },
  { id: 'cao', icon: '🦊' },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- QUẢN LÝ TRẠNG THÁI ĐĂNG NHẬP (State Management) ---
  const [currentUser, setCurrentUser] = useState(() => {
    if (location.state?.username) return location.state.username;
    try {
      const raw = localStorage.getItem(SESSION_USER_KEY);
      if (raw) {
        const user = JSON.parse(raw);
        return user.display_name || user.username;
      }
    } catch {
      return null;
    }
    return null;
  });

  const isLoggedIn = !!currentUser; // Trạng thái: true nếu đã đăng nhập, false nếu chưa

  const [step, setStep] = useState(1); // 1: Nhập PIN, 2: Nhập Tên, 3: Chọn Nhân vật
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [isHostRole, setIsHostRole] = useState(false); // Trạng thái Host
  const [avatar, setAvatar] = useState(''); // Lưu trữ nhân vật được chọn
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // State điều khiển modal đăng xuất
  const [error, setError] = useState(''); // State lưu lỗi kiểm tra mã PIN
  const [isLoading, setIsLoading] = useState(false); // State loading khi gọi API
  
  const [roomData, setRoomData] = useState(null); // Lưu trữ dữ liệu câu hỏi của phòng
  const [showHostModal, setShowHostModal] = useState(false); // Modal danh sách phòng Host
  const [hostRooms, setHostRooms] = useState([]); // Dữ liệu phòng Host
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  
  const [cancelModal, setCancelModal] = useState({ show: false, room: null, password: '', error: '', isLoading: false });
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');
  const [copySuccessMsg, setCopySuccessMsg] = useState('');
  const [joinRoomModal, setJoinRoomModal] = useState({ show: false, room: null });

  // Tự động vào phòng nếu được chuyển hướng từ trang Tạo Game
  useEffect(() => {
    if (location.state?.autoJoinPin && step === 1) {
      const pinToJoin = location.state.autoJoinPin;
      setPin(pinToJoin);
      
      const doAutoJoin = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`${API_BASE}/api/rooms/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pinToJoin })
          });
          const data = await response.json();
          if (data.success) {
            try {
              const raw = localStorage.getItem(SESSION_USER_KEY);
              if (raw) {
                const userObj = JSON.parse(raw);
                setIsHostRole(data.data.host_id === userObj.user_id);
              } else {
                setIsHostRole(false);
              }
            } catch (e) {
              setIsHostRole(false);
            }
            setRoomData(data.data);
            setStep(2); // Chuyển thẳng tới bước chọn tên
          } else {
            setError(data.message || 'Lỗi khi vào phòng.');
          }
        } catch (err) {
          setError('Không thể kết nối đến máy chủ.');
        } finally {
          setIsLoading(false);
          // Xóa state để không bị tự động vào lại nếu người dùng ấn "Quay lại"
          const safeState = location.state ? { ...location.state, autoJoinPin: undefined } : undefined;
          navigate('/', { state: safeState, replace: true });
        }
      };
      doAutoJoin();
    }
  }, [location.state?.autoJoinPin]);

  // Tự động điền mã PIN nếu có trên URL (được bạn bè mời qua link)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pinFromUrl = params.get('pin');
    if (pinFromUrl && step === 1 && !pin) {
      setPin(pinFromUrl);
    }
  }, [location.search, step, pin]);

  // Tạo danh sách hạt tiền (Memoized để không bị render lại khi nhập liệu)
  const moneyParticles = useMemo(() => {
    return [...Array(150)].map((_, i) => {
      return {
        id: i,
        left: Math.random() * 100, // Vị trí ngang ngẫu nhiên (0-100%)
        rotation: Math.random() * 360,
        duration: 5 + Math.random() * 5,
        delay: Math.random() * 10
      };
    });
  }, []);

  const handleJoin = async () => {
    setError('');
    if (step === 1 && pin) {
      // Kiểm tra Regex: Yêu cầu mã phòng phải là 6 chữ số
      const pinRegex = /^[0-9]{6}$/;
      if (!pinRegex.test(pin.trim())) {
        setError('Mã phòng không hợp lệ (Phải gồm 6 chữ số)!');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/rooms/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ pin: pin.trim() })
        });
        
        const data = await response.json();
        if (data.success) {
          // Kiểm tra xem người dùng hiện tại có phải là chủ phòng không
          try {
            const raw = localStorage.getItem(SESSION_USER_KEY);
            if (raw) {
              const userObj = JSON.parse(raw);
              setIsHostRole(data.data.host_id === userObj.user_id);
            } else {
              setIsHostRole(false);
            }
          } catch (e) {
            setIsHostRole(false);
          }
          setRoomData(data.data);
          setStep(2); // Mã phòng hợp lệ, chuyển sang bước nhập tên
        } else {
          setError(data.message || 'Lỗi khi vào phòng.');
        }
      } catch (err) {
        console.error("Lỗi fetch API:", err);
        setError('Không thể kết nối đến máy chủ.');
      } finally {
        setIsLoading(false);
      }
    } else if (step === 2 && nickname) {
      setStep(3); // Chuyển sang bước chọn nhân vật
    } else if (step === 3 && avatar) {
      let userId = null;
      try {
        const raw = localStorage.getItem(SESSION_USER_KEY);
        if (raw) userId = JSON.parse(raw).user_id;
      } catch(e) {}
      navigate('/lobby', { state: { pin, nickname, avatar, isHost: isHostRole, roomData, userId } });
    }
  };

  const handleConfirmJoinRoom = async () => {
    const selectedRoom = joinRoomModal.room;
    setJoinRoomModal({ show: false, room: null });
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: selectedRoom.room_pin })
      });
      const data = await response.json();
      if (data.success) {
        setRoomData(data.data);
        setPin(selectedRoom.room_pin);
        setIsHostRole(true);
        setStep(2);
        setShowHostModal(false);
      } else {
        setError(data.message || 'Lỗi khi vào phòng.');
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCancelRoom = async () => {
    if (!cancelModal.password) {
      setCancelModal(prev => ({ ...prev, error: 'Vui lòng nhập mật khẩu!' }));
      return;
    }

    setCancelModal(prev => ({ ...prev, isLoading: true, error: '' }));
    try {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      const response = await fetch(`${API_BASE}/api/rooms/${cancelModal.room.room_id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: cancelModal.password })
      });
      
      const data = await response.json();
      if (data.success) {
        // Loại bỏ phòng khỏi giao diện sau khi xoá thành công
        setHostRooms(prev => prev.filter(r => r.room_id !== cancelModal.room.room_id));
        setCancelSuccessMsg(`Đã huỷ phòng "${cancelModal.room.quiz_title} - ${cancelModal.room.room_pin}"`);
        setCancelModal({ show: false, room: null, password: '', error: '', isLoading: false });
        
        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => setCancelSuccessMsg(''), 3000);
      } else {
        setCancelModal(prev => ({ ...prev, isLoading: false, error: data.message }));
      }
    } catch (err) {
      setCancelModal(prev => ({ ...prev, isLoading: false, error: 'Lỗi kết nối đến máy chủ.' }));
    }
  };

  const handleCopyInvite = (pinCode) => {
    const url = `${window.location.origin}/?pin=${pinCode}`;
    const text = `🧧 Tham gia trò chơi WOAY - Vui Tết Sum Vầy cùng tôi!\n📍 Mã phòng (PIN): ${pinCode}\n🔗 Truy cập ngay: ${url}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccessMsg(`Đã sao chép thông tin mời cho phòng: ${pinCode}`);
      setTimeout(() => setCopySuccessMsg(''), 3000);
    }).catch(() => {
      alert('Lỗi sao chép! Mã phòng của bạn là: ' + pinCode);
    });
  };

  const handleOpenHost = async () => {
    setShowHostModal(true);
    setIsLoadingRooms(true);
    try {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/rooms/my-waiting`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHostRooms(data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách phòng:", err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Mở modal xác nhận
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  // Thực hiện đăng xuất
  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    setCurrentUser(null);
    navigate('/', { state: null, replace: true }); // Xóa state đăng nhập
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-800 via-red-600 to-orange-500 flex items-center justify-center overflow-hidden relative">
      {/* --- THANH CÔNG CỤ (Toolbar) --- */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-yellow-50 p-2 rounded-2xl border-2 border-yellow-200 shadow-lg z-50">
        {/* Nút Giới thiệu */}
        <div className="relative group">
          <button 
            onClick={() => navigate('/landing')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-yellow-100 text-red-700 font-bold text-sm transition-colors"
          >
            <span className="text-lg">ℹ️</span>
            <span>Giới thiệu</span>
          </button>
          {/* Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-2 bg-red-800 text-yellow-200 text-xs font-bold rounded-lg shadow-xl border border-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-50">
            Xem thông tin sản phẩm
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-800 border-t border-l border-yellow-400 rotate-45"></div>
          </div>
        </div>

        {isLoggedIn && (
          <>
            {/* Nút Trang chủ */}
            <div className="relative group">
              <button 
                onClick={() => navigate('/home')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-yellow-100 text-red-700 font-bold text-sm transition-colors"
              >
                <span className="text-lg">🏠</span>
                <span>Trang chủ</span>
              </button>
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-2 bg-red-800 text-yellow-200 text-xs font-bold rounded-lg shadow-xl border border-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-50">
                Về trang chính
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-800 border-t border-l border-yellow-400 rotate-45"></div>
              </div>
            </div>

            {/* Nút Host */}
            <div className="relative group">
              <button 
                onClick={handleOpenHost}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 font-bold text-sm shadow-sm transition-colors"
              >
                <span className="text-lg">👑</span>
                <span>Host</span>
              </button>
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-2 bg-red-800 text-yellow-200 text-xs font-bold rounded-lg shadow-xl border border-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-50">
                Quản lý phòng chờ
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-800 border-t border-l border-yellow-400 rotate-45"></div>
              </div>
            </div>

            {/* Nút Tạo Game */}
            <div className="relative group">
              <button 
                onClick={() => navigate('/create-game')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold text-sm shadow-sm transition-colors"
              >
                <span className="text-lg">🎭</span>
                <span>Tạo Game</span>
              </button>
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-2 bg-red-800 text-yellow-200 text-xs font-bold rounded-lg shadow-xl border border-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-50">
                Tổ chức phòng chơi mới
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-800 border-t border-l border-yellow-400 rotate-45"></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nút Đăng Nhập HOẶC Thông tin User (Góc phải trên) */}
      <div className="absolute top-4 right-4 z-50">
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-md border-2 border-yellow-300 rounded-full shadow-lg">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-red-700 font-bold shadow-inner">
                {currentUser.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-yellow-100">{currentUser}</span>
            </div>
            <button
              onClick={handleLogoutClick}
              className="px-3 py-2 bg-red-600 text-white text-sm font-bold rounded-xl border-2 border-red-400 shadow-lg hover:bg-red-700 transition-all"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-white/20 backdrop-blur-md border-2 border-yellow-300 text-yellow-100 font-bold rounded-full hover:bg-white/30 hover:text-white transition-all shadow-lg"
          >
            Đăng Nhập
          </button>
        )}
      </div>

      {/* Nút Quay lại (Hiện khi ở Step 2 và 3) */}
      {step > 1 && (
        <motion.button
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => {
            setStep(step - 1);
            setError('');
          }}
          className="absolute top-24 left-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-red-600 rounded-xl font-bold shadow-lg border-2 border-red-200 hover:bg-red-50 transition-all z-50"
        >
          <span>⬅</span> Quay lại
        </motion.button>
      )}

      {/* --- HỌA TIẾT TRANG TRÍ TẾT (Background Elements) --- */}
      {/* Lồng đèn treo góc trái */}
      <motion.div 
        animate={{ y: [0, 10, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-40 text-6xl z-0 opacity-80"
      >
        🏮
        <div className="h-20 w-1 bg-yellow-400 mx-auto -mt-2"></div>
      </motion.div>

      {/* Lồng đèn treo góc phải (Đối xứng) */}
      <motion.div 
        animate={{ y: [0, 10, 0], rotate: [0, -5, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-40 text-6xl z-0 opacity-80"
      >
        🏮
        <div className="h-20 w-1 bg-yellow-400 mx-auto -mt-2"></div>
      </motion.div>
      
      {/* --- TIỀN RƠI (Money Rain) --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {moneyParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: -50, opacity: 0 }}
            animate={{ 
              y: "110vh", 
              opacity: [0, 1, 1, 0], 
              rotate: p.rotation + 360
            }}
            transition={{ 
              duration: p.duration, 
              repeat: Infinity, 
              delay: p.delay,
              ease: "linear" 
            }}
            className="absolute text-2xl text-yellow-400 drop-shadow-[0_0_1.5px_#713f12]"
            style={{ left: `${p.left}%` }}
          >
            <FaMoneyBillWave />
          </motion.div>
        ))}
      </div>

      {/* --- DÂY PHÁO NỔ (Firecrackers) --- */}
      {/* Dây pháo bên Trái (Treo thấp hơn toolbar) */}
      <motion.div 
        className="absolute top-0 left-8 flex flex-col items-center z-0 opacity-90"
        animate={{ rotate: [-1, 1, -1], y: [0, 2, 0] }}
        transition={{ duration: 0.2, repeat: Infinity }}
      >
        <div className="w-1 h-10 bg-yellow-600 mb-[-5px]"></div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="text-5xl -my-3 drop-shadow-lg">🧨</div>
        ))}
        <motion.div 
          animate={{ scale: [1, 1.5, 0.8], opacity: [1, 0.8, 1] }}
          transition={{ duration: 0.1, repeat: Infinity }}
          className="text-4xl mt-[-10px]"
        >
          💥
        </motion.div>
      </motion.div>

      {/* Dây pháo bên Phải */}
      <motion.div 
        className="absolute top-0 right-8 flex flex-col items-center z-0 opacity-90"
        animate={{ rotate: [1, -1, 1], y: [0, 2, 0] }}
        transition={{ duration: 0.25, repeat: Infinity, delay: 0.1 }}
      >
        <div className="w-1 h-10 bg-yellow-600 mb-[-5px]"></div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="text-5xl -my-3 drop-shadow-lg">🧨</div>
        ))}
        <motion.div 
          animate={{ scale: [1, 1.4, 0.9], opacity: [1, 0.7, 1] }}
          transition={{ duration: 0.15, repeat: Infinity }}
          className="text-4xl mt-[-10px]"
        >
          💥
        </motion.div>
      </motion.div>

    

      {/* --- FORM CHÍNH (Main Card) --- */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl w-full max-w-md border-4 border-yellow-400 z-10 relative"
      >
        {/* Logo / Tiêu đề */}
        <div className="text-center mb-8 mt-4">
          <h1 className="text-5xl font-black text-red-600 mb-2 drop-shadow-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
            WOAY
          </h1>
          <p className="text-orange-600 font-medium text-lg">Vui Tết Sum Vầy 🧧</p>
        </div>

        {/* Input Area */}
        <div className="space-y-6">
          {step === 1 ? (
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <label className="block text-red-800 font-bold mb-2 ml-1"></label>
              <input
                type="text"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Nhập mã phòng..."
                className="w-full px-6 py-4 text-2xl text-center font-bold text-red-600 bg-yellow-50 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-200 placeholder-red-200 transition-all"
              />
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-red-600 font-bold text-center bg-red-100 p-3 rounded-xl border border-red-200 shadow-sm">
                  {error}
                </motion.div>
              )}
            </motion.div>
          ) : step === 2 ? (
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <label className="block text-red-800 font-bold mb-2 ml-1 flex items-center gap-2">
                BIỆT DANH (NICKNAME)
                {isHostRole && <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-md text-xs border border-orange-200 shadow-sm">👑 Chủ phòng</span>}
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Tên của bạn..."
                className="w-full px-6 py-4 text-2xl text-center font-bold text-red-600 bg-yellow-50 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-200 placeholder-red-200 transition-all"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl py-3 px-6 mb-6 inline-block shadow-inner">
                <span className="text-sm font-bold text-red-800/70 block mb-1">
                  NGƯỜI CHƠI {isHostRole && <span className="text-orange-600 ml-1 font-black">(👑 HOST)</span>}
                </span>
                <span className="text-3xl font-black text-red-600 uppercase tracking-wider">{nickname}</span>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {AVATARS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAvatar(item.icon)}
                    className={`text-4xl p-3 rounded-2xl border-4 transition-all duration-200 flex items-center justify-center ${
                      avatar === item.icon 
                      ? 'border-yellow-500 bg-yellow-200 scale-110 shadow-lg' 
                      : 'border-red-100 bg-white hover:bg-red-50 hover:border-red-300 hover:scale-105'
                    }`}
                  >
                    <span className="drop-shadow-md">{item.icon}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleJoin}
            disabled={(step === 3 && !avatar) || isLoading}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-700 font-black text-xl rounded-xl shadow-lg border-b-4 border-yellow-600 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "ĐANG KIỂM TRA..." : step === 1 ? "TIẾP TỤC" : step === 2 ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🦁</span>
                <span>CHỌN NHÂN VẬT</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🚀</span>
                <span>VÀO PHÒNG CHỜ</span>
              </div>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* --- MODAL XÁC NHẬN ĐĂNG XUẤT (Custom Dialog) --- */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border-4 border-yellow-400 shadow-2xl text-center relative overflow-hidden"
          >
            {/* Họa tiết nền */}
            <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
            <div className="text-6xl mb-2">🥺</div>
            <h3 className="text-2xl font-black text-red-600 mb-2">Bạn muốn rời đi?</h3>
            <p className="text-gray-600 font-medium mb-6">Đừng bỏ lỡ lì xì nhé! Bạn có chắc chắn muốn đăng xuất không?</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Ở lại chơi
              </button>
              <button 
                onClick={confirmLogout}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-colors border-b-4 border-red-800 active:border-b-0 active:translate-y-1"
              >
                Đăng xuất
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- MODAL DANH SÁCH PHÒNG HOST --- */}
      {showHostModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-2xl border-4 border-yellow-400 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="bg-red-700 p-4 text-white flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2"><span>👑</span> Quản Lý Phòng Chờ Của Bạn</h3>
              <button onClick={() => setShowHostModal(false)} className="text-red-200 hover:text-white font-bold text-xl">✖</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              {isLoadingRooms ? (
                <div className="text-center text-gray-500 font-bold py-10">Đang tải dữ liệu...</div>
              ) : hostRooms.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-6xl mb-4 opacity-50">📭</div>
                  <p className="text-gray-500 font-bold text-lg">Bạn chưa có phòng nào đang ở trạng thái chờ.</p>
                  <button onClick={() => { setShowHostModal(false); navigate('/create-game'); }} className="mt-4 px-6 py-2 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200">Tạo phòng ngay</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {hostRooms.map((room) => (
                    <div key={room.room_id} className="bg-white border-2 border-gray-200 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-orange-400 transition-all group">
                      <div className="flex-1 cursor-pointer" onClick={() => setJoinRoomModal({ show: true, room })}>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-black tracking-widest border border-yellow-300">
                            PIN: {room.room_pin}
                          </span>
                          <span className="text-gray-400 text-xs font-medium">{new Date(room.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                          {room.quiz_title} <span className="text-sm font-normal text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2">(Nhấn để vào sảnh)</span>
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCopyInvite(room.room_pin); }}
                          className="px-4 py-2 bg-green-100 text-green-700 font-bold rounded-xl hover:bg-green-200 transition-colors text-sm"
                        >
                          Mời bạn bè
                        </button>
                        <button 
                          onClick={() => navigate('/create-game', { state: { editRoomId: room.room_id, editQuizId: room.quiz_id, roomPin: room.room_pin } })}
                          className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200 transition-colors text-sm"
                        >
                          Sửa câu hỏi
                        </button>
                        <button 
                          onClick={() => setCancelModal({ show: true, room: room, password: '', error: '', isLoading: false })}
                          className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors text-sm"
                        >
                          Huỷ phòng
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* --- MODAL XÁC NHẬN VÀO LOBBY TỪ DANH SÁCH HOST --- */}
      {joinRoomModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border-4 border-orange-400 shadow-2xl text-center"
          >
            <div className="text-6xl mb-4">🚪</div>
            <h3 className="text-xl font-black text-orange-600 mb-2">Vào Sảnh Chờ?</h3>
            <p className="text-gray-600 font-medium mb-6 text-sm">
              Bạn có muốn tham gia vào sảnh chờ của phòng <b>{joinRoomModal.room?.quiz_title}</b> (PIN: <span className="text-orange-600 font-bold">{joinRoomModal.room?.room_pin}</span>) với tư cách là Chủ Phòng không?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setJoinRoomModal({ show: false, room: null })} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Huỷ bỏ</button>
              <button onClick={handleConfirmJoinRoom} className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all">Vào Phòng</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- MODAL XÁC NHẬN HUỶ PHÒNG --- */}
      {cancelModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border-4 border-red-500 shadow-2xl text-center"
          >
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-black text-red-600 mb-2">Huỷ Phòng Chờ</h3>
            <p className="text-gray-600 font-medium mb-4 text-sm">
              Bạn có chắc chắn muốn huỷ phòng <b>{cancelModal.room?.quiz_title}</b> (PIN: <span className="text-red-600 font-bold">{cancelModal.room?.room_pin}</span>) không? Hành động này không thể hoàn tác.
            </p>
            
            <div className="mb-4 text-left">
              <label className="block text-red-800 font-bold mb-1 text-sm">Nhập mật khẩu để xác nhận:</label>
              <input 
                type="password"
                value={cancelModal.password}
                onChange={(e) => setCancelModal({...cancelModal, password: e.target.value, error: ''})}
                className="w-full px-4 py-3 bg-red-50 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 transition-all font-medium"
                placeholder="Mật khẩu của bạn..."
              />
              {cancelModal.error && (
                <p className="text-red-600 text-sm font-bold mt-2 bg-red-100 p-2 rounded-lg text-center">{cancelModal.error}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setCancelModal({ show: false, room: null, password: '', error: '', isLoading: false })}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Huỷ bỏ
              </button>
              <button 
                onClick={handleConfirmCancelRoom}
                disabled={cancelModal.isLoading}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all"
              >
                {cancelModal.isLoading ? 'Đang xử lý...' : 'Xác nhận huỷ'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- THÔNG BÁO THÀNH CÔNG --- */}
      <AnimatePresence>
        {cancelSuccessMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-10 left-1/2 z-[100] bg-green-100 border-2 border-green-500 text-green-800 px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-3 text-sm md:text-base whitespace-nowrap"
          >
            <span className="text-2xl">✅</span>
            {cancelSuccessMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- THÔNG BÁO COPY THÀNH CÔNG --- */}
      <AnimatePresence>
        {copySuccessMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-10 left-1/2 z-[100] bg-blue-100 border-2 border-blue-500 text-blue-800 px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-3 text-sm md:text-base whitespace-nowrap"
          >
            <span className="text-2xl">📋</span>
            {copySuccessMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copyright */}
      <div className="absolute bottom-4 text-yellow-200 text-sm font-medium">
        © 2026 WOAY Trivia - Happy New Year
      </div>
    </div>
  );
};

export default Login;