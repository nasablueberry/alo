import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const initial = {
  email: '',
  password: '',
  birthCertificateId: '',
  fullName: '',
  phone: '',
  district: '',
  upazila: '',
  institutionName: '',
  institutionType: 'school',
  householdIncome: '',
  familySize: '1',
  attendancePercentage: '',
  cgpa: '',
};

export default function RegisterStudent() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerStudent({
        ...form,
        householdIncome: Number(form.householdIncome),
        familySize: Number(form.familySize) || 1,
        attendancePercentage: Number(form.attendancePercentage) || 0,
        cgpa: Number(form.cgpa) || 0,
      });
      toast.success('Registered successfully');
      navigate('/student');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 560, margin: '2rem auto' }}>
      <h1 className="page-title" style={{ textAlign: 'center' }}>Student Registration</h1>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Birth Certificate ID *</label>
              <input name="birthCertificateId" value={form.birthCertificateId} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Full Name *</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} required />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>District *</label>
              <input name="district" value={form.district} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Upazila *</label>
              <input name="upazila" value={form.upazila} onChange={handleChange} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Institution Name *</label>
              <input name="institutionName" value={form.institutionName} onChange={handleChange} required />
            </div>
            <div style={{ minWidth: 140 }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Type</label>
              <select name="institutionType" value={form.institutionType} onChange={handleChange}>
                <option value="school">School</option>
                <option value="college">College</option>
                <option value="university">University</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Household Income (BDT) *</label>
              <input type="number" name="householdIncome" value={form.householdIncome} onChange={handleChange} required min={0} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Family Size</label>
              <input type="number" name="familySize" value={form.familySize} onChange={handleChange} min={1} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Attendance %</label>
              <input type="number" name="attendancePercentage" value={form.attendancePercentage} onChange={handleChange} min={0} max={100} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>CGPA (0-4)</label>
            <input type="number" name="cgpa" value={form.cgpa} onChange={handleChange} min={0} max={4} step={0.01} />
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
