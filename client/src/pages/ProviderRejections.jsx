import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API } from '../config.js';


function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '—';
  }
}

export default function ProviderRejections() {
  const { fetchWithAuth } = useAuth();
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${API}/applications/provider/rejections`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Could not load');
        }
        const data = await res.json();
        if (!cancel) setRows(data);
      } catch (e) {
        toast.error(e.message);
        if (!cancel) setRows([]);
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
      <header className="dash-page-header">
        <div>
          <span className="dash-page-kicker">{t('dash.providerPortal')}</span>
          <h1 className="dash-page-title">{t('rejections.providerTitle')}</h1>
          <p className="dash-page-lead dash-muted">{t('rejections.leadProvider')}</p>
        </div>
      </header>

      {loading ? (
        <p className="dash-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="dash-card dash-rejection-panel">
          <p className="dash-muted" style={{ margin: 0 }}>
            {t('rejections.emptyApps')}
          </p>
        </div>
      ) : (
        <ul className="dash-rejection-list">
          {rows.map((a) => (
            <li key={a._id} className="dash-card dash-rejection-card">
              <div className="dash-rejection-card-head">
                <h2 className="dash-rejection-name">{a.student?.fullName || t('rejections.notProvided')}</h2>
                <span className="badge badge-rejected">{t('dash.rejected')}</span>
              </div>
              <p className="dash-rejection-meta">
                {a.student?.district}
                {a.student?.upazila ? ` · ${a.student.upazila}` : ''}
                {a.student?.birthCertificateId ? ` · ID ${a.student.birthCertificateId}` : ''}
              </p>
              <p className="dash-rejection-line">
                <strong>{t('rejections.program')}:</strong> {a.program?.title || '—'}
              </p>
              <p className="dash-rejection-line">
                <strong>{t('rejections.reason')}:</strong> {a.rejectionReason || t('rejections.notProvided')}
              </p>
              <p className="dash-rejection-line">
                <strong>{t('rejections.reviewed')}:</strong> {formatWhen(a.reviewedAt || a.updatedAt)}
              </p>
              {a.program?._id && (
                <Link to={`/provider/programs/${a.program._id}/applications`} className="btn btn-outline btn-sm" style={{ marginTop: '0.75rem' }}>
                  {t('rejections.openProgram')}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
