import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoginSketchBg from '../components/LoginSketchBg';

export default function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Logged in');
      const role = data.user?.role;
      navigate(role === 'admin' ? '/admin' : role === 'provider' ? '/provider' : '/student');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page-ambient" aria-hidden="true">
        <LoginSketchBg />
        <div className="login-page-mesh" />
        <span className="login-page-orb login-page-orb--a" />
        <span className="login-page-orb login-page-orb--b" />
        <span className="login-page-orb login-page-orb--c" />
      </div>
      <div className="container login-page-inner" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h1 className="page-title login-page-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="hero-title-accent">{t('home.titleAccent')}</span>
          <span className="hero-title-rest">{t('home.titleRest')}</span>
        </h1>
        <div className="card login-page-card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Sign in</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p style={{ marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <Link to="/register/student">Register as Student</Link>
            {' or '}
            <Link to="/register/provider">Register as Provider</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
