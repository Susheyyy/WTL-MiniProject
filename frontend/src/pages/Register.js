import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { register as registerUser } from '../api';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const { login: loginToContext } = useContext(AuthContext); 
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register: registerField, 
    handleSubmit,
    watch, 
    formState: { errors }
  } = useForm({
    defaultValues: { role: 'user' },
    mode: "onChange" 
  });

  const password = watch("password");

  const onSubmit = async (formData) => {
    setServerError('');
    setLoading(true);
    try {
      const { data } = await registerUser(formData);
      
      loginToContext(data.user, data.token); 
      
      navigate(data.user.role === 'owner' ? '/dashboard' : '/');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Create account</h2>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="field-group">
            <label className="field-label">Full name</label>
            <input
              type="text"
              className={`field-input ${errors.name ? 'input-error' : ''}`}
              placeholder="Enter Name"
              {...registerField("name", { required: "Full name is required" })}
            />
            {errors.name && <p className="error-text-small">{errors.name.message}</p>}
          </div>

          <div className="field-group">
            <label className="field-label">Email address</label>
            <input
              type="email"
              className={`field-input ${errors.email ? 'input-error' : ''}`}
              placeholder="Enter Email ID"
              {...registerField("email", { 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email format"
                }
              })}
            />
            {errors.email && <p className="error-text-small">{errors.email.message}</p>}
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <input
              type="password"
              className={`field-input ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter password (Minimum 8 characters)"
              {...registerField("password", { 
                required: "Password is required", 
                minLength: { value: 8, message: "Must be at least 8 characters" } 
              })}
            />
            {errors.password && <p className="error-text-small">{errors.password.message}</p>}
          </div>

          <div className="field-group">
            <label className="field-label">Confirm Password</label>
            <input
              type="password"
              className={`field-input ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Repeat password"
              {...registerField("confirmPassword", { 
                required: "Please confirm your password",
                validate: value => value === password || "Passwords do not match"
              })}
            />
            {errors.confirmPassword && <p className="error-text-small">{errors.confirmPassword.message}</p>}
          </div>

          <div className="field-group">
            <label className="field-label">I am a</label>
            <select className="field-input field-select" {...registerField("role")}>
              <option value="user">Customer - looking for businesses</option>
              <option value="owner">Business owner - listing a business</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;