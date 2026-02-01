import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
      <footer className="bg-red-900 text-center py-8 text-red-300 border-t border-red-800">
        <p className="font-medium">© 2026 WOAY Capstone Project.</p>
        <p className="text-sm mt-1 opacity-70">Built with React, Node.js & Passion ❤️</p>
      </footer>
    </div>
  );
};

export default Landing;
