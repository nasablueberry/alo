import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import heroImage from '../assets/bangladeshi_student_hero.png';
import cap3D from '../assets/3d_graduation_cap.png';
import shield3D from '../assets/3d_security_shield.png';
import funds3D from '../assets/3d_funding_coins.png';

export default function Homepage() {
  const { t } = useLanguage();

  return (
    <>
      <section className="new-hero-section container">
        <div className="new-hero-grid">
          <div className="new-hero-content">
            <div className="new-hero-blob new-hero-blob-1" />
            <div className="new-hero-badge anim-fade-up">
              <span className="material-symbols-outlined scale-75" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="new-hero-badge-text">{t('home.newHeroBadge')}</span>
            </div>

            <h1 className="new-hero-title anim-fade-up anim-delay-1">
              <span className="new-hero-title-highlight">{t('home.heroTitleHighlight')}</span> {t('home.heroTitleRest')}
            </h1>

            <p className="new-hero-subtitle anim-fade-up anim-delay-2">{t('home.heroSubtitle')}</p>

            <div className="new-hero-actions anim-fade-up anim-delay-3">
              <Link to="/register/student" className="new-btn-primary">
                {t('home.startApplication')}
              </Link>
              <a href="#how-it-works" className="new-btn-outline">
                {t('home.howWeVerify')}
              </a>
            </div>

            <svg className="hero-drawn-arrow" width="280" height="200" viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="arrow-mask">
                  <path className="drawn-arrow-mask-path" d="M 20,120 C 30,30 110,-10 140,50 C 170,110 130,130 110,100 C 90,70 120,30 170,40 C 220,50 240,90 250,140" stroke="white" strokeWidth="15" strokeLinecap="round" fill="none" />
                </mask>
              </defs>
              <g mask="url(#arrow-mask)">
                <path d="M 20,120 C 30,30 110,-10 140,50 C 170,110 130,130 110,100 C 90,70 120,30 170,40 C 220,50 240,90 250,140" stroke="#1a1c1d" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 10" fill="none" />
              </g>
              <path className="drawn-arrow-head" d="M 230,125 L 250,140 L 260,115" stroke="#1a1c1d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>

          <div className="new-hero-visual anim-fade-up anim-delay-2">
            <div className="new-hero-blob new-hero-blob-2" />
            <div className="new-hero-image-container">
              <div className="new-hero-floating-card top-card">
                <div className="top-card-icon">
                  <span className="material-symbols-outlined">volunteer_activism</span>
                </div>
                <div>
                  <p className="top-card-title">{t('home.demoGrantTitle')}</p>
                  <p className="top-card-subtitle">{t('home.demoGrantSubtitle')}</p>
                </div>
              </div>

              <div className="new-hero-image-wrapper blob-shape-1">
                <img
                  src={heroImage}
                  alt={t('home.heroImageAlt')}
                  className="new-hero-image"
                  loading="eager"
                />
              </div>

              <div className="new-hero-floating-card bottom-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '2.5rem', color: '#008558' }}>
                  verified
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="bottom-card-value" style={{ fontSize: '1.25rem' }}>{t('home.heroVerified')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-stats">
        <div className="container">
          <div className="stats-grid stats-grid-landing stats-grid--stagger">
            <div className="stat-item stat-item--pop">
              <span className="stat-value">12,450+</span>
              <span className="stat-label">{t('home.statStudentsAssisted')}</span>
            </div>
            <div className="stat-item stat-item--pop">
              <span className="stat-value">৳42.8M</span>
              <span className="stat-label">{t('home.statFundsDisbursed')}</span>
            </div>
            <div className="stat-item stat-item--pop">
              <span className="stat-value">100%</span>
              <span className="stat-label">{t('home.statTransparencyRate')}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section section-features section-conduit">
        <div className="container">
          <h2 className="section-title section-title-editorial">{t('home.conduitTitle')}</h2>
          <p className="section-subtitle">{t('home.conduitSubtitle')}</p>
          <div className="bento-grid">
            <div className="feature-card bento-large feature-card--lift" style={{ textAlign: 'center' }}>
              <div className="feature-index" style={{ textAlign: 'left' }}>01</div>
              <img src={cap3D} alt="" className="asset-3d asset-3d-float" />
              <h3 style={{ marginTop: '0.5rem' }}>{t('home.students')}</h3>
              <p>{t('home.studentsDesc')}</p>
            </div>
            <div className="feature-card bento-accent feature-card--lift" style={{ textAlign: 'center' }}>
              <img src={shield3D} alt="" className="asset-3d asset-3d-float" style={{ animationDelay: '-1.5s', maxWidth: '160px' }} />
              <h3 style={{ marginTop: '0.5rem' }}>{t('home.providers')}</h3>
              <p>{t('home.providersDesc')}</p>
            </div>
            <div className="feature-card bento-half feature-card--lift" style={{ textAlign: 'center' }}>
              <img src={funds3D} alt="" className="asset-3d asset-3d-float" style={{ animationDelay: '-3s', maxWidth: '100px' }} />
              <h3 style={{ marginTop: '0.5rem' }}>{t('home.dynamicFunding')}</h3>
              <p>{t('home.dynamicFundingDesc')}</p>
            </div>
            <div className="feature-card bento-half feature-card--lift">
              <div className="feature-icon" aria-hidden>
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <h3>{t('home.impactTracking')}</h3>
              <p>{t('home.impactTrackingDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-transparency">
        <div className="container transparency-wrap">
          <div className="transparency-main">
            <h2 className="section-title section-title-left">{t('home.radicalTitle')}</h2>
            <p className="transparency-text">{t('home.radicalLead')}</p>
            <ul className="trust-points">
              <li>{t('home.trustPoint1')}</li>
              <li>{t('home.trustPoint2')}</li>
              <li>{t('home.trustPoint3')}</li>
            </ul>
          </div>
          <div className="transparency-grid">
            <div className="feature-card feature-card--lift">
              <h3>{t('home.directFunding')}</h3>
              <p>{t('home.directFundingDesc')}</p>
            </div>
            <div className="feature-card feature-card--lift">
              <h3>{t('home.studentJourney')}</h3>
              <p>{t('home.studentJourneyDesc')}</p>
            </div>
            <div className="feature-card feature-card--lift">
              <h3>{t('home.verificationAi')}</h3>
              <p>{t('home.verificationAiDesc')}</p>
            </div>
            <div className="feature-card feature-card--lift">
              <h3>{t('home.globalSecurity')}</h3>
              <p>{t('home.globalSecurityDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-cta">
        <div className="container">
          <div className="cta-box cta-box-strong cta-box--anim">
            <h2 className="cta-title">{t('home.ctaTitle')}</h2>
            <p className="cta-text">{t('home.ctaText')}</p>
            <div className="cta-actions">
              <Link to="/register/student" className="btn btn-amber">
                {t('home.getStartedToday')}
              </Link>
              <Link to="/login" className="btn btn-outline">
                {t('nav.login')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
