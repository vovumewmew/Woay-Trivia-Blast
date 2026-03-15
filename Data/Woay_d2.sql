USE woay_trivia;

CREATE TABLE rooms (
    room_id VARCHAR(50) PRIMARY KEY,
    room_pin VARCHAR(10) UNIQUE NOT NULL,
    quiz_id VARCHAR(50) NOT NULL,
    host_id VARCHAR(50) NOT NULL,
    status ENUM('waiting', 'playing', 'finished') DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    
    -- Móc nối Khóa ngoại (Foreign Keys)
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    FOREIGN KEY (host_id) REFERENCES users(user_id) ON DELETE CASCADE
);