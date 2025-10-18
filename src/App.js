import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import TopBar from './Pages/TopBar';  
import Login from './Pages/Auth/Login'; 
import Info from './Pages/Info';
import Register from './Pages/Auth/Register';
import Dashboard from './Pages/Dashboard';
import AdminDashboard from './Pages/Admin/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <TopBar /> 
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
                 <Route path="/dashboard" element={<Dashboard />} />
               <Route path="/info" element={<Info />} />
                <Route path="/adminDashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;