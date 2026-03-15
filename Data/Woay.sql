-- 1. Tạo cơ sở dữ liệu (Database) cho dự án và sử dụng nó
CREATE DATABASE IF NOT EXISTS woay_trivia DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE woay_trivia;

-- 2. Bảng Users (Lưu thông tin tài khoản)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Quizzes (Lưu thông tin bộ câu hỏi)
-- Bảng này tham chiếu đến bảng users để biết ai là người tạo
CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    creator_id INT NULL, -- NULL nếu là bộ câu hỏi mặc định của hệ thống
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 4. Bảng Questions (Lưu các câu hỏi chi tiết)
-- Bảng này tham chiếu đến bảng quizzes
CREATE TABLE IF NOT EXISTS questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    time_limit INT DEFAULT 20,
    points INT DEFAULT 1000,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

-- 5. Bảng Answers (Lưu các đáp án cho từng câu hỏi)
-- Bảng này tham chiếu đến bảng questions
CREATE TABLE IF NOT EXISTS answers (
    answer_id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    answer_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
);