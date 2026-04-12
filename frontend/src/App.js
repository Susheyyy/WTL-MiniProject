import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import BusinessDetail from './pages/BusinessDetail'; 
import { Toaster } from 'react-hot-toast';
import './App.css';

const ProtectedRoute = ({ children, requiredRole }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Router>
        <Toaster position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            fontFamily: 'var(--font-body)',
            borderRadius: 'var(--radius)',
            background: 'var(--ink)',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: 'var(--accent)',
              secondary: '#fff',
            },
          },
        }}
      />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/business/:id" element={<BusinessDetail />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="owner">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;