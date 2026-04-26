import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API } from '../../config.js';


function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '—';
  }
}

export default function AdminRejections() {
  const { fetchWithAuth } = useAuth();
  const { t } = useLanguage();
  const [appRows, setAppRows] = useState([]);
  const [profileRows, setProfileRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${API}/admin/rejections`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Could not load');
        }
        const data = await res.json();
        if (!cancel) {
          setAppRows(data.applicationRejections || []);
          setProfileRows(data.profileRejections || []);
        }
      } catch (e) {
        toast.error(e.message);
        if (!cancel) {
          setAppRows([]);
          setProfileRows([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [fetchWithAuth]);

  return (
    <div className="dash-page">
      <header className="dash-page-header dash-page-header--admin">
        <div>
          <span className="dash-page-kicker">{t('dash.adminPortal')}</span>
          <h1 className="dash-page-title">{t('rejections.adminTitle')}</h1>
          <p className="dash-page-lead dash-muted">{t('rejections.leadAdmin')}</p>
        </div>
      </header>

      {loading ? (
        <p className="dash-muted">Loading…</p>
      ) : (
        <>
          <section className="dash-rejection-section">
            <h2 className="dash-rejection-section-title">{t('rejections.applicationSection')}</h2>
            {appRows.length === 0 ? (
              <div className="dash-card dash-rejection-panel">
                <p className="dash-muted" style={{ margin: 0 }}>
                  {t('rejections.emptyAppsAdmin')}
                </p>
              </div>
            ) : (
              <ul className="dash-rejection-list">
                {appRows.map((a) => (
                  <li key={a._id} className="dash-card dash-rejection-card">
                    <div className="dash-rejection-card-head">
                      <h2 className="dash-rejection-name">{a.student?.fullName || '—'}</h2>
                      <span className="badge badge-rejected">{t('dash.rejected')}</span>
                    </div>
                    <p className="dash-rejection-meta">
                      {a.program?.title || '—'}
                      {a.program?.provider?.organizationName
                        ? ` · ${a.program.provider.organizationName}`
                        : ''}
                    </p>
                    <p className="dash-rejection-line">
                      <strong>{t('rejections.reason')}:</strong> {a.rejectionReason || t('rejections.notProvided')}
                    </p>
                    <p className="dash-rejection-line">
                      <strong>{t('rejections.reviewed')}:</strong> {formatWhen(a.reviewedAt || a.updatedAt)}
                    </p>
                    {a.student?._id && (
                      <Link to={`/admin/students/${a.student._id}`} className="btn btn-outline btn-sm" style={{ marginTop: '0.75rem' }}>
                        {t('rejections.openStudent')}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dash-rejection-section" style={{ marginTop: '2.5rem' }}>
            <h2 className="dash-rejection-section-title">{t('rejections.profileSection')}</h2>
            {profileRows.length === 0 ? (
              <div className="dash-card dash-rejection-panel">
                <p className="dash-muted" style={{ margin: 0 }}>
                  {t('rejections.emptyProfile')}
                </p>
              </div>
            ) : (
              <ul className="dash-rejection-list">
                {profileRows.map((p) => (
                  <li key={p._id} className="dash-card dash-rejection-card dash-rejection-card--profile">
                    <div className="dash-rejection-card-head">
                      <h2 className="dash-rejection-name">{p.fullName || '—'}</h2>
                      <span className="badge badge-rejected">{t('dash.rejected')}</span>
                    </div>
                    <p className="dash-rejection-meta">
                      {p.user?.email}
                      {p.district ? ` · ${p.district}, ${p.upazila || ''}` : ''}
                    </p>
                    <p className="dash-rejection-line">
                      <strong>{t('rejections.reviewed')}:</strong> {formatWhen(p.verificationReviewedAt || p.updatedAt)}
                    </p>
                    <Link to={`/admin/students/${p._id}`} className="btn btn-outline btn-sm" style={{ marginTop: '0.75rem' }}>
                      {t('rejections.openStudent')}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
