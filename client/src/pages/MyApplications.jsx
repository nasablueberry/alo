import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API } from '../config.js';

function appStatusLabel(t, s) {
  if (!s) return '—';
  const k = 'dash.appStatus.' + String(s).toLowerCase();
  const v = t(k);
  return v === k ? s : v;
}

export default function MyApplications() {
  const { fetchWithAuth } = useAuth();
  const { t, locale } = useLanguage();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(API + '/applications/my');
        if (res.ok) setApplications(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchWithAuth]);

  if (loading) {
    return (
      <div className="container">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">{t('student.myAppsTitle')}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {applications.length === 0 ? (
          <div className="card">
            {t('student.noAppsLine')}{' '}
            <Link to="/student/programs">{t('student.browseToApply')}</Link> {t('student.toApply')}
          </div>
        ) : (
          applications.map((a) => (
            <div key={a._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{a.program?.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {t('student.amount')}: BDT {a.program?.amountPerBeneficiary?.toLocaleString(locale)} · {t('student.started')}:{' '}
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString(locale) : '-'}
                    {a.submissionStatus === 'submitted' && a.submittedAt
                      ? ` · ${t('student.submittedOn')}: ${new Date(a.submittedAt).toLocaleDateString(locale)}`
                      : ''}
                  </p>
                  {a.submissionStatus === 'draft' && (
                    <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                      <Link to={`/student/programs/${a.program?._id || a.program}/apply`}>{t('student.continueLink')}</Link>
                    </p>
                  )}
                  {a.submissionStatus === 'submitted' && a.status === 'pending' && (
                    <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                      <Link to={`/student/programs/${a.program?._id || a.program}/apply`}>{t('student.editLink')}</Link>
                    </p>
                  )}
                  {a.eligibilityNotes && (
                    <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                      {t('student.eligibility')}: {a.eligibilityNotes}
                    </p>
                  )}
                  {a.duplicateConflictWarning && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--warning)' }}>{t('student.duplicateWarning')}</p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {a.submissionStatus === 'draft' && (
                    <span className="badge" style={{ marginRight: '0.35rem', background: 'var(--warning-soft)', color: 'var(--amber)' }}>
                      {t('student.draftBadge')}
                    </span>
                  )}
                  <span className={`badge badge-${a.status}`}>{appStatusLabel(t, a.status)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
