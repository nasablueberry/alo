import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'eads.support@example.org';

const faqKeys = ['q1', 'a1', 'q2', 'a2', 'q3', 'a3', 'q4', 'a4'];

export default function HelpCenter() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      toast.success(t('help.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  const faq = [];
  for (let i = 0; i < faqKeys.length; i += 2) {
    faq.push({ q: t(`help.${faqKeys[i]}`), a: t(`help.${faqKeys[i + 1]}`) });
  }

  return (
    <div className="dash-page help-center-page">
      <header className="dash-page-header">
        <div>
          <span className="dash-page-kicker">EADS</span>
          <h1 className="dash-page-title">{t('help.title')}</h1>
          <p className="dash-muted" style={{ maxWidth: '36rem', marginTop: '0.5rem' }}>
            {t('help.intro')}
          </p>
        </div>
      </header>

      <section className="help-center-section">
        <h2 className="help-center-h2">{t('help.faqSection')}</h2>
        <ul className="help-faq-list">
          {faq.map((item, idx) => (
            <li key={idx} className="help-faq-item dash-card">
              <p className="help-faq-q">{item.q}</p>
              <p className="help-faq-a dash-muted">{item.a}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="help-center-section help-center-contact">
        <h2 className="help-center-h2">{t('help.contactTitle')}</h2>
        <p className="dash-muted" style={{ marginBottom: '1rem' }}>
          {t('help.contactLead')}
        </p>
        <div className="help-contact-box dash-card">
          <p className="help-email-label">{t('help.emailLabel')}</p>
          <p className="help-email-value">
            <a href={`mailto:${SUPPORT_EMAIL}`} className="help-email-link">
              {SUPPORT_EMAIL}
            </a>
          </p>
          <div className="help-contact-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={copyEmail}>
              {copied ? t('help.copyDone') : t('help.copy')}
            </button>
            <a className="btn btn-primary btn-sm" href={`mailto:${SUPPORT_EMAIL}`}>
              {t('help.openMail')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
