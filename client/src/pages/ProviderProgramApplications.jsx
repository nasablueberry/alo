import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { uploadUrl } from '../utils/uploadUrl';
import { API } from '../config.js';


const profileDocTypeLabel = (type) => {
  const m = {
    transcript: 'Transcript',
    income_proof: 'Income proof',
    identification: 'Identification',
    birth_certificate: 'Birth certificate',
  };
  return m[type] || type || 'Document';
};

/** Fraud status chip shown inside application cards */
function FraudBanner({ app }) {
  if (!app.duplicateConflictWarning) return null;

  const isConfirmed = app.fraudReviewStatus === 'confirmed_fraud';
  const isCleared   = app.fraudReviewStatus === 'cleared';

  return (
    <div className={`fraud-provider-banner${isConfirmed ? ' fraud-provider-banner--confirmed' : isCleared ? ' fraud-provider-banner--cleared' : ''}`}>
      <div className="fraud-provider-banner-icon" aria-hidden>
        <span className="material-symbols-outlined">
          {isCleared ? 'verified' : 'gpp_bad'}
        </span>
      </div>
      <div className="fraud-provider-banner-body">
        {isConfirmed && (
          <p className="fraud-provider-banner-title">
            ⚠ Confirmed Fraudulent — Application Auto-Rejected by Admin
          </p>
        )}
        {isCleared && (
          <p className="fraud-provider-banner-title fraud-provider-banner-title--cleared">
            ✓ False Positive — Cleared by Admin
          </p>
        )}
        {!isConfirmed && !isCleared && (
          <p className="fraud-provider-banner-title">
            ⚠ Flagged for Potential Fraudulent Activity — Awaiting Admin Review
          </p>
        )}
        <p className="fraud-provider-banner-detail">
          {app.duplicateConflictNotes || 'Duplicate aid conflict detected. This student may already be receiving active scholarship(s).'}
        </p>
        {(isConfirmed || isCleared) && app.fraudReviewedBy?.email && (
          <p className="fraud-provider-banner-reviewer">
            Reviewed by <strong>{app.fraudReviewedBy.email}</strong>
            {app.fraudReviewedAt ? ` · ${new Date(app.fraudReviewedAt).toLocaleDateString()}` : ''}
            {app.fraudReviewNote ? ` · "${app.fraudReviewNote}"` : ''}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProviderProgramApplications() {
  const { programId } = useParams();
  const { fetchWithAuth } = useAuth();
  const { t } = useLanguage();
  const [program, setProgram] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const closeRejectModal = useCallback(() => {
    if (busyId) return;
    setRejectModal(null);
    setRejectReason('');
  }, [busyId]);

  useEffect(() => {
    if (!rejectModal) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeRejectModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [rejectModal, closeRejectModal]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [progRes, appRes] = await Promise.all([
          fetch(`${API}/programs/${programId}`),
          fetchWithAuth(`${API}/applications/program/${programId}`),
        ]);
        const progData = await progRes.json().catch(() => ({}));
        if (progRes.ok) setProgram(progData);
        if (appRes.ok) {
          setApplications(await appRes.json());
        } else {
          const err = await appRes.json().catch(() => ({}));
          throw new Error(err.message || 'Could not load applications');
        }
      } catch (e) {
        console.error(e);
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (programId) load();
  }, [programId, fetchWithAuth]);

  const review = async (applicationId, action, rejectionReasonText) => {
    setBusyId(applicationId);
    try {
      const res = await fetchWithAuth(`${API}/applications/${applicationId}/review`, {
        method: 'PUT',
        body: JSON.stringify({
          action,
          ...(action === 'reject' ? { rejectionReason: rejectionReasonText || undefined } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Update failed');
      toast.success(action === 'approve' ? 'Application approved' : 'Application rejected');
      setApplications((list) => list.map((a) => (a._id === applicationId ? data : a)));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const openRejectModal = (a) => {
    setRejectReason('');
    setRejectModal({ id: a._id, name: a.student?.fullName || '—' });
  };

  const confirmReject = async () => {
    if (!rejectModal) return;
    const id = rejectModal.id;
    const reason = rejectReason.trim();
    setRejectModal(null);
    setRejectReason('');
    await review(id, 'reject', reason);
  };

  if (loading) {
    return (
      <div className="dash-page">
        <p className="dash-muted">Loading…</p>
      </div>
    );
  }

  const flaggedCount = applications.filter((a) => a.duplicateConflictWarning).length;

  return (
    <div className="dash-page">
      <p style={{ marginBottom: '0.5rem' }}>
        <Link to="/provider">Dashboard</Link>
        <span style={{ color: 'var(--text-muted)' }}> / </span>
        <span style={{ color: 'var(--text-muted)' }}>{t('nav.applications')}</span>
      </p>
      <h1 className="page-title">{program?.title || 'Program applications'}</h1>
      <p className="dash-page-lead dash-muted" style={{ marginBottom: '1.25rem' }}>
        Review submitted applications. Only students who completed the application form appear here.
      </p>

      {/* Flagged summary banner */}
      {flaggedCount > 0 && (
        <div className="fraud-provider-summary">
          <span className="material-symbols-outlined" aria-hidden>warning</span>
          <div>
            <strong>{flaggedCount} application{flaggedCount > 1 ? 's' : ''} flagged</strong> for potential duplicate aid.
            Flagged applications are highlighted below. An admin must confirm or clear each flag.
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="card">
          <p>No submitted applications for this program yet.</p>
          <p className="dash-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Reminder: students must finish the full form (statement, payment details, at least one document) and click{' '}
            <strong>Submit to provider</strong>. Draft applications are not visible here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map((a) => {
            const isFlagged    = a.duplicateConflictWarning;
            const isConfirmed  = a.fraudReviewStatus === 'confirmed_fraud';
            const isCleared    = a.fraudReviewStatus === 'cleared';

            return (
              <div
                key={a._id}
                className={`card${isFlagged && !isCleared ? (isConfirmed ? ' fraud-card-confirmed-provider' : ' fraud-card-flagged-provider') : ''}`}
              >
                {/* Fraud banner at top of card */}
                <FraudBanner app={a} />

                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>{a.student?.fullName || 'Student'}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {a.student?.district}, {a.student?.upazila} · CGPA {a.student?.cgpa ?? '—'} · Verification:{' '}
                      {a.student?.verificationStatus ?? '—'}
                    </p>
                    {a.capabilityStatement && (
                      <p style={{ marginTop: '0.75rem', fontSize: '0.95rem' }}>
                        <strong>Statement:</strong> {a.capabilityStatement}
                      </p>
                    )}
                    {a.paymentPreference?.method && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        <strong>Payment preference:</strong> {a.paymentPreference.method}
                        {a.paymentPreference.mobileNumber ? ` · ${a.paymentPreference.mobileNumber}` : ''}
                        {a.paymentPreference.bankName ? ` · ${a.paymentPreference.bankName}` : ''}
                      </p>
                    )}
                    {(a.applicationDocuments?.length > 0 || a.student?.documents?.length > 0) && (
                      <div style={{ marginTop: '0.75rem' }}>
                        {a.applicationDocuments?.length > 0 && (
                          <div style={{ marginBottom: a.student?.documents?.length > 0 ? '0.75rem' : 0 }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                              Application documents
                            </p>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                              {a.applicationDocuments.map((d) => (
                                <li key={d._id || d.url}>
                                  <a href={uploadUrl(d.url)} target="_blank" rel="noreferrer">
                                    {d.label || 'Document'}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {a.student?.documents?.length > 0 && (
                          <div>
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                              Student profile documents
                            </p>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                              {a.student.documents.map((d) => (
                                <li key={d._id || d.url}>
                                  <a href={uploadUrl(d.url)} target="_blank" rel="noreferrer">
                                    {profileDocTypeLabel(d.type)} (profile)
                                  </a>
                                  {d.verified && (
                                    <span className="badge badge-approved" style={{ marginLeft: '0.35rem', fontSize: '0.7rem' }}>
                                      Verified
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                    {a.status === 'pending' && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={busyId === a._id || isConfirmed}
                            title={isConfirmed ? 'Cannot approve a confirmed-fraud application' : undefined}
                            onClick={() => review(a._id, 'approve')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={busyId === a._id || !!rejectModal}
                            onClick={() => openRejectModal(a)}
                          >
                            Reject
                          </button>
                        </div>
                        {isFlagged && !isConfirmed && !isCleared && (
                          <p style={{ fontSize: '0.75rem', color: '#b91c1c', maxWidth: '14rem', textAlign: 'right', margin: 0 }}>
                            ⚠ Flagged — approval allowed until admin confirms fraud
                          </p>
                        )}
                        {isConfirmed && (
                          <p style={{ fontSize: '0.75rem', color: '#b91c1c', maxWidth: '14rem', textAlign: 'right', margin: 0 }}>
                            Approve blocked — confirmed fraud by admin
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectModal && (
        <div className="eads-modal" role="dialog" aria-modal="true" aria-labelledby="provider-reject-title">
          <button type="button" className="eads-modal__backdrop" aria-label={t('dash.cancel')} onClick={closeRejectModal} />
          <div className="eads-modal__panel eads-modal__panel--reject">
            <div className="eads-modal__brandbar" aria-hidden />
            <div className="eads-modal__head">
              <h2 id="provider-reject-title" className="eads-modal__title">
                {t('dash.rejectAppTitle')}
              </h2>
              <p className="eads-modal__lead">{t('dash.rejectAppLead')}</p>
              <p className="eads-reject-student">
                {t('dash.rejectAppStudent')}: {rejectModal.name}
              </p>
            </div>
            <div className="eads-reject-form">
              <label className="form-label" htmlFor="provider-reject-reason">
                {t('dash.rejectAppReason')}
              </label>
              <textarea
                id="provider-reject-reason"
                className="eads-reject-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                maxLength={2000}
                autoComplete="off"
                rows={4}
                placeholder=""
              />
            </div>
            <div className="eads-modal__actions eads-modal__actions--reject">
              <button type="button" className="btn btn-secondary" disabled={!!busyId} onClick={closeRejectModal}>
                {t('dash.cancel')}
              </button>
              <button
                type="button"
                className="btn eads-btn-danger"
                disabled={!!busyId}
                onClick={confirmReject}
              >
                {busyId ? t('dash.working') : t('dash.confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
