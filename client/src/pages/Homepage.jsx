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
              <span className="new-hero-badge-text">Radically Transparent Funding</span>
            </div>
            
            <h1 className="new-hero-title anim-fade-up anim-delay-1">
              <span className="new-hero-title-highlight">Alokdaar:</span> Ensuring Education to All
            </h1>
            
            <p className="new-hero-subtitle anim-fade-up anim-delay-2">
              We bridge the gap between human potential and educational access through a verifiable, blockchain-backed aid ecosystem. Honest aid for honest growth.
            </p>
            
            <div className="new-hero-actions anim-fade-up anim-delay-3">
              <Link to="/register/student" className="new-btn-primary">
                Start Your Application
              </Link>
              <button className="new-btn-outline">
                How We Verify
              </button>
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
                  <p className="top-card-title">New Grant Issued</p>
                  <p className="top-card-subtitle">$2,400 to Sarah J.</p>
                </div>
              </div>

              <div className="new-hero-image-wrapper blob-shape-1">
                <img
                  src={heroImage}
                  alt="Young diverse Bangladeshi student smiling while studying"
                  className="new-hero-image"
                  loading="eager"
                />
              </div>

              <div className="new-hero-floating-card bottom-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '2.5rem', color: '#008558' }}>
                  verified
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="bottom-card-value" style={{ fontSize: '1.25rem' }}>Verified</span>
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
              <span className="stat-label">Students Assisted</span>
            </div>
            <div className="stat-item stat-item--pop">
              <span className="stat-value">৳42.8M</span>
              <span className="stat-label">Funds Disbursed</span>
            </div>
            <div className="stat-item stat-item--pop">
              <span className="stat-value">100%</span>
              <span className="stat-label">Transparency Rate</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section section-features section-conduit">
        <div className="container">
          <h2 className="section-title section-title-editorial">The Conduit of Progress</h2>
          <p className="section-subtitle">
            A transparent and structured path from application to meaningful support.
          </p>
          <div className="bento-grid">
            <div className="feature-card bento-large feature-card--lift" style={{ textAlign: 'center' }}>
              <div className="feature-index" style={{ textAlign: 'left' }}>01</div>
              <img src={cap3D} alt="Students 3D" className="asset-3d asset-3d-float" />
              <h3 style={{ marginTop: '0.5rem' }}>{t('home.students')}</h3>
              <p>{t('home.studentsDesc')}</p>
            </div>
            <div className="feature-card bento-accent feature-card--lift" style={{ textAlign: 'center' }}>
              <img src={shield3D} alt="Providers 3D" className="asset-3d asset-3d-float" style={{ animationDelay: '-1.5s', maxWidth: '160px' }} />
              <h3 style={{ marginTop: '0.5rem' }}>{t('home.providers')}</h3>
              <p>{t('home.providersDesc')}</p>
            </div>
            <div className="feature-card bento-half feature-card--lift" style={{ textAlign: 'center' }}>
              <img src={funds3D} alt="Dynamic Funding 3D" className="asset-3d asset-3d-float" style={{ animationDelay: '-3s', maxWidth: '100px' }} />
              <h3 style={{ marginTop: '0.5rem' }}>Dynamic Funding</h3>
              <p>Budgeted programs allocate support fairly across eligible learners.</p>
            </div>
            <div className="feature-card bento-half feature-card--lift">
              <div className="feature-icon" aria-hidden>
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <h3>Impact Tracking</h3>
              <p>Every disbursement is tracked with status updates and clear reporting.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-transparency">
        <div className="container transparency-wrap">
          <div className="transparency-main">
            <h2 className="section-title section-title-left">Radical Transparency as a Standard.</h2>
            <p className="transparency-text">
              We provide real-time visibility into how aid moves from donor funds to student outcomes.
            </p>
            <ul className="trust-points">
              <li>Third-party quality checks</li>
              <li>Clear audit trails for every disbursement</li>
              <li>Zero-hidden fee distribution model</li>
            </ul>
          </div>
          <div className="transparency-grid">
            <div className="feature-card feature-card--lift">
              <h3>Direct Funding</h3>
              <p>Support reaches students and institutions through verified channels.</p>
            </div>
            <div className="feature-card feature-card--lift">
              <h3>Student Journey</h3>
              <p>Track progress from first application to scholarship completion.</p>
            </div>
            <div className="feature-card feature-card--lift">
              <h3>Verification AI</h3>
              <p>Identity and eligibility checks reduce fraud and improve trust.</p>
            </div>
            <div className="feature-card feature-card--lift">
              <h3>Global Security</h3>
              <p>Modern safeguards protect student and provider information.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-cta">
        <div className="container">
          <div className="cta-box cta-box-strong cta-box--anim">
            <h2 className="cta-title">Ready to change a life?</h2>
            <p className="cta-text">Whether you are a student or a donor, your journey starts here.</p>
            <div className="cta-actions">
              <Link to="/register/student" className="btn btn-amber">
                Get Started Today
              </Link>
              <Link to="/login" className="btn btn-outline">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
