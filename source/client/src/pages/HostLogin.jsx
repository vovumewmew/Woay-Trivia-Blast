import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMoneyBillWave } from 'react-icons/fa';

const HostLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Tái sử dụng hiệu ứng tiền rơi
  const moneyParticles = useMemo(() => {
    return [...Array(150)].map((_, i) => {
      return {
        id: i,
        left: Math.random() * 100,
        rotation: Math.random() * 360,
        duration: 5 + Math.random() * 5,
        delay: Math.random() * 10
      };
    });
  }, []);

  const handleLogin = () => {
    if (username === 'Vu123' && password === '123') {
      // Chuyển hướng sang Home và gửi kèm tên người dùng
      navigate('/home', { state: { username: username } });
    } else {
      setError('Tài khoản hoặc mật khẩu không đúng! 😅');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-800 via-red-600 to-orange-500 flex items-center justify-center overflow-hidden relative">
      {/* Nút quay lại */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-red-600 rounded-xl font-bold shadow-lg border-2 border-red-200 hover:bg-red-50 transition-all z-50"
      >
        <span>⬅</span> Quay lại
      </button>

      {/* --- BACKGROUND EFFECTS (Giữ nguyên theme Tết) --- */}
      <motion.div 
        animate={{ y: [0, 10, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-40 text-6xl z-0 opacity-80"
      >
        🏮
        <div className="h-20 w-1 bg-yellow-400 mx-auto -mt-2"></div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, 10, 0], rotate: [0, -5, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-40 text-6xl z-0 opacity-80"
      >
        🏮
        <div className="h-20 w-1 bg-yellow-400 mx-auto -mt-2"></div>
      </motion.div>
      
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

      {/* --- FORM ĐĂNG NHẬP --- */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl w-full max-w-md border-4 border-yellow-400 z-10 relative"
      >
        <div className="text-center mb-6 mt-2">
          <h1 className="text-4xl font-black text-red-600 mb-2">ĐĂNG NHẬP</h1>
          <p className="text-orange-600 font-medium"></p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-red-800 font-bold mb-1 ml-1 text-sm">TÀI KHOẢN</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 text-lg font-bold text-red-600 bg-yellow-50 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 transition-all"
              placeholder="Nhập tài khoản..."
            />
          </div>
          
          <div>
            <label className="block text-red-800 font-bold mb-1 ml-1 text-sm">MẬT KHẨU</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-lg font-bold text-red-600 bg-yellow-50 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 transition-all"
              placeholder="Nhập mật khẩu..."
            />
          </div>

          {error && (
            <div className="text-red-600 font-bold text-center bg-red-100 p-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            className="w-full py-3 mt-2 bg-red-600 text-white font-black text-xl rounded-xl shadow-lg border-b-4 border-red-800 hover:bg-red-500 active:border-b-0 active:translate-y-1 transition-all"
          >
            ĐĂNG NHẬP NGAY
          </motion.button>

          {/* Khu vực Đăng ký */}
          <div className="mt-6 text-center border-t-2 border-red-100 pt-4">
            <p className="text-red-800/70 text-sm font-bold mb-3">Chưa có tài khoản?</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => alert('Chức năng Đăng ký đang phát triển! 📝')}
              className="w-full py-3 bg-yellow-400 text-red-700 font-black text-xl rounded-xl shadow-lg border-b-4 border-yellow-600 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
            >
              ĐĂNG KÝ MIỄN PHÍ
            </motion.button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default HostLogin;
