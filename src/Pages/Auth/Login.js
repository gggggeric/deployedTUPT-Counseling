import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

const handleLoginSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.username || !formData.password) {
    setErrors({ general: 'Username and password are required' });
    return;
  }

  setIsLoading(true);

  try {
    const response = await fetch('https://tupt-counselingbackend.onrender.com/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: formData.username,
        password: formData.password
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store user data in localStorage
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      localStorage.setItem('isAuthenticated', 'true');
      
      console.log('Login successful:', data);
      alert('Login successful!');
      
      // Check user role and redirect accordingly
      if (data.user.role === 'admin') {
        navigate('/adminDashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      if (data.error) {
        setErrors({ general: data.error });
      } else if (data.message) {
        setErrors({ general: data.message });
      } else {
        setErrors({ general: 'Login failed. Please try again.' });
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    setErrors({ general: 'Network error. Please check if the server is running.' });
  } finally {
    setIsLoading(false);
  }
};

  const handleClearForm = () => {
    setFormData({
      username: '',
      password: ''
    });
    setErrors({});
  };

  return (
    <div className="home-container">
      <section className="login-section">
        <div className="login-box">
          <h2 className="login-title">TUPT Counseling Scheduler</h2>
          <div className="login-subtitle">User Authentication</div>
          
          {errors.general && (
            <div style={{ 
              color: '#ff5252', 
              fontSize: '14px', 
              textAlign: 'center', 
              marginBottom: '15px',
              padding: '8px',
              backgroundColor: 'rgba(255, 82, 82, 0.1)',
              borderRadius: '2px',
              border: '1px solid rgba(255, 82, 82, 0.3)'
            }}>
              {errors.general}
            </div>
          )}
          
          <form onSubmit={handleLoginSubmit}>
            <div>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                className={errors.username ? 'error' : ''}
                required
              />
              {errors.username && <span className="error-message">{errors.username}</span>}
            </div>
            
            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className={errors.password ? 'error' : ''}
                required
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
            
            <div className="buttons">
              <button 
                type="button" 
                className="btn-clear" 
                onClick={handleClearForm}
                disabled={isLoading}
              >
                Clear
              </button>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      
                <button 
                  type="submit" 
                  className="btn-login"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <Link to="/register" style={{ fontSize: '13px', color: 'white' }}>
                Create New Account
              </Link>
            </div>
          </form>

          <div className="more-info-container">
            <Link to="/info" className="more-info-link">
              For more information click here
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;