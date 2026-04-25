import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API = '/api';

export default function AdminProviders() {
  const { fetchWithAuth } = useAuth();
  const [providers, setProviders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState('');
  const limit = 20;

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
        const res = await fetchWithAuth(`${API}/admin/providers?${params}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setProviders(data.providers || []);
          setTotal(data.total ?? 0);
        } else {
          setError(data.message || `Failed to load (${res.status})`);
          setProviders([]);
          setTotal(0);
        }
      } catch (e) {
        setError(e.message || 'Failed to load providers');
        setProviders([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchWithAuth, page, searchDebounced]);

  const changeProviderVerification = async (providerId, isVerified) => {
    setSavingId(providerId);
    try {
      const res = await fetchWithAuth(`${API}/admin/providers/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, isVerified }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to update provider status');
      setProviders((prev) =>
        prev.map((p) => (p._id === providerId ? { ...p, isVerified } : p))
      );
    } catch (e) {
      setError(e.message || 'Failed to update provider status');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">All Providers</h1>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <input
          type="search"
          placeholder="Search by organization name, type, district, contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>
      {error && (
        <div className="card" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {loading ? (
        <div className="card">Loading...</div>
      ) : providers.length === 0 && !error ? (
        <div className="card">No providers found.</div>
      ) : !error ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {providers.map((p) => (
              <div key={p._id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.35rem' }}>{p.organizationName}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {p.type} · {p.user?.email}
                  </p>
                  <p style={{ marginTop: '0.35rem' }}>
                    <span className={`badge badge-${p.isVerified ? 'approved' : 'pending'}`}>
                      {p.isVerified ? 'verified' : 'pending'}
                    </span>
                  </p>
                  {p.district && <p style={{ fontSize: '0.9rem' }}>District: {p.district}</p>}
                  {p.contactPerson && <p style={{ fontSize: '0.9rem' }}>Contact: {p.contactPerson}</p>}
                  {p.phone && <p style={{ fontSize: '0.9rem' }}>Phone: {p.phone}</p>}
                  {p.description && <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{p.description.slice(0, 120)}{p.description.length > 120 ? '...' : ''}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={savingId === p._id || p.isVerified}
                    onClick={() => changeProviderVerification(p._id, true)}
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={savingId === p._id || !p.isVerified}
                    onClick={() => changeProviderVerification(p._id, false)}
                  >
                    Unverify
                  </button>
                  <Link to={`/admin/providers/${p._id}`} className="btn btn-ghost btn-sm">View details</Link>
                </div>
              </div>
            ))}
          </div>
          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <button type="button" className="btn btn-ghost" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
