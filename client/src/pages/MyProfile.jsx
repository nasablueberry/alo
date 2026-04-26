import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { API } from '../config.js';


const SCORE_COLOR = (score) => {
  if (score >= 75) return '#16a34a';
  if (score >= 50) return '#ca8a04';
  if (score >= 25) return '#ea580c';
  return '#dc2626';
};

const SCORE_LABEL = (score) => {
  if (score >= 75) return 'High eligibility';
  if (score >= 50) return 'Moderate eligibility';
  if (score >= 25) return 'Low eligibility';
  return 'Needs more data';
};

function ScoreRing({ score }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  const color = SCORE_COLOR(score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', width: '6rem', height: '6rem' }}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${c}`}
            style={{ transition: 'stroke-dasharray 0.7s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>/100</span>
        </div>
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{SCORE_LABEL(score)}</span>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, min, max, step, children }) {
  return (
    <div>
      <label
        htmlFor={`profile-${name}`}
        style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}
      >
        {label}
      </label>
      {children || (
        <input
          id={`profile-${name}`}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          style={{ width: '100%' }}
        />
      )}
    </div>
  );
}

export default function MyProfile() {
  const { fetchWithAuth, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [prevScore, setPrevScore] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(API + '/students/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setPrevScore(data.financialNeedScore ?? 0);
          setForm({
            fullName: data.fullName ?? '',
            phone: data.phone ?? '',
            district: data.district ?? '',
            upazila: data.upazila ?? '',
            institutionName: data.institutionName ?? '',
            institutionType: data.institutionType ?? 'school',
            householdIncome: data.householdIncome ?? '',
            familySize: data.familySize ?? '',
            attendancePercentage: data.attendancePercentage ?? '',
            cgpa: data.cgpa ?? '',
            gender: data.gender ?? '',
          });
        }
      } catch (e) {
        console.error(e);
        toast.error('Could not load profile');
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
      const res = await fetchWithAuth(API + '/students/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Update failed');
      }
      const data = await res.json();

      // Show score change feedback
      const oldScore = profile?.financialNeedScore ?? 0;
      const newScore = data.financialNeedScore ?? 0;
      const diff = newScore - oldScore;
      if (diff > 0) {
        toast.success(`Profile saved! Eligibility score ↑ ${diff} pts (${newScore}/100)`);
      } else if (diff < 0) {
        toast.success(`Profile saved. Eligibility score ↓ ${Math.abs(diff)} pts (${newScore}/100)`);
      } else {
        toast.success('Profile saved successfully');
      }

      setProfile(data);

      // Propagate the fresh data to AuthContext so the whole app sees it
      await refreshProfile();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-page">
        <p className="dash-muted">Loading profile…</p>
      </div>
    );
  }

  const score = profile?.financialNeedScore ?? 0;
  const docCount = (profile?.documents && profile.documents.length) ? profile.documents.length : 0;
  const docBonus = Math.min(20, docCount * 5); // each document adds 5 pts, capped at 20
  const combinedScore = Math.min(100, score + docBonus);
  const lastUpdated = profile?.lastNeedScoreUpdate
    ? new Date(profile.lastNeedScoreUpdate).toLocaleDateString()
    : null;

  return (
    <div className="dash-page" style={{ maxWidth: 720 }}>
      <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>My Profile</h1>
      <p className="dash-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Keep your information up to date — it directly affects your eligibility score and aid applications.
      </p>

      {/* Score + identity summary card */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <ScoreRing score={combinedScore} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.3rem' }}>
              Eligibility Score
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.6rem' }}>
              Your score is calculated based on various factors.
              {lastUpdated && <> Last updated: <strong>{lastUpdated}</strong>.</>}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: 'transparent',
                color: 'var(--text-muted)'
              }}>
                Documents: {docCount} {docBonus ? `(+${docBonus} pts)` : ''}
              </div>
              <div style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'var(--surface-hover)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}>
                ID: <span style={{ color: 'var(--text)' }}>{profile?.birthCertificateId ?? '—'}</span>
              </div>
              <div style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: profile?.verificationStatus === 'verified'
                  ? 'rgba(22,163,74,0.12)'
                  : profile?.verificationStatus === 'rejected'
                    ? 'rgba(220,38,38,0.1)'
                    : 'rgba(202,138,4,0.1)',
                color: profile?.verificationStatus === 'verified'
                  ? '#15803d'
                  : profile?.verificationStatus === 'rejected'
                    ? '#b91c1c'
                    : '#854d0e',
              }}>
                {profile?.verificationStatus === 'verified' ? '✓ Verified' :
                  profile?.verificationStatus === 'rejected' ? '✗ Rejected' :
                    profile?.verificationStatus === 'unverified' ? '— Unverified' : 'Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Personal Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} />
            <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} />
            <Field label="Gender" name="gender" value={form.gender} onChange={handleChange}>
              <select
                id="profile-gender"
                name="gender"
                value={form.gender || ''}
                onChange={handleChange}
                style={{ width: '100%' }}
              >
                <option value="">— Select —</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Location
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="District" name="district" value={form.district} onChange={handleChange} />
            <Field label="Upazila" name="upazila" value={form.upazila} onChange={handleChange} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Institution
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Institution Name" name="institutionName" value={form.institutionName} onChange={handleChange} />
            <Field label="Institution Type" name="institutionType" value={form.institutionType} onChange={handleChange}>
              <select
                id="profile-institutionType"
                name="institutionType"
                value={form.institutionType || 'school'}
                onChange={handleChange}
                style={{ width: '100%' }}
              >
                <option value="school">School</option>
                <option value="college">College</option>
                <option value="university">University</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Financial Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Monthly Household Income (BDT)" name="householdIncome" type="number" value={form.householdIncome} onChange={handleChange} min={0} />
            <Field label="Family Size" name="familySize" type="number" value={form.familySize} onChange={handleChange} min={1} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Academic Performance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Attendance %" name="attendancePercentage" type="number" value={form.attendancePercentage} onChange={handleChange} min={0} max={100} />
            <Field label="CGPA (0–4)" name="cgpa" type="number" value={form.cgpa} onChange={handleChange} min={0} max={4} step={0.01} />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
          style={{ width: '100%' }}
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', animation: 'spin 1s linear infinite' }} aria-hidden>progress_activity</span>
              Saving &amp; recalculating score…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }} aria-hidden>save</span>
              Save changes
            </>
          )}
        </button>
      </form>
    </div>
  );
}
