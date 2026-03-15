import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SESSION_TOKEN_KEY = 'woay_session_token';

const HostCreateGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy dữ liệu sửa từ trang Login (Sửa phòng) hoặc Home (Sửa/Tạo bộ câu hỏi)
  const { editRoomId, editQuizId, roomPin, editBaseQuizId, defaultTab } = location.state || {};
  const isEditRoomMode = !!editRoomId; 
  const isEditBaseMode = !!editBaseQuizId; 
  const isEditMode = isEditRoomMode || isEditBaseMode; 

  const [activeTab, setActiveTab] = useState(defaultTab || (isEditMode ? 'custom' : 'templates'));
  
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createdPin, setCreatedPin] = useState(null); // Lưu mã PIN khi tạo phòng thành công

  // State cho bộ câu hỏi tự tạo
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([
    {
      question_text: '',
      time_limit: 20,
      points: 1000,
      answers: [
        { answer_text: '', is_correct: true },
        { answer_text: '', is_correct: false },
        { answer_text: '', is_correct: false },
        { answer_text: '', is_correct: false }
      ]
    }
  ]);

  // Modal xác nhận xoá câu hỏi
  const [deleteModal, setDeleteModal] = useState({ show: false, index: null });
  
  // State quản lý việc lưu và điều hướng
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showNavigateConfirm, setShowNavigateConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSaveOptionsModal, setShowSaveOptionsModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      navigate('/login');
      return;
    }
    fetchQuizzes(token);
    
    // Lấy dữ liệu nếu đang ở chế độ sửa (phòng hoặc bộ câu hỏi gốc)
    const targetQuizId = editQuizId || editBaseQuizId;
    if (isEditMode && targetQuizId) {
      fetchQuizDetails(targetQuizId, token);
    }
  }, [navigate, editQuizId, editBaseQuizId, isEditMode]);

  const fetchQuizzes = async (token) => {
    try {
      const [resTemplates, resMy] = await Promise.all([
        fetch(`${API_BASE}/api/quizzes/templates`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/quizzes/my-quizzes`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const dataTemplates = await resTemplates.json();
      const dataMy = await resMy.json();
      
      let combined = [];
      if (dataTemplates.success) combined = [...combined, ...dataTemplates.data.map(q => ({...q, type: 'system'}))];
      if (dataMy.success) combined = [...combined, ...dataMy.data.map(q => ({...q, type: 'user'}))];
      setTemplates(combined);
    } catch (err) {
      console.error('Lỗi khi tải danh sách câu hỏi:', err);
    }
  };

  const fetchQuizDetails = async (quizId, token) => {
    try {
      const res = await fetch(`${API_BASE}/api/quizzes/${quizId}/full`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setQuizTitle(data.data.title);
        // Đảm bảo đủ 4 đáp án cho form dù DB có thể lưu ít hơn
        const formattedQuestions = data.data.questions.map(q => {
          const ans = q.answers || [];
          const paddedAns = [...Array(4)].map((_, i) => ans[i] ? { answer_text: ans[i].answer_text, is_correct: !!ans[i].is_correct } : { answer_text: '', is_correct: false });
          return { ...q, answers: paddedAns };
        });
        setQuestions(formattedQuestions);
        setHasUnsavedChanges(false); // Reset trạng thái khi load dữ liệu xong
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết quiz:', err);
    }
  };

  // --- HÀM TẠO PHÒNG CHƠI ---
  const handleCreateRoom = async (quizId) => {
    setIsLoading(true);
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    try {
      const res = await fetch(`${API_BASE}/api/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quiz_id: quizId })
      });
      const data = await res.json();
      if (data.success) {
        setHasUnsavedChanges(false);
        setCreatedPin(data.data.room_pin); // Hiển thị Modal Mã PIN
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (err) {
      alert('Không thể kết nối đến server!');
    } finally {
      setIsLoading(false);
    }
  };

  // --- NÚT BẤM LƯU CHÍNH ---
  const handleMainSaveButton = () => {
    // Validate cơ bản
    if (!quizTitle.trim()) return alert('Vui lòng nhập Tên bộ câu hỏi!');
    for (let i=0; i<questions.length; i++) {
      if (!questions[i].question_text.trim()) return alert(`Câu hỏi số ${i+1} không được để trống!`);
      const hasCorrect = questions[i].answers.some(a => a.is_correct);
      if (!hasCorrect) return alert(`Câu hỏi số ${i+1} chưa chọn đáp án đúng!`);
    }

    if (isEditMode) {
      executeSave(false, false);
    } else {
      setShowSaveOptionsModal(true); // Mở popup hỏi tạo phòng hay chỉ lưu
    }
  };

  // --- HÀM THỰC THI LƯU DỮ LIỆU ---
  const executeSave = async (navigateAfterSave = false, createRoom = false) => {
    // Đảm bảo validate lại nếu lưu từ modal thoát
    if (!quizTitle.trim() || questions.some(q => !q.question_text.trim() || !q.answers.some(a => a.is_correct))) {
      return;
    }

    setShowSaveOptionsModal(false);
    setIsLoading(true);
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    try {
      if (isEditRoomMode) {
        // --- NẾU ĐANG SỬA BỘ CÂU HỎI CỦA PHÒNG ---
        const resUpdate = await fetch(`${API_BASE}/api/rooms/${editRoomId}/update-quiz`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title: quizTitle, questions })
        });
        const dataUpdate = await resUpdate.json();
        
        if (dataUpdate.success) {
          setHasUnsavedChanges(false);
          if (navigateAfterSave === true) {
            navigate('/home');
          } else {
            setShowSuccessModal(true); // Hiện popup lưu thành công thay vì alert
          }
        } else {
          alert('Lỗi cập nhật: ' + dataUpdate.message);
        }
      } else if (isEditBaseMode) {
        // --- NẾU ĐANG SỬA BỘ CÂU HỎI GỐC TRONG QUẢN LÝ ---
        const resUpdate = await fetch(`${API_BASE}/api/quizzes/${editBaseQuizId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title: quizTitle, questions })
        });
        const dataUpdate = await resUpdate.json();
        
        if (dataUpdate.success) {
          setHasUnsavedChanges(false);
          if (navigateAfterSave === true) {
            navigate('/home');
          } else {
            setShowSuccessModal(true); 
          }
        } else {
          alert('Lỗi cập nhật: ' + dataUpdate.message);
        }
      } else {
        // --- NẾU TẠO PHÒNG MỚI ---
        const resQuiz = await fetch(`${API_BASE}/api/quizzes/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title: quizTitle, questions })
        });
        const dataQuiz = await resQuiz.json();
        
        if (dataQuiz.success) {
          setHasUnsavedChanges(false);
          if (createRoom) {
            handleCreateRoom(dataQuiz.quiz_id);
          } else {
            if (navigateAfterSave) {
              navigate('/home');
            } else {
              setShowSuccessModal(true); 
            }
          }
        } else {
          alert('Lỗi lưu câu hỏi: ' + dataQuiz.message);
        }
      }
    } catch (err) {
      alert('Không thể lưu câu hỏi!');
    } finally {
      if (!createRoom) setIsLoading(false);
    }
  };

  // --- LOGIC XỬ LÝ GIAO DIỆN FORM ---
  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: '', time_limit: 20, points: 1000,
      answers: [{answer_text: '', is_correct: true}, {answer_text: '', is_correct: false}, {answer_text: '', is_correct: false}, {answer_text: '', is_correct: false}]
    }]);
    setHasUnsavedChanges(true);
  };

  const updateQuestion = (qIndex, field, value) => {
    const newQ = [...questions];
    newQ[qIndex] = { ...newQ[qIndex], [field]: value };
    setQuestions(newQ);
    setHasUnsavedChanges(true);
  };

  const updateAnswer = (qIndex, aIndex, text) => {
    const newQ = [...questions];
    const updatedAnswers = [...newQ[qIndex].answers];
    updatedAnswers[aIndex] = { ...updatedAnswers[aIndex], answer_text: text };
    newQ[qIndex] = { ...newQ[qIndex], answers: updatedAnswers };
    setQuestions(newQ);
    setHasUnsavedChanges(true);
  };

  const setCorrectAnswer = (qIndex, aIndex) => {
    const newQ = [...questions];
    const updatedAnswers = newQ[qIndex].answers.map((a, i) => ({
      ...a,
      is_correct: i === aIndex
    }));
    newQ[qIndex] = { ...newQ[qIndex], answers: updatedAnswers };
    setQuestions(newQ);
    setHasUnsavedChanges(true);
  };

  const requestRemoveQuestion = (qIndex) => {
    if (questions.length === 1) return alert('Phải có ít nhất 1 câu hỏi!');
    setDeleteModal({ show: true, index: qIndex });
  };

  const confirmRemoveQuestion = () => {
    setQuestions(questions.filter((_, i) => i !== deleteModal.index));
    setDeleteModal({ show: false, index: null });
    setHasUnsavedChanges(true);
  };

  // --- XỬ LÝ NÚT QUAY LẠI TRANG CHỦ ---
  const handleBackToHome = () => {
    if (hasUnsavedChanges) {
      setShowNavigateConfirm(true);
    } else {
      navigate('/home');
    }
  };

  const confirmNavigateWithoutSaving = () => {
    setShowNavigateConfirm(false);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-yellow-50 font-sans p-6 pb-20">
      {/* Thanh Topbar */}
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-yellow-200">
        <button onClick={handleBackToHome} className="font-bold text-red-600 hover:text-red-800 flex items-center gap-2">
          <span>⬅</span> Về Trang Chủ
        </button>
        <h1 className="text-2xl font-black text-red-800 tracking-wide">THIẾT LẬP PHÒNG CHƠI</h1>
        <div className="w-24"></div> {/* Spacer để căn giữa tiêu đề */}
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {!isEditMode && (
          <button 
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-4 text-lg font-bold rounded-2xl transition-all ${activeTab === 'templates' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-white text-red-600 border-2 border-red-200 hover:bg-red-50'}`}
          >
            📚 Gói Câu Hỏi Có Sẵn (Classic)
          </button>
          )}
          <button 
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-4 text-lg font-bold rounded-2xl transition-all ${activeTab === 'custom' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-white text-red-600 border-2 border-red-200 hover:bg-red-50'}`}
          >
            {isEditRoomMode ? `✍️ Chỉnh Sửa Câu Hỏi Phòng [${roomPin}]` : isEditBaseMode ? '✍️ Chỉnh Sửa Bộ Câu Hỏi' : '✍️ Tự Tạo Bộ Câu Hỏi Mới'}
          </button>
        </div>

        {/* CONTENT TABS */}
        {activeTab === 'templates' ? (
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map(quiz => (
              <div key={quiz.quiz_id} className={`bg-white rounded-2xl p-6 shadow-xl border-b-8 border-r-8 flex flex-col justify-between ${quiz.type === 'system' ? 'border-yellow-400' : 'border-purple-400'}`}>
                <div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${quiz.type === 'system' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
                    {quiz.type === 'system' ? 'Hệ Thống' : 'Của Bạn'}
                  </span>
                  <h3 className="text-xl font-extrabold text-red-900 mt-3 mb-2">{quiz.title}</h3>
                  <p className="text-gray-500 font-medium text-sm">{quiz.type === 'system' ? 'Chế độ cơ bản - Thử thách kiến thức ngày Tết.' : 'Bộ câu hỏi tự tạo.'}</p>
                </div>
                <button 
                  onClick={() => handleCreateRoom(quiz.quiz_id)}
                  disabled={isLoading}
                  className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-red-900 font-black py-3 rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all w-full"
                >
                  {isLoading ? 'Đang tạo phòng...' : 'Tạo Phòng Ngay 🚀'}
                </button>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white p-8 rounded-3xl shadow-xl border-2 border-yellow-300">
            {/* Tên bộ câu hỏi */}
            <div className="mb-8">
              <label className="block text-red-800 font-bold mb-2 text-lg">Tiêu đề Gói Câu Hỏi:</label>
              <input 
                type="text" value={quizTitle} onChange={e => { setQuizTitle(e.target.value); setHasUnsavedChanges(true); }}
                placeholder="VD: Đố Vui Gia Đình 2026..."
                className="w-full text-xl p-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-100 font-bold text-gray-800 transition-all"
              />
            </div>

            {/* Danh sách câu hỏi */}
            <div className="space-y-8">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative">
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-red-600 text-white font-black rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                    {qIndex + 1}
                  </div>
                  <button onClick={() => requestRemoveQuestion(qIndex)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold">
                    ✖ Xóa
                  </button>
                  
                  <input 
                    type="text" value={q.question_text} onChange={e => updateQuestion(qIndex, 'question_text', e.target.value)}
                    placeholder="Nhập nội dung câu hỏi..."
                    className="w-full text-lg p-3 mt-2 border border-gray-300 rounded-lg mb-4 font-bold text-gray-800"
                  />
                  
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <label className="text-sm font-bold text-gray-500 mb-1 block">⏱ Thời gian (giây)</label>
                      <select value={q.time_limit} onChange={e => updateQuestion(qIndex, 'time_limit', parseInt(e.target.value))} className="w-full p-2 border rounded-lg font-medium">
                        <option value={10}>10 giây</option>
                        <option value={15}>15 giây</option>
                        <option value={20}>20 giây</option>
                        <option value={30}>30 giây</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-bold text-gray-500 mb-1 block">⭐ Điểm số</label>
                      <select value={q.points} onChange={e => updateQuestion(qIndex, 'points', parseInt(e.target.value))} className="w-full p-2 border rounded-lg font-medium">
                        <option value={500}>500 Điểm</option>
                        <option value={800}>800 Điểm</option>
                        <option value={1000}>1000 Điểm</option>
                        <option value={1200}>1200 Điểm</option>
                        <option value={1500}>1500 Điểm</option>
                        <option value={2000}>2000 Điểm</option>
                      </select>
                    </div>
                  </div>

                  <label className="text-sm font-bold text-gray-500 mb-2 block">Cài đặt Đáp án (Chọn ô tròn cho đáp án đúng):</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.answers.map((ans, aIndex) => {
                      const colors = ['border-red-400 bg-red-50', 'border-blue-400 bg-blue-50', 'border-yellow-400 bg-yellow-50', 'border-green-400 bg-green-50'];
                      return (
                        <div key={aIndex} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${colors[aIndex]} ${ans.is_correct ? 'ring-2 ring-offset-2 ring-gray-800' : ''}`}>
                          <input 
                            type="radio" name={`correct-${qIndex}`} checked={ans.is_correct} onChange={() => setCorrectAnswer(qIndex, aIndex)}
                            className="w-5 h-5 accent-gray-800 cursor-pointer"
                          />
                          <input 
                            type="text" value={ans.answer_text} onChange={e => updateAnswer(qIndex, aIndex, e.target.value)}
                            placeholder={`Đáp án ${aIndex + 1}`}
                            className="flex-1 bg-transparent border-none outline-none font-semibold text-gray-700 placeholder-gray-400"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center border-t-2 border-dashed border-gray-200 pt-6">
              <button onClick={addQuestion} className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                <span className="text-xl">+</span> Thêm Câu Hỏi
              </button>
              
              <button 
                onClick={handleMainSaveButton}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 font-black text-lg rounded-xl shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
              >
                {isLoading ? 'Đang xử lý...' : isEditMode ? 'Lưu Cập Nhật 💾' : 'Lưu Bộ Câu Hỏi 💾'}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* --- MODAL XÁC NHẬN XOÁ CÂU HỎI --- */}
      <AnimatePresence>
        {deleteModal.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border-4 border-red-500 shadow-2xl text-center"
            >
              <div className="text-6xl mb-4">🗑️</div>
              <h3 className="text-xl font-black text-red-700 mb-2">Xác nhận xoá?</h3>
              <p className="text-gray-600 font-medium mb-6">Bạn có chắc chắn muốn xoá câu hỏi số <b>{deleteModal.index + 1}</b> này không?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal({ show: false, index: null })} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Huỷ bỏ</button>
                <button onClick={confirmRemoveQuestion} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 border-b-4 border-red-800 active:border-b-0 active:translate-y-1">Chắc chắn xoá</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL HỎI LƯU KHI RỜI ĐI --- */}
      <AnimatePresence>
        {showNavigateConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border-4 border-yellow-500 shadow-2xl text-center"
            >
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-black text-yellow-600 mb-2">Chưa lưu thay đổi!</h3>
              <p className="text-gray-600 font-medium mb-6">Bạn có muốn lưu các chỉnh sửa trước khi rời đi không?</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setShowNavigateConfirm(false); executeSave(true, false); }} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 border-b-4 border-green-800 active:border-b-0 active:translate-y-1">Có</button>
                <button onClick={confirmNavigateWithoutSaving} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 border-b-4 border-red-800 active:border-b-0 active:translate-y-1">Không</button>
                <button onClick={() => setShowNavigateConfirm(false)} className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 mt-2">Hủy bỏ</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL BÁO LƯU THÀNH CÔNG --- */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border-4 border-green-500 shadow-2xl text-center"
            >
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-black text-green-600 mb-2">Lưu Thành Công!</h3>
              <p className="text-gray-600 font-medium mb-6">Bộ câu hỏi của bạn đã được cập nhật.</p>
              <button onClick={() => { setShowSuccessModal(false); navigate(isEditBaseMode ? '/home' : '/'); }} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 border-b-4 border-green-800 active:border-b-0 active:translate-y-1">Hoàn tất</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL CHỌN LƯU HAY TẠO PHÒNG MỚI --- */}
      <AnimatePresence>
        {showSaveOptionsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border-4 border-blue-500 shadow-2xl text-center"
            >
              <div className="text-6xl mb-4">💾</div>
              <h3 className="text-xl font-black text-blue-700 mb-2">Lưu Bộ Câu Hỏi</h3>
              <p className="text-gray-600 font-medium mb-6">Bạn có muốn tạo ngay một phòng chờ bằng bộ câu hỏi này không?</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => executeSave(false, true)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1">Tạo phòng mới</button>
                <button onClick={() => executeSave(false, false)} className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 border-b-4 border-purple-800 active:border-b-0 active:translate-y-1">Lưu vào bộ câu hỏi</button>
                <button onClick={() => setShowSaveOptionsModal(false)} className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 mt-2">Hủy</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL HIỂN THỊ MÃ PIN KHI TẠO XONG PHÒNG */}
      <AnimatePresence>
        {createdPin && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative border-8 border-yellow-400 overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.5)]"
            >
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
              <div className="relative z-10">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-2xl font-black text-red-600 mb-2 uppercase">Phòng Của Bạn Đã Sẵn Sàng!</h2>
                <p className="text-gray-600 font-medium mb-6">Mời người chơi nhập mã PIN dưới đây để tham gia.</p>
                
                <div className="bg-gray-100 py-4 px-6 rounded-2xl mb-8 border-2 border-gray-300 shadow-inner">
                  <span className="text-sm font-bold text-gray-400 block mb-1 uppercase tracking-widest">Mã PIN Game</span>
                  <span className="text-5xl font-black text-gray-900 tracking-[0.2em]">{createdPin}</span>
                </div>

                <button 
                  onClick={() => navigate('/', { state: { autoJoinPin: createdPin } })} 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all text-lg"
                >
                  Vào Sảnh Chờ Host 🚀
                </button>
                <button 
                  onClick={() => setCreatedPin(null)} 
                  className="mt-4 text-gray-500 font-bold hover:text-red-500"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HostCreateGame;