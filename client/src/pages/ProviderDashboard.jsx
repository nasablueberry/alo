import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API } from '../config.js';


function programStatusLabel(t, s) {
  if (!s) return '—';
  const k = 'dash.progStatus.' + String(s).toLowerCase();
  const v = t(k);
  return v === k ? s : v;
}

export default function ProviderDashboard() {
  const { fetchWithAuth, profile } = useAuth();
  const { t, locale } = useLanguage();
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(API + '/programs/my/list');
        if (res.ok) setPrograms(await res.json());
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [fetchWithAuth]);

  const totalFund = programs.reduce((s, p) => s + (Number(p.totalFund) || 0), 0);
  const totalRemaining = programs.reduce((s, p) => s + (Number(p.remainingFund) || 0), 0);
  const disbursed = Math.max(0, totalFund - totalRemaining);
  const activeCount = programs.filter((p) => p.status === 'active').length;
  const beneficiaries = programs.reduce((s, p) => s + (Number(p.currentBeneficiaries) || 0), 0);

  return (
    <div className="dash-page">
      <header className="dash-page-header dash-page-header--provider">
        <div>
          <span className="dash-page-kicker">{t('dash.providerPortal')}</span>
          <h1 className="dash-page-title">{t('nav.dashboard')}</h1>
          <p className="dash-page-lead">{t('dash.providerLead')}</p>
        </div>
        <div className="dash-provider-chip">
          <div className="dash-provider-avatar">
            {(profile?.organizationName || 'E')
              .split(/\s+/)
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="dash-page-name">{profile?.organizationName || '—'}</p>
            <p className="dash-page-sub">{profile?.type || '—'}</p>
          </div>
        </div>
      </header>

      <div className="dash-provider-grid">
        <section className="dash-card dash-provider-main">
          <div className="dash-card-head">
            <div>
              <h2 className="dash-card-title">{t('dash.createProgramTitle')}</h2>
              <p className="dash-muted">{t('dash.createProgramSub')}</p>
            </div>
            <Link to="/provider/programs/new" className="btn btn-primary">
              {t('dash.newProgram')}
            </Link>
          </div>
          <p className="dash-muted">{t('dash.createProgramHint')}</p>
        </section>

        <aside className="dash-provider-aside">
          <div className="dash-metric">
            <p className="dash-metric-label">{t('dash.totalDisbursedLabel')}</p>
            <p className="dash-metric-value">৳ {disbursed.toLocaleString()}</p>
          </div>
          <div className="dash-metric dash-metric--green">
            <p className="dash-metric-label">{t('dash.activeScholars')}</p>
            <p className="dash-metric-value">{beneficiaries}</p>
          </div>
          <div className="dash-card dash-programs-list">
            <div className="dash-card-head">
              <div>
                <h3 className="dash-card-h">{t('dash.totalPrograms')}</h3>
                <p className="dash-muted-xs">
                  {activeCount} {t('dash.activePrograms')}
                </p>
              </div>
              <Link to="/provider/programs/new" className="dash-inline-link">
                {t('dash.viewAll')}
              </Link>
            </div>
            {programs.length === 0 ? (
              <p className="dash-muted">{t('dash.noProgramsYet')}</p>
            ) : (
              <div className="dash-program-stack">
                {programs.map((p) => {
                  const tf = Number(p.totalFund) || 0;
                  const rf = Number(p.remainingFund) || 0;
                  const pct = tf > 0 ? Math.round(((tf - rf) / tf) * 100) : 0;
                  return (
                    <div key={p._id} className="dash-program-item">
                      <div className="dash-program-head">
                        <h4>{p.title}</h4>
                        <span className={`badge badge-${p.status === 'active' ? 'active' : 'pending'}`}>
                          {programStatusLabel(t, p.status)}
                        </span>
                      </div>
                      <p className="dash-muted-xs">
                        {t('dash.beneficiaryLine')}: {p.currentBeneficiaries ?? 0} / {p.maxBeneficiaries ?? '—'}
                      </p>
                      <div className="dash-progress-track">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      <div className="dash-progress-labels">
                        <span>
                          ৳ {(tf - rf).toLocaleString(locale)} {t('dash.disbursedShort')}
                        </span>
                        <span>
                          ৳ {tf.toLocaleString(locale)} {t('dash.totalShort')}
                        </span>
                      </div>
                      <Link
                        to={`/provider/programs/${p._id}/applications`}
                        className="dash-inline-link"
                        style={{ display: 'inline-block', marginTop: '0.5rem' }}
                      >
                        {t('nav.reviewApplications')}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      <section className="dash-card dash-provider-bottom">
        <div className="dash-banner">
          <div>
            <span className="dash-banner-kicker">{t('dash.impactNote')}</span>
            <h3 className="dash-banner-title">{t('dash.transparencyTitle')}</h3>
          </div>
          <span className="material-symbols-outlined dash-banner-icon">verified</span>
        </div>
        <p className="dash-muted">{t('dash.verificationBody')}</p>
      </section>
    </div>
  );
}
