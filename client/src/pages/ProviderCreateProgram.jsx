import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { API } from '../config.js';


const initial = {
  title: '',
  description: '',
  totalFund: '',
  amountPerBeneficiary: '',
  maxBeneficiaries: '',
  startDate: '',
  endDate: '',
  applicationDeadline: '',
  durationMonths: '12',
  minCgpa: '',
  maxIncome: '',
  minAttendance: '',
  allowedDistricts: '',
  allowedInstitutionTypes: [],
};

export default function ProviderCreateProgram() {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleInstitutionType = (e) => {
    const v = e.target.value;
    if (!v) return;
    setForm((f) => ({
      ...f,
      allowedInstitutionTypes: f.allowedInstitutionTypes.includes(v)
        ? f.allowedInstitutionTypes.filter((t) => t !== v)
        : [...f.allowedInstitutionTypes, v],
    }));
  };

  const amount = Number(form.amountPerBeneficiary) || 0;
  const numStudents = Number(form.maxBeneficiaries) || 0;
  const computedTotal = amount * numStudents;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalFund = Number(form.totalFund) || computedTotal;
    const amountPerBeneficiary = Number(form.amountPerBeneficiary);
    const maxBeneficiaries = Number(form.maxBeneficiaries);
    if (!amountPerBeneficiary || amountPerBeneficiary < 1) {
      toast.error('Enter amount per student (BDT)');
      return;
    }
    if (!maxBeneficiaries || maxBeneficiaries < 1) {
      toast.error('Enter number of students to support');
      return;
    }
    const finalTotal = totalFund > 0 ? totalFund : amountPerBeneficiary * maxBeneficiaries;
    if (finalTotal < amountPerBeneficiary * maxBeneficiaries) {
      toast.error('Total budget must be at least (amount per student × number of students)');
      return;
    }
    if (!form.title?.trim()) {
      toast.error('Enter program title');
      return;
    }
    if (!form.startDate || !form.endDate || !form.applicationDeadline) {
      toast.error('Enter start date, end date, and application deadline');
      return;
    }
    setLoading(true);
    try {
      const eligibilityCriteria = {};
      if (form.minCgpa !== '') eligibilityCriteria.minCgpa = Number(form.minCgpa);
      if (form.maxIncome !== '') eligibilityCriteria.maxIncome = Number(form.maxIncome);
      if (form.minAttendance !== '') eligibilityCriteria.minAttendance = Number(form.minAttendance);
      if (form.allowedDistricts?.trim()) {
        eligibilityCriteria.allowedDistricts = form.allowedDistricts.split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (form.allowedInstitutionTypes?.length) eligibilityCriteria.allowedInstitutionTypes = form.allowedInstitutionTypes;

      const res = await fetchWithAuth(API + '/programs', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          totalFund: finalTotal,
          amountPerBeneficiary,
          maxBeneficiaries,
          startDate: form.startDate,
          endDate: form.endDate,
          applicationDeadline: form.applicationDeadline,
          durationMonths: Number(form.durationMonths) || 12,
          eligibilityCriteria: Object.keys(eligibilityCriteria).length ? eligibilityCriteria : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create program');
      toast.success('Program created');
      navigate('/provider');
    } catch (err) {
      toast.error(err.message || 'Failed to create program');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 680 }}>
      <Link to="/provider" style={{ display: 'inline-block', marginBottom: '1rem', fontSize: '0.9rem' }}>← Back to dashboard</Link>
      <h1 className="page-title">Create Scholarship Program</h1>
      <div className="card">
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
          Set your program budget and how many students will receive how much scholarship. Total budget will be used to track remaining funds as you disburse.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Program title *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Merit Scholarship 2025" required />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Brief description of the program" />
          </div>

          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', marginTop: '1.5rem' }}>Budget & beneficiaries</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Scholarship amount per student (BDT) *</label>
              <input type="number" name="amountPerBeneficiary" value={form.amountPerBeneficiary} onChange={handleChange} min={1} placeholder="e.g. 10000" required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Number of students to support *</label>
              <input type="number" name="maxBeneficiaries" value={form.maxBeneficiaries} onChange={handleChange} min={1} placeholder="e.g. 50" required />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total budget (BDT) — optional (auto: amount × students)</label>
            <input type="number" name="totalFund" value={form.totalFund} onChange={handleChange} min={0} placeholder={computedTotal ? `Auto: ${computedTotal.toLocaleString()}` : 'Leave blank to use amount × students'} />
          </div>
          {(amount > 0 && numStudents > 0) && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Total: {computedTotal.toLocaleString()} BDT = {numStudents} students × {amount.toLocaleString()} BDT each
            </p>
          )}

          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', marginTop: '1.5rem' }}>Dates</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Start date *</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>End date *</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Application deadline *</label>
              <input type="date" name="applicationDeadline" value={form.applicationDeadline} onChange={handleChange} required />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Duration (months)</label>
            <input type="number" name="durationMonths" value={form.durationMonths} onChange={handleChange} min={1} />
          </div>

          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', marginTop: '1.5rem' }}>Eligibility (optional)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Min CGPA (0–4)</label>
              <input type="number" name="minCgpa" value={form.minCgpa} onChange={handleChange} min={0} max={4} step={0.01} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Max household income (BDT)</label>
              <input type="number" name="maxIncome" value={form.maxIncome} onChange={handleChange} min={0} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Min attendance %</label>
              <input type="number" name="minAttendance" value={form.minAttendance} onChange={handleChange} min={0} max={100} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Allowed districts (comma-separated)</label>
            <input name="allowedDistricts" value={form.allowedDistricts} onChange={handleChange} placeholder="e.g. Dhaka, Chittagong" />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <span style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Institution types</span>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {['school', 'college', 'university'].map((t) => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input type="checkbox" value={t} checked={form.allowedInstitutionTypes.includes(t)} onChange={handleInstitutionType} />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create program'}</button>
            <Link to="/provider" className="btn btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
