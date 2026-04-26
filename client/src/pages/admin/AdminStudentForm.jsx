import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { API } from '../../config.js';


const emptyForm = {
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
  verificationStatus: 'pending',
};

export default function AdminStudentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await fetchWithAuth(`${API}/admin/students/${id}`);
        if (res.ok) {
          const s = await res.json();
          setForm({
            email: s.user?.email ?? '',
            password: '',
            birthCertificateId: s.birthCertificateId ?? '',
            fullName: s.fullName ?? '',
            phone: s.phone ?? '',
            district: s.district ?? '',
            upazila: s.upazila ?? '',
            institutionName: s.institutionName ?? '',
            institutionType: s.institutionType ?? 'school',
            householdIncome: s.householdIncome ?? '',
            familySize: String(s.familySize ?? 1),
            attendancePercentage: s.attendancePercentage ?? '',
            cgpa: s.cgpa ?? '',
            verificationStatus: s.verificationStatus ?? 'pending',
          });
        } else navigate('/admin/students');
      } catch (e) {
        console.error(e);
        navigate('/admin/students');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEdit, id, fetchWithAuth, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        birthCertificateId: form.birthCertificateId,
        fullName: form.fullName,
        phone: form.phone || undefined,
        district: form.district,
        upazila: form.upazila,
        institutionName: form.institutionName,
        institutionType: form.institutionType,
        householdIncome: Number(form.householdIncome) || 0,
        familySize: Number(form.familySize) || 1,
        attendancePercentage: form.attendancePercentage !== '' ? Number(form.attendancePercentage) : undefined,
        cgpa: form.cgpa !== '' ? Number(form.cgpa) : undefined,
        verificationStatus: form.verificationStatus,
      };
      if (isEdit) {
        body.email = form.email;
        if (form.password) body.password = form.password;
        const res = await fetchWithAuth(`${API}/admin/students/${id}`, { method: 'PUT', body: JSON.stringify(body) });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Update failed');
        }
        toast.success('Student updated');
        navigate('/admin/students');
      } else {
        body.email = form.email;
        body.password = form.password || 'Password123';
        const res = await fetchWithAuth(`${API}/admin/students`, { method: 'POST', body: JSON.stringify(body) });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Create failed');
        }
        toast.success('Student added');
        navigate('/admin/students');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1 className="page-title">{isEdit ? 'Edit Student' : 'Add Student'}</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            {!isEdit && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} minLength={6} placeholder="Default: Password123" />
              </div>
            )}
            {isEdit && form.password !== '' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>New password (leave blank to keep)</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} minLength={6} />
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Birth Certificate ID *</label>
              <input name="birthCertificateId" value={form.birthCertificateId} onChange={handleChange} required disabled={isEdit} />
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
            <div style={{ minWidth: 120 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>CGPA (0–4)</label>
              <input type="number" name="cgpa" value={form.cgpa} onChange={handleChange} min={0} max={4} step={0.01} />
            </div>
            {isEdit && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Verification</label>
                <select name="verificationStatus" value={form.verificationStatus} onChange={handleChange}>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add Student'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/students')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
