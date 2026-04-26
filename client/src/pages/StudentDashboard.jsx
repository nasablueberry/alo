import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import StudentWithdrawPanel from '../components/StudentWithdrawPanel';
import { API } from '../config.js';


export default function StudentDashboard() {
  const { fetchWithAuth, profile, loadUser } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [stats, setStats] = useState({ applications: [], disbursements: [] });
  const [withdrawals, setWithdrawals] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const loadWallet = useCallback(async () => {
    try {
      const [histRes, wRes] = await Promise.all([
        fetchWithAuth(API + '/students/scholarship-history'),
        fetchWithAuth(API + '/students/withdrawals'),
      ]);
      if (histRes.ok) {
        const h = await histRes.json();
        setStats((s) => ({ ...s, disbursements: h.disbursements || [] }));
      }
      if (wRes.ok) {
        setWithdrawals(await wRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    const load = async () => {
      try {
        const [appRes, histRes, notifRes, wRes] = await Promise.all([
          fetchWithAuth(API + '/applications/my'),
          fetchWithAuth(API + '/students/scholarship-history'),
          fetchWithAuth(API + '/notifications?limit=8'),
          fetchWithAuth(API + '/students/withdrawals'),
        ]);
        if (appRes.ok) {
          const applications = await appRes.json();
          setStats((s) => ({ ...s, applications }));
        }
        if (histRes.ok) {
          const h = await histRes.json();
          setStats((s) => ({ ...s, disbursements: h.disbursements || [] }));
        }
        if (notifRes.ok) {
          const n = await notifRes.json();
          setNotifications(n.notifications || []);
        }
        if (wRes.ok) {
          setWithdrawals(await wRes.json());
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [fetchWithAuth]);

  useEffect(() => {
    const id = location.hash?.replace('#', '');
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }, [location.hash, location.pathname]);

  const [downloading, setDownloading] = useState(false);

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      const res = await fetchWithAuth(API + '/students/report');
      if (!res.ok) throw new Error('Failed to download report');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student-report-${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Error downloading report');
    } finally {
      setDownloading(false);
    }
  };

  const pending = stats.applications.filter((a) => a.status === 'pending').length;
  const approved = stats.applications.filter((a) => a.status === 'approved').length;

  const totalAid = stats.disbursements.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const needScore = profile?.financialNeedScore != null ? Number(profile.financialNeedScore).toFixed(1) : '—';

  const verificationLabel =
    profile?.verificationStatus === 'verified'
      ? t('dash.approved')
      : profile?.verificationStatus === 'rejected'
        ? t('dash.rejected')
        : profile?.verificationStatus === 'unverified'
          ? 'Unverified'
          : t('dash.pending');

  const verificationPillClass =
    profile?.verificationStatus === 'verified'
      ? 'dash-pill--green'
      : profile?.verificationStatus === 'rejected'
        ? 'dash-pill--amber'
        : profile?.verificationStatus === 'unverified'
          ? 'dash-pill--slate'
          : 'dash-pill--amber';

  return (
    <div className="dash-page">
      <header className="dash-page-header">
        <div>
          <span className="dash-page-kicker">{t('dash.studentPortal')}</span>
          <h1 className="dash-page-title">
            {t('dash.welcomeBack')}
            {profile?.fullName ? `, ${profile.fullName.split(' ')[0]}.` : '.'}
          </h1>
        </div>
        {profile?.birthCertificateId && (
          <div className="dash-page-header-meta">
            <div>
              <p className="dash-page-name">{profile.fullName}</p>
              <p className="dash-page-sub">ID: {profile.birthCertificateId}</p>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={handleDownloadReport}
              disabled={downloading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
            >
              <span className="material-symbols-outlined">download</span>
              {downloading ? 'Downloading...' : 'Download Report (PDF)'}
            </button>
          </div>
        )}
      </header>

      <div className="dash-bento">
        <section className="dash-card dash-card--hero dash-span-8" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="dash-card-glow" aria-hidden />
          <div className="dash-hero-inner">
            <div className="dash-hero-main">
              <div className="dash-badges">
                <span className={`dash-pill ${verificationPillClass}`}>{verificationLabel}</span>
                {profile?.isAtRisk && (
                  <span className="dash-pill dash-pill--amber">{t('dash.atRiskBadge')}</span>
                )}
              </div>
              <h2 className="dash-card-title">{profile?.institutionName || '—'}</h2>
              <p className="dash-muted">
                {profile?.district}, {profile?.upazila} · CGPA {profile?.cgpa ?? '—'} ·{' '}
                {t('dash.attendanceShort')}: {profile?.attendancePercentage ?? '—'}%
              </p>
              {profile?.isAtRisk && profile?.atRiskReason && (
                <p className="dash-risk">{profile.atRiskReason}</p>
              )}
              <div className="dash-stat-row">
                <div>
                  <p className="dash-stat-label">CGPA</p>
                  <p className="dash-stat-value">{profile?.cgpa ?? '—'}</p>
                </div>
                <div>
                  <p className="dash-stat-label">{t('dash.attendanceShort')}</p>
                  <p className="dash-stat-value">{profile?.attendancePercentage ?? '—'}%</p>
                </div>
                <div>
                  <p className="dash-stat-label">{t('dash.totalAid')}</p>
                  <p className="dash-stat-value">
                    ৳ {totalAid ? totalAid.toLocaleString() : '0'}
                  </p>
                </div>
                <div>
                  <p className="dash-stat-label">Account balance</p>
                  <p className="dash-stat-value">
                    ৳{' '}
                    {profile?.accountBalance != null
                      ? Number(profile.accountBalance).toLocaleString()
                      : '0'}
                  </p>
                </div>
              </div>
              <div className="dash-hero-withdraw">
                <StudentWithdrawPanel
                  accountBalance={profile?.accountBalance}
                  onSuccess={loadWallet}
                />
              </div>
            </div>
            <div className="dash-hero-side">
              <p className="dash-stat-label">{t('dash.profileCard')}</p>
              <div className="dash-meter-labels">
                <span>{t('dash.needLabel')}</span>
                <span className="dash-text-accent">{needScore}</span>
              </div>
              <div className="dash-meter">
                <span
                  style={{
                    width: `${Math.min(100, Math.max(0, Number(profile?.financialNeedScore) || 0))}%`,
                  }}
                />
              </div>
              <Link to="/student/programs" className="btn btn-primary dash-hero-cta">
                {t('dash.explorePrograms')}
              </Link>
            </div>
          </div>
        </section>

        <section className="dash-card dash-card--timeline dash-span-4">
          <h3 className="dash-card-h">{t('dash.applicationStatus')}</h3>
          <div className="dash-timeline">
            <div className="dash-timeline-line" aria-hidden />
            <div className="dash-timeline-item">
              <div className="dash-dot dash-dot--done">
                <span className="material-symbols-outlined">check</span>
              </div>
              <div>
                <p className="dash-timeline-title">{t('dash.stepProfile')}</p>
                <p className="dash-muted-sm">{verificationLabel}</p>
              </div>
            </div>
            <div className="dash-timeline-item">
              <div
                className={
                  stats.applications.length ? 'dash-dot dash-dot--done' : 'dash-dot dash-dot--idle'
                }
              >
                {stats.applications.length ? (
                  <span className="material-symbols-outlined">check</span>
                ) : null}
              </div>
              <div>
                <p className="dash-timeline-title">{t('dash.stepApply')}</p>
                <p className="dash-muted-sm">
                  {stats.applications.length
                    ? `${stats.applications.length} ${t('dash.submitted')}`
                    : t('dash.noApplicationsYet')}
                </p>
              </div>
            </div>
            <div className="dash-timeline-item">
              <div
                className={
                  pending
                    ? 'dash-dot dash-dot--active'
                    : approved
                      ? 'dash-dot dash-dot--done'
                      : 'dash-dot dash-dot--idle'
                }
              >
                {pending ? (
                  <span className="material-symbols-outlined">hourglass_empty</span>
                ) : approved ? (
                  <span className="material-symbols-outlined">check</span>
                ) : null}
              </div>
              <div>
                <p className="dash-timeline-title">{t('dash.stepDecision')}</p>
                <p className="dash-muted-sm">
                  {pending
                    ? `${pending} ${t('dash.pendingLower')}`
                    : `${approved} ${t('dash.approvedLower')}`}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="dash-card dash-card--score dash-span-4">
          <div className="dash-score-bg" aria-hidden>
            <span className="material-symbols-outlined">verified</span>
          </div>
          <h3 className="dash-card-h">{t('dash.eligibilityScore')}</h3>
          <p className="dash-muted dash-score-desc">{t('dash.eligibilityBlurb')}</p>
          <div className="dash-score-big">{needScore}</div>
          <p className="dash-muted-xs">{t('dash.compositeIndex')}</p>
        </section>

        <section className="dash-card dash-span-8">
          <h3 className="dash-card-h">{t('dash.recentApplications')}</h3>
          {stats.applications.length === 0 ? (
            <p className="dash-muted">{t('dash.noApplicationsYet')}</p>
          ) : (
            <ul className="dash-list">
              {stats.applications.slice(0, 6).map((a) => (
                <li key={a._id} className="dash-list-row">
                  <Link to="/student/applications">{a.program?.title || '—'}</Link>
                  <span className={`badge badge-${a.status}`}>{a.status}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/student/programs" className="dash-inline-link">
            {t('dash.explorePrograms')} →
          </Link>
        </section>

        <section className="dash-card dash-span-4 dash-notif-section" id="dash-notifications">
          <h3 className="dash-card-h">{t('dash.notifications')}</h3>
          {notifications.length === 0 ? (
            <p className="dash-muted">{t('dash.noNotifications')}</p>
          ) : (
            <ul className="dash-notif-list">
              {notifications.map((n) => (
                <li key={n._id}>
                  <strong>{n.title}</strong>
                  <span>{n.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-card dash-span-12 dash-split" id="dash-disbursements">
          <div className="dash-split-visual" />
          <div className="dash-split-body">
            <h3 className="dash-card-h">{t('dash.disbursementStatus')}</h3>
            <p className="dash-muted">{t('dash.insightBody')}</p>
            {stats.disbursements.length === 0 ? (
              <p className="dash-muted">{t('dash.noDisbursements')}</p>
            ) : (
              <ul className="dash-list">
                {stats.disbursements.slice(0, 5).map((d) => (
                  <li key={d._id} className="dash-list-row">
                    <span>
                      ৳ {Number(d.amount).toLocaleString()} · {d.program?.title || '—'}
                    </span>
                    <span className="dash-muted-sm">
                      {d.paymentMethod} · {d.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="dash-card-h" style={{ marginTop: '1.25rem' }}>
              {t('dash.withdrawHistory')}
            </h3>
            {withdrawals.length === 0 ? (
              <p className="dash-muted">{t('dash.noWithdrawals')}</p>
            ) : (
              <ul className="dash-list">
                {withdrawals.slice(0, 6).map((w) => (
                  <li key={w._id} className="dash-list-row">
                    <span>
                      ৳ {Number(w.amount).toLocaleString()} → {w.method}
                    </span>
                    <span className="dash-muted-sm">{w.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
