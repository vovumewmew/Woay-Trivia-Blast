import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import Confetti from 'react-confetti';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SESSION_TOKEN_KEY = 'woay_session_token';

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pin, nickname, avatar, isHost, roomData, mode, lobbyPlayers } = location.state || {};

  // --- CÁC TRẠNG THÁI GAME LOOP ---
  const [gameState, setGameState] = useState('countdown'); // countdown -> playing -> feedback -> leaderboard
  const [countdown, setCountdown] = useState(3);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const questions = roomData?.questions || [];
  const currentQ = questions[currentQIndex];

  // Danh sách điểm mô phỏng cho Leaderboard cuối game
  const [leaderboardData, setLeaderboardData] = useState([]);
  const socketRef = useRef(null);

  // --- KHỞI TẠO ÂM THANH ---
  const tickSound = useRef(typeof Audio !== "undefined" ? new Audio('/assets/sounds/tick.mp3') : null);
  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio('/assets/sounds/correct.mp3') : null);
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio('/assets/sounds/wrong.mp3') : null);
  const cheerSound = useRef(typeof Audio !== "undefined" ? new Audio('/assets/sounds/cheer.mp3') : null);

  // --- STATE KÍCH THƯỚC MÀN HÌNH CHO CONFETTI ---
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (lobbyPlayers && lobbyPlayers.length > 0) {
      setLeaderboardData(lobbyPlayers.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        isMe: p.isMe,
        isBot: p.isBot
      })));
    }
  }, [lobbyPlayers]);

  // --- KẾT NỐI SOCKET ĐỂ ĐỒNG BỘ ĐIỂM SỐ ---
  useEffect(() => {
    socketRef.current = io(API_BASE);
    socketRef.current.emit('join_game_room', { pin });

    socketRef.current.on('sync_score', ({ nickname: syncName, avatar: syncAvatar, score: syncScore, isCorrect: syncCorrect }) => {
      setLeaderboardData(prev => prev.map(p => {
        // Cập nhật điểm cho người chơi khác hoặc bot (nếu được host gửi)
        if (!p.isMe && p.name === syncName && p.avatar === syncAvatar) {
          return { 
            ...p, 
            score: syncScore,
            correctAnswers: p.correctAnswers + (syncCorrect ? 1 : 0),
            wrongAnswers: p.wrongAnswers + (syncCorrect ? 0 : 1)
          };
        }
        return p;
      }));
    });

    return () => socketRef.current.disconnect();
  }, [pin]);

  // --- TỰ ĐỘNG GỌI API LƯU LỊCH SỬ KHI GAME KẾT THÚC (CHỈ DÀNH CHO HOST) ---
  const [hasSavedHistory, setHasSavedHistory] = useState(false);
  useEffect(() => {
    if (gameState === 'leaderboard' && isHost && roomData && !hasSavedHistory) {
      setHasSavedHistory(true);
      const saveHistory = async () => {
        try {
          const token = localStorage.getItem(SESSION_TOKEN_KEY);
          await fetch(`${API_BASE}/api/rooms/${roomData.room_id}/finish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ players: leaderboardData })
          });
        } catch (e) {
          console.error('Lỗi lưu lịch sử:', e);
        }
      };
      saveHistory();
    }
  }, [gameState, isHost, roomData, hasSavedHistory, leaderboardData]);

  // --- ĐẾM NGƯỢC LÚC MỚI VÀO PHÒNG ---
  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        if (tickSound.current) {
          tickSound.current.currentTime = 0;
          tickSound.current.play().catch(e => console.log("Trình duyệt chặn autoplay:", e));
        }
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState('playing');
        setTimeLeft(currentQ?.time_limit || 20);
      }
    }
  }, [countdown, gameState, currentQ]);

  // --- ĐẾM GIỜ TRẢ LỜI CÂU HỎI ---
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      if (timeLeft <= 5 && tickSound.current) { // Đánh tiếng tích tắc 5s cuối
        tickSound.current.currentTime = 0;
        tickSound.current.play().catch(e => {});
      }
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && timeLeft === 0) {
      handleTimeUp(); // Hết giờ không chọn kịp
    }
  }, [timeLeft, gameState]);

  // Khi hết giờ
  const handleTimeUp = () => {
    setSelectedAnswer(null);
    setIsCorrect(false);
    setPointsEarned(0);
    setGameState('feedback');
    if (mode !== 'spectate' && wrongSound.current) {
      wrongSound.current.currentTime = 0;
      wrongSound.current.play().catch(e => {});
    }
    scheduleNext(0, false);
  };

  // Xử lý khi nhấn chọn câu trả lời
  const handleSelectAnswer = (answer, index) => {
    if (gameState !== 'playing') return;
    
    setSelectedAnswer(index);
    const correct = answer.is_correct;
    setIsCorrect(correct);
    
    let earned = 0;
    if (correct) {
      // Trả lời càng nhanh điểm càng cao (thấp nhất 50% điểm gốc)
      const ratio = Math.max(0.5, timeLeft / (currentQ.time_limit || 20));
      earned = Math.round((currentQ.points || 1000) * ratio);
      setScore(prev => {
        const newTotal = prev + earned;
        if (socketRef.current && mode !== 'spectate') {
          socketRef.current.emit('submit_score', { pin, nickname, avatar, score: newTotal, isCorrect: correct });
        }
        return newTotal;
      });
      if (mode !== 'spectate' && correctSound.current) {
        correctSound.current.currentTime = 0;
        correctSound.current.play().catch(e => {});
      }
    } else {
      if (mode !== 'spectate' && wrongSound.current) {
        wrongSound.current.currentTime = 0;
        wrongSound.current.play().catch(e => {});
      }
    }
    setPointsEarned(earned);
    setGameState('feedback');
    scheduleNext(earned, correct);
  };

  // Chờ 3s phản hồi rồi qua câu tiếp hoặc kết thúc game
  const scheduleNext = (earned = 0, currentIsCorrect = false) => {
    // Cập nhật điểm cho giả lập Bot
    setLeaderboardData(prev => prev.map(p => {
      if (p.isMe) return { 
        ...p, 
        score: p.score + earned,
        correctAnswers: p.correctAnswers + (currentIsCorrect ? 1 : 0),
        wrongAnswers: p.wrongAnswers + (currentIsCorrect ? 0 : 1)
      };
      if (!p.isBot) return p; // Nếu là người chơi thật khác, điểm sẽ đồng bộ bằng realtime sau
      
      // Chỉ có Host mới tính điểm cho Bot và gửi cho mọi người để đảm bảo đồng bộ 100%
      if (isHost) {
        const numAnswers = currentQ.answers.length || 4;
        const botPickedIndex = Math.floor(Math.random() * numAnswers);
        const botAnswer = currentQ.answers[botPickedIndex];
        
        let botEarned = 0;
        const botCorrect = botAnswer && botAnswer.is_correct;
        if (botCorrect) {
          const botRatio = 0.5 + Math.random() * 0.5;
          botEarned = Math.round((currentQ.points || 1000) * botRatio);
        }
        
        const newBotScore = p.score + botEarned;
        if (socketRef.current) {
          socketRef.current.emit('submit_score', { pin, nickname: p.name, avatar: p.avatar, score: newBotScore, isCorrect: botCorrect });
        }
        return { 
          ...p, 
          score: newBotScore,
          correctAnswers: p.correctAnswers + (botCorrect ? 1 : 0),
          wrongAnswers: p.wrongAnswers + (botCorrect ? 0 : 1)
        };
      }

      return p; // Không phải Host thì không tính điểm Bot, chờ Host gửi qua Socket
    }));

    setTimeout(() => {
      if (currentQIndex < questions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
        setGameState('playing');
        setTimeLeft(questions[currentQIndex + 1].time_limit || 20);
        setSelectedAnswer(null);
      } else {
        setGameState('leaderboard');
        if (cheerSound.current) {
          cheerSound.current.currentTime = 0;
          cheerSound.current.play().catch(e => {});
        }
      }
    }, 3000);
  };

  const SHAPES = ['▲', '◆', '●', '■'];
  const COLORS = ['bg-red-600 border-red-800', 'bg-blue-600 border-blue-800', 'bg-yellow-500 border-yellow-700 text-red-900', 'bg-green-600 border-green-800'];

  if (!roomData) return <div className="min-h-screen bg-red-800 flex items-center justify-center text-white">Lỗi Dữ Liệu!</div>;

  // ================== GIAO DIỆN ==================
  
  // MÀN HÌNH ĐẾM NGƯỢC
  if (gameState === 'countdown') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-800 to-orange-600 flex items-center justify-center">
        <motion.div key={countdown} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 2, opacity: 0 }} className="text-9xl font-black text-yellow-400 drop-shadow-2xl">
          {countdown > 0 ? countdown : 'BẮT ĐẦU!'}
        </motion.div>
      </div>
    );
  }

  // MÀN HÌNH XẾP HẠNG CUỐI GAME
  if (gameState === 'leaderboard') {
    const sorted = [...leaderboardData].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-800 to-blue-900 text-white font-sans p-6 flex flex-col items-center overflow-hidden">
        <Confetti width={windowSize.width} height={windowSize.height} recycle={true} numberOfPieces={400} gravity={0.15} />
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10 mt-6">
          <h1 className="text-5xl font-black text-yellow-400 mb-2 drop-shadow-lg">BẢNG VÀNG VINH DANH</h1>
          <p className="text-xl font-medium opacity-80">Phòng: {roomData.quiz_title}</p>
        </motion.div>
        <div className="w-full max-w-4xl bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-end justify-center h-80 gap-4 sm:gap-8 mb-8">
            {sorted.slice(0, 3).map((player, index) => {
              const order = index === 0 ? 1 : index === 1 ? 0 : 2; // Sắp xếp bục: 2 - 1 - 3
              if(!sorted[order]) return null;
              const p = sorted[order];
              return (
                <motion.div key={p.id} initial={{ height: 0 }} animate={{ height: '100%' }} transition={{ duration: 1, delay: index * 0.3 }} className="flex flex-col items-center justify-end w-1/4">
                  <div className="text-4xl mb-2 relative">
                    {p.avatar}
                    {order === 0 && <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl">👑</span>}
                  </div>
                  <div className={`w-full rounded-t-xl flex flex-col items-center pt-4 font-bold shadow-inner ${order===0?'bg-yellow-400 h-full':order===1?'bg-gray-300 h-4/5':'bg-orange-400 h-3/5'} relative`}>
                    <span className="text-black z-10 text-2xl drop-shadow-sm">{p.score}</span>
                    <span className="text-black/70 z-10 text-sm mt-1 truncate w-full text-center px-1">{p.name} {p.isMe && '(Bạn)'}</span>
                    <span className="text-black/50 z-10 text-6xl font-black absolute bottom-4">{order + 1}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="flex justify-center mt-10">
            <button onClick={() => navigate('/home')} className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl border-b-4 border-red-800 transition-all text-xl shadow-lg">TRỞ VỀ TRANG CHỦ</button>
          </div>
        </div>
      </div>
    );
  }

  // MÀN HÌNH CHƠI GAME CHÍNH
  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col relative overflow-hidden">
      {/* Header trạng thái */}
      <header className="bg-white px-6 py-4 shadow-md flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-4">
          <div className="text-3xl drop-shadow-sm">{avatar}</div>
          <div>
            <div className="font-bold text-gray-800">{nickname} {isHost && <span className="text-xs bg-orange-100 text-orange-600 px-2 rounded ml-1">👑 Host</span>}</div>
            <div className="text-sm font-black text-gray-500 bg-gray-100 px-3 py-1 rounded-full mt-1">ĐIỂM: {score}</div>
          </div>
        </div>
        {/* Đồng hồ */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-inner border-4 transition-colors ${timeLeft <= 5 ? 'bg-red-600 border-red-800 animate-pulse' : 'bg-purple-600 border-purple-800'}`}>
            {timeLeft}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-gray-400">PIN: {pin}</div>
          <div className="font-black text-purple-700 text-lg">{currentQIndex + 1} / {questions.length}</div>
        </div>
      </header>

      {/* Nội dung câu hỏi */}
      <main className="flex-1 flex flex-col p-6 z-10">
        <div className="flex-1 flex items-center justify-center bg-white rounded-3xl shadow-lg border-2 border-gray-200 mb-6 p-8 text-center relative">
          {mode === 'spectate' && <div className="absolute top-4 right-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Chỉ Xem</div>}
          <h2 className="text-3xl md:text-5xl font-black text-gray-800 leading-tight">{currentQ.question_text}</h2>
        </div>
        {/* Nút đáp án */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64 md:h-80">
          {currentQ.answers.map((ans, index) => {
            let stateClass = COLORS[index];
            if (gameState === 'feedback') {
              if (ans.is_correct) stateClass = 'bg-green-500 border-green-700 shadow-[0_0_30px_rgba(34,197,94,0.6)]';
              else if (selectedAnswer === index) stateClass = 'bg-red-600 border-red-800 opacity-50';
              else stateClass = 'bg-gray-300 border-gray-400 opacity-30 text-gray-500';
            }
            return (
              <motion.button key={ans.answer_id} whileHover={gameState === 'playing' && mode !== 'spectate' ? { scale: 1.02 } : {}} whileTap={gameState === 'playing' && mode !== 'spectate' ? { scale: 0.98 } : {}} onClick={() => mode !== 'spectate' && handleSelectAnswer(ans, index)} disabled={gameState !== 'playing' || mode === 'spectate'} className={`relative rounded-xl border-b-8 shadow-md flex items-center p-6 text-white font-bold text-xl md:text-2xl transition-all ${stateClass}`}>
                <span className="text-4xl mr-6 opacity-80">{SHAPES[index]}</span>
                <span className="text-left leading-snug">{ans.answer_text}</span>
                {gameState === 'feedback' && ans.is_correct && <span className="absolute right-6 text-4xl">✅</span>}
              </motion.button>
            );
          })}
        </div>
      </main>

      {/* Màn hình Phản hồi */}
      <AnimatePresence>
        {gameState === 'feedback' && mode !== 'spectate' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${isCorrect ? 'bg-green-500/90' : 'bg-red-600/90'} backdrop-blur-sm`}>
            <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className="text-9xl mb-6 drop-shadow-2xl">{isCorrect ? '🎯' : '❌'}</motion.div>
            <h2 className="text-5xl font-black text-white drop-shadow-md mb-4">{isCorrect ? 'CHÍNH XÁC!' : 'SAI RỒI!'}</h2>
            {isCorrect ? <div className="bg-black/20 px-6 py-2 rounded-full text-white font-bold text-2xl shadow-inner">+ {pointsEarned} ĐIỂM</div> : <div className="bg-black/20 px-6 py-2 rounded-full text-white font-bold text-xl shadow-inner">Cố gắng câu sau nhé!</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Game;