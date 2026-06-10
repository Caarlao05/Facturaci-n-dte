import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Lock, Mail, AlertCircle } from 'lucide-react';
import './LoginView.css';

const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Si ya hay token y usuario, redirigir
    if (localStorage.getItem('token') && localStorage.getItem('user')) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email,
        password
      });

      if (response.data.token) {
        const data = response.data;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'SUPERADMIN') {
          window.location.href = '/superadmin';
        } else {
          window.location.href = '/';
        }
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Sci-Fi Background Elements */}
      <div className="login-grid-bg"></div>
      <div className="hud-scanner"></div>
      <div className="scanlines-overlay"></div>

      {/* Background Particles Simulation */}
      <div className="particles-overlay">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`particle particle-${i+1}`}></div>
        ))}
      </div>

      <div className="glass-panel">
        <div className="login-header">
          <div className="logo-pulse">
            <img src="/logo.png" alt="Quantis Logo" className="login-logo-img" />
          </div>
          <h1>Bienvenido a Quantis</h1>
          <p>Inicia sesión en tu entorno corporativo</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <div className="input-icon-wrapper">
              <input 
                type="email" 
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="input-icon" size={20} />
            </div>
          </div>

          <div className="input-group">
            <div className="input-icon-wrapper">
              <input 
                type="password" 
                placeholder="Contraseña de Acceso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock className="input-icon" size={20} />
            </div>
          </div>

          {errorMsg && (
            <div className="error-alert">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button 
            type="submit" 
            className={`btn-login ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="spinner" size={20} />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Acceder al Portal</span>
            )}
            <div className="btn-glow"></div>
          </button>
        </form>

        <div className="login-footer">
          <p>Protegido con cifrado End-to-End y validación MH El Salvador.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
