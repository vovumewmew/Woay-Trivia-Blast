import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // Import hook điều hướng

const Login = () => {
  const navigate = useNavigate(); // Khởi tạo điều hướng
  const [pin, setPin] = useState('');
  // ... (giữ nguyên các state cũ của bạn nếu có)

  // Hàm bật Fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-orange-800 relative overflow-hidden">
      
      {/* --- THANH CÔNG CỤ (TOOLBAR) GÓC TRÁI --- */}
      <div className="absolute top-4 left-4 flex gap-2 z-50">
        
        {/* 1. Nút Home: Điều hướng về trang chủ */}
        <button 
          onClick={() => navigate('/home')}
          className="bg-black/20 hover:bg-black/40 text-white p-3 rounded-full backdrop-blur-sm transition-all"
          title="Về trang chủ"
        >
          {/* Icon Ngôi nhà (SVG) */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>

        {/* 2. Nút Fullscreen: Phóng to màn hình */}
        <button 
          onClick={toggleFullScreen}
          className="bg-black/20 hover:bg-black/40 text-white p-3 rounded-full backdrop-blur-sm transition-all"
          title="Toàn màn hình"
        >
          {/* Icon Mở rộng (SVG) */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
        </button>

      </div>
      {/* --- HẾT THANH CÔNG CỤ --- */}

      {/* ... (Phần Logo và Form nhập PIN giữ nguyên như cũ) ... */}
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8 text-center z-10">
        <h1 className="text-5xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] italic tracking-wider">
          WOAY <span className="text-yellow-400">TRIVIA</span>
        </h1>
      </motion.div>

      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm z-10">
          <input
            type="text"
            placeholder="Game PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-2xl font-bold py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors placeholder:text-gray-400 text-gray-800 mb-4"
          />
          <button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-xl py-4 rounded-lg transition-transform active:scale-95 shadow-lg">
            Enter
          </button>
      </motion.div>

    </div>
  );
};

export default Login;