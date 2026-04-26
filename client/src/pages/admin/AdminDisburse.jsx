import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API } from '../../config.js';


const PAYMENT_METHODS = [
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
];

function methodLabel(m) {
  return PAYMENT_METHODS.find((x) => x.value === m)?.label || m || '—';
}

export default function AdminDisburse() {
  const { fetchWithAuth } = useAuth();
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [modalApp, setModalApp] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [transactionReference, setTransactionReference] = useState('');
  const [releaseDate, setReleaseDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/admin/applications/pending-disbursement`);
      if (res.ok) setRows(await res.json());
      else {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to load');
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [fetchWithAuth]);

  const openModal = (app) => {
    const def = Number(app.program?.amountPerBeneficiary || 0);
    setModalApp(app);
    setAmount(String(def > 0 ? def : ''));
    const pref = app.paymentPreference?.method;
    setPaymentMethod(PAYMENT_METHODS.some((x) => x.value === pref) ? pref : 'bank');
    setTransactionReference('');
    setReleaseDate(new Date().toISOString().slice(0, 10));
  };

  const closeModal = () => {
    if (busyId) return;
    setModalApp(null);
  };

  const confirmDisburse = async (e) => {
    e.preventDefault();
    if (!modalApp) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Invalid amount');
      return;
    }
    // enforce provider's per-beneficiary limit and remaining fund
    const perBeneficiary = Number(modalApp.program?.amountPerBeneficiary || 0);
    const remainingFund = Number(modalApp.program?.remainingFund ?? Infinity);
    const allowedMax = Math.min(perBeneficiary > 0 ? perBeneficiary : Infinity, remainingFund);
    if (Number.isFinite(allowedMax) && amt > allowedMax) {
      toast.error(`Amount exceeds allowed maximum of ৳ ${allowedMax.toLocaleString()}`);
      return;
    }
    // enforce student's payment preference if present
    const studentPref = modalApp.paymentPreference?.method;
    if (studentPref && paymentMethod !== studentPref) {
      toast.error('Payment method must match student preference');
      return;
    }
    setBusyId(modalApp._id);
    try {
      const res = await fetchWithAuth(`${API}/admin/disbursements`, {
        method: 'POST',
        body: JSON.stringify({
          applicationId: modalApp._id,
          amount: amt,
          paymentMethod,
          transactionReference: transactionReference.trim() || undefined,
          releaseDate: releaseDate ? new Date(releaseDate).toISOString() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Disbursement failed');
      toast.success('Disbursement recorded');
      setRows((r) => r.filter((x) => x._id !== modalApp._id));
      setModalApp(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="dash-page">
        <div className="dash-card dash-loading">{t('dash.loading')}</div>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <header className="dash-page-header">
        <div>
          <span className="dash-page-kicker">Admin</span>
          <h1 className="dash-page-title">Disburse approved aid</h1>
          <p className="dash-page-lead" style={{ maxWidth: '40rem' }}>
            These applications are approved by the provider and do not yet have a disbursement on record. Recording a
            disbursement reduces the program&apos;s remaining fund and credits the student&apos;s account balance.
          </p>
        </div>
        <Link to="/admin" className="btn btn-secondary btn-sm">
          Back to analytics
        </Link>
      </header>

      {rows.length === 0 ? (
        <section className="dash-card">
          <p className="dash-muted">No approved applications waiting for disbursement.</p>
        </section>
      ) : (
        <div className="dash-disburse-list">
          {rows.map((app) => (
            <section key={app._id} className="dash-card dash-disburse-row">
              <div className="dash-disburse-row-main">
                <h2 className="dash-card-h" style={{ marginBottom: '0.35rem' }}>
                  {app.program?.title}
                </h2>
                <p className="dash-muted" style={{ fontSize: '0.9rem' }}>
                  <strong>{t('dash.disburseStudent')}:</strong> {app.student?.fullName} · {app.student?.district},{' '}
                  {app.student?.upazila}
                </p>
                <p className="dash-muted" style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                  ID: {app.student?.birthCertificateId}
                </p>
                <div className="dash-disburse-meta">
                  <div className="dash-disburse-pill">
                    <span className="material-symbols-outlined" aria-hidden>
                      payments
                    </span>
                    <span>
                      {t('dash.disburseDefault')}: ৳ {Number(app.program?.amountPerBeneficiary || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="dash-disburse-pill dash-disburse-pill--soft">
                    <span className="material-symbols-outlined" aria-hidden>
                      account_balance
                    </span>
                    <span>
                      {t('dash.disburseFundLeft')}: ৳ {Number(app.program?.remainingFund ?? 0).toLocaleString()}
                    </span>
                  </div>
                  {app.paymentPreference?.method && (
                    <div className="dash-disburse-pill">
                      <span className="material-symbols-outlined" aria-hidden>
                        smartphone
                      </span>
                      <span>
                        Preference: {methodLabel(app.paymentPreference.method)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="dash-disburse-row-actions">
                <button type="button" className="btn btn-primary" onClick={() => openModal(app)}>
                  Record disbursement
                </button>
              </div>
            </section>
          ))}
        </div>
      )}

      {modalApp && (
        <div className="eads-modal" role="dialog" aria-modal="true" aria-labelledby="disburse-modal-title">
          <button type="button" className="eads-modal__backdrop" aria-label="Close" onClick={closeModal} />
          <div className="eads-modal__panel eads-modal__panel--disburse">
            <div className="eads-modal__brandbar" aria-hidden />
            <div className="eads-disburse-header">
              <div className="eads-disburse-icon">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <div>
                <h2 id="disburse-modal-title" className="eads-modal__title">
                  {t('dash.disburseModalTitle')}
                </h2>
                <p className="eads-modal__lead">{t('dash.disburseModalLead')}</p>
              </div>
            </div>

            <div className="eads-disburse-dash">
              <div className="eads-disburse-stat">
                <p className="eads-disburse-stat-label">{t('dash.disburseProgram')}</p>
                <p className="eads-disburse-stat-value">{modalApp.program?.title}</p>
              </div>
              <div className="eads-disburse-stat">
                <p className="eads-disburse-stat-label">{t('dash.disburseStudent')}</p>
                <p className="eads-disburse-stat-value">{modalApp.student?.fullName}</p>
              </div>
              <div className="eads-disburse-stat eads-disburse-stat--accent">
                <p className="eads-disburse-stat-label">{t('dash.disburseDefault')}</p>
                <p className="eads-disburse-stat-value">
                  ৳ {Number(modalApp.program?.amountPerBeneficiary || 0).toLocaleString()}
                </p>
              </div>
              <div className="eads-disburse-stat">
                <p className="eads-disburse-stat-label">{t('dash.disburseFundLeft')}</p>
                <p className="eads-disburse-stat-value">
                  ৳ {Number(modalApp.program?.remainingFund ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            <form onSubmit={confirmDisburse} className="eads-disburse-form">
              <label className="form-label" htmlFor="disb-amount">
                {t('dash.disburseAmount')}
              </label>
              {/* determine allowed maximum from program settings */}
              {(() => {
                const per = Number(modalApp.program?.amountPerBeneficiary || 0);
                const rem = Number(modalApp.program?.remainingFund ?? Infinity);
                const maxAllowed = Math.min(per > 0 ? per : Infinity, rem);
                return (
                  <>
                    <input
                      id="disb-amount"
                      className="form-input"
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      max={Number.isFinite(maxAllowed) ? maxAllowed : undefined}
                      aria-describedby="disb-amount-help"
                    />
                    {Number.isFinite(maxAllowed) && (
                      <small id="disb-amount-help" style={{ display: 'block', marginTop: '0.35rem', color: '#475569' }}>
                        Max allowed per provider: ৳ {maxAllowed.toLocaleString()}
                      </small>
                    )}
                  </>
                );
              })()}

              <label className="form-label" htmlFor="disb-method">
                {t('dash.disburseMethod')}
              </label>
              {/* If student specified a payment preference, only allow that method */}
              {modalApp.paymentPreference?.method ? (
                <select
                  id="disb-method"
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled
                >
                  <option value={modalApp.paymentPreference.method}>
                    {methodLabel(modalApp.paymentPreference.method)}
                  </option>
                </select>
              ) : (
                <select
                  id="disb-method"
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              )}

              <label className="form-label" htmlFor="disb-date">
                {t('dash.disburseReleaseDate')}
              </label>
              <input
                id="disb-date"
                className="form-input"
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
              />

              <label className="form-label" htmlFor="disb-ref">
                {t('dash.disburseRef')}
              </label>
              <input
                id="disb-ref"
                className="form-input"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="e.g. TRXID, bank ref"
              />

              <div className="eads-modal__actions eads-modal__actions--end">
                <button type="button" className="btn btn-secondary" disabled={!!busyId} onClick={closeModal}>
                  {t('dash.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={!!busyId}>
                  {busyId ? t('dash.working') : t('dash.disburseConfirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
