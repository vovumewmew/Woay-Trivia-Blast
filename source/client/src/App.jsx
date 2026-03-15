import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './pages/player/Login';
import Home from './pages/Home';
import HostLogin from './pages/HostLogin';
import Landing from './pages/Landing';
import Lobby from './pages/player/Lobby';
import HostCreateGame from './pages/HostCreateGame';
import Game from './pages/player/Game';

// --- COMPONENT QUẢN LÝ NHẠC NỀN TOÀN CỤC ---
function GlobalAudio() {
  const location = useLocation();
  const [volume, setVolume] = useState(0.4);
  const [isMuted, setIsMuted] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // Lưu trạng thái đang phát
  
  const audioRef = useRef(null);

  // Đổi bài hát khi chuyển trang
  useEffect(() => {
    const inGame = location.pathname === '/game';
    // Mã hóa URL để đảm bảo các khoảng trắng không bị trình duyệt báo lỗi 404 (encodeURI)
    const rawSrc = inGame 
      ? '/assets/sounds/SoundBackgroundGame.mp3' 
      : '/assets/sounds/SoundBackground.mp3';
      
    const newSrc = encodeURI(rawSrc);
      
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.src.includes(newSrc)) {
      audio.src = newSrc;
      audio.load();
      // Chỉ tự động phát bài mới nếu người dùng đã cho phép phát trước đó
      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    }
  }, [location.pathname, isPlaying]);

  // Áp dụng âm lượng
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Fix triệt để: Gọi audio.play() TRỰC TIẾP trong hàm xử lý sự kiện
  useEffect(() => {
    const handleFirstInteraction = () => {
      const audio = audioRef.current;
      // Ép chạy ngay lập tức cùng lúc với click chuột
      if (audio && audio.paused) {
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(e => console.log("Trình duyệt vẫn chặn:", e));
      }
    };
    
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  return (
    <div 
      className="fixed bottom-6 left-6 z-[9999]"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <div className="relative flex items-center">
        <AnimatePresence>
          {showSlider && (
            <motion.div 
              initial={{ opacity: 0, x: -10, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.8 }}
              className="absolute left-full ml-3 bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border-2 border-yellow-300 flex items-center"
            >
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={isMuted ? 0 : volume} 
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (parseFloat(e.target.value) > 0) setIsMuted(false);
                }}
                className="w-24 accent-red-600 cursor-pointer"
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            
            // Nếu đang tắt tiếng, hoặc chưa phát, thì bật lên và ÉP PHÁT TRỰC TIẾP
            if (isMuted || volume === 0 || audio.paused) {
              setIsMuted(false);
              if (volume === 0) setVolume(0.4);
              audio.play().then(() => setIsPlaying(true)).catch(() => {});
            } else {
              setIsMuted(true);
            }
          }}
          className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-full shadow-2xl border-4 border-yellow-400 flex items-center justify-center text-2xl hover:bg-yellow-100 hover:scale-110 active:scale-95 transition-all"
          title="Nhạc nền"
        >
          {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </button>
      </div>
      <audio ref={audioRef} loop />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter> 
      <Routes>
        {/* path="/" nghĩa là trang chủ mặc định. 
          element={<Login />} nghĩa là hiển thị trang Login.
        */}
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<HostLogin />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/create-game" element={<HostCreateGame />} />
        <Route path="/game" element={<Game />} />
      </Routes>
      <GlobalAudio />
    </BrowserRouter>
  );
}

export default App;