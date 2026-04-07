import { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { getBalance, redeem } from '../services/api';

const ACHIEVEMENTS = [
  { id: 'course:intro', label: 'Intro Course', icon: '📚' },
  { id: 'quiz:midterm', label: 'Midterm Quiz', icon: '📝' },
  { id: 'exam:final', label: 'Final Exam', icon: '🎓' },
  { id: 'attendance:week1', label: 'Week 1 Attendance', icon: '✅' },
];

export default function StudentDashboard() {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(null);
  const [redeemType, setRedeemType] = useState('scholarship');
  const [redeemAmt, setRedeemAmt] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (publicKey) {
      getBalance(publicKey).then(r => setBalance(r.data.balance)).catch(() => setBalance('N/A'));
    }
  }, [publicKey]);

  async function handleRedeem(e) {
    e.preventDefault();
    try {
      await redeem({ studentAddress: publicKey, rewardType: redeemType, amount: Number(redeemAmt) });
      setMsg('Redeemed successfully!');
      const r = await getBalance(publicKey);
      setBalance(r.data.balance);
    } catch (err) {
      setMsg(err.response?.data?.error || err.message);
    }
  }

  return (
    <div style={s.page}>
      <h2>Student Dashboard</h2>
      <div style={s.balanceCard}>
        <div style={s.balLabel}>EDU Balance</div>
        <div style={s.balValue}>{balance ?? '…'}</div>
      </div>

      <h3>Achievements</h3>
      <div style={s.grid}>
        {ACHIEVEMENTS.map(a => (
          <div key={a.id} style={s.achCard}>
            <span style={s.achIcon}>{a.icon}</span>
            <span>{a.label}</span>
          </div>
        ))}
      </div>

      <h3>Redeem Tokens</h3>
      <form onSubmit={handleRedeem} style={s.form}>
        <select value={redeemType} onChange={e => setRedeemType(e.target.value)} style={s.input}>
          <option value="scholarship">Scholarship</option>
          <option value="resource">Educational Resource</option>
          <option value="discount">Discount</option>
          <option value="fiat">Fiat via Anchor</option>
        </select>
        <input
          type="number" placeholder="Amount" value={redeemAmt}
          onChange={e => setRedeemAmt(e.target.value)} style={s.input} required
        />
        <button type="submit" style={s.btn}>Redeem</button>
      </form>
      {msg && <p style={s.msg}>{msg}</p>}
    </div>
  );
}

const s = {
  page: { padding: 32, color: '#fff', background: '#0f0f1a', minHeight: '100vh' },
  balanceCard: { background: '#1a1a2e', borderRadius: 12, padding: 24, display: 'inline-block', marginBottom: 32 },
  balLabel: { color: '#aaa', fontSize: 13 },
  balValue: { fontSize: 40, fontWeight: 700, color: '#e94560' },
  grid: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 },
  achCard: { background: '#1a1a2e', borderRadius: 8, padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'center' },
  achIcon: { fontSize: 22 },
  form: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
  input: { padding: 10, borderRadius: 6, background: '#1a1a2e', color: '#fff', border: '1px solid #333' },
  btn: { padding: '10px 20px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  msg: { marginTop: 12, color: '#aaa' },
};
