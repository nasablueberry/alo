import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import eadsLogo from '../eadslogo.png';
import { API } from '../config.js';


function Icon({ name }) {
  return (
    <span className="material-symbols-outlined dash-nav-icon" aria-hidden>
      {name}
    </span>
  );
}

export default function DashboardShell({ role }) {
  const { logout, profile, user, fetchWithAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t, locale } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem('eads_nav_collapsed') === '1'
  );
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const profileMenuRef = useRef(null);
  const notifRef = useRef(null);

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((o) => !o);
    } else {
      setNavCollapsed((c) => {
        const next = !c;
        localStorage.setItem('eads_nav_collapsed', next ? '1' : '0');
        return next;
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMobile();
  };

  const studentLinks = [
    { to: '/student', end: true, icon: 'dashboard', label: t('nav.dashboard') },
    { to: '/student/programs', icon: 'school', label: t('dash.applyForAid') },
    { to: '/student/applications', icon: 'assignment', label: t('nav.applications') },
    { to: '/student#dash-disbursements', icon: 'account_balance_wallet', label: t('dash.disbursementStatus'), isHash: true },
    { to: '/student#dash-notifications', icon: 'notifications', label: t('dash.notifications'), isHash: true },
  ];

  const providerLinks = [
    { to: '/provider', end: true, icon: 'dashboard', label: t('nav.dashboard') },
    { to: '/provider/programs/new', icon: 'add_circle', label: t('dash.newProgram') },
    {
      to: '/provider/review',
      end: true,
      icon: 'assignment',
      label: t('nav.reviewApplications'),
      getIsActive: (loc) =>
        loc.pathname === '/provider/review' || /^\/provider\/programs\/[^/]+\/applications$/.test(loc.pathname),
    },
    { to: '/provider/rejections', icon: 'person_off', label: t('rejections.nav') },
    { to: '/provider/profile', icon: 'business', label: t('nav.profile') },
  ];

  const adminLinks = [
    { to: '/admin', end: true, icon: 'analytics', label: t('dash.systemAnalytics') },
    { to: '/admin/fraud', icon: 'gpp_bad', label: t('dash.fraudReview') },
    { to: '/admin/disburse', icon: 'payments', label: t('dash.disburseAid') },
    { to: '/admin/students', icon: 'groups', label: t('nav.students') },
    { to: '/admin/rejections', icon: 'gavel', label: t('rejections.nav') },
    { to: '/admin/providers', icon: 'corporate_fare', label: t('nav.providers') },
  ];

  const links =
    role === 'student' ? studentLinks : role === 'provider' ? providerLinks : adminLinks;

  const profilePath =
    role === 'student'
      ? '/student/profile'
      : role === 'provider'
        ? '/provider/profile'
        : '/admin';

  const displayName =
    profile?.fullName ||
    profile?.organizationName ||
    user?.email ||
    '—';

  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API}/notifications?limit=20`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setNotifUnread(data.unreadCount ?? 0);
    } catch (e) {
      console.error(e);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!notifOpen && !profileOpen) return;
    const onPointerDown = (e) => {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileOpen && profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [notifOpen, profileOpen]);

  const onNotifRowActivate = async (n) => {
    try {
      if (!n.read) {
        await fetchWithAuth(`${API}/notifications/${n._id}/read`, { method: 'PUT' });
        setNotifUnread((c) => Math.max(0, c - 1));
        setNotifications((list) => list.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      }
    } catch (e) {
      console.error(e);
    }
    if (n.relatedType === 'application' && n.relatedId) {
      if (role === 'student') navigate('/student/applications');
      else if (role === 'provider') navigate('/provider');
      else navigate('/admin');
    }
    setNotifOpen(false);
  };

  const markAllRead = async () => {
    try {
      const res = await fetchWithAuth(`${API}/notifications/read-all`, { method: 'PUT' });
      if (res.ok) {
        setNotifUnread(0);
        setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dash-shell">
      {isMobile && mobileOpen && (
        <button
          type="button"
          className="dash-sidebar-backdrop"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      )}
      <aside
        className={`dash-sidebar ${
          isMobile && mobileOpen ? 'dash-sidebar--open' : ''
        } ${!isMobile && navCollapsed ? 'dash-sidebar--collapsed' : ''}`}
      >
        <div className="dash-sidebar-brand">
          <Link to="/" className="dash-sidebar-logo" onClick={closeMobile} title="EADS home">
            <img src={eadsLogo} alt="EADS" />
          </Link>
          <p className="dash-sidebar-tagline">{t('dash.systemTagline')}</p>
        </div>

        <nav className="dash-sidebar-nav" aria-label="Dashboard">
          {links.map((item) =>
            item.isHash ? (
              <Link
                key={item.to}
                to={item.to}
                className="dash-nav-link"
                title={item.label}
                onClick={closeMobile}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ) : (
              <NavLink
                key={item.to + (item.end ? '-home' : '')}
                to={item.to}
                end={item.end}
                title={item.label}
                className={({ isActive }) => {
                  const active = item.getIsActive
                    ? item.getIsActive(location)
                    : isActive;
                  return 'dash-nav-link' + (active ? ' dash-nav-link--active' : '');
                }}
                onClick={closeMobile}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="dash-sidebar-footer">
          <NavLink
            to={profilePath}
            end={role === 'admin'}
            title={t('dash.settings')}
            className={({ isActive }) =>
              'dash-nav-link dash-nav-link--sub' + (isActive ? ' dash-nav-link--active' : '')
            }
            onClick={closeMobile}
          >
            <Icon name="settings" />
            <span>{t('dash.settings')}</span>
          </NavLink>
          <button
            type="button"
            className="dash-nav-link dash-nav-link--sub"
            title={t('nav.logout')}
            onClick={handleLogout}
          >
            <Icon name="logout" />
            <span>{t('nav.logout')}</span>
          </button>

          <div className="dash-sidebar-help">
            <p className="dash-sidebar-help-title">{t('dash.needSupport')}</p>
            <NavLink
              to={role === 'student' ? '/student/help' : role === 'provider' ? '/provider/help' : '/admin/help'}
              className={({ isActive }) =>
                'dash-sidebar-help-btn' + (isActive ? ' dash-sidebar-help-btn--active' : '')
              }
              onClick={closeMobile}
            >
              {t('dash.helpCenter')}
            </NavLink>
          </div>

          <div className="dash-sidebar-toggles">
            <button
              type="button"
              className="dash-mini-toggle"
              onClick={toggleTheme}
              title={theme === 'light' ? t('dash.themeDark') : t('dash.themeLight')}
              aria-label={theme === 'light' ? t('dash.themeDark') : t('dash.themeLight')}
            >
              <span className="material-symbols-outlined" aria-hidden>
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
            <div className="dash-lang" role="group" aria-label="Language">
              <button
                type="button"
                className={lang === 'en' ? 'active' : ''}
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <span className="dash-lang-divider">|</span>
              <button
                type="button"
                className={lang === 'bn' ? 'active' : ''}
                onClick={() => setLang('bn')}
              >
                বাংলা
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="dash-main-wrap">
        <header className="dash-topbar">
          <button
            type="button"
            className="dash-menu-btn"
            aria-label={
              isMobile
                ? mobileOpen
                  ? t('dash.navClose')
                  : t('dash.navOpen')
                : navCollapsed
                  ? t('dash.navExpand')
                  : t('dash.navCollapse')
            }
            onClick={toggleSidebar}
            aria-expanded={isMobile ? mobileOpen : !navCollapsed}
          >
            <span className="material-symbols-outlined" aria-hidden>
              {isMobile
                ? mobileOpen
                  ? 'close'
                  : 'menu'
                : navCollapsed
                  ? 'menu_open'
                  : 'menu'}
            </span>
          </button>
          <span className="dash-topbar-spacer" />
          <div className="dash-topbar-actions">
            <div className="dash-notif-wrap" ref={notifRef}>
              <button
                type="button"
                className="dash-notif-btn"
                aria-label={t('dash.notifications')}
                id="dash-notif-button"
                aria-haspopup="true"
                aria-expanded={notifOpen}
                onClick={() => {
                  setProfileOpen(false);
                  setNotifOpen((o) => !o);
                }}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  notifications
                </span>
                {notifUnread > 0 && <span className="dash-notif-badge">{notifUnread > 9 ? '9+' : notifUnread}</span>}
              </button>
              {notifOpen && (
                <div
                  className="dash-notif-panel"
                  role="menu"
                  aria-labelledby="dash-notif-button"
                >
                  <div className="dash-notif-panel-head">
                    <span className="dash-notif-panel-title">{t('dash.notifications')}</span>
                    {notifications.some((n) => !n.read) && (
                      <button type="button" className="dash-notif-mark-all" onClick={markAllRead}>
                        {t('dash.markAllRead')}
                      </button>
                    )}
                  </div>
                  <ul className="dash-header-notif-list">
                    {notifications.length === 0 ? (
                      <li className="dash-notif-empty">{t('dash.noNotifications')}</li>
                    ) : (
                      notifications.map((n) => (
                        <li key={n._id}>
                          <button
                            type="button"
                            className={'dash-notif-item' + (n.read ? '' : ' dash-notif-item--unread')}
                            onClick={() => onNotifRowActivate(n)}
                          >
                            <span className="dash-notif-item-title">{n.title}</span>
                            <span className="dash-notif-item-msg">{n.message}</span>
                            <span className="dash-notif-item-time">
                              {n.createdAt ? new Date(n.createdAt).toLocaleString(locale) : ''}
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
            <div className="dash-avatar-wrap" ref={profileMenuRef}>
            <button
              type="button"
              className="dash-avatar-btn"
              title={displayName}
              aria-label={displayName}
              id="dash-profile-menu-button"
              aria-haspopup="true"
              aria-expanded={profileOpen}
              onClick={() => {
                setNotifOpen(false);
                setProfileOpen((o) => !o);
              }}
            >
              {initials}
            </button>
            {profileOpen && (
              <div
                className="dash-profile-menu"
                role="menu"
                aria-labelledby="dash-profile-menu-button"
              >
                <div className="dash-profile-menu-head">
                  <span className="dash-profile-menu-name">{displayName}</span>
                  {user?.email && (
                    <span className="dash-profile-menu-email">{user.email}</span>
                  )}
                </div>
                <Link
                  to={profilePath}
                  className="dash-profile-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    closeMobile();
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    person
                  </span>
                  {t('nav.profile')}
                </Link>
                <button
                  type="button"
                  className="dash-profile-menu-item dash-profile-menu-item--logout"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    logout
                  </span>
                  {t('nav.logout')}
                </button>
              </div>
            )}
            </div>
          </div>
        </header>

        <main className="dash-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
