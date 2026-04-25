import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API = '/api';

const STATUS_LABELS = {
  unreviewed: 'Awaiting Review',
  confirmed_fraud: 'Confirmed Fraud',
  cleared: 'Cleared — False Positive',
};

const APP_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function AdminFraudReview() {
  const { fetchWithAuth } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null); // { id, action, name }
  const [note, setNote] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('all'); // all | unreviewed | confirmed_fraud | cleared

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${API}/admin/applications/flagged`);
        if (res.ok) {
          setApps(await res.json());
        } else {
          toast.error('Could not load flagged applications');
        }
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchWithAuth]);

  const openModal = (app, action) => {
    setNote('');
    setConfirmModal({ id: app._id, action, name: app.student?.fullName || 'Unknown Student' });
  };

  const closeModal = useCallback(() => {
    if (busyId) return;
    setConfirmModal(null);
    setNote('');
  }, [busyId]);

  useEffect(() => {
    if (!confirmModal) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmModal, closeModal]);

  const submitReview = async () => {
    if (!confirmModal) return;
    setBusyId(confirmModal.id);
    try {
      const res = await fetchWithAuth(`${API}/admin/applications/${confirmModal.id}/fraud-review`, {
        method: 'PUT',
        body: JSON.stringify({ action: confirmModal.action, note: note.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Action failed');

      setApps((prev) => prev.map((a) => (a._id === confirmModal.id ? data : a)));
      toast.success(
        confirmModal.action === 'confirmed_fraud'
          ? '⚠ Fraud confirmed — application rejected'
          : '✓ Cleared as false positive'
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
      setConfirmModal(null);
      setNote('');
    }
  };

  const filtered = apps.filter((a) =>
    filter === 'all' ? true : a.fraudReviewStatus === filter
  );

  const counts = {
    all: apps.length,
    unreviewed: apps.filter((a) => a.fraudReviewStatus === 'unreviewed').length,
    confirmed_fraud: apps.filter((a) => a.fraudReviewStatus === 'confirmed_fraud').length,
    cleared: apps.filter((a) => a.fraudReviewStatus === 'cleared').length,
  };

  return (
    <div className="dash-page">
      {/* Header */}
      <header className="fraud-page-header">
        <div className="fraud-page-header-inner">
          <div className="fraud-header-icon-wrap" aria-hidden>
            <span className="material-symbols-outlined">gpp_bad</span>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              <Link to="/admin">Dashboard</Link>
              <span style={{ margin: '0 0.4rem', color: 'var(--text-muted)' }}>/</span>
              Fraud Review
            </p>
            <h1 className="dash-page-title" style={{ margin: 0 }}>
              Fraud &amp; Duplicate Aid Flags
            </h1>
            <p className="dash-page-lead" style={{ margin: '0.25rem 0 0' }}>
              Applications flagged for potential duplicate or fraudulent aid requests. Review each case and confirm or clear.
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="fraud-stats-strip">
          <div className="fraud-stat">
            <span className="fraud-stat-num">{counts.all}</span>
            <span className="fraud-stat-label">Total Flagged</span>
          </div>
          <div className="fraud-stat fraud-stat--danger">
            <span className="fraud-stat-num">{counts.unreviewed}</span>
            <span className="fraud-stat-label">Awaiting Review</span>
          </div>
          <div className="fraud-stat fraud-stat--red">
            <span className="fraud-stat-num">{counts.confirmed_fraud}</span>
            <span className="fraud-stat-label">Confirmed Fraud</span>
          </div>
          <div className="fraud-stat fraud-stat--green">
            <span className="fraud-stat-num">{counts.cleared}</span>
            <span className="fraud-stat-label">Cleared</span>
          </div>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="fraud-filter-tabs">
        {['all', 'unreviewed', 'confirmed_fraud', 'cleared'].map((f) => (
          <button
            key={f}
            type="button"
            className={`fraud-filter-tab${filter === f ? ' fraud-filter-tab--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : STATUS_LABELS[f]}
            <span className="fraud-filter-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="dash-card dash-loading">Loading flagged applications…</div>
      ) : filtered.length === 0 ? (
        <div className="fraud-empty">
          <span className="material-symbols-outlined">verified_user</span>
          <p>No flagged applications in this category.</p>
        </div>
      ) : (
        <div className="fraud-list">
          {filtered.map((app) => {
            const isConfirmed = app.fraudReviewStatus === 'confirmed_fraud';
            const isCleared = app.fraudReviewStatus === 'cleared';
            const isUnreviewed = app.fraudReviewStatus === 'unreviewed';
            const isBusy = busyId === app._id;

            return (
              <article
                key={app._id}
                className={`fraud-card${isConfirmed ? ' fraud-card--confirmed' : ''}${isCleared ? ' fraud-card--cleared' : ''}${isUnreviewed ? ' fraud-card--unreviewed' : ''}`}
              >
                {/* Top stripe */}
                <div className="fraud-card-stripe" aria-hidden />

                <div className="fraud-card-body">
                  {/* Left: student + program info */}
                  <div className="fraud-card-main">
                    {/* Status chip */}
                    <div className="fraud-chip-row">
                      {isUnreviewed && (
                        <span className="fraud-chip fraud-chip--warn">
                          <span className="material-symbols-outlined" aria-hidden>warning</span>
                          Flagged — Awaiting Review
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="fraud-chip fraud-chip--danger">
                          <span className="material-symbols-outlined" aria-hidden>gpp_bad</span>
                          Confirmed Fraud
                        </span>
                      )}
                      {isCleared && (
                        <span className="fraud-chip fraud-chip--clear">
                          <span className="material-symbols-outlined" aria-hidden>verified</span>
                          Cleared — False Positive
                        </span>
                      )}
                      <span className={`fraud-app-status-pill fraud-app-status-pill--${app.status}`}>
                        Application: {APP_STATUS_LABELS[app.status] || app.status}
                      </span>
                    </div>

                    {/* Student */}
                    <h2 className="fraud-card-student">
                      <span className="material-symbols-outlined" aria-hidden>person</span>
                      {app.student?.fullName || 'Unknown Student'}
                    </h2>
                    <p className="fraud-card-meta">
                      {app.student?.district && `${app.student.district}`}
                      {app.student?.upazila && `, ${app.student.upazila}`}
                      {app.student?.birthCertificateId && ` · ID: ${app.student.birthCertificateId}`}
                      {app.student?.cgpa != null && ` · CGPA ${app.student.cgpa}`}
                    </p>

                    {/* Program */}
                    <div className="fraud-card-program">
                      <span className="material-symbols-outlined" aria-hidden>school</span>
                      <div>
                        <span className="fraud-card-program-title">
                          {app.program?.title || 'Unknown Program'}
                        </span>
                        {app.program?.provider?.organizationName && (
                          <span className="fraud-card-program-provider">
                            {' '}— {app.program.provider.organizationName}
                          </span>
                        )}
                        {app.program?.amountPerBeneficiary && (
                          <span className="fraud-card-program-amount">
                            {' '}· ৳{Number(app.program.amountPerBeneficiary).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Conflict details */}
                    <div className="fraud-conflict-box">
                      <span className="material-symbols-outlined" aria-hidden>info</span>
                      <div>
                        <p className="fraud-conflict-title">Conflict Details</p>
                        <p className="fraud-conflict-body">
                          {app.duplicateConflictNotes || 'Duplicate aid conflict detected at application creation.'}
                        </p>
                      </div>
                    </div>

                    {/* Submitted at */}
                    {app.submittedAt && (
                      <p className="fraud-card-date">
                        Submitted: {new Date(app.submittedAt).toLocaleString()}
                      </p>
                    )}

                    {/* Review record */}
                    {(isConfirmed || isCleared) && (
                      <div className="fraud-review-record">
                        <span className="material-symbols-outlined" aria-hidden>
                          {isConfirmed ? 'gavel' : 'check_circle'}
                        </span>
                        <div>
                          <p>
                            {isConfirmed ? 'Confirmed as fraud' : 'Cleared as false positive'} by{' '}
                            <strong>{app.fraudReviewedBy?.email || 'Admin'}</strong>
                            {app.fraudReviewedAt && ` on ${new Date(app.fraudReviewedAt).toLocaleString()}`}
                          </p>
                          {app.fraudReviewNote && (
                            <p className="fraud-review-note">Note: "{app.fraudReviewNote}"</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: action buttons */}
                  {isUnreviewed && (
                    <div className="fraud-card-actions">
                      <button
                        type="button"
                        className="fraud-btn-confirm"
                        disabled={isBusy}
                        onClick={() => openModal(app, 'confirmed_fraud')}
                        title="Mark as confirmed fraud and auto-reject the application"
                      >
                        <span className="material-symbols-outlined" aria-hidden>gpp_bad</span>
                        Confirm Fraud
                      </button>
                      <button
                        type="button"
                        className="fraud-btn-clear"
                        disabled={isBusy}
                        onClick={() => openModal(app, 'cleared')}
                        title="Clear this flag as a false positive — application remains unchanged"
                      >
                        <span className="material-symbols-outlined" aria-hidden>verified</span>
                        Clear — False Positive
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Confirmation modal */}
      {confirmModal && (
        <div className="eads-modal" role="dialog" aria-modal="true" aria-labelledby="fraud-modal-title">
          <button
            type="button"
            className="eads-modal__backdrop"
            aria-label="Cancel"
            onClick={closeModal}
          />
          <div className={`eads-modal__panel fraud-modal${confirmModal.action === 'confirmed_fraud' ? ' fraud-modal--danger' : ' fraud-modal--clear'}`}>
            <div className="fraud-modal-icon" aria-hidden>
              <span className="material-symbols-outlined">
                {confirmModal.action === 'confirmed_fraud' ? 'gpp_bad' : 'verified'}
              </span>
            </div>
            <div className="eads-modal__head">
              <h2 id="fraud-modal-title" className="eads-modal__title">
                {confirmModal.action === 'confirmed_fraud'
                  ? 'Confirm Fraudulent Application'
                  : 'Clear Flag — False Positive'}
              </h2>
              <p className="eads-modal__lead">
                {confirmModal.action === 'confirmed_fraud'
                  ? `This will mark "${confirmModal.name}"'s application as confirmed fraud and automatically reject it. The student will be notified.`
                  : `This will clear the fraud flag on "${confirmModal.name}"'s application as a false positive. The application status will not change.`}
              </p>
            </div>
            <div className="eads-reject-form">
              <label className="form-label" htmlFor="fraud-review-note">
                {confirmModal.action === 'confirmed_fraud' ? 'Reason / Evidence (optional)' : 'Reason for Clearing (optional)'}
              </label>
              <textarea
                id="fraud-review-note"
                className="eads-reject-textarea"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder={
                  confirmModal.action === 'confirmed_fraud'
                    ? 'Describe the evidence of fraud…'
                    : 'Explain why this is a false positive…'
                }
              />
            </div>
            <div className="eads-modal__actions eads-modal__actions--reject">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!!busyId}
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!!busyId}
                className={confirmModal.action === 'confirmed_fraud' ? 'fraud-btn-confirm' : 'fraud-btn-clear'}
                onClick={submitReview}
              >
                {busyId
                  ? 'Processing…'
                  : confirmModal.action === 'confirmed_fraud'
                  ? 'Yes, Confirm Fraud'
                  : 'Yes, Clear Flag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
