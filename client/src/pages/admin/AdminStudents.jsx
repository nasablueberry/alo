import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API } from '../../config.js';


const VERIFICATION_OPTIONS = [
  { value: 'verified', label: 'Verify' },
  { value: 'unverified', label: 'Unverified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'pending', label: 'Pending' },
];

function badgeClassForStatus(status) {
  if (status === 'verified') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'unverified') return 'unverified';
  return 'pending';
}

export default function AdminStudents() {
  const { fetchWithAuth } = useAuth();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState('');
  const limit = 100;

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page, limit });
        if (searchDebounced) params.set('search', searchDebounced);
        const res = await fetchWithAuth(`${API}/admin/students?${params}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStudents(data.students || []);
          setTotal(data.total ?? 0);
        } else {
          setError(data.message || `Failed to load (${res.status})`);
          setStudents([]);
          setTotal(0);
        }
      } catch (e) {
        setError(e.message || 'Failed to load students');
        setStudents([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchWithAuth, page, searchDebounced]);

  const changeVerification = async (studentId, status) => {
    setSavingId(studentId);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API}/admin/students/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to update verification');
      setStudents((prev) =>
        prev.map((s) => (s._id === studentId ? { ...s, verificationStatus: data.verificationStatus || status } : s))
      );
    } catch (e) {
      setError(e.message || 'Failed to update verification');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="dash-page">
      <header className="dash-page-header">
        <div>
          <span className="dash-page-kicker">Admin</span>
          <h1 className="dash-page-title">All students</h1>
          <p className="dash-page-lead">Set verification from the status menu for each student.</p>
        </div>
        <Link to="/admin/students/new" className="btn btn-primary">
          Add student
        </Link>
      </header>

      <div className="dash-card" style={{ marginBottom: '1rem' }}>
        <input
          type="search"
          className="form-input"
          placeholder="Search by name, email, birth certificate ID, district, institution…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 420, width: '100%' }}
        />
      </div>
      {error && (
        <div className="dash-card" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {loading ? (
        <div className="dash-card">Loading…</div>
      ) : students.length === 0 && !error ? (
        <div className="dash-card">No students found.</div>
      ) : !error ? (
        <>
          <div className="dash-table-wrap dash-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="dash-table admin-students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Birth cert. ID</th>
                  <th>District / Upazila</th>
                  <th>Institution</th>
                  <th>CGPA / Attend.</th>
                  <th>Verification</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td>{s.fullName}</td>
                    <td>{s.user?.email}</td>
                    <td>{s.birthCertificateId}</td>
                    <td>
                      {s.district} / {s.upazila}
                    </td>
                    <td>{s.institutionName}</td>
                    <td>
                      {s.cgpa} / {s.attendancePercentage}%
                    </td>
                    <td>
                      <div className="admin-verify-cell">
                        <span className={`badge badge-${badgeClassForStatus(s.verificationStatus)}`}>
                          {s.verificationStatus}
                        </span>
                        <div className="admin-select-wrap">
                          <label className="visually-hidden" htmlFor={`verify-${s._id}`}>
                            Change verification
                          </label>
                          <select
                            id={`verify-${s._id}`}
                            className="admin-verify-select"
                            value={s.verificationStatus}
                            onChange={(e) => changeVerification(s._id, e.target.value)}
                            disabled={savingId === s._id}
                            aria-busy={savingId === s._id}
                          >
                            {VERIFICATION_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Link to={`/admin/students/${s._id}`} className="btn btn-ghost btn-sm">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > limit && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1rem',
              }}
            >
              <span className="dash-muted-sm">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={page * limit >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
