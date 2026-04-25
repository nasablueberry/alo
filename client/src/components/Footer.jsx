import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import eadsLogo from '../eadslogo.png';

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img src={eadsLogo} alt="EADS" className="footer-logo-img" />
          </Link>
          <p className="footer-tagline">{t('footer.tagline')}</p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>{t('footer.students')}</h4>
            <Link to="/register/student">{t('nav.register')}</Link>
            <Link to="/login">{t('nav.login')}</Link>
            <Link to="/student/programs">{t('footer.browsePrograms')}</Link>
          </div>
          <div className="footer-col">
            <h4>{t('footer.providers')}</h4>
            <Link to="/register/provider">{t('nav.register')}</Link>
            <Link to="/login">{t('nav.login')}</Link>
          </div>
          <div className="footer-col">
            <h4>{t('footer.system')}</h4>
            <Link to="/">{t('nav.home')}</Link>
            <Link to="/#how-it-works">{t('nav.howItWorks')}</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>© {year} {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
