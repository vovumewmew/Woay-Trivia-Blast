import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMoneyBillWave } from 'react-icons/fa';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- QUẢN LÝ TRẠNG THÁI ĐĂNG NHẬP (State Management) ---
  const currentUser = location.state?.username; // Tên người dùng hiện tại
  const isLoggedIn = !!currentUser; // Trạng thái: true nếu đã đăng nhập, false nếu chưa

  const [step, setStep] = useState(1); // 1: Nhập PIN, 2: Nhập Tên
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // State điều khiển modal đăng xuất

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

  const handleJoin = () => {
    if (step === 1 && pin) {
      setStep(2);
    } else if (step === 2 && nickname) {
      // Hiện thông báo tính năng đang phát triển
      alert('Tính năng chọn nhân vật đang phát triển! 🦁🧧');
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
    navigate('/', { state: null }); // Xóa state đăng nhập
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

        {/* Nút Tạo Game */}
        <div className="relative group">
          <button 
            onClick={() => isLoggedIn ? alert('Tính năng tạo game đang phát triển! 🚧') : navigate('/login')}
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

      {/* Nút Quay lại (Chỉ hiện khi ở Step 2) */}
      {step === 2 && (
        <motion.button
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => setStep(1)}
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
                onChange={(e) => setPin(e.target.value)}
                placeholder="Nhập mã phòng..."
                className="w-full px-6 py-4 text-2xl text-center font-bold text-red-600 bg-yellow-50 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-200 placeholder-red-200 transition-all"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <label className="block text-red-800 font-bold mb-2 ml-1">BIỆT DANH (NICKNAME)</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Tên của bạn..."
                className="w-full px-6 py-4 text-2xl text-center font-bold text-red-600 bg-yellow-50 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-200 placeholder-red-200 transition-all"
              />
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleJoin}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-700 font-black text-xl rounded-xl shadow-lg border-b-4 border-yellow-600 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
          >
            {step === 1 ? "TIẾP TỤC" : (
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🦁</span>
                <span>CHỌN NHÂN VẬT</span>
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

      {/* Copyright */}
      <div className="absolute bottom-4 text-yellow-200 text-sm font-medium">
        © 2026 WOAY Trivia - Happy New Year
      </div>
    </div>
  );
};

export default Login;