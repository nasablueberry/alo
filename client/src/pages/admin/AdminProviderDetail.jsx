import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API = '/api';

const TYPES = [
  { value: 'ngo', label: 'NGO' },
  { value: 'bank', label: 'Bank' },
  { value: 'government', label: 'Government' },
  { value: 'private', label: 'Private' },
];

export default function AdminProviderDetail() {
  const { id } = useParams();
  const { fetchWithAuth } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/admin/providers/${id}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        const { programs, user, ...prov } = d;
        setForm({
          organizationName: prov.organizationName || '',
          type: prov.type || 'ngo',
          registrationNumber: prov.registrationNumber || '',
          contactPerson: prov.contactPerson || '',
          phone: prov.phone || '',
          address: prov.address || '',
          district: prov.district || '',
          website: prov.website || '',
          description: prov.description || '',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, fetchWithAuth]);

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${API}/admin/providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Save failed');
      setData(d);
      setEditing(false);
      toast.success('Provider updated');
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-page">
        <div className="dash-card dash-loading">Loading…</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="dash-page">
        <div className="dash-card">Provider not found.</div>
      </div>
    );
  }

  const { programs = [], user, ...provider } = data;

  return (
    <div className="dash-page admin-provider-page">
      <p className="admin-provider-breadcrumb">
        <Link to="/admin/providers">Providers</Link>
        <span className="admin-provider-bc-sep" aria-hidden>
          /
        </span>
        <span className="dash-muted-sm">{provider.organizationName}</span>
      </p>

      <header className="admin-provider-hero">
        <div className="admin-provider-hero-bg" aria-hidden />
        <div className="admin-provider-hero-inner">
          <div className="admin-provider-hero-icon" aria-hidden>
            <span className="material-symbols-outlined">corporate_fare</span>
          </div>
          <div>
            <div className="admin-provider-hero-badges">
              <span
                className={`admin-provider-verify-pill ${
                  provider.isVerified ? 'admin-provider-verify-pill--on' : ''
                }`}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  {provider.isVerified ? 'verified' : 'hourglass_empty'}
                </span>
                {provider.isVerified ? 'Verified provider' : 'Pending verification'}
              </span>
              <span className="admin-provider-type-pill">{provider.type}</span>
            </div>
            <h1 className="dash-page-title admin-provider-title">{provider.organizationName}</h1>
            <p className="admin-provider-email">{user?.email}</p>
            {provider.district && <p className="admin-provider-loc">📍 {provider.district}</p>}
          </div>
        </div>
        <div className="admin-provider-hero-actions">
          {!editing ? (
            <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
              Edit details
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  load();
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </header>

      {editing ? (
        <form onSubmit={save} className="dash-card admin-provider-form">
          <h2 className="dash-card-h" style={{ marginBottom: '1rem' }}>
            Edit organization
          </h2>
          <div className="admin-provider-form-grid">
            <label className="form-label">
              Organization name
              <input
                className="form-input"
                value={form.organizationName}
                onChange={(e) => updateField('organizationName', e.target.value)}
                required
              />
            </label>
            <label className="form-label">
              Type
              <select
                className="form-input"
                value={form.type}
                onChange={(e) => updateField('type', e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Registration number
              <input
                className="form-input"
                value={form.registrationNumber}
                onChange={(e) => updateField('registrationNumber', e.target.value)}
              />
            </label>
            <label className="form-label">
              Contact person
              <input
                className="form-input"
                value={form.contactPerson}
                onChange={(e) => updateField('contactPerson', e.target.value)}
              />
            </label>
            <label className="form-label">
              Phone
              <input
                className="form-input"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </label>
            <label className="form-label">
              District
              <input
                className="form-input"
                value={form.district}
                onChange={(e) => updateField('district', e.target.value)}
              />
            </label>
            <label className="form-label" style={{ gridColumn: '1 / -1' }}>
              Address
              <input
                className="form-input"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </label>
            <label className="form-label" style={{ gridColumn: '1 / -1' }}>
              Website
              <input
                className="form-input"
                type="url"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://"
              />
            </label>
            <label className="form-label" style={{ gridColumn: '1 / -1' }}>
              Description
              <textarea
                className="form-input"
                rows={4}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </label>
          </div>
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="admin-provider-info-grid">
          <div className="dash-card admin-provider-tile">
            <h3 className="admin-provider-tile-title">Contact</h3>
            <dl className="admin-provider-dl">
              <div>
                <dt>Email</dt>
                <dd>{user?.email || '—'}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{provider.phone || '—'}</dd>
              </div>
              <div>
                <dt>Contact person</dt>
                <dd>{provider.contactPerson || '—'}</dd>
              </div>
            </dl>
          </div>
          <div className="dash-card admin-provider-tile">
            <h3 className="admin-provider-tile-title">Organization</h3>
            <dl className="admin-provider-dl">
              <div>
                <dt>Type</dt>
                <dd>{provider.type}</dd>
              </div>
              <div>
                <dt>Registration</dt>
                <dd>{provider.registrationNumber || '—'}</dd>
              </div>
              <div>
                <dt>District</dt>
                <dd>{provider.district || '—'}</dd>
              </div>
              {provider.address && (
                <div>
                  <dt>Address</dt>
                  <dd>{provider.address}</dd>
                </div>
              )}
              {provider.website && (
                <div>
                  <dt>Website</dt>
                  <dd>
                    <a href={provider.website} target="_blank" rel="noopener noreferrer">
                      {provider.website}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
          {provider.description && (
            <div className="dash-card admin-provider-tile admin-provider-tile--wide">
              <h3 className="admin-provider-tile-title">About</h3>
              <p className="admin-provider-desc">{provider.description}</p>
            </div>
          )}
        </div>
      )}

      <section className="admin-provider-programs">
        <h2 className="dash-card-h" style={{ marginBottom: '1rem' }}>
          Scholarship programs <span className="dash-muted-sm">({programs.length})</span>
        </h2>
        {programs.length === 0 ? (
          <div className="dash-card">No programs created yet.</div>
        ) : (
          <div className="admin-provider-program-grid">
            {programs.map((prog) => (
              <div key={prog._id} className="dash-card admin-provider-prog-card">
                <h3 className="admin-provider-prog-title">{prog.title}</h3>
                <div className="admin-provider-prog-meta">
                  <span className={`badge badge-${prog.status === 'active' ? 'active' : 'pending'}`}>
                    {prog.status}
                  </span>
                </div>
                <p className="admin-provider-prog-stat">
                  ৳ {Number(prog.remainingFund || 0).toLocaleString()} /{' '}
                  {Number(prog.totalFund || 0).toLocaleString()} remaining
                </p>
                <p className="admin-provider-prog-stat">
                  {prog.currentBeneficiaries} / {prog.maxBeneficiaries} beneficiaries
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
