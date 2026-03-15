import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SESSION_TOKEN_KEY = 'woay_session_token';
const SESSION_USER_KEY = 'woay_session_user';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const savedUser = (() => {
    try {
      const raw = localStorage.getItem(SESSION_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const username = location.state?.username || savedUser?.display_name || savedUser?.username || 'Khách';

  // --- STATE CHO DỮ LIỆU TỪ BACKEND ---
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // State điều khiển modal đăng xuất
  
  // State Quản lý Bộ câu hỏi
  const [showQuizManager, setShowQuizManager] = useState(false);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [isLoadingMyQuizzes, setIsLoadingMyQuizzes] = useState(false);
  const [deleteQuizModal, setDeleteQuizModal] = useState({ show: false, quiz: null, password: '', error: '', isLoading: false });
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');

  // --- STATE LỊCH SỬ ĐẤU ---
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // --- STATE BẢNG XẾP HẠNG ---
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // --- GỌI API LẤY QUIZ KHI VỪA MỞ TRANG ---
  useEffect(() => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      setLoading(false);
      navigate('/login');
      return;
    }

    fetch(`${API_BASE}/api/quizzes/templates`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem(SESSION_TOKEN_KEY);
          localStorage.removeItem(SESSION_USER_KEY);
          navigate('/login');
          return null;
        }
        return res.json();
      })
      .then((response) => {
        if (!response) {
          return;
        }

        if (response.success) {
          setQuizzes(response.data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Lỗi kết nối đến Backend:', error);
        setLoading(false);
      });
  }, [navigate]);

  // Danh sách các tính năng (Menu)
  const menuItems = [
    { id: 0, title: "Tham Gia Game", icon: "🎮", color: "bg-green-600", desc: "Vào phòng chơi ngay" },
    { id: 1, title: "Tạo Game Mới", icon: "🎭", color: "bg-red-500", desc: "Làm Host tổ chức game" },
    { id: 2, title: "Lịch Sử Đấu", icon: "📜", color: "bg-orange-500", desc: "Xem lại thành tích" },
    { id: 3, title: "Bảng Xếp Hạng", icon: "🏆", color: "bg-yellow-500", desc: "Vinh danh top server" },
    { id: 5, title: "Quản Lý Câu Hỏi", icon: "📚", color: "bg-purple-600", desc: "Sửa/Xoá bộ câu hỏi" },
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

  // Mở modal xác nhận
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  // Thực hiện đăng xuất
  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    navigate('/login');
  };

  // --- HÀM MỞ LỊCH SỬ ĐẤU VÀ GỌI API ---
  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/history/my-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setGameHistory(data.data);
      }
    } catch (error) {
      console.error('Lỗi lấy lịch sử đấu:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // --- HÀM MỞ BẢNG XẾP HẠNG VÀ GỌI API ---
  const handleOpenLeaderboard = async () => {
    setShowLeaderboardModal(true);
    setIsLoadingLeaderboard(true);
    try {
      const res = await fetch(`${API_BASE}/api/history/leaderboard`);
      const data = await res.json();
      if (data.success) {
        setLeaderboardData(data.data);
      }
    } catch (error) {
      console.error('Lỗi lấy bảng xếp hạng:', error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const handleOpenQuizManager = async () => {
    setShowQuizManager(true);
    setIsLoadingMyQuizzes(true);
    try {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/quizzes/my-quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMyQuizzes(data.data);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách quiz:', error);
    } finally {
      setIsLoadingMyQuizzes(false);
    }
  };

  const handleConfirmDeleteQuiz = async () => {
    if (!deleteQuizModal.password) {
      setDeleteQuizModal(prev => ({ ...prev, error: 'Vui lòng nhập mật khẩu!' }));
      return;
    }
    setDeleteQuizModal(prev => ({ ...prev, isLoading: true, error: '' }));
    
    try {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/quizzes/${deleteQuizModal.quiz.quiz_id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deleteQuizModal.password })
      });
      const data = await res.json();
      
      if (data.success) {
        setMyQuizzes(prev => prev.filter(q => q.quiz_id !== deleteQuizModal.quiz.quiz_id));
        setDeleteSuccessMsg(`Đã huỷ bộ câu hỏi "${deleteQuizModal.quiz.title}"`);
        setDeleteQuizModal({ show: false, quiz: null, password: '', error: '', isLoading: false });
        
        setTimeout(() => setDeleteSuccessMsg(''), 3000);
      } else {
        setDeleteQuizModal(prev => ({ ...prev, isLoading: false, error: data.message }));
      }
    } catch (error) {
      setDeleteQuizModal(prev => ({ ...prev, isLoading: false, error: 'Lỗi kết nối' }));
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 font-sans pb-24">
      {/* --- HEADER --- */}
      <header className="bg-red-700 text-white p-6 shadow-lg rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center relative z-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-yellow-300 tracking-wider">WOAY</h1>
            <p className="text-red-100 text-sm font-medium">Chúc mừng năm mới 2026 🐎</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Nút Fullscreen trên Header */}
            <button onClick={toggleFullscreen} className="p-2 bg-red-800 rounded-full hover:bg-red-600 transition-colors" title="Toàn màn hình">
              ⛶
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3 bg-red-800 px-4 py-2 rounded-full border border-red-500 ml-2 shadow-inner">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-red-700 font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-yellow-100">{username}</span>
            </div>

            {/* Nút Đăng Xuất */}
            <button
              onClick={handleLogoutClick}
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-full border-2 border-red-400 shadow-lg hover:bg-red-500 transition-all ml-1"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-4xl mx-auto p-6 mt-4">
        {/* Banner Chúc Tết */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-6 mb-8 shadow-md flex items-center justify-between text-red-900 border-2 border-yellow-300"
        >
          <div>
            <h2 className="text-2xl font-black mb-1">Khai Xuân Như Ý! 🌸</h2>
            <p className="font-medium opacity-90">Cùng chơi game để nhận lì xì may mắn nhé.</p>
          </div>
          <div className="text-5xl animate-bounce drop-shadow-lg">🧧</div>
        </motion.div>

        {/* Grid Menu Chức năng */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, rotate: 1 }}
              whileTap={{ scale: 0.98 }}
              className={`${item.color} p-6 rounded-2xl shadow-lg cursor-pointer border-2 border-white/20 relative overflow-hidden group`}
              onClick={() => {
                if (item.id === 1) {
                  navigate('/create-game');
                } else if (item.id === 0) {
                  navigate('/', { state: { username: username } });
                } else if (item.id === 5) {
                  handleOpenQuizManager();
                } else if (item.id === 2) {
                  handleOpenHistory();
                } else if (item.id === 3) {
                  handleOpenLeaderboard();
                } else {
                  console.log("Clicked", item.title);
                }
              }}
            >
              {/* Họa tiết nền mờ */}
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-20 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>

              <div className="relative z-10">
                <div className="text-4xl mb-3 bg-white/20 w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                <p className="text-white/90 text-sm font-medium">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* --- KHU VỰC DATA TỪ BACKEND: BỘ CÂU HỎI MẪU --- */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-black text-red-800 uppercase tracking-wide">
              🔥 Bộ Câu Hỏi Nổi Bật
            </h2>
            <div className="flex-1 h-0.5 bg-red-200 rounded-full"></div>
          </div>

          {loading ? (
            // Trạng thái đang tải dữ liệu
            <div className="flex flex-col justify-center items-center py-12">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mb-4"
              ></motion.div>
              <p className="text-red-600 font-medium animate-pulse">Đang kết nối kho câu hỏi...</p>
            </div>
          ) : (
            // Hiển thị danh sách câu hỏi
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz, index) => (
                <motion.div 
                  key={quiz.quiz_id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15, duration: 0.5, type: "spring" }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl p-6 shadow-xl border-b-8 border-r-8 border-yellow-400 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-red-200">
                        Hệ Thống
                      </span>
                      <span className="text-gray-400 text-xs font-bold bg-gray-100 px-2 py-1 rounded-md">
                        {quiz.quiz_id}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-red-900 leading-snug mb-2">
                      {quiz.title}
                    </h3>
                  </div>
                  
                  <div className="flex justify-between items-end mt-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Số câu hỏi</span>
                      <span className="text-yellow-600 font-black text-lg">10 Câu</span>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-colors flex items-center gap-2"
                      onClick={() => navigate('/create-game')}
                    >
                      Chơi Ngay 🚀
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

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

      {/* --- MODAL QUẢN LÝ BỘ CÂU HỎI --- */}
      {showQuizManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-2xl border-4 border-purple-400 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="bg-purple-700 p-4 text-white flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2"><span>📚</span> Quản Lý Bộ Câu Hỏi Của Bạn</h3>
              <button onClick={() => setShowQuizManager(false)} className="text-purple-200 hover:text-white font-bold text-xl">✖</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              <button 
                onClick={() => navigate('/create-game', { state: { defaultTab: 'custom' } })}
                className="w-full mb-6 py-3 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:shadow-md font-bold rounded-xl transition-all flex justify-center items-center gap-2 border-2 border-dashed border-purple-300"
              >
                <span className="text-xl">+</span> Tạo bộ câu hỏi mới
              </button>

              {isLoadingMyQuizzes ? (
                <div className="text-center text-gray-500 font-bold py-10">Đang tải dữ liệu...</div>
              ) : myQuizzes.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-6xl mb-4 opacity-50">📭</div>
                  <p className="text-gray-500 font-bold text-lg">Bạn chưa tạo bộ câu hỏi nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myQuizzes.map((quiz) => (
                    <div key={quiz.quiz_id} className="bg-white border-2 border-gray-200 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-purple-400 transition-colors">
                      <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-1">{quiz.title}</h4>
                        <span className="text-gray-400 text-xs font-medium bg-gray-100 px-2 py-1 rounded-md">
                          Tạo lúc: {new Date(quiz.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => navigate('/create-game', { state: { editBaseQuizId: quiz.quiz_id } })}
                          className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200 transition-colors text-sm"
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => setDeleteQuizModal({ show: true, quiz: quiz, password: '', error: '', isLoading: false })}
                          className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors text-sm"
                        >
                          Xoá
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

      {/* --- MODAL XÁC NHẬN XOÁ BỘ CÂU HỎI --- */}
      {deleteQuizModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border-4 border-red-500 shadow-2xl text-center"
          >
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-black text-red-600 mb-2">Huỷ Bộ Câu Hỏi</h3>
            <p className="text-gray-600 font-medium mb-4 text-sm">
              Bạn có chắc chắn muốn xoá bộ câu hỏi <b>{deleteQuizModal.quiz?.title}</b> không? Các phòng đang dùng bộ này sẽ bị ảnh hưởng!
            </p>
            
            <div className="mb-4 text-left">
              <label className="block text-red-800 font-bold mb-1 text-sm">Nhập mật khẩu để xác nhận:</label>
              <input 
                type="password"
                value={deleteQuizModal.password}
                onChange={(e) => setDeleteQuizModal({...deleteQuizModal, password: e.target.value, error: ''})}
                className="w-full px-4 py-3 bg-red-50 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 transition-all font-medium"
                placeholder="Mật khẩu của bạn..."
              />
              {deleteQuizModal.error && (
                <p className="text-red-600 text-sm font-bold mt-2 bg-red-100 p-2 rounded-lg text-center">{deleteQuizModal.error}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteQuizModal({ show: false, quiz: null, password: '', error: '', isLoading: false })}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Huỷ bỏ
              </button>
              <button 
                onClick={handleConfirmDeleteQuiz}
                disabled={deleteQuizModal.isLoading}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all"
              >
                {deleteQuizModal.isLoading ? 'Đang xử lý...' : 'Xác nhận xoá'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- THÔNG BÁO THÀNH CÔNG --- */}
      <AnimatePresence>
        {deleteSuccessMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-10 left-1/2 z-[100] bg-green-100 border-2 border-green-500 text-green-800 px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-3 text-sm md:text-base whitespace-nowrap"
          >
            <span className="text-2xl">✅</span>
            {deleteSuccessMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL LỊCH SỬ ĐẤU --- */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-2xl border-4 border-orange-400 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="bg-orange-600 p-4 text-white flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2"><span>📜</span> Lịch Sử Đấu Của Bạn</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-orange-200 hover:text-white font-bold text-xl">✖</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-orange-50">
              {isLoadingHistory ? (
                <div className="text-center text-orange-500 font-bold py-10">Đang tải dữ liệu...</div>
              ) : gameHistory.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-6xl mb-4 opacity-50">📭</div>
                  <p className="text-gray-500 font-bold text-lg">Bạn chưa tham gia trận đấu nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {gameHistory.map((match) => (
                    <div key={match.id} className="bg-white border-2 border-orange-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      {/* Hiệu ứng nền cho Top 3 */}
                      {match.rank_pos === 1 && <div className="absolute top-0 left-0 w-2 h-full bg-yellow-400"></div>}
                      {match.rank_pos === 2 && <div className="absolute top-0 left-0 w-2 h-full bg-gray-400"></div>}
                      {match.rank_pos === 3 && <div className="absolute top-0 left-0 w-2 h-full bg-orange-800"></div>}

                      <div className="pl-4 mb-3 sm:mb-0">
                        <h4 className="text-lg font-bold text-gray-800 mb-1">{match.quizTitle}</h4>
                        <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded-md">🕒 {new Date(match.date).toLocaleString('vi-VN')}</span>
                          <span>👥 {match.totalPlayers} Người chơi</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 pl-4 sm:pl-0">
                        <div className="text-right">
                          <span className="block text-xs font-bold text-gray-400 uppercase">Điểm số</span>
                          <span className="text-xl font-black text-orange-600">{match.score}</span>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shadow-inner border-2 ${
                          match.rank_pos === 1 ? 'bg-yellow-100 border-yellow-400 text-yellow-600' :
                          match.rank_pos === 2 ? 'bg-gray-100 border-gray-400 text-gray-600' :
                          match.rank_pos === 3 ? 'bg-orange-100 border-orange-400 text-orange-800' :
                          'bg-blue-50 border-blue-200 text-blue-600'
                        }`}>
                          #{match.rank_pos}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* --- MODAL BẢNG XẾP HẠNG --- */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-2xl border-4 border-yellow-400 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="bg-yellow-500 p-4 text-red-900 flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2"><span>🏆</span> Bảng Xếp Hạng Máy Chủ</h3>
              <button onClick={() => setShowLeaderboardModal(false)} className="text-red-800 hover:text-red-900 font-bold text-xl">✖</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-yellow-50">
              {isLoadingLeaderboard ? (
                <div className="text-center text-yellow-600 font-bold py-10">Đang tải dữ liệu...</div>
              ) : leaderboardData.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-6xl mb-4 opacity-50">🏆</div>
                  <p className="text-gray-500 font-bold text-lg">Chưa có dữ liệu xếp hạng.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboardData.map((player, index) => (
                    <div key={player.user_id} className="bg-white border-2 border-yellow-200 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      {/* Hiệu ứng nền cho Top 3 */}
                      {index === 0 && <div className="absolute top-0 left-0 w-2 h-full bg-yellow-400"></div>}
                      {index === 1 && <div className="absolute top-0 left-0 w-2 h-full bg-gray-400"></div>}
                      {index === 2 && <div className="absolute top-0 left-0 w-2 h-full bg-orange-800"></div>}

                      <div className="flex items-center gap-4 pl-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                          index === 0 ? 'bg-yellow-400 text-white shadow-md' :
                          index === 1 ? 'bg-gray-300 text-white shadow-md' :
                          index === 2 ? 'bg-orange-400 text-white shadow-md' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-800">{player.name}</h4>
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                            🎮 {player.totalGames} trận
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="block text-xs font-bold text-gray-400 uppercase">Tổng điểm</span>
                        <span className="text-xl font-black text-yellow-600">{player.totalScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default Home;
