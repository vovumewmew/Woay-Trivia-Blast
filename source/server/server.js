const crypto = require('crypto');
const cors = require('cors');
const express = require('express');
const mysql = require('mysql2');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const SALT_BYTES = 16;
const HASH_BYTES = 64;
const HASH_PREFIX = 'scrypt';
const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRES_SECONDS = 60 * 60 * 12; // 12 hours
const JWT_SECRET = process.env.JWT_SECRET || 'woay_dev_secret_change_me';
const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,20}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
const USER_ID_PREFIX = 'USR_';
const USER_ID_PAD_LENGTH = 2;
const USER_ID_LOCK_NAME = 'woay_user_id_sequence_lock';

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
const dbPromise = db.promise();

db.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL connection error:', err.message);
    return;
  }

  console.log('Connected to MySQL database:', process.env.DB_NAME);
  connection.release();
});

function toBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload) {
  const header = { alg: JWT_ALGORITHM, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + JWT_EXPIRES_SECONDS
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(fullPayload));
  const content = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(content)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${content}.${signature}`;
}

function parseBase64UrlToJson(base64Url) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

function verifyJwt(token) {
  if (!token) {
    return { valid: false, message: 'Thiếu token' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, message: 'Token không hợp lệ' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const content = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(content)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const actualSigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSignature);
  const isSignatureValid =
    actualSigBuffer.length === expectedSigBuffer.length &&
    crypto.timingSafeEqual(actualSigBuffer, expectedSigBuffer);

  if (!isSignatureValid) {
    return { valid: false, message: 'Token sai chữ ký' };
  }

  try {
    const header = parseBase64UrlToJson(encodedHeader);
    const payload = parseBase64UrlToJson(encodedPayload);

    if (header.alg !== JWT_ALGORITHM || header.typ !== 'JWT') {
      return { valid: false, message: 'Token sai định dạng' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp <= now) {
      return { valid: false, message: 'Token đã hết hạn' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, message: 'Token không thể giải mã' };
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const hasBearer = authHeader.startsWith('Bearer ');
  if (!hasBearer) {
    return res.status(401).json({ success: false, message: 'Thiếu Bearer token' });
  }

  const token = authHeader.slice(7).trim();
  const result = verifyJwt(token);
  if (!result.valid) {
    return res.status(401).json({ success: false, message: result.message });
  }

  req.authUser = result.payload;
  return next();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const hash = crypto.scryptSync(password, salt, HASH_BYTES).toString('hex');
  return `${HASH_PREFIX}$${salt}$${hash}`;
}

function verifyPassword(plainPassword, storedPassword) {
  if (!storedPassword) {
    return false;
  }

  const [algorithm, salt, hash] = String(storedPassword).split('$');
  if (algorithm === HASH_PREFIX && salt && hash) {
    const computed = crypto.scryptSync(plainPassword, salt, HASH_BYTES).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'));
  }

  // Backward compatibility for legacy plain text rows.
  return plainPassword === storedPassword;
}

app.get('/api/test-db', (req, res) => {
  const query = 'SELECT user_id, username, display_name FROM users';

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database query failed' });
    }

    return res.json({
      success: true,
      data: results
    });
  });
});

app.post('/api/auth/signup', async (req, res) => {
  const username = (req.body.username || '').trim();
  const displayName = (req.body.displayName || '').trim();
  const password = req.body.password || '';

  if (!username || !displayName || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập đầy đủ tài khoản, tên hiển thị và mật khẩu'
    });
  }

  if (!USERNAME_REGEX.test(username)) {
    return res.status(400).json({
      success: false,
      message: 'Tên tài khoản phải dài 4-20 ký tự và chỉ gồm chữ, số hoặc dấu gạch dưới'
    });
  }

  if (displayName.length < 2 || displayName.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Tên hiển thị phải dài từ 2 đến 100 ký tự'
    });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu phải 8-64 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
    });
  }

  let connection;
  let lockAcquired = false;

  try {
    connection = await dbPromise.getConnection();
    await connection.beginTransaction();

    const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS locked', [USER_ID_LOCK_NAME]);
    lockAcquired = lockRows[0] && lockRows[0].locked === 1;
    if (!lockAcquired) {
      await connection.rollback();
      return res.status(503).json({
        success: false,
        message: 'Hệ thống đang bận, vui lòng thử lại sau'
      });
    }

    const [existingUsers] = await connection.query(
      'SELECT user_id FROM users WHERE username = ? LIMIT 1 FOR UPDATE',
      [username]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'Tài khoản đã tồn tại' });
    }

    const [lastUserRows] = await connection.query(`
      SELECT user_id
      FROM users
      WHERE user_id REGEXP '^USR_[0-9]+$'
      ORDER BY CAST(SUBSTRING(user_id, 5) AS UNSIGNED) DESC
      LIMIT 1
      FOR UPDATE
    `);

    let nextSequence = 1;
    if (lastUserRows.length > 0) {
      const match = String(lastUserRows[0].user_id).match(/^USR_(\d+)$/);
      if (match) {
        nextSequence = Number.parseInt(match[1], 10) + 1;
      }
    }

    const userId = `${USER_ID_PREFIX}${String(nextSequence).padStart(USER_ID_PAD_LENGTH, '0')}`;
    const passwordHash = hashPassword(password);

    await connection.query(
      'INSERT INTO users (user_id, username, password_hash, display_name) VALUES (?, ?, ?, ?)',
      [userId, username, passwordHash, displayName]
    );

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user_id: userId,
        username,
        display_name: displayName
      }
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        // Ignore rollback errors and return original failure.
      }
    }

    console.error('Signup error:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo tài khoản' });
  } finally {
    if (connection) {
      if (lockAcquired) {
        try {
          await connection.query('SELECT RELEASE_LOCK(?)', [USER_ID_LOCK_NAME]);
        } catch (releaseLockError) {
          // Lock auto-releases when connection closes.
        }
      }
      connection.release();
    }
  }
});

app.post('/api/auth/login', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập tài khoản và mật khẩu'
    });
  }

  if (!USERNAME_REGEX.test(username)) {
    return res.status(400).json({
      success: false,
      message: 'Tên tài khoản không đúng định dạng'
    });
  }

  const findUserSql = `
    SELECT user_id, username, password_hash, display_name
    FROM users
    WHERE username = ?
    LIMIT 1
  `;

  db.query(findUserSql, [username], (err, users) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập' });
    }

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
    }

    const user = users[0];
    const isValidPassword = verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
    }

    const token = signJwt({
      user_id: user.user_id,
      username: user.username,
      display_name: user.display_name
    });

    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user_id: user.user_id,
        username: user.username,
        display_name: user.display_name
      }
    });
  });
});

app.get('/api/auth/session', authMiddleware, (req, res) => {
  return res.json({
    success: true,
    message: 'Phiên đăng nhập hợp lệ',
    data: req.authUser
  });
});

app.get('/api/quizzes/templates', authMiddleware, (req, res) => {
  const query = `
    SELECT quiz_id, title, created_at
    FROM quizzes
    WHERE is_template = TRUE
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Query error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    return res.json({
      success: true,
      data: results
    });
  });
});

