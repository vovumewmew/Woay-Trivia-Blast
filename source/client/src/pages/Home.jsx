import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-orange-500 mb-4">WOAY TRIVIA BLAST</h1>
      <p className="text-gray-300 mb-8 text-center max-w-md">
        Nền tảng Gamification tương tác nội bộ. Được thiết kế cho YEP 2026.
      </p>
      
      {/* Nút quay lại chơi game */}
      <button 
        onClick={() => navigate('/')}
        className="bg-white text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition"
      >
        🎮 Vào Chơi Ngay
      </button>
    </div>
  );
};

export default Home;