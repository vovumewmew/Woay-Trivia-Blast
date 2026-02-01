import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Lấy username từ state khi chuyển trang, nếu không có thì mặc định là "Khách"
  const username = location.state?.username || "Khách";

  // Danh sách các tính năng (Menu)
  const menuItems = [
    { id: 0, title: "Tham Gia Game", icon: "🎮", color: "bg-green-600", desc: "Vào phòng chơi ngay" },
    { id: 1, title: "Tạo Game Mới", icon: "🎭", color: "bg-red-500", desc: "Làm Host tổ chức game" },
    { id: 2, title: "Lịch Sử Đấu", icon: "📜", color: "bg-orange-500", desc: "Xem lại thành tích" },
    { id: 3, title: "Bảng Xếp Hạng", icon: "🏆", color: "bg-yellow-500", desc: "Vinh danh top server" },
    { id: 4, title: "Cài Đặt", icon: "⚙️", color: "bg-red-600", desc: "Tài khoản & Âm thanh" },
  ];

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
    <div className="min-h-screen bg-yellow-50 font-sans">
      {/* --- HEADER --- */}
      <header className="bg-red-700 text-white p-6 shadow-lg rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center relative z-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-yellow-300">WOAY</h1>
            <p className="text-red-100 text-sm">Chúc mừng năm mới 2026 🐎</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Nút Home & Fullscreen trên Header */}
            <button onClick={() => navigate('/')} className="p-2 bg-red-800 rounded-full hover:bg-red-600 transition-colors" title="Về trang đăng nhập">
              🏠
            </button>
            <button onClick={toggleFullscreen} className="p-2 bg-red-800 rounded-full hover:bg-red-600 transition-colors" title="Toàn màn hình">
              ⛶
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3 bg-red-800 px-4 py-2 rounded-full border border-red-500 ml-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-red-700 font-bold">
                V
              </div>
              <span className="font-bold text-yellow-100">{username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-4xl mx-auto p-6 mt-4">
        {/* Banner Chúc Tết */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-6 mb-8 shadow-md flex items-center justify-between text-red-900"
        >
          <div>
            <h2 className="text-2xl font-bold mb-1">Khai Xuân Như Ý! 🌸</h2>
            <p className="font-medium opacity-80">Cùng chơi game để nhận lì xì may mắn nhé.</p>
          </div>
          <div className="text-5xl animate-bounce">🧧</div>
        </motion.div>

        {/* Grid Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, rotate: 1 }}
              whileTap={{ scale: 0.98 }}
              className={`${item.color} p-6 rounded-2xl shadow-lg cursor-pointer border-2 border-yellow-400/30 relative overflow-hidden group`}
              onClick={() => {
                if (item.id === 1) {
                  alert("Tính năng đang trong giai đoạn phát triển 🚧");
                } else if (item.id === 0) {
                  navigate('/', { state: { username: username } });
                } else {
                  console.log("Clicked", item.title);
                }
              }}
            >
              {/* Họa tiết nền mờ */}
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-20 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>

              <div className="relative z-10">
                <div className="text-4xl mb-3 bg-white/20 w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                <p className="text-white/80 text-sm">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* --- FOOTER --- */}
      <div className="fixed bottom-6 right-6">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          onClick={() => navigate('/')}
          className="bg-white text-red-600 p-4 rounded-full shadow-xl border-4 border-red-100 font-bold"
        >
          🔙 Thoát
        </motion.button>
      </div>
    </div>
  );
};

export default Home;