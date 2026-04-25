import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import eadsLogo from '../eadslogo.png';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, t, setLang } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const publicNav = [
    { to: '/', label: t('nav.home') },
    { to: '/#how-it-works', label: t('nav.howItWorks') },
    { to: '/register/student', label: t('nav.forStudents') },
    { to: '/register/provider', label: t('nav.forProviders') },
  ];

  const roleNav = {
    student: [
      { to: '/student', label: t('nav.dashboard') },
      { to: '/student/programs', label: t('nav.programs') },
      { to: '/student/applications', label: t('nav.applications') },
      { to: '/student/profile', label: t('nav.profile') },
    ],
    provider: [
      { to: '/provider', label: t('nav.dashboard') },
      { to: '/provider/profile', label: t('nav.profile') },
    ],
    admin: [
      { to: '/admin', label: t('nav.dashboard') },
      { to: '/admin/students', label: t('nav.students') },
      { to: '/admin/providers', label: t('nav.providers') },
    ],
  };

  const role = user?.role?.toLowerCase?.() || user?.role;
  const links = user ? (roleNav[role] || []) : publicNav;
  const dashboardPath = user ? (role === 'admin' ? '/admin' : role === 'provider' ? '/provider' : '/student') : '/';

  return (
    <header className="site-header">
      <div className="header-inner container">
        <NavLink to={dashboardPath} className="logo">
          <img src={eadsLogo} alt="EADS" className="logo-img" />
        </NavLink>
        <nav className="nav-links">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              {l.label}
            </NavLink>
          ))}
          <div className="header-toggles">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              <span className="material-symbols-outlined" aria-hidden>
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
            <div className="lang-toggle" role="group" aria-label="Language">
              <span className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</span>
              <span className="lang-divider">|</span>
              <span className={lang === 'bn' ? 'active' : ''} onClick={() => setLang('bn')}>বাংলা</span>
            </div>
          </div>
          {user ? (
            <button type="button" onClick={handleLogout} className="btn btn-ghost">
              {t('nav.logout')}
            </button>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-ghost">{t('nav.login')}</NavLink>
              <NavLink to="/register/student" className="btn btn-primary btn-sm">{t('nav.register')}</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
