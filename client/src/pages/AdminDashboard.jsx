import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const API = '/api';

const REGION_BARS = [
  { key: 'dhaka', h: 62 },
  { key: 'chattogram', h: 78 },
  { key: 'rajshahi', h: 45 },
  { key: 'khulna', h: 88 },
  { key: 'sylhet', h: 55 },
];

export default function AdminDashboard() {
  const { fetchWithAuth } = useAuth();
  const { t } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [flaggedApps, setFlaggedApps] = useState([]);
  const [report, setReport] = useState({
    type: 'disbursements',
    format: 'csv',
    programId: '',
    district: '',
    from: '',
    to: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(API + '/admin/dashboard');
        if (res.ok) setDashboard(await res.json());
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [fetchWithAuth]);

  useEffect(() => {
    const loadFlagged = async () => {
      try {
        const res = await fetchWithAuth(`${API}/admin/applications/flagged`);
        if (res.ok) setFlaggedApps(await res.json());
      } catch (e) {
        console.error(e);
      }
    };
    loadFlagged();
  }, [fetchWithAuth]);

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const res = await fetchWithAuth(`${API}/programs/public?status=active&page=1&limit=100`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) setPrograms(data.programs || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadPrograms();
  }, [fetchWithAuth]);

  const onReportChange = (key, value) => {
    setReport((prev) => ({ ...prev, [key]: value }));
  };

  const downloadReport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(report).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      const res = await fetchWithAuth(`${API}/admin/reports?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to generate report');
      }
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition') || '';
      const fileMatch = contentDisposition.match(/filename="([^"]+)"/);
      const fallbackName = `report-${Date.now()}.${report.format === 'pdf' ? 'pdf' : 'csv'}`;
      const filename = fileMatch?.[1] || fallbackName;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (e) {
      toast.error(e.message || 'Report generation failed');
    }
  };

  if (!dashboard) {
    return (
      <div className="dash-page">
        <div className="dash-card dash-loading">{t('dash.loading')}</div>
      </div>
    );
  }

  const pending = dashboard.pendingApplications ?? 0;
  const queuePct = Math.min(100, Math.max(8, Math.round(15 + Math.min(pending * 3, 70))));
  const r = 52;
  const c = 2 * Math.PI * r;
  const dashLen = (queuePct / 100) * c;

  return (
    <div className="dash-page">
      <header className="dash-page-header dash-page-header--admin">
        <div>
          <h1 className="dash-page-title">{t('dash.systemAnalytics')}</h1>
          <p className="dash-page-lead">{t('dash.systemOverview')}</p>
        </div>
        <div className="dash-admin-actions">
          <div className="dash-pill-soft">
            <span className="material-symbols-outlined">calendar_today</span>
            <span>{t('dash.reportPeriod')}</span>
          </div>
          <button type="button" className="btn btn-primary" onClick={downloadReport}>
            {t('dash.generateExport')}
          </button>
        </div>
      </header>

      <div className="dash-admin-bento">
        <section className="dash-card dash-admin-chart">
          <div className="dash-card-head">
            <h2 className="dash-card-h">{t('dash.distributionByRegion')}</h2>
            <div className="dash-legend">
              <span>
                <i className="dash-dot-swatch dash-dot-swatch--primary" /> {t('dash.approved')}
              </span>
              <span>
                <i className="dash-dot-swatch" /> {t('dash.pending')}
              </span>
            </div>
          </div>
          <div className="dash-bar-row">
            {REGION_BARS.map((r) => (
              <div key={r.key} className="dash-bar-col">
                <div className="dash-bar-shell">
                  <div className="dash-bar-fill" style={{ height: `${r.h}%` }} />
                </div>
                <span className="dash-bar-label">{t(`dash.region.${r.key}`)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-card dash-admin-donut">
          <h2 className="dash-card-h">{t('dash.approvalRatio')}</h2>
          <div className="dash-donut-wrap">
            <svg className="dash-donut-svg" viewBox="0 0 120 120">
              <circle className="dash-donut-track" cx="60" cy="60" r="52" />
              <circle
                className="dash-donut-prog"
                cx="60"
                cy="60"
                r={r}
                strokeDasharray={`${dashLen} ${c}`}
              />
            </svg>
            <div className="dash-donut-center">
              <span className="dash-donut-num">{pending}</span>
              <span className="dash-donut-sub">{t('dash.pendingQueue')}</span>
            </div>
          </div>
          <div className="dash-mini-stats">
            <div>
              <span className="dash-muted-sm">{t('dash.activeProgramsLabel')}</span>
              <span className="dash-mini-val">{dashboard.activePrograms}</span>
            </div>
            <div>
              <span className="dash-muted-sm">{t('dash.pending')}</span>
              <span className="dash-mini-val dash-text-warn">{pending}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="dash-admin-row2">
        <section className={`dash-card dash-alert-card${flaggedApps.filter(a => a.fraudReviewStatus === 'unreviewed').length > 0 ? ' dash-alert-card--active' : ''}`}>
          <div className="dash-alert-head">
            <span className="material-symbols-outlined" style={{ color: flaggedApps.filter(a => a.fraudReviewStatus === 'unreviewed').length > 0 ? '#dc2626' : 'var(--text-muted)' }}>
              gpp_bad
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h3 className="dash-card-h">{t('dash.duplicateAlerts')}</h3>
                {flaggedApps.filter(a => a.fraudReviewStatus === 'unreviewed').length > 0 && (
                  <span className="fraud-admin-badge">
                    {flaggedApps.filter(a => a.fraudReviewStatus === 'unreviewed').length} awaiting review
                  </span>
                )}
              </div>
              <p className="dash-muted-sm">{t('dash.duplicateBody')}</p>
            </div>
          </div>

          {flaggedApps.length === 0 ? (
            <p className="dash-muted dash-alert-hint" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#16a34a' }}>check_circle</span>
              No duplicate aid flags detected. All clear.
            </p>
          ) : (
            <>
              <div className="fraud-admin-stats">
                <div className="fraud-admin-stat">
                  <span className="fraud-admin-stat-num" style={{ color: '#dc2626' }}>
                    {flaggedApps.filter(a => a.fraudReviewStatus === 'unreviewed').length}
                  </span>
                  <span className="fraud-admin-stat-label">Unreviewed</span>
                </div>
                <div className="fraud-admin-stat">
                  <span className="fraud-admin-stat-num" style={{ color: '#b91c1c' }}>
                    {flaggedApps.filter(a => a.fraudReviewStatus === 'confirmed_fraud').length}
                  </span>
                  <span className="fraud-admin-stat-label">Confirmed Fraud</span>
                </div>
                <div className="fraud-admin-stat">
                  <span className="fraud-admin-stat-num" style={{ color: '#16a34a' }}>
                    {flaggedApps.filter(a => a.fraudReviewStatus === 'cleared').length}
                  </span>
                  <span className="fraud-admin-stat-label">Cleared</span>
                </div>
              </div>
              <Link to="/admin/fraud" className="fraud-admin-review-link">
                <span className="material-symbols-outlined" aria-hidden>arrow_forward</span>
                Review flagged applications
              </Link>
            </>
          )}
        </section>

        <div className="dash-quick-grid">
          <Link to="/admin/students" className="dash-quick-tile">
            <span className="material-symbols-outlined">how_to_reg</span>
            <div>
              <p className="dash-quick-title">{t('dash.verifyStudents')}</p>
              <p className="dash-quick-sub">{dashboard.totalStudents} {t('dash.totalStudents')}</p>
            </div>
          </Link>
          <Link to="/admin/providers" className="dash-quick-tile dash-quick-tile--green">
            <span className="material-symbols-outlined">verified_user</span>
            <div>
              <p className="dash-quick-title">{t('dash.approveProviders')}</p>
              <p className="dash-quick-sub">{dashboard.totalProviders} {t('dash.totalProviders')}</p>
            </div>
          </Link>
          <div className="dash-quick-tile dash-quick-tile--muted">
            <span className="material-symbols-outlined">payments</span>
            <div>
              <p className="dash-quick-title">{t('dash.disbursements')}</p>
              <p className="dash-quick-sub">
                ৳ {Number(dashboard.totalFundUtilized || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="dash-quick-tile dash-quick-tile--muted">
            <span className="material-symbols-outlined">analytics</span>
            <div>
              <p className="dash-quick-title">{t('dash.impactReport')}</p>
              <p className="dash-quick-sub">{t('dash.reportPeriod')}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="dash-card dash-audit-card">
        <div className="dash-card-head">
          <h2 className="dash-card-h">{t('dash.auditLog')}</h2>
        </div>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>{t('dash.colAction')}</th>
                <th>{t('dash.colResource')}</th>
                <th>{t('dash.colUser')}</th>
                <th>{t('dash.colTime')}</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard.recentAudit || []).slice(0, 12).map((log) => (
                <tr key={log._id}>
                  <td>
                    <strong>{log.action}</strong>
                  </td>
                  <td className="dash-muted-sm">
                    {log.resource} {log.resourceId ? String(log.resourceId).slice(-6) : ''}
                  </td>
                  <td className="dash-muted-sm">{log.user?.email || '—'}</td>
                  <td className="dash-muted-sm">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dash-card" style={{ marginTop: '1.25rem' }}>
        <div className="dash-card-head">
          <h2 className="dash-card-h">Report Generation System</h2>
          <button type="button" className="btn btn-primary" onClick={downloadReport}>
            Download {report.format.toUpperCase()}
          </button>
        </div>
        <p className="dash-muted" style={{ marginBottom: '0.9rem' }}>
          Generate downloadable reports by program, region, and time period.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <select value={report.type} onChange={(e) => onReportChange('type', e.target.value)}>
            <option value="disbursements">Program disbursements</option>
            <option value="regional">Regional impact</option>
          </select>
          <select value={report.format} onChange={(e) => onReportChange('format', e.target.value)}>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
          <select value={report.programId} onChange={(e) => onReportChange('programId', e.target.value)}>
            <option value="">All programs</option>
            {programs.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </select>
          <input
            placeholder="District (optional)"
            value={report.district}
            onChange={(e) => onReportChange('district', e.target.value)}
          />
          <input type="date" value={report.from} onChange={(e) => onReportChange('from', e.target.value)} />
          <input type="date" value={report.to} onChange={(e) => onReportChange('to', e.target.value)} />
        </div>
      </section>
    </div>
  );
}
