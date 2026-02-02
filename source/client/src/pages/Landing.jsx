import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFacebook, FaGithub, FaEnvelope, FaYoutube } from 'react-icons/fa';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-800 via-red-600 to-orange-500 text-white overflow-y-auto font-sans">
      {/* --- NAVIGATION --- */}
      <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto sticky top-0 z-50 bg-red-800/80 backdrop-blur-md rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🐴</span>
          <h1 className="text-2xl font-black text-yellow-400 tracking-wider">WOAY PROJECT</h1>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-yellow-400 text-red-800 font-bold rounded-full shadow-lg hover:bg-yellow-300 hover:scale-105 transition-all border-2 border-yellow-200"
        >
          Vào Game Ngay 🎮
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="text-center py-20 px-4 relative overflow-hidden">
        {/* Hiệu ứng nền */}
        <div className="absolute top-10 left-10 text-8xl opacity-20 animate-bounce">🧧</div>
        <div className="absolute bottom-10 right-10 text-8xl opacity-20 animate-pulse">🏮</div>

        <motion.h2 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl md:text-7xl font-black mb-6 text-yellow-300 drop-shadow-[0_4px_0_#7f1d1d]"
        >
          DỰ ÁN THỰC TẬP
        </motion.h2>
        <motion.p 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-3xl max-w-4xl mx-auto text-red-100 font-medium"
        >
          Nền tảng tổ chức trò chơi trực tuyến tương tác thời gian thực <br/>
          <span className="text-yellow-400 font-bold">WOAY TRIVIA BLAST 2026</span>
        </motion.p>
      </header>

      {/* --- CONTENT SECTION --- */}
      <main className="max-w-6xl mx-auto px-6 pb-20 grid gap-16">
        
        {/* Giới thiệu */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border-2 border-yellow-400/30 shadow-2xl"
        >
          <h3 className="text-3xl font-bold text-yellow-400 mb-4 border-b-2 border-white/20 pb-2 inline-block">📖 Về Dự Án</h3>
          <p className="text-lg leading-relaxed text-justify">
            WOAY là một ứng dụng web hiện đại cho phép người dùng tổ chức (Host) và tham gia (Player) các trò chơi đố vui trực tuyến. 
            Lấy cảm hứng từ Kahoot nhưng mang đậm bản sắc văn hóa Việt Nam, đặc biệt là không khí Tết Nguyên Đán. 
            Hệ thống hỗ trợ tương tác thời gian thực (Real-time) với độ trễ thấp, mang lại trải nghiệm sôi động và kịch tính.
          </p>
        </motion.section>

        {/* Hình ảnh Demo (Placeholder) */}
        <section className="grid md:grid-cols-2 gap-8">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-red-900/40 rounded-3xl p-1 border-4 border-yellow-600 shadow-xl aspect-video relative group overflow-hidden"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
              <span className="text-6xl mb-2">💻</span>
              <p className="font-bold text-yellow-200 text-xl">Giao diện Quản lý (Host)</p>
            </div>
            {/* Sau này bạn có thể thay thẻ img vào đây */}
            {/* <img src="/path/to/host-screenshot.png" className="w-full h-full object-cover rounded-2xl" /> */}
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-red-900/40 rounded-3xl p-1 border-4 border-yellow-600 shadow-xl aspect-video relative group overflow-hidden"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
              <span className="text-6xl mb-2">📱</span>
              <p className="font-bold text-yellow-200 text-xl">Giao diện Người chơi (Player)</p>
            </div>
          </motion.div>
        </section>

        {/* Thành viên */}
        <section className="text-center">
          <h3 className="text-3xl font-bold text-yellow-400 mb-10">👨‍💻 Đội Ngũ Thực Hiện</h3>
          <div className="flex justify-center gap-8 flex-wrap">
            {/* Card thành viên */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-gradient-to-br from-red-700 to-red-900 p-6 rounded-2xl w-72 shadow-xl border border-yellow-400/50"
            >
              <div className="w-28 h-28 bg-yellow-400 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl border-4 border-white shadow-inner">
                N
              </div>
              <h4 className="text-2xl font-bold text-white">Nhật Minh</h4>
              <p className="text-yellow-200 font-medium mt-1">Fullstack Developer</p>
              <p className="text-red-200 text-sm mt-2 italic">"Code xuyên Tết, bug xuyên màn đêm"</p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-red-900 text-yellow-100 pt-16 pb-8 border-t-4 border-yellow-500 relative overflow-hidden">
        {/* Họa tiết chìm */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none select-none">
            <div className="absolute top-10 left-10 text-9xl">🌸</div>
            <div className="absolute bottom-10 right-10 text-9xl">🧧</div>
            <div className="absolute top-1/2 left-1/2 text-[20rem] -translate-x-1/2 -translate-y-1/2 rotate-12">🐎</div>
        </div>

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12 relative z-10">
          {/* Cột 1: Thông tin */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-4xl">🐴</span>
              <h2 className="text-2xl font-black text-yellow-400">WOAY PROJECT</h2>
            </div>
            <p className="opacity-80 leading-relaxed text-sm text-justify">
              Dự án tốt nghiệp mang đậm bản sắc Tết Việt 2026. Nơi kết nối mọi người qua những trò chơi đố vui kịch tính, thú vị và tràn ngập tiếng cười.
            </p>
          </div>

          {/* Cột 2: Liên kết nhanh */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4 border-b-2 border-yellow-500/30 pb-2 inline-block">Liên Kết Nhanh</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><button onClick={() => navigate('/')} className="hover:text-yellow-400 transition-colors flex items-center gap-2">🏠 Trang Chủ</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-yellow-400 transition-colors flex items-center gap-2">🎭 Đăng Nhập Host</button></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors flex items-center gap-2">📜 Điều Khoản Sử Dụng</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors flex items-center gap-2">🔒 Chính Sách Bảo Mật</a></li>
            </ul>
          </div>

          {/* Cột 3: Kết nối & Lì xì */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4 border-b-2 border-yellow-500/30 pb-2 inline-block">Kết Nối Với Chúng Tôi</h3>
            <div className="flex gap-4 mb-6">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-red-900 transition-all shadow-lg border border-yellow-500/20">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-red-900 transition-all shadow-lg border border-yellow-500/20">
                <FaGithub size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-red-900 transition-all shadow-lg border border-yellow-500/20">
                <FaYoutube size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-red-900 transition-all shadow-lg border border-yellow-500/20">
                <FaEnvelope size={20} />
              </a>
            </div>
            <p className="text-sm opacity-70 italic">"Code xuyên Tết - Bug xuyên màn đêm"</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-12 pt-8 border-t border-white/10 text-sm opacity-60 relative z-10">
          <p>© 2026 WOAY Capstone Project. All rights reserved.</p>
          <p className="mt-1">Designed with ❤️ & ☕ by NhatMinh Team</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
