import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { uploadUrl } from '../utils/uploadUrl';
import { API } from '../config.js';


const emptyPreference = { method: '', mobileNumber: '', bankName: '', accountName: '', accountNumber: '', branch: '', routingNumber: '' };

export default function ApplyProgram() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();
  const [program, setProgram] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [capabilityStatement, setCapabilityStatement] = useState('');
  const [paymentPreference, setPaymentPreference] = useState(emptyPreference);
  const [docLabel, setDocLabel] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const progRes = await fetch(`${API}/programs/${programId}`);
        const progData = await progRes.json().catch(() => ({}));
        if (!progRes.ok) throw new Error(progData.message || 'Program not found');
        setProgram(progData);

        const startRes = await fetchWithAuth(`${API}/applications/start`, {
          method: 'POST',
          body: JSON.stringify({ programId }),
        });
        const appData = await startRes.json().catch(() => ({}));
        if (!startRes.ok) throw new Error(appData.message || 'Could not open application');
        setApplication(appData);
        setCapabilityStatement(appData.capabilityStatement || '');
        setPaymentPreference({
          ...emptyPreference,
          ...(appData.paymentPreference || {}),
        });
      } catch (e) {
        console.error(e);
        toast.error(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    if (programId) load();
  }, [programId, fetchWithAuth]);

  const canEdit = (app) =>
    app &&
    (app.submissionStatus === 'draft' ||
      (app.submissionStatus === 'submitted' && app.status === 'pending'));

  const saveDraft = async () => {
    if (!canEdit(application)) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${API}/applications/${application._id}/draft`, {
        method: 'PUT',
        body: JSON.stringify({
          capabilityStatement,
          paymentPreference,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setApplication(data);
      toast.success(application.submissionStatus === 'draft' ? 'Draft saved' : 'Application updated');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadDoc = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canEdit(application)) return;
    const fd = new FormData();
    fd.append('document', file);
    if (docLabel.trim()) fd.append('label', docLabel.trim());
    try {
      const res = await fetchWithAuth(`${API}/applications/${application._id}/documents`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setApplication(data);
      setDocLabel('');
      toast.success('Document uploaded');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submit = async () => {
    if (!application?._id || application.submissionStatus !== 'draft') return;
    setSaving(true);
    try {
      const putRes = await fetchWithAuth(`${API}/applications/${application._id}/draft`, {
        method: 'PUT',
        body: JSON.stringify({ capabilityStatement, paymentPreference }),
      });
      const putData = await putRes.json().catch(() => ({}));
      if (!putRes.ok) throw new Error(putData.message || 'Save failed');
      setApplication(putData);

      const res = await fetchWithAuth(`${API}/applications/${application._id}/submit`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Submit failed');
      toast.success('Application submitted to the provider');
      navigate('/student/applications');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p className="dash-muted">Loading…</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="container">
        <p>Program not found.</p>
        <Link to="/student/programs">Back to programs</Link>
      </div>
    );
  }

  const isDraft = application?.submissionStatus === 'draft';
  const isPendingReview = application?.submissionStatus === 'submitted' && application?.status === 'pending';
  const isEditable = isDraft || isPendingReview;

  return (
    <div className="container" style={{ maxWidth: '720px' }}>
      <p style={{ marginBottom: '0.5rem' }}>
        <Link to="/student/programs">Programs</Link>
        <span style={{ color: 'var(--text-muted)' }}> / Apply</span>
      </p>
      <h1 className="page-title">{program.title}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        {program.provider?.organizationName} · BDT {program.amountPerBeneficiary?.toLocaleString()} · Deadline:{' '}
        {program.applicationDeadline ? new Date(program.applicationDeadline).toLocaleDateString() : '—'}
      </p>

      {!application && <p>Could not load application.</p>}

      {application && !isEditable && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <p>
            {application.submissionStatus === 'submitted' || application.submittedAt
              ? 'This application was already submitted'
              : 'Your application is on file'}
            {application.submittedAt ? ` on ${new Date(application.submittedAt).toLocaleString()}` : ''}.
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            Status: <span className={`badge badge-${application.status}`}>{application.status}</span>
          </p>
          <Link to="/student/applications" className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Back to my applications
          </Link>
        </div>
      )}

      {isEditable && (
        <>
          {isPendingReview && (
            <div
              className="card"
              style={{
                marginBottom: '1rem',
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                Your application is <strong>submitted</strong> and is pending provider review. You can still update your
                statement, payment details, and documents until a decision is made.
              </p>
            </div>
          )}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Why you are a strong candidate</h3>
            <textarea
              className="form-input"
              style={{ width: '100%', minHeight: '140px' }}
              value={capabilityStatement}
              onChange={(e) => setCapabilityStatement(e.target.value)}
              placeholder="Describe your academic performance, circumstances, and goals."
            />
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>How you want to receive funds</h3>
            <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
              Method
            </label>
            <select
              className="form-input"
              style={{ width: '100%', maxWidth: '320px' }}
              value={paymentPreference.method || ''}
              onChange={(e) => setPaymentPreference((p) => ({ ...p, method: e.target.value }))}
            >
              <option value="">Select…</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
              <option value="bank">Bank transfer</option>
            </select>
            {['bkash', 'nagad', 'rocket'].includes(paymentPreference.method) && (
              <div style={{ marginTop: '0.75rem' }}>
                <label className="form-label">Wallet number</label>
                <input
                  className="form-input"
                  style={{ width: '100%', maxWidth: '320px' }}
                  value={paymentPreference.mobileNumber || ''}
                  onChange={(e) => setPaymentPreference((p) => ({ ...p, mobileNumber: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                />
              </div>
            )}
            {paymentPreference.method === 'bank' && (
              <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
                <input
                  className="form-input"
                  placeholder="Bank name"
                  value={paymentPreference.bankName || ''}
                  onChange={(e) => setPaymentPreference((p) => ({ ...p, bankName: e.target.value }))}
                />
                <input
                  className="form-input"
                  placeholder="Account name"
                  value={paymentPreference.accountName || ''}
                  onChange={(e) => setPaymentPreference((p) => ({ ...p, accountName: e.target.value }))}
                />
                <input
                  className="form-input"
                  placeholder="Account number"
                  value={paymentPreference.accountNumber || ''}
                  onChange={(e) => setPaymentPreference((p) => ({ ...p, accountNumber: e.target.value }))}
                />
                <input
                  className="form-input"
                  placeholder="Branch (optional)"
                  value={paymentPreference.branch || ''}
                  onChange={(e) => setPaymentPreference((p) => ({ ...p, branch: e.target.value }))}
                />
                <input
                  className="form-input"
                  placeholder="Routing number (optional)"
                  value={paymentPreference.routingNumber || ''}
                  onChange={(e) => setPaymentPreference((p) => ({ ...p, routingNumber: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Supporting documents</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              PDF, JPG, PNG, or Word files. At least one document is required before you submit.
            </p>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Document type</label>
            <select
              className="form-input"
              style={{ marginBottom: '0.5rem', maxWidth: '320px' }}
              value={docLabel}
              onChange={(e) => setDocLabel(e.target.value)}
            >
              <option value="">Select document type…</option>
              <option value="NID/Birth Certificate">NID/Birth Certificate</option>
              <option value="Institutional ID">Institutional ID</option>
              <option value="Testimonial">Testimonial</option>
              <option value="Latest Gradesheet">Latest Gradesheet</option>
            </select>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={uploadDoc} />
            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem' }}>
              {(application.applicationDocuments || []).map((d) => (
                <li key={d._id || d.url}>
                  {d.label || 'Document'}{' '}
                  <a href={uploadUrl(d.url)} target="_blank" rel="noreferrer">
                    View
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" disabled={saving} onClick={saveDraft}>
              {saving ? 'Saving…' : isDraft ? 'Save draft' : 'Save changes'}
            </button>
            {isDraft && (
              <button type="button" className="btn btn-primary" disabled={saving} onClick={submit}>
                Submit to provider
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
