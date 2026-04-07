import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { redeem } from '../services/api';

const ITEMS = [
  { id: 'scholarship', label: 'Scholarship Grant', cost: 500, icon: '🎓', desc: 'Partial tuition scholarship' },
  { id: 'resource', label: 'Course Bundle', cost: 100, icon: '📚', desc: 'Access to premium courses' },
  { id: 'discount', label: '20% Tuition Discount', cost: 200, icon: '🏷️', desc: 'Discount on next semester' },
  { id: 'fiat', label: 'Cash via Anchor', cost: 50, icon: '💵', desc: 'Redeem for fiat via Stellar anchor' },
];

export default function Marketplace() {
  const { publicKey } = useWallet();
  const [msg, setMsg] = useState('');

  async function handleRedeem(item) {
    if (!publicKey) return setMsg('Connect wallet first');
    try {
      await redeem({ studentAddress: publicKey, rewardType: item.id, amount: item.cost });
      setMsg(`Redeemed: ${item.label}`);
    } catch (err) {
      setMsg(err.response?.data?.error || err.message);
    }
  }

  return (
    <div style={s.page}>
      <h2>🛍️ Rewards Marketplace</h2>
      <p style={s.sub}>Spend your EDU tokens on real rewards</p>
      <div style={s.grid}>
        {ITEMS.map(item => (
          <div key={item.id} style={s.card}>
            <div style={s.icon}>{item.icon}</div>
            <h3>{item.label}</h3>
            <p style={s.desc}>{item.desc}</p>
            <div style={s.cost}>{item.cost} EDU</div>
            <button onClick={() => handleRedeem(item)} style={s.btn}>Redeem</button>
          </div>
        ))}
      </div>
      {msg && <p style={s.msg}>{msg}</p>}
    </div>
  );
}

const s = {
  page: { padding: 32, color: '#fff', background: '#0f0f1a', minHeight: '100vh' },
  sub: { color: '#aaa', marginBottom: 32 },
  grid: { display: 'flex', gap: 24, flexWrap: 'wrap' },
  card: { background: '#1a1a2e', borderRadius: 12, padding: 24, width: 200, textAlign: 'center' },
  icon: { fontSize: 36, marginBottom: 8 },
  desc: { color: '#aaa', fontSize: 13, marginBottom: 12 },
  cost: { color: '#e94560', fontWeight: 700, fontSize: 18, marginBottom: 12 },
  btn: { width: '100%', padding: '8px 0', background: '#e94560', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  msg: { marginTop: 16, color: '#aaa' },
};
