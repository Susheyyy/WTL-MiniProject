import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await login(formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(data.user.role === 'owner' ? '/dashboard' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

 return (
  <div className="auth-page-wrapper">
    <div className="auth-card">
      <h2>Welcome back</h2>
      <p>Enter your details to sign in</p>
      <form className="form-group" onSubmit={handleSubmit}>
       <input 
  type="email" 
  placeholder="Email address" 
  required 
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
/>
<input 
  type="password" 
  placeholder="Password" 
  required 
  value={formData.password}
  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
/> <button type="submit" className="btn-primary-full">Sign In</button>
      </form>
    </div>
  </div>
);
};

export default Login;