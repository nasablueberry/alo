import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API } from '../config.js';


export default function ProviderReviewApplications() {
  const { fetchWithAuth, profile } = useAuth();
  const { t } = useLanguage();
  const [programs, setPrograms] = useState([]);
  const activeCount = programs.filter((p) => p.status === 'active').length;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(`${API}/programs/my/list`);
        if (res.ok) setPrograms(await res.json());
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [fetchWithAuth]);

  return (
    <div className="dash-page">
      <header className="dash-page-header dash-page-header--provider" style={{ marginBottom: '1.25rem' }}>
        <div>
          <span className="dash-page-kicker">{t('dash.providerPortal')}</span>
          <h1 className="page-title" style={{ marginTop: 0 }}>
            {t('nav.reviewApplications')}
          </h1>
          <p className="dash-page-lead dash-muted">{t('dash.reviewApplicationsLead')}</p>
        </div>
        <div className="dash-provider-chip" aria-hidden>
          <div className="dash-provider-avatar">
            {(profile?.organizationName || 'E')
              .split(/\s+/)
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
        </div>
      </header>

      {programs.length === 0 ? (
        <div className="card">
          <p className="dash-muted">{t('dash.noProgramsYet')}</p>
          <p style={{ marginTop: '0.75rem' }}>
            <Link to="/provider/programs/new" className="btn btn-primary">
              {t('dash.newProgram')}
            </Link>
          </p>
        </div>
      ) : (
        <div className="dash-card dash-programs-list">
          <div className="dash-card-head">
            <div>
              <h2 className="dash-card-h">{t('dash.totalPrograms')}</h2>
              <p className="dash-muted-xs">
                {activeCount} {t('dash.activePrograms')}
              </p>
            </div>
            <Link to="/provider" className="dash-inline-link">
              {t('nav.dashboard')}
            </Link>
          </div>
          <div className="dash-program-stack">
            {programs.map((p) => {
              const tf = Number(p.totalFund) || 0;
              const rf = Number(p.remainingFund) || 0;
              const pct = tf > 0 ? Math.round(((tf - rf) / tf) * 100) : 0;
              return (
                <div key={p._id} className="dash-program-item">
                  <div className="dash-program-head">
                    <h3>{p.title}</h3>
                    <span className={`badge badge-${p.status === 'active' ? 'active' : 'pending'}`}>
                      {p.status}
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
                      ৳ {(tf - rf).toLocaleString()} {t('dash.disbursedShort')}
                    </span>
                    <span>
                      ৳ {tf.toLocaleString()} {t('dash.totalShort')}
                    </span>
                  </div>
                  <Link
                    to={`/provider/programs/${p._id}/applications`}
                    className="btn btn-primary"
                    style={{ display: 'inline-block', marginTop: '0.75rem' }}
                  >
                    {t('nav.reviewApplications')}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