// --- API: KIỂM TRA MÃ PIN VÀ LẤY DỮ LIỆU PHÒNG CHƠI ---
app.post('/api/rooms/join', async (req, res) => {
  const pin = (req.body.pin || '').trim();

  if (!pin) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập mã phòng!' });
  }

  try {
    // 1. Kiểm tra xem phòng có tồn tại với mã PIN không
    const [rooms] = await dbPromise.query('SELECT room_id, quiz_id, status, host_id FROM rooms WHERE room_pin = ?', [pin]);
    
    if (rooms.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã phòng chơi' });
    }

    const room = rooms[0];

    // Kiểm tra trạng thái phòng
    if (room.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Màn chơi đang diễn ra không thể đăng nhập thêm' });
    }

    // 2. Lấy thông tin bộ câu hỏi (quiz) của phòng này
    const [quizzes] = await dbPromise.query('SELECT quiz_id, title FROM quizzes WHERE quiz_id = ?', [room.quiz_id]);
    
    if (quizzes.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ dữ liệu câu hỏi cho phòng này!' });
    }

    const quiz = quizzes[0];

    // 3. Lấy danh sách câu hỏi
    const [questions] = await dbPromise.query('SELECT question_id, question_text, time_limit, points FROM questions WHERE quiz_id = ?', [quiz.quiz_id]);

    // 4. Lấy danh sách đáp án cho các câu hỏi trên
    const questionIds = questions.map(q => q.question_id);
    let answers = [];
    if (questionIds.length > 0) {
      const [ans] = await dbPromise.query('SELECT answer_id, question_id, answer_text, is_correct FROM answers WHERE question_id IN (?)', [questionIds]);
      answers = ans;
    }

    // 5. Ghép đáp án vào từng câu hỏi tương ứng
    const questionsWithAnswers = questions.map(q => ({
      ...q,
      answers: answers.filter(a => a.question_id === q.question_id).map(a => ({
        answer_id: a.answer_id,
        answer_text: a.answer_text,
        // Không nên gửi is_correct về cho Player để tránh bị hack, nhưng hiện tại ta cứ gửi để test luồng
        is_correct: a.is_correct 
      }))
    }));

    return res.json({ 
      success: true, 
      message: 'Vào phòng thành công', 
      data: { 
        room_id: room.room_id,
        room_pin: pin, 
        quiz_id: quiz.quiz_id,
        quiz_title: quiz.title, 
        status: room.status,
        host_id: room.host_id,
        questions: questionsWithAnswers 
      } 
    });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu phòng:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi kết nối vào phòng' });
  }
});

