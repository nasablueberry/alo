import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = '/api';

export default function MyApplications() {
  const { fetchWithAuth } = useAuth();
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

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h1 className="page-title">My Applications</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {applications.length === 0 ? (
          <div className="card">
            No applications yet.{' '}
            <Link to="/student/programs">Browse programs</Link> to apply.
          </div>
        ) : (
          applications.map((a) => (
            <div key={a._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{a.program?.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Amount: BDT {a.program?.amountPerBeneficiary?.toLocaleString()} · Started:{' '}
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-'}
                    {a.submissionStatus === 'submitted' && a.submittedAt
                      ? ` · Submitted: ${new Date(a.submittedAt).toLocaleDateString()}`
                      : ''}
                  </p>
                  {a.submissionStatus === 'draft' && (
                    <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                      <Link to={`/student/programs/${a.program?._id || a.program}/apply`}>Continue application</Link>
                    </p>
                  )}
                  {a.submissionStatus === 'submitted' && a.status === 'pending' && (
                    <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                      <Link to={`/student/programs/${a.program?._id || a.program}/apply`}>Edit application</Link>
                    </p>
                  )}
                  {a.eligibilityNotes && <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>Eligibility: {a.eligibilityNotes}</p>}
                  {a.duplicateConflictWarning && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--warning)' }}>Duplicate aid warning was raised.</p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {a.submissionStatus === 'draft' && (
                    <span className="badge" style={{ marginRight: '0.35rem', background: 'var(--warning-soft)', color: 'var(--amber)' }}>
                      draft
                    </span>
                  )}
                  <span className={`badge badge-${a.status}`}>{a.status}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
