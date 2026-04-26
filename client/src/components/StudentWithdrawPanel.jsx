import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API } from '../config.js';


const METHODS = [
  { id: 'bkash', label: 'bKash' },
  { id: 'nagad', label: 'Nagad' },
  { id: 'rocket', label: 'Rocket' },
  { id: 'bank', label: 'Bank' },
];

export default function StudentWithdrawPanel({ accountBalance, onSuccess }) {
  const { fetchWithAuth, loadUser } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState('bkash');
  const [amount, setAmount] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [busy, setBusy] = useState(false);

  const bal = Math.max(0, Number(accountBalance) || 0);
  const canOpen = bal >= 1;

  const resetForm = () => {
    setAmount('');
    setMobileNumber('');
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setBranch('');
    setRoutingNumber('');
    setMethod('bkash');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canOpen) return;
    setBusy(true);
    try {
      const body = { method, amount: Number(amount) };
      if (['bkash', 'nagad', 'rocket'].includes(method)) {
        body.mobileNumber = mobileNumber;
      } else {
        body.bankName = bankName;
        body.accountName = accountName;
        body.accountNumber = accountNumber;
        if (branch.trim()) body.branch = branch;
        if (routingNumber.trim()) body.routingNumber = routingNumber;
      }
      const res = await fetchWithAuth(`${API}/students/withdraw`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Request failed');
      toast.success(t('dash.withdrawSuccess'));
      setOpen(false);
      resetForm();
      await loadUser();
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || t('dash.withdrawError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="dash-withdraw-cta">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canOpen}
          onClick={() => setOpen(true)}
        >
          {t('dash.withdrawFunds')}
        </button>
        {!canOpen && <p className="dash-muted-xs dash-withdraw-hint">{t('dash.withdrawNoBalance')}</p>}
      </div>

      {open && (
        <div className="eads-modal" role="dialog" aria-modal="true" aria-labelledby="withdraw-modal-title">
          <button
            type="button"
            className="eads-modal__backdrop"
            aria-label="Close"
            onClick={() => !busy && setOpen(false)}
          />
          <div className="eads-modal__panel eads-modal__panel--withdraw">
            <div className="eads-modal__head">
              <h2 id="withdraw-modal-title" className="eads-modal__title">
                {t('dash.withdrawTitle')}
              </h2>
              <p className="eads-modal__lead">
                {t('dash.withdrawAvailable')}{' '}
                <strong>৳ {bal.toLocaleString()}</strong>
              </p>
            </div>
            <form onSubmit={submit} className="eads-withdraw-form">
              <div className="eads-form-group">
                <span className="form-label">{t('dash.withdrawMethod')}</span>
                <div className="eads-method-grid">
                  {METHODS.map((m) => (
                    <label key={m.id} className={`eads-method-chip${method === m.id ? ' eads-method-chip--active' : ''}`}>
                      <input
                        type="radio"
                        name="wmethod"
                        value={m.id}
                        checked={method === m.id}
                        onChange={() => setMethod(m.id)}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>

              <label className="form-label" htmlFor="w-amount">
                {t('dash.withdrawAmount')}
              </label>
              <input
                id="w-amount"
                className="form-input"
                type="number"
                min="1"
                max={bal}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0"
              />

              {['bkash', 'nagad', 'rocket'].includes(method) && (
                <>
                  <label className="form-label" htmlFor="w-mobile">
                    {t('dash.withdrawWalletNumber')}
                  </label>
                  <input
                    id="w-mobile"
                    className="form-input"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    required
                    autoComplete="tel"
                  />
                </>
              )}

              {method === 'bank' && (
                <div className="eads-bank-grid">
                  <div>
                    <label className="form-label" htmlFor="w-bank">
                      {t('dash.withdrawBankName')}
                    </label>
                    <input
                      id="w-bank"
                      className="form-input"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="w-accname">
                      {t('dash.withdrawAccountName')}
                    </label>
                    <input
                      id="w-accname"
                      className="form-input"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="eads-bank-full">
                    <label className="form-label" htmlFor="w-accno">
                      {t('dash.withdrawAccountNumber')}
                    </label>
                    <input
                      id="w-accno"
                      className="form-input"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="w-branch">
                      {t('dash.withdrawBranch')}
                    </label>
                    <input
                      id="w-branch"
                      className="form-input"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="w-route">
                      {t('dash.withdrawRouting')}
                    </label>
                    <input
                      id="w-route"
                      className="form-input"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <p className="eads-withdraw-footnote">{t('dash.withdrawNote')}</p>

              <div className="eads-modal__actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  {t('dash.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? t('dash.working') : t('dash.submitWithdrawal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
