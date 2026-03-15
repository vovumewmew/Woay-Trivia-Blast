import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SESSION_TOKEN_KEY = 'woay_session_token';

// Danh sách sticker động
const STICKERS = [
  { id: 's1', icon: '🧧', name: 'Lì xì' },
  { id: 's2', icon: '🧨', name: 'Pháo nổ' },
  { id: 's3', icon: '🌸', name: 'Hoa đào' },
  { id: 's4', icon: '😂', name: 'Haha' },
  { id: 's5', icon: '😍', name: 'Tym' },
  { id: 's6', icon: '😡', name: 'Giận' },
  { id: 's7', icon: '🍻', name: 'Dô' },
  { id: 's8', icon: '🐴', name: 'Ngựa' }
];

const Lobby = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lấy dữ liệu từ trang đăng nhập truyền sang (Fallback nếu f5)
  const { pin = '123456', nickname = 'Khách', avatar = '🦁', isHost = false, roomData = null, userId = null } = location.state || {};

  // State quản lý
  const [players, setPlayers] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [kickModal, setKickModal] = useState({ show: false, playerId: null, playerName: '' });
  const [copySuccessMsg, setCopySuccessMsg] = useState('');
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const playersRef = useRef([]); 

  // --- KẾT NỐI SOCKET VÀ XỬ LÝ SỰ KIỆN ---
  useEffect(() => {
    socketRef.current = io(API_BASE);

    // Gửi yêu cầu vào sảnh
    socketRef.current.emit('join_lobby', { pin, nickname, avatar, isHost, userId });

    // Lắng nghe cập nhật danh sách người chơi (Bao gồm Bot do Server quản lý)
    socketRef.current.on('update_players', (serverPlayers) => {
      const mappedPlayers = serverPlayers.map(p => ({
        ...p,
        isMe: p.id === socketRef.current.id
      }));
      setPlayers(mappedPlayers);
    });

    socketRef.current.on('receive_chat', ({ playerId, content, type, senderName }) => {
      triggerPlayerAction(playerId, content, type, senderName);
    });

    socketRef.current.on('receive_sticker', ({ playerId, content, type, senderName }) => {
      triggerPlayerAction(playerId, content, type, senderName);
    });

    socketRef.current.on('kicked', () => {
      alert("Bạn đã bị Chủ phòng kích khỏi sảnh!");
      navigate('/');
    });

    socketRef.current.on('game_started', ({ hostMode }) => {
      navigate('/game', { state: { pin, nickname, avatar, isHost, roomData, mode: isHost ? hostMode : 'play', lobbyPlayers: playersRef.current } });
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [nickname, avatar, pin, isHost, navigate, roomData]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Hàm xử lý hiển thị bong bóng chat/sticker trên đầu nhân vật
  const triggerPlayerAction = (playerId, content, type, senderName = '') => {
    // Cập nhật trạng thái hiển thị bong bóng cho player
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return { 
          ...p, 
          activeMessage: type === 'text' ? content : null,
          activeSticker: type === 'sticker' ? content : null 
        };
      }
      return p;
    }));

    // Đẩy vào lịch sử chat
    setChatHistory(prev => [...prev, { 
      id: Date.now(), 
      sender: playerId === socketRef.current?.id ? nickname : senderName, 
      isMe: playerId === socketRef.current?.id,
      content, 
      type 
    }]);

    // Ẩn bong bóng sau 3.5 giây
    setTimeout(() => {
      setPlayers(prev => prev.map(p => {
        if (p.id === playerId && (p.activeMessage === content || p.activeSticker === content)) {
          return { ...p, activeMessage: null, activeSticker: null };
        }
        return p;
      }));
    }, 3500);
  };

  // Gửi tin nhắn text
  const handleSendChat = (e) => {
    e.preventDefault();
    const me = players.find(p => p.isMe);
    if (me && me.isMuted) return alert('Bạn đã bị Chủ phòng cấm chat!');
    if (!chatInput.trim()) return;
    socketRef.current.emit('send_chat', { pin, message: chatInput });
    setChatInput('');
  };

  // Gửi sticker
  const handleSendSticker = (stickerIcon) => {
    const me = players.find(p => p.isMe);
    if (me && me.isMuted) return alert('Bạn đã bị Chủ phòng cấm dùng sticker!');
    socketRef.current.emit('send_sticker', { pin, sticker: stickerIcon });
    setShowStickers(false);
  };

  // CHỨC NĂNG CỦA HOST
  const handleToggleMute = (playerId) => {
    socketRef.current.emit('toggle_mute', { pin, targetId: playerId });
  };

  const handleKickPlayer = (playerId, playerName) => {
    setKickModal({ show: true, playerId, playerName });
  };

  const confirmKickPlayer = () => {
    socketRef.current.emit('kick_player', { pin, targetId: kickModal.playerId });
    setKickModal({ show: false, playerId: null, playerName: '' });
  };

  const handleStartGame = async (mode) => {
    setShowStartModal(false);
    try {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/rooms/${roomData.room_id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        socketRef.current.emit('host_start_game', { pin, hostMode: mode });
      }
    } catch (err) {
      alert('Không thể bắt đầu game.');
    }
  };

  const handleCopyInvite = () => {
    const url = `${window.location.origin}/?pin=${pin}`;
    const text = `🧧 Tham gia trò chơi WOAY - Vui Tết Sum Vầy cùng tôi!\n📍 Mã phòng (PIN): ${pin}\n🔗 Truy cập ngay: ${url}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccessMsg(`Đã sao chép thông tin mời cho phòng: ${pin}`);
      setTimeout(() => setCopySuccessMsg(''), 3000);
    }).catch(() => {
      alert('Lỗi sao chép! Mã phòng của bạn là: ' + pin);
    });
  };

  // Đảm bảo tạo đủ 9 ô (Lưới 3x3)
  const gridSlots = [...Array(9)].map((_, i) => players[i] || null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-800 via-red-600 to-orange-500 flex font-sans overflow-hidden">
      
      {/* --- KHU VỰC TRÁI: LƯỚI NGƯỜI CHƠI (Grid 3x3) --- */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Nút thoát sảnh */}
        <button 
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold border border-white/30 hover:bg-white/30 transition-colors z-20"
        >
          ⬅ Thoát sảnh
        </button>

        {/* Nút Bắt đầu cho Host */}
        {isHost && (
          <button 
            onClick={() => setShowStartModal(true)}
            className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-800 px-6 py-2 rounded-full font-black shadow-[0_0_15px_rgba(250,204,21,0.5)] border-2 border-yellow-300 hover:scale-105 active:scale-95 transition-all z-20"
          >
            BẮT ĐẦU GAME 🚀
          </button>
        )}

        {/* Tiêu đề phòng */}
        <div className="pt-10 pb-4 text-center z-10">
          <h2 className="text-xl font-bold text-yellow-200 uppercase tracking-widest drop-shadow-md">Sảnh Chờ</h2>
          <div className="text-5xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] mt-2 tracking-widest flex items-center justify-center gap-4">
            <span>PIN: {pin}</span>
            {isHost && (
              <button 
                onClick={handleCopyInvite}
                className="text-3xl bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors shadow-sm active:scale-95"
                title="Sao chép thông tin mời"
              >
                📋
              </button>
            )}
          </div>
          <p className="text-yellow-400 font-medium mt-2 bg-black/20 inline-block px-4 py-1 rounded-full">
            Đang chờ Host bắt đầu... ({players.length}/9)
          </p>
        </div>

        {/* Lưới 3x3 */}
        <div className="flex-1 flex items-center justify-center p-8 z-10">
          <div className="grid grid-cols-3 gap-6 w-full max-w-4xl aspect-square max-h-[80vh]">
            {gridSlots.map((player, index) => (
              <div 
                key={player ? player.id : `empty-${index}`}
                className={`relative flex flex-col items-center justify-center rounded-3xl transition-all duration-500 group ${
                  player 
                    ? player.isMe ? 'bg-yellow-400/20 border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'bg-black/20 border-2 border-white/20'
                    : 'bg-black/10 border-2 border-dashed border-white/10'
                }`}
              >
                {player ? (
                  <>
                    {/* --- BONG BÓNG CHAT / STICKER --- */}
                    <AnimatePresence>
                      {player.activeMessage && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.5, originY: 1 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="absolute -top-16 bg-white text-red-900 font-bold px-4 py-2 rounded-2xl shadow-xl z-30 max-w-[150px] break-words text-center border-2 border-yellow-400"
                        >
                          {player.activeMessage}
                          {/* Mũi nhọn bong bóng */}
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-yellow-400"></div>
                          <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white z-10"></div>
                        </motion.div>
                      )}

                      {player.activeSticker && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0, y: 20 }}
                          animate={{ opacity: 1, scale: [1.5, 1, 1.2, 1], y: -80 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute text-7xl z-30 drop-shadow-[0_5px_15px_rgba(0,0,0,0.4)]"
                        >
                          {player.activeSticker}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* --- CÔNG CỤ QUẢN LÝ DÀNH CHO HOST --- */}
                    {isHost && !player.isMe && (
                      <div className="absolute top-2 right-2 flex gap-1 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleToggleMute(player.id)} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md border border-white/50 ${player.isMuted ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-700 hover:bg-white'}`} title={player.isMuted ? "Mở chat" : "Cấm chat"}>
                          {player.isMuted ? "🔇" : "💬"}
                        </button>
                        <button onClick={() => handleKickPlayer(player.id, player.name)} className="w-8 h-8 bg-red-600/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm shadow-md border border-white/50" title="Kích khỏi phòng">
                          🥾
                        </button>
                      </div>
                    )}

                    {/* Icon Muted (Cấm chat) */}
                    {player.isMuted && (
                      <div className="absolute top-2 left-2 text-red-500 bg-white/80 rounded-full w-8 h-8 flex items-center justify-center shadow-sm z-30">🔇</div>
                    )}

                    {/* Avatar Nhân Vật */}
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-7xl drop-shadow-xl mb-3"
                    >
                      {player.avatar}
                    </motion.div>

                    {/* Tên Nhân Vật */}
                    <div className={`px-4 py-1.5 rounded-full font-bold text-sm max-w-[90%] truncate shadow-inner ${
                      player.isMe ? 'bg-yellow-400 text-red-900' : 'bg-black/40 text-white'
                    } ${player.isMuted ? 'opacity-50' : ''}`}>
                      {isHost && player.isMe && <span className="mr-1">👑</span>}
                      {player.name} {player.isMe && !isHost && '(Bạn)'}
                    </div>
                  </>
                ) : (
                  // Ô trống
                  <div className="text-white/20 text-4xl">?</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- KHU VỰC PHẢI: BẢNG CHAT --- */}
      <div className="w-80 bg-white/95 backdrop-blur-md shadow-[-10px_0_30px_rgba(0,0,0,0.3)] flex flex-col z-20 border-l-4 border-yellow-400">
        
        {/* Header Chat */}
        <div className="bg-red-700 text-yellow-300 p-4 font-black text-xl flex items-center gap-2 border-b-4 border-red-800">
          <span>💬</span> Tán Gẫu
        </div>

        {/* Lịch sử Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-400 font-medium text-sm italic mt-10">
              Chưa có tin nhắn nào. Hãy là người đầu tiên bắt chuyện!
            </div>
          ) : (
            chatHistory.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, x: msg.isMe ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={msg.id} 
                className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-xs text-gray-500 font-bold mb-1 mx-1">{msg.sender}</span>
                {msg.type === 'sticker' ? (
                  <div className="text-4xl drop-shadow-md">{msg.content}</div>
                ) : (
                  <div className={`px-4 py-2 rounded-2xl max-w-[85%] break-words font-medium shadow-sm ${
                    msg.isMe 
                      ? 'bg-yellow-400 text-red-900 rounded-tr-sm' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm border border-gray-200'
                  }`}>
                    {msg.content}
                  </div>
                )}
              </motion.div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Chat & Stickers */}
        <div className="p-4 bg-white border-t-2 border-gray-100 relative">
          
          {/* Bảng chọn Sticker (Popup) */}
          <AnimatePresence>
            {showStickers && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-full right-4 mb-2 p-3 bg-white border-2 border-red-200 rounded-2xl shadow-xl grid grid-cols-4 gap-2 w-[calc(100%-2rem)]"
              >
                {STICKERS.map(st => (
                  <button 
                    key={st.id} 
                    onClick={() => handleSendSticker(st.icon)}
                    className="text-3xl p-2 hover:bg-yellow-100 rounded-xl transition-colors hover:scale-110"
                    title={st.name}
                  >
                    {st.icon}
                  </button>
                ))}
                <div className="absolute -bottom-[10px] right-8 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-red-200"></div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSendChat} className="flex gap-2">
            <button type="button" onClick={() => setShowStickers(!showStickers)} className="text-2xl p-2 bg-gray-100 hover:bg-yellow-100 text-gray-600 hover:text-red-600 rounded-xl transition-colors">
              😊
            </button>
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập tin nhắn..." 
              className="flex-1 bg-gray-100 border-none px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 font-medium"
            />
            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-4 rounded-xl font-bold transition-colors">
              Gửi
            </button>
          </form>
        </div>
      </div>

      {/* --- MODAL CHỌN CHẾ ĐỘ BẮT ĐẦU DÀNH CHO HOST --- */}
      <AnimatePresence>
        {showStartModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full border-4 border-yellow-400 shadow-2xl text-center"
            >
              <div className="text-6xl mb-4">👑</div>
              <h3 className="text-2xl font-black text-red-600 mb-2">Bắt Đầu Trò Chơi</h3>
              <p className="text-gray-600 font-medium mb-6">Bạn muốn tham gia game với vai trò gì?</p>
              
              <div className="flex flex-col gap-3">
                <button onClick={() => handleStartGame('play')} className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-red-800 font-black rounded-xl border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 transition-all shadow-md">🎮 Tham gia như Người Chơi</button>
                <button onClick={() => handleStartGame('spectate')} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all shadow-md">👀 Chỉ xem (Giám sát phòng)</button>
                <button onClick={() => setShowStartModal(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl mt-2 transition-colors">Huỷ bỏ</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL XÁC NHẬN KÍCH NGƯỜI CHƠI --- */}
      <AnimatePresence>
        {kickModal.show && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full border-4 border-red-500 shadow-2xl text-center"
            >
              <div className="text-6xl mb-4">🥾</div>
              <h3 className="text-2xl font-black text-red-600 mb-2">Đuổi Khỏi Phòng?</h3>
              <p className="text-gray-600 font-medium mb-6">Bạn có chắc chắn muốn kích <b>{kickModal.playerName}</b> ra khỏi phòng không?</p>
              <div className="flex gap-3">
                <button onClick={() => setKickModal({ show: false, playerId: null, playerName: '' })} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">Huỷ bỏ</button>
                <button onClick={confirmKickPlayer} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all">Đuổi Ngay</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- THÔNG BÁO COPY THÀNH CÔNG --- */}
      <AnimatePresence>
        {copySuccessMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-10 left-1/2 z-[100] bg-blue-100 border-2 border-blue-500 text-blue-800 px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-3 text-sm md:text-base whitespace-nowrap"
          >
            <span className="text-2xl">📋</span>
            {copySuccessMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Lobby;