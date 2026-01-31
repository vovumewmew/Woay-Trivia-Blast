import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/player/Login';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* path="/" nghĩa là trang chủ mặc định. 
          element={<Login />} nghĩa là hiển thị trang Login.
        */}
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        
        {/* Sau này bạn sẽ thêm các trang khác vào đây, ví dụ: */}
        {/* <Route path="/host" element={<HostLobby />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;