import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API } from '../config.js';

export default function ProgramsList() {
  const { fetchWithAuth } = useAuth();
  const { t, locale } = useLanguage();
  const [programs, setPrograms] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pubRes, myRes] = await Promise.all([
          fetch(`${API}/programs/public?status=active&limit=100`),
          fetchWithAuth(`${API}/applications/my`),
        ]);
        const pubData = await pubRes.json().catch(() => ({}));
        if (!pubRes.ok) {
          throw new Error(pubData.message || `Could not load programs (${pubRes.status})`);
        }
        setPrograms(pubData.programs || []);

        if (myRes.ok) {
          setMyApplications(await myRes.json());
        }
      } catch (e) {
        console.error(e);
        setError(e.message || t('student.loadError'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchWithAuth]);

  const appByProgramId = useMemo(() => {
    const m = new Map();
    (myApplications || []).forEach((a) => {
      const pid = a.program?._id ?? a.program;
      if (pid) m.set(String(pid), a);
    });
    return m;
  }, [myApplications]);

  if (loading) {
    return (
      <div className="container">
        <p className="dash-muted">{t('student.loadingPrograms')}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">{t('student.programsTitle')}</h1>
      {error && (
        <div className="card" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {programs.length === 0 && !error ? (
          <div className="card">
            <p>{t('student.noOpen')}</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              {t('student.noOpenHint')}
            </p>
          </div>
        ) : (
          programs.map((p) => {
            const app = appByProgramId.get(String(p._id));
            const isDraft = app?.submissionStatus === 'draft';
            const hasApp = Boolean(app);

            let action = null;
            if (!hasApp) {
              action = (
                <Link to={`/student/programs/${p._id}/apply`} className="btn btn-primary">
                  {t('student.apply')}
                </Link>
              );
            } else if (isDraft) {
              action = (
                <Link to={`/student/programs/${p._id}/apply`} className="btn btn-primary">
                  {t('student.continueApplication')}
                </Link>
              );
            } else {
              action = (
                <span className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
                  {t('student.applied')}
                </span>
              );
            }

            const amt = p.amountPerBeneficiary != null ? Number(p.amountPerBeneficiary).toLocaleString(locale) : '—';
            const deadline = p.applicationDeadline
              ? new Date(p.applicationDeadline).toLocaleDateString(locale)
              : '—';

            return (
              <div
                key={p._id}
                className="card"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}
              >
                <div>
                  <h3 style={{ marginBottom: '0.35rem' }}>{p.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {p.provider?.organizationName} · {p.provider?.type}
                  </p>
                  {p.description && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      {p.description.slice(0, 200)}
                      {p.description.length > 200 ? '...' : ''}
                    </p>
                  )}
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {t('student.perBeneficiary').replace('{n}', amt)} · {t('student.deadline')}: {deadline}
                  </p>
                  {isDraft && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--amber)', marginTop: '0.35rem' }}>{t('student.draftNote')}</p>
                  )}
                </div>
                {action}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
