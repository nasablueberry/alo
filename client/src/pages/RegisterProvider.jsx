import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const initial = {
  email: '',
  password: '',
  organizationName: '',
  type: 'ngo',
  registrationNumber: '',
  contactPerson: '',
  phone: '',
  address: '',
  district: '',
  website: '',
  description: '',
};

export default function RegisterProvider() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const { registerProvider } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerProvider(form);
      toast.success('Registered successfully');
      navigate('/provider');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 560, margin: '2rem auto' }}>
      <h1 className="page-title" style={{ textAlign: 'center' }}>Aid Provider Registration</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Password *</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Organization Name *</label>
            <input name="organizationName" value={form.organizationName} onChange={handleChange} required />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Type *</label>
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="ngo">NGO</option>
              <option value="bank">Bank</option>
              <option value="government">Government</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Contact Person</label>
              <input name="contactPerson" value={form.contactPerson} onChange={handleChange} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Address / District</label>
            <input name="address" value={form.address} onChange={handleChange} placeholder="Address" />
            <input name="district" value={form.district} onChange={handleChange} placeholder="District" style={{ marginTop: '0.5rem' }} />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
          </div>
          <button type="submit" disabled={loading} style={{ marginTop: '1.5rem', width: '100%' }}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
