import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMoneyBillWave } from 'react-icons/fa';

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Nhập PIN, 2: Nhập Tên
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');

  const handleJoin = () => {
    if (step === 1 && pin) {
      setStep(2);
    } else if (step === 2 && nickname) {
      // Giả lập login thành công
      navigate('/home');
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-800 via-red-600 to-orange-500 flex items-center justify-center overflow-hidden relative">
      {/* --- THANH CÔNG CỤ (Toolbar) --- */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-yellow-50 p-2 rounded-2xl border-2 border-yellow-200 shadow-lg z-50">
        <button 
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-yellow-100 text-red-700 font-bold text-sm transition-colors"
          title="Về trang chủ"
        >
          <span className="text-lg">🏠</span>
          <span>Trang chủ</span>
        </button>
        <button 
          onClick={() => alert('Tính năng Host đang phát triển!')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold text-sm shadow-sm transition-colors"
          title="Tạo phòng chơi mới"
        >
          <span className="text-lg">🎭</span>
          <span>Tạo Game</span>
        </button>
      </div>

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
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: "110vh", opacity: [0, 1, 1, 0], rotate: 360 }}
            transition={{ 
              duration: Math.random() * 5 + 5, // Rơi chậm từ 5-10s
              repeat: Infinity, 
              delay: Math.random() * 10, // Xuất hiện ngẫu nhiên
              ease: "linear" 
            }}
            className="absolute text-2xl text-yellow-400 drop-shadow-[0_0_1.5px_#713f12]" // Icon vàng, viền nâu rõ nét
            style={{ left: `${Math.random() * 100}%` }} // Rải đều chiều ngang
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
            {step === 1 ? "TIẾP TỤC 🧧" : "VÀO CHƠI NGAY 🚀"}
          </motion.button>
        </div>
      </motion.div>

      {/* Copyright */}
      <div className="absolute bottom-4 text-yellow-200 text-sm font-medium">
        © 2026 WOAY Trivia - Happy New Year
      </div>
    </div>
  );
};

export default Login;