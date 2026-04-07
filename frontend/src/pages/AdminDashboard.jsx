import { useState } from 'react';
import { treasuryFund, treasuryApprove } from '../services/api';

export default function AdminDashboard() {
  const [fund, setFund] = useState({ proposalId: '', amount: '', targetAddress: '' });
  const [approveId, setApproveId] = useState('');
  const [msg, setMsg] = useState('');

  async function handleFund(e) {
    e.preventDefault();
    try {
      await treasuryFund({ ...fund, amount: Number(fund.amount) });
      setMsg(`Proposal ${fund.proposalId} created`);
      setFund({ proposalId: '', amount: '', targetAddress: '' });
    } catch (err) {
      setMsg(err.response?.data?.error || err.message);
    }
  }

  async function handleApprove(e) {
    e.preventDefault();
    try {
      await treasuryApprove({ proposalId: approveId });
      setMsg(`Approved proposal ${approveId}`);
      setApproveId('');
    } catch (err) {
      setMsg(err.response?.data?.error || err.message);
    }
  }

  return (
    <div style={s.page}>
      <h2>Admin Dashboard</h2>

      <section style={s.section}>
        <h3>🏦 Fund Treasury (Multisig Proposal)</h3>
        <form onSubmit={handleFund} style={s.form}>
          <input placeholder="Proposal ID" value={fund.proposalId}
            onChange={e => setFund({ ...fund, proposalId: e.target.value })} style={s.input} required />
          <input type="number" placeholder="Amount" value={fund.amount}
            onChange={e => setFund({ ...fund, amount: e.target.value })} style={s.input} required />
          <input placeholder="Target Address" value={fund.targetAddress}
            onChange={e => setFund({ ...fund, targetAddress: e.target.value })} style={s.input} required />
          <button type="submit" style={s.btn}>Propose</button>
        </form>
      </section>

      <section style={s.section}>
        <h3>✅ Approve Proposal</h3>
        <form onSubmit={handleApprove} style={s.form}>
          <input placeholder="Proposal ID" value={approveId}
            onChange={e => setApproveId(e.target.value)} style={s.input} required />
          <button type="submit" style={s.btn}>Approve</button>
        </form>
      </section>

      {msg && <p style={s.msg}>{msg}</p>}
    </div>
  );
}

const s = {
  page: { padding: 32, color: '#fff', background: '#0f0f1a', minHeight: '100vh' },
  section: { background: '#1a1a2e', borderRadius: 12, padding: 24, marginBottom: 24 },
  form: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
  input: { padding: 10, borderRadius: 6, background: '#0f0f1a', color: '#fff', border: '1px solid #333' },
  btn: { padding: '10px 20px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  msg: { color: '#aaa', marginTop: 12 },
};
