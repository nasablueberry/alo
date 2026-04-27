import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { API } from '../config.js';

const SCORE_COLOR = (score) => {
  if (score >= 75) return '#16a34a';
  if (score >= 50) return '#ca8a04';
  if (score >= 25) return '#ea580c';
  return '#dc2626';
};

function scoreRingLabel(t, score) {
  if (score >= 75) return t('profile.scoreHigh');
  if (score >= 50) return t('profile.scoreModerate');
  if (score >= 25) return t('profile.scoreLow');
  return t('profile.scoreNeedsData');
}

function ScoreRing({ score, t }) {
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>/100</span>
        </div>
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{scoreRingLabel(t, score)}</span>
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
  const { t, locale } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(API + '/students/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
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
        toast.error(t('profile.loadError'));
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
        throw new Error(err.message || t('profile.updateError'));
      }
      const data = await res.json();

      const oldScore = profile?.financialNeedScore ?? 0;
      const newScore = data.financialNeedScore ?? 0;
      const diff = newScore - oldScore;
      if (diff > 0) {
        toast.success(
          t('profile.savedUp').replace('{diff}', String(diff)).replace('{score}', String(newScore))
        );
      } else if (diff < 0) {
        toast.success(
          t('profile.savedDown')
            .replace('{diff}', String(Math.abs(diff)))
            .replace('{score}', String(newScore))
        );
      } else {
        toast.success(t('profile.saved'));
      }

      setProfile(data);
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
        <p className="dash-muted">{t('profile.loading')}</p>
      </div>
    );
  }

  const score = profile?.financialNeedScore ?? 0;
  const docCount = profile?.documents && profile.documents.length ? profile.documents.length : 0;
  const docBonus = Math.min(20, docCount * 5);
  const combinedScore = Math.min(100, score + docBonus);
  const lastUpdated = profile?.lastNeedScoreUpdate
    ? new Date(profile.lastNeedScoreUpdate).toLocaleDateString(locale)
    : null;

  const ptsBonus =
    docBonus > 0 ? t('profile.ptsBonus').replace('{n}', String(docBonus)) : '';

  const verificationText =
    profile?.verificationStatus === 'verified'
      ? `✓ ${t('profile.verified')}`
      : profile?.verificationStatus === 'rejected'
        ? `✗ ${t('profile.rejected')}`
        : profile?.verificationStatus === 'unverified'
          ? `— ${t('profile.unverified')}`
          : t('dash.pending');

  return (
    <div className="dash-page" style={{ maxWidth: 720 }}>
      <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>
        {t('profile.title')}
      </h1>
      <p className="dash-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        {t('profile.lead')}
      </p>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <ScoreRing score={combinedScore} t={t} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.3rem' }}>{t('profile.scoreTitle')}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.6rem' }}>
              {t('profile.scoreBlurb')}
              {lastUpdated && (
                <>
                  {' '}
                  {t('profile.lastUpdated')}: <strong>{lastUpdated}</strong>.
                </>
              )}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: 'transparent',
                  color: 'var(--text-muted)',
                }}
              >
                {t('profile.documents')}: {docCount} {ptsBonus}
              </div>
              <div
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--surface-hover)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                {t('dash.idLabel')}: <span style={{ color: 'var(--text)' }}>{profile?.birthCertificateId ?? '—'}</span>
              </div>
              <div
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background:
                    profile?.verificationStatus === 'verified'
                      ? 'rgba(22,163,74,0.12)'
                      : profile?.verificationStatus === 'rejected'
                        ? 'rgba(220,38,38,0.1)'
                        : 'rgba(202,138,4,0.1)',
                  color:
                    profile?.verificationStatus === 'verified'
                      ? '#15803d'
                      : profile?.verificationStatus === 'rejected'
                        ? '#b91c1c'
                        : '#854d0e',
                }}
              >
                {verificationText}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {t('profile.personalInfo')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label={t('profile.fullName')} name="fullName" value={form.fullName} onChange={handleChange} />
            <Field label={t('profile.phone')} name="phone" value={form.phone} onChange={handleChange} />
            <Field label={t('profile.gender')} name="gender" value={form.gender} onChange={handleChange}>
              <select id="profile-gender" name="gender" value={form.gender || ''} onChange={handleChange} style={{ width: '100%' }}>
                <option value="">{t('profile.select')}</option>
                <option value="male">{t('profile.male')}</option>
                <option value="female">{t('profile.female')}</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {t('profile.location')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label={t('profile.district')} name="district" value={form.district} onChange={handleChange} />
            <Field label={t('profile.upazila')} name="upazila" value={form.upazila} onChange={handleChange} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {t('profile.institution')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label={t('profile.institutionName')} name="institutionName" value={form.institutionName} onChange={handleChange} />
            <Field label={t('profile.institutionType')} name="institutionType" value={form.institutionType} onChange={handleChange}>
              <select
                id="profile-institutionType"
                name="institutionType"
                value={form.institutionType || 'school'}
                onChange={handleChange}
                style={{ width: '100%' }}
              >
                <option value="school">{t('profile.school')}</option>
                <option value="college">{t('profile.college')}</option>
                <option value="university">{t('profile.university')}</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {t('profile.financial')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field
              label={t('profile.monthlyIncome')}
              name="householdIncome"
              type="number"
              value={form.householdIncome}
              onChange={handleChange}
              min={0}
            />
            <Field
              label={t('profile.familySize')}
              name="familySize"
              type="number"
              value={form.familySize}
              onChange={handleChange}
              min={1}
            />
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {t('profile.academic')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field
              label={t('profile.attendance')}
              name="attendancePercentage"
              type="number"
              value={form.attendancePercentage}
              onChange={handleChange}
              min={0}
              max={100}
            />
            <Field label={t('profile.cgpa')} name="cgpa" type="number" value={form.cgpa} onChange={handleChange} min={0} max={4} step={0.01} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%' }}>
          {saving ? (
            <>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '1rem', animation: 'spin 1s linear infinite' }}
                aria-hidden
              >
                progress_activity
              </span>
              {t('profile.saving')}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }} aria-hidden>
                save
              </span>
              {t('profile.save')}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
