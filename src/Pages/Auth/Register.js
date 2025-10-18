import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    idNumber: '',
    password: '',
    confirmPassword: '',
    birthdate: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Check password strength when password changes
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) {
      setPasswordStrength('');
      return;
    }

    if (password.length < 6) {
      setPasswordStrength('weak');
    } else if (password.length < 10) {
      setPasswordStrength('medium');
    } else {
      // Check for complexity
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      
      const complexityScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
      
      if (complexityScore >= 3) {
        setPasswordStrength('strong');
      } else {
        setPasswordStrength('medium');
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID Number is required';
    }

    if (!formData.birthdate) {
      newErrors.birthdate = 'Birthdate is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log("📨 Sending registration request...", {
        username: formData.username,
        id_number: formData.idNumber,
        birthdate: formData.birthdate
      });

      const response = await fetch('https://tupt-counselingbackend.onrender.com/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          id_number: formData.idNumber,
          birthdate: formData.birthdate
        }),
      });

      console.log("📨 Response status:", response.status);
      
      const data = await response.json();
      console.log("📨 Response data:", data);

      if (response.ok) {
        // Registration successful
        alert('Registration successful! Please login.');
        navigate('/');
      } else {
        // Handle errors from Flask backend
        console.error("❌ Registration failed:", data);
        if (data.error) {
          setErrors({ general: data.error });
        } else if (data.message) {
          setErrors({ general: data.message });
        } else {
          setErrors({ general: 'Registration failed. Please try again.' });
        }
      }
    } catch (error) {
      console.error('💥 Registration error:', error);
      setErrors({ general: 'Network error. Please check if the server is running.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      username: '',
      idNumber: '',
      password: '',
      confirmPassword: '',
      birthdate: ''
    });
    setErrors({});
    setPasswordStrength('');
  };

  return (
    <div className="home-container">
      <section className="login-section">
        <div className="login-box">
          <h2 className="login-title">TUPT Counseling Scheduler</h2>
          <div className="login-subtitle">Create New Account</div>
          
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
          
          <form onSubmit={handleRegisterSubmit}>
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
              <label htmlFor="idNumber">ID Number</label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                placeholder="Enter your ID number"
                className={errors.idNumber ? 'error' : ''}
                required
              />
              {errors.idNumber && <span className="error-message">{errors.idNumber}</span>}
            </div>
            
            <div>
              <label htmlFor="birthdate">Birthdate</label>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleInputChange}
                className={errors.birthdate ? 'error' : ''}
                required
              />
              {errors.birthdate && <span className="error-message">{errors.birthdate}</span>}
            </div>
            
            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                className={errors.password ? 'error' : ''}
                required
              />
              {passwordStrength && (
                <div className={`password-strength strength-${passwordStrength}`}></div>
              )}
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className={errors.confirmPassword ? 'error' : ''}
                required
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
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
                <Link to="/" style={{ fontSize: '13px', color: 'white' }}>Back to Login</Link>
                <button 
                  type="submit" 
                  className="btn-login"
                  disabled={isLoading}
                >
                  {isLoading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </div>
          </form>

          {/* For more information link */}
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

export default Register;