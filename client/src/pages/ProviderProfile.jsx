import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API = '/api';

export default function ProviderProfile() {
  const { fetchWithAuth, profile: initialProfile } = useAuth();
  const [profile, setProfile] = useState(initialProfile || {});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(API + '/providers/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setForm({
            organizationName: data.organizationName,
            type: data.type,
            registrationNumber: data.registrationNumber,
            contactPerson: data.contactPerson,
            phone: data.phone,
            address: data.address,
            district: data.district,
            website: data.website,
            description: data.description,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchWithAuth]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchWithAuth(API + '/providers/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      setProfile(data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container">Loading profile...</div>;

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1 className="page-title">Provider Profile</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Organization Name</label>
            <input name="organizationName" value={form.organizationName || ''} onChange={handleChange} required />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Type</label>
            <select name="type" value={form.type || ''} onChange={handleChange}>
              <option value="ngo">NGO</option>
              <option value="bank">Bank</option>
              <option value="government">Government</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Contact Person</label>
              <input name="contactPerson" value={form.contactPerson || ''} onChange={handleChange} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Phone</label>
              <input name="phone" value={form.phone || ''} onChange={handleChange} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Address / District</label>
            <input name="address" value={form.address || ''} onChange={handleChange} placeholder="Address" />
            <input name="district" value={form.district || ''} onChange={handleChange} placeholder="District" style={{ marginTop: '0.5rem' }} />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Description</label>
            <textarea name="description" value={form.description || ''} onChange={handleChange} rows={3} />
          </div>
          <button type="submit" disabled={saving} style={{ marginTop: '1.5rem' }}>{saving ? 'Saving...' : 'Save changes'}</button>
        </form>
      </div>
    </div>
  );
}