// --- API: HOST TẠO PHÒNG CHƠI MỚI ---
app.post('/api/rooms/create', authMiddleware, async (req, res) => {
  const { quiz_id } = req.body;
  const host_id = req.authUser.user_id; // Lấy ID của Host từ Token đăng nhập

  if (!quiz_id) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã bộ câu hỏi (quiz_id)' });
  }

  try {
    let pin;
    let isUnique = false;

    // 1. Vòng lặp tạo mã PIN ngẫu nhiên 6 chữ số và kiểm tra trùng lặp
    while (!isUnique) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
      // Kiểm tra xem PIN này có đang được sử dụng ở một phòng chưa kết thúc không
      const [existing] = await dbPromise.query('SELECT room_pin FROM rooms WHERE room_pin = ? AND status != "finished"', [pin]);
      
      if (existing.length === 0) {
        isUnique = true;
      }
    }

    // 2. Tạo mã phòng (room_id) duy nhất. Ví dụ: RM_1678901234567
    const room_id = `RM_${Date.now()}`;

    // 3. Lưu vào database
    await dbPromise.query(
      'INSERT INTO rooms (room_id, room_pin, quiz_id, host_id, status) VALUES (?, ?, ?, ?, ?)',
      [room_id, pin, quiz_id, host_id, 'waiting']
    );

    return res.status(201).json({
      success: true,
      message: 'Tạo phòng thành công',
      data: { room_id, room_pin: pin, quiz_id, host_id }
    });
  } catch (error) {
    console.error('Lỗi khi tạo phòng mới:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo phòng' });
  }
});

