import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMoneyBillWave } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,20}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
const SESSION_TOKEN_KEY = 'woay_session_token';
const SESSION_USER_KEY = 'woay_session_user';

const HostLogin = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const moneyParticles = useMemo(() => {
    return [...Array(150)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      rotation: Math.random() * 360,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 10
    }));
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const parseResponse = async (response) => {
    try {
      return await response.json();
    } catch {
      return {};
    }
  };

  const handleLogin = async () => {
    clearMessages();

    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    if (!USERNAME_REGEX.test(username.trim())) {
      setError('Tài khoản phải dài 4-20 ký tự và chỉ gồm chữ, số hoặc dấu gạch dưới.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const data = await parseResponse(response);
      if (!response.ok || !data.success) {
        setError(data.message || 'Đăng nhập thất bại.');
        return;
      }

      const profile = data.data;
      localStorage.setItem(SESSION_TOKEN_KEY, profile.token);
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(profile));

      navigate('/home', {
        state: {
          username: profile.display_name || profile.username,
          user: profile
        }
      });
    } catch {
      setError('Không thể kết nối tới máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    clearMessages();

    if (!username.trim() || !displayName.trim() || !password) {
      setError('Vui lòng nhập đủ tài khoản, tên hiển thị và mật khẩu.');
      return;
    }

    if (!USERNAME_REGEX.test(username.trim())) {
      setError('Tài khoản phải dài 4-20 ký tự và chỉ gồm chữ, số hoặc dấu gạch dưới.');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError('Mật khẩu phải 8-64 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          displayName: displayName.trim(),
          password
        })
      });

      const data = await parseResponse(response);
      if (!response.ok || !data.success) {
        setError(data.message || 'Đăng ký thất bại.');
        return;
      }

      setSuccess('Đăng ký thành công. Vui lòng đăng nhập.');
      setMode('login');
      setPassword('');
    } catch {
      setError('Không thể kết nối tới máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (loading) {
      return;
    }

    if (mode === 'login') {
      handleLogin();
      return;
    }

    handleSignup();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-800 via-red-600 to-orange-500 flex items-center justify-center overflow-hidden relative">
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white/90 text-red-600 rounded-xl font-bold shadow-lg border-2 border-red-200 hover:bg-red-50 transition-all z-50"
      >
        <span>{'<'}</span> Quay lại
      </button>

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {moneyParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: -50, opacity: 0 }}
            animate={{
              y: '110vh',
              opacity: [0, 1, 1, 0],
              rotate: p.rotation + 360
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'linear'
            }}
            className="absolute text-2xl text-yellow-400 drop-shadow-[0_0_1.5px_#713f12]"
            style={{ left: `${p.left}%` }}
          >
            <FaMoneyBillWave />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl w-full max-w-md border-4 border-yellow-400 z-10 relative"
      >
        <div className="text-center mb-6 mt-2">
          <h1 className="text-4xl font-black text-red-600 mb-2">
            {mode === 'login' ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}
          </h1>
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

          {mode === 'signup' && (
            <div>
              <label className="block text-red-800 font-bold mb-1 ml-1 text-sm">TÊN HIỂN THỊ</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 text-lg font-bold text-red-600 bg-yellow-50 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 transition-all"
                placeholder="Nhập tên hiển thị..."
              />
            </div>
          )}

          <div>
            <label className="block text-red-800 font-bold mb-1 ml-1 text-sm">MẬT KHẨU</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-lg font-bold text-red-600 bg-yellow-50 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 transition-all"
              placeholder="Nhập mật khẩu..."
            />
            {mode === 'signup' && (
              <p className="text-xs text-red-700/70 mt-2 leading-relaxed">
                Mật khẩu mạnh: 8-64 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
              </p>
            )}
          </div>

          {error && (
            <div className="text-red-600 font-bold text-center bg-red-100 p-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-700 font-bold text-center bg-green-100 p-2 rounded-lg text-sm">
              {success}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 mt-2 bg-red-600 text-white font-black text-xl rounded-xl shadow-lg border-b-4 border-red-800 hover:bg-red-500 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'ĐANG XỬ LÝ...' : mode === 'login' ? 'ĐĂNG NHẬP NGAY' : 'ĐĂNG KÝ NGAY'}
          </motion.button>

          <div className="mt-6 text-center border-t-2 border-red-100 pt-4">
            {mode === 'login' ? (
              <>
                <p className="text-red-800/70 text-sm font-bold mb-3">Chưa có tài khoản?</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    clearMessages();
                    setPassword('');
                    setMode('signup');
                  }}
                  className="w-full py-3 bg-yellow-400 text-red-700 font-black text-xl rounded-xl shadow-lg border-b-4 border-yellow-600 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
                >
                  TẠO TÀI KHOẢN
                </motion.button>
              </>
            ) : (
              <>
                <p className="text-red-800/70 text-sm font-bold mb-3">Đã có tài khoản?</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    clearMessages();
                    setPassword('');
                    setMode('login');
                  }}
                  className="w-full py-3 bg-yellow-400 text-red-700 font-black text-xl rounded-xl shadow-lg border-b-4 border-yellow-600 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
                >
                  CHUYỂN SANG ĐĂNG NHẬP
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HostLogin;