// --- API: BẮT ĐẦU GAME (HOST) ---
app.post('/api/rooms/:roomId/start', authMiddleware, async (req, res) => {
  const { roomId } = req.params;
  const host_id = req.authUser.user_id;

  try {
    const [result] = await dbPromise.query('UPDATE rooms SET status = "playing" WHERE room_id = ? AND host_id = ? AND status = "waiting"', [roomId, host_id]);
    if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'Không thể bắt đầu game. Kiểm tra quyền hoặc trạng thái phòng.' });
    return res.json({ success: true, message: 'Game started' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// --- API: KẾT THÚC GAME VÀ LƯU LỊCH SỬ ---
app.post('/api/rooms/:roomId/finish', authMiddleware, async (req, res) => {
  const { roomId } = req.params;
  const { players } = req.body;
  const host_id = req.authUser.user_id;

  let connection;
  try {
    connection = await dbPromise.getConnection();
    await connection.beginTransaction();

    const [rooms] = await connection.query('SELECT status FROM rooms WHERE room_id = ? AND host_id = ?', [roomId, host_id]);
    if (rooms.length === 0) throw new Error('Không tìm thấy phòng hoặc không có quyền');

    // Chỉ lưu nếu phòng chưa finish (tránh lưu trùng lặp)
    if (rooms[0].status !== 'finished') {
      await connection.query('UPDATE rooms SET status = "finished", ended_at = CURRENT_TIMESTAMP WHERE room_id = ?', [roomId]);

      // Lọc ra người chơi thật (có userId) và sắp xếp theo điểm để tính Rank
      const realPlayers = players.filter(p => p.userId && !p.isBot).sort((a, b) => b.score - a.score);

      for (let i = 0; i < realPlayers.length; i++) {
        const p = realPlayers[i];
        
        const rp_id = `RP_${Date.now()}_${i}`;
        await connection.query('INSERT INTO room_players (room_player_id, room_id, user_id, joined_at, left_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [rp_id, roomId, p.userId]);

        const history_id = `HIS_${Date.now()}_${i}`;
        await connection.query('INSERT INTO player_game_history (history_id, room_id, user_id, total_score, correct_answers, wrong_answers, rank_position) VALUES (?, ?, ?, ?, ?, ?, ?)', [history_id, roomId, p.userId, p.score, p.correctAnswers, p.wrongAnswers, i + 1]);
      }
    }

    await connection.commit();
    return res.json({ success: true, message: 'Đã lưu lịch sử đấu' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Lỗi khi lưu lịch sử:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  } finally {
    if (connection) connection.release();
  }
});

// --- API: KIỂM TRA TRẠNG THÁI PHÒNG (Cho Polling) ---
app.get('/api/rooms/:roomPin/status', async (req, res) => {
  const { roomPin } = req.params;
  try {
    const [rooms] = await dbPromise.query('SELECT status FROM rooms WHERE room_pin = ?', [roomPin]);
    if (rooms.length === 0) return res.status(404).json({ success: false });
    return res.json({ success: true, status: rooms[0].status });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
});

// --- API: LẤY DANH SÁCH PHÒNG ĐANG CHỜ CỦA HOST ---
app.get('/api/rooms/my-waiting', authMiddleware, async (req, res) => {
  const host_id = req.authUser.user_id;

  try {
    const query = `
      SELECT r.room_id, r.room_pin, r.quiz_id, r.status, r.created_at, q.title as quiz_title
      FROM rooms r
      JOIN quizzes q ON r.quiz_id = q.quiz_id
      WHERE r.host_id = ? AND r.status = 'waiting'
      ORDER BY r.created_at DESC
    `;
    const [rooms] = await dbPromise.query(query, [host_id]);
    
    return res.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng waiting:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// --- API: HOST TẠO BỘ CÂU HỎI MỚI (CUSTOM QUIZ) ---
app.post('/api/quizzes/create', authMiddleware, async (req, res) => {
  const { title, questions } = req.body;
  const creator_id = req.authUser.user_id;

  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ. Vui lòng nhập tiêu đề và ít nhất 1 câu hỏi.' });
  }

  let connection;
  try {
    connection = await dbPromise.getConnection();
    await connection.beginTransaction(); // Bắt đầu Transaction

    // 1. Tạo Quiz
    const quiz_id = `QZ_${Date.now()}`;
    await connection.query(
      'INSERT INTO quizzes (quiz_id, title, creator_id, is_template) VALUES (?, ?, ?, ?)',
      [quiz_id, title, creator_id, false]
    );

    // 2. Loop qua từng câu hỏi để insert
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const q_id = `QS_${Date.now()}_${i}`;
      await connection.query(
        'INSERT INTO questions (question_id, quiz_id, question_text, time_limit, points) VALUES (?, ?, ?, ?, ?)',
        [q_id, quiz_id, q.question_text, q.time_limit || 20, q.points || 1000]
      );

      // 3. Loop qua các đáp án của câu hỏi này
      for (let j = 0; j < q.answers.length; j++) {
        const a = q.answers[j];
        const a_id = `ANS_${Date.now()}_${i}_${j}`;
        await connection.query(
          'INSERT INTO answers (answer_id, question_id, answer_text, is_correct) VALUES (?, ?, ?, ?)',
          [a_id, q_id, a.answer_text, a.is_correct ? 1 : 0]
        );
      }
    }

    await connection.commit(); // Thành công thì Commit
    return res.status(201).json({ success: true, message: 'Tạo bộ câu hỏi thành công', quiz_id });
  } catch (error) {
    if (connection) await connection.rollback(); // Lỗi thì Rollback
    console.error('Lỗi khi lưu bộ câu hỏi:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo bộ câu hỏi' });
  } finally {
    if (connection) connection.release();
  }
});

// --- API: LẤY CHI TIẾT BỘ CÂU HỎI ĐỂ HOST SỬA ---
app.get('/api/quizzes/:quizId/full', authMiddleware, async (req, res) => {
  const { quizId } = req.params;
  try {
    const [quizzes] = await dbPromise.query('SELECT quiz_id, title FROM quizzes WHERE quiz_id = ?', [quizId]);
    if (quizzes.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy bộ câu hỏi' });

    const quiz = quizzes[0];
    const [questions] = await dbPromise.query('SELECT question_id, question_text, time_limit, points FROM questions WHERE quiz_id = ?', [quizId]);

    for (let q of questions) {
      const [answers] = await dbPromise.query('SELECT answer_id, answer_text, is_correct FROM answers WHERE question_id = ?', [q.question_id]);
      q.answers = answers.map(a => ({ ...a, is_correct: !!a.is_correct })); // Chuyển is_correct thành boolean
    }

    return res.json({ success: true, data: { title: quiz.title, questions } });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết quiz:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// --- API: HUỶ PHÒNG CHỜ (YÊU CẦU MẬT KHẨU) ---
app.post('/api/rooms/:roomId/cancel', authMiddleware, async (req, res) => {
  const { roomId } = req.params;
  const { password } = req.body;
  const host_id = req.authUser.user_id;

  if (!password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu xác nhận' });
  }

  try {
    // 1. Lấy thông tin người dùng để kiểm tra mật khẩu
    const [users] = await dbPromise.query('SELECT password_hash FROM users WHERE user_id = ?', [host_id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const isValid = verifyPassword(password, users[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác' });
    }

    // 2. Kiểm tra xem phòng có tồn tại và thuộc về host không
    const [rooms] = await dbPromise.query('SELECT room_pin FROM rooms WHERE room_id = ? AND host_id = ? AND status = "waiting"', [roomId, host_id]);
    if (rooms.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng chờ hợp lệ hoặc phòng đã bị thay đổi trạng thái' });
    }

    // 3. Xoá phòng chờ khỏi database
    await dbPromise.query('DELETE FROM rooms WHERE room_id = ?', [roomId]);

    return res.json({ success: true, message: 'Huỷ phòng thành công' });
  } catch (error) {
    console.error('Lỗi khi huỷ phòng:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// --- API: CẬP NHẬT BỘ CÂU HỎI CHO PHÒNG (Lưu tạm thời) ---
app.post('/api/rooms/:roomId/update-quiz', authMiddleware, async (req, res) => {
  const { roomId } = req.params;
  const { title, questions } = req.body;
  const host_id = req.authUser.user_id;

  let connection;
  try {
    connection = await dbPromise.getConnection();
    await connection.beginTransaction();

    // 1. Tạo một bộ câu hỏi TẠM THỜI (Temporary)
    const quiz_id = `QZ_TMP_${Date.now()}`;
    await connection.query('INSERT INTO quizzes (quiz_id, title, creator_id, is_template) VALUES (?, ?, ?, ?)', [quiz_id, title, host_id, false]);

    // 2. Chèn câu hỏi & đáp án
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const q_id = `QS_TMP_${Date.now()}_${i}`;
      await connection.query('INSERT INTO questions (question_id, quiz_id, question_text, time_limit, points) VALUES (?, ?, ?, ?, ?)', [q_id, quiz_id, q.question_text, q.time_limit || 20, q.points || 1000]);

      for (let j = 0; j < q.answers.length; j++) {
        const a = q.answers[j];
        const a_id = `ANS_TMP_${Date.now()}_${i}_${j}`;
        await connection.query('INSERT INTO answers (answer_id, question_id, answer_text, is_correct) VALUES (?, ?, ?, ?)', [a_id, q_id, a.answer_text, a.is_correct ? 1 : 0]);
      }
    }

    // 3. Cập nhật phòng để sử dụng bộ câu hỏi Tạm này
    await connection.query('UPDATE rooms SET quiz_id = ? WHERE room_id = ? AND host_id = ? AND status = "waiting"', [quiz_id, roomId, host_id]);

    await connection.commit();
    return res.json({ success: true, message: 'Đã cập nhật câu hỏi cho phòng thành công' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Lỗi khi cập nhật quiz phòng:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  } finally {
    if (connection) connection.release();
  }
});

// --- API: LẤY DANH SÁCH BỘ CÂU HỎI CỦA NGƯỜI DÙNG ---
app.get('/api/quizzes/my-quizzes', authMiddleware, async (req, res) => {
  const user_id = req.authUser.user_id;
  try {
    const [quizzes] = await dbPromise.query(
      'SELECT quiz_id, title, created_at FROM quizzes WHERE creator_id = ? AND is_template = FALSE ORDER BY created_at DESC',
      [user_id]
    );
    return res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Lỗi lấy danh sách bộ câu hỏi:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// --- API: HUỶ BỘ CÂU HỎI CỦA NGƯỜI DÙNG ---
app.post('/api/quizzes/:quizId/delete', authMiddleware, async (req, res) => {
  const { quizId } = req.params;
  const { password } = req.body;
  const user_id = req.authUser.user_id;

  if (!password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu xác nhận' });
  }

  try {
    const [users] = await dbPromise.query('SELECT password_hash FROM users WHERE user_id = ?', [user_id]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    if (!verifyPassword(password, users[0].password_hash)) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác' });
    }

    const [quizzes] = await dbPromise.query('SELECT quiz_id FROM quizzes WHERE quiz_id = ? AND creator_id = ?', [quizId, user_id]);
    if (quizzes.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ câu hỏi hoặc không có quyền xoá' });
    }

    await dbPromise.query('DELETE FROM quizzes WHERE quiz_id = ?', [quizId]);
    return res.json({ success: true, message: 'Xoá bộ câu hỏi thành công' });
  } catch (error) {
    console.error('Lỗi xoá bộ câu hỏi:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// --- API: CẬP NHẬT BỘ CÂU HỎI GỐC CỦA NGƯỜI DÙNG ---
app.put('/api/quizzes/:quizId', authMiddleware, async (req, res) => {
  const { quizId } = req.params;
  const { title, questions } = req.body;
  const user_id = req.authUser.user_id;

  let connection;
  try {
    connection = await dbPromise.getConnection();
    await connection.beginTransaction();

    const [quizzes] = await connection.query('SELECT quiz_id FROM quizzes WHERE quiz_id = ? AND creator_id = ?', [quizId, user_id]);
    if (quizzes.length === 0) throw new Error('Không tìm thấy bộ câu hỏi hoặc không có quyền sửa');

    await connection.query('UPDATE quizzes SET title = ? WHERE quiz_id = ?', [title, quizId]);
    await connection.query('DELETE FROM questions WHERE quiz_id = ?', [quizId]);

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const q_id = `QS_${Date.now()}_${i}`;
      await connection.query('INSERT INTO questions (question_id, quiz_id, question_text, time_limit, points) VALUES (?, ?, ?, ?, ?)', [q_id, quizId, q.question_text, q.time_limit || 20, q.points || 1000]);

      for (let j = 0; j < q.answers.length; j++) {
        const a = q.answers[j];
        const a_id = `ANS_${Date.now()}_${i}_${j}`;
        await connection.query('INSERT INTO answers (answer_id, question_id, answer_text, is_correct) VALUES (?, ?, ?, ?)', [a_id, q_id, a.answer_text, a.is_correct ? 1 : 0]);
      }
    }

    await connection.commit();
    return res.json({ success: true, message: 'Cập nhật bộ câu hỏi thành công' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Lỗi khi cập nhật bộ câu hỏi:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  } finally {
    if (connection) connection.release();
  }
});

// --- API: LẤY LỊCH SỬ ĐẤU CỦA NGƯỜI DÙNG ---
app.get('/api/history/my-history', authMiddleware, async (req, res) => {
  const user_id = req.authUser.user_id;
  try {
    const query = `
      SELECT 
        h.history_id as id,
        q.title as quizTitle,
        h.played_at as date,
        h.rank_position as rank_pos,
        h.total_score as score,
        (SELECT COUNT(*) FROM room_players rp WHERE rp.room_id = h.room_id) as totalPlayers
      FROM player_game_history h
      JOIN rooms r ON h.room_id = r.room_id
      JOIN quizzes q ON r.quiz_id = q.quiz_id
      WHERE h.user_id = ?
      ORDER BY h.played_at DESC
    `;
    const [history] = await dbPromise.query(query, [user_id]);
    return res.json({ success: true, data: history });
  } catch (error) {
    console.error('Lỗi lấy lịch sử đấu:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// --- API: LẤY BẢNG XẾP HẠNG TỔNG ---
app.get('/api/history/leaderboard', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.user_id, 
        u.display_name as name, 
        SUM(h.total_score) as totalScore,
        COUNT(h.history_id) as totalGames
      FROM users u
      JOIN player_game_history h ON u.user_id = h.user_id
      GROUP BY u.user_id
      ORDER BY totalScore DESC
      LIMIT 10
    `;
    const [leaderboard] = await dbPromise.query(query);
    return res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Lỗi lấy bảng xếp hạng:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// --- SOCKET.IO LOBBY REAL-TIME ---
const activeRooms = {};
const BOTS_TEMPLATE = [
  { id: 'b1', name: 'Minh Tí', avatar: '🐭', isBot: true, isMuted: false },
  { id: 'b2', name: 'Bé Lan', avatar: '🐍', isBot: true, isMuted: false },
  { id: 'b3', name: 'Hùng Cường', avatar: '🐯', isBot: true, isMuted: false },
  { id: 'b4', name: 'Bé Nhi', avatar: '🦁', isBot: true, isMuted: false },
  { id: 'b5', name: 'Con mèo', avatar: '🐱', isBot: true, isMuted: false },
];
const STICKERS = ['🧧', '🧨', '🌸', '😂', '😍', '😡', '🍻', '🐴'];

io.on('connection', (socket) => {
  socket.on('join_lobby', ({ pin, nickname, avatar, isHost, userId }) => {
    socket.join(pin);
    socket.data.pin = pin;

    if (!activeRooms[pin]) {
      // Khởi tạo phòng với mảng Bot mặc định
      activeRooms[pin] = { players: JSON.parse(JSON.stringify(BOTS_TEMPLATE)) };
    }

    const room = activeRooms[pin];
    
    // Kiểm tra xem đã có người chơi này chưa (tránh F5 bị nhân bản)
    const existIdx = room.players.findIndex(p => p.id === socket.id);
    if (existIdx === -1) {
      // Nếu phòng >= 9 người, tìm 1 con Bot để kích ra nhường chỗ
      if (room.players.length >= 9) {
        const botIdx = room.players.findIndex(p => p.isBot);
        if (botIdx !== -1) room.players.splice(botIdx, 1);
      }
      
      // Thêm người chơi mới
      if (room.players.length < 9) {
        room.players.push({
          id: socket.id,
          userId: userId || null,
          name: nickname,
          avatar: avatar,
          isBot: false,
          isHost: isHost,
          isMuted: false
        });
      }
    }

    io.to(pin).emit('update_players', room.players);
  });

  socket.on('send_chat', ({ pin, message }) => {
    const room = activeRooms[pin];
    if(!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if(player && !player.isMuted) {
      io.to(pin).emit('receive_chat', { playerId: socket.id, content: message, type: 'text', senderName: player.name });
    }
  });

  socket.on('send_sticker', ({ pin, sticker }) => {
    const room = activeRooms[pin];
    if(!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if(player && !player.isMuted) {
      io.to(pin).emit('receive_sticker', { playerId: socket.id, content: sticker, type: 'sticker', senderName: player.name });
    }
  });

  socket.on('kick_player', ({ pin, targetId }) => {
    const room = activeRooms[pin];
    if(room && room.players.find(p => p.id === socket.id && p.isHost)) {
      room.players = room.players.filter(p => p.id !== targetId);
      io.to(pin).emit('update_players', room.players);
      io.to(targetId).emit('kicked');
    }
  });

  socket.on('toggle_mute', ({ pin, targetId }) => {
    const room = activeRooms[pin];
    if(room && room.players.find(p => p.id === socket.id && p.isHost)) {
      const target = room.players.find(p => p.id === targetId);
      if(target) target.isMuted = !target.isMuted;
      io.to(pin).emit('update_players', room.players);
    }
  });

  socket.on('host_start_game', ({ pin, hostMode }) => {
    io.to(pin).emit('game_started', { hostMode });
  });

  // --- ĐỒNG BỘ ĐIỂM SỐ TRONG GAME ---
  socket.on('join_game_room', ({ pin }) => {
    socket.join(pin);
  });

  socket.on('submit_score', ({ pin, nickname, avatar, score, isCorrect }) => {
    io.to(pin).emit('sync_score', { nickname, avatar, score, isCorrect });
  });

  socket.on('disconnect', () => {
    const pin = socket.data.pin;
    if(pin && activeRooms[pin]) {
      activeRooms[pin].players = activeRooms[pin].players.filter(p => p.id !== socket.id);
      io.to(pin).emit('update_players', activeRooms[pin].players);
    }
  });
});

// Vòng lặp giả lập Bot tự động chat/sticker trên Server
setInterval(() => {
  for (const pin in activeRooms) {
    const room = activeRooms[pin];
    const bots = room.players.filter(p => p.isBot && !p.isMuted);
    if (bots.length > 0 && Math.random() > 0.6) {
      const bot = bots[Math.floor(Math.random() * bots.length)];
      const isSticker = Math.random() > 0.5;
      if (isSticker) {
        const sticker = STICKERS[Math.floor(Math.random() * STICKERS.length)];
        io.to(pin).emit('receive_sticker', { playerId: bot.id, content: sticker, type: 'sticker', senderName: bot.name });
      } else {
        const msgs = ["Có ai sẵn sàng chưa?", "Chờ host lâu quá ta", "Sắp được nhận lì xì rồi hehe", "Tết vui vẻ nhé!"];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        io.to(pin).emit('receive_chat', { playerId: bot.id, content: msg, type: 'text', senderName: bot.name });
      }
    }
  }
}, 5000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});