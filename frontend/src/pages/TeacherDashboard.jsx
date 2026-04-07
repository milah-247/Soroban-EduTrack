import { useState } from 'react';
import { rewardStudent, bulkReward } from '../services/api';

const ACTIVITY_TYPES = ['course', 'assignment', 'quiz', 'attendance', 'exam'];

export default function TeacherDashboard() {
  const [single, setSingle] = useState({ studentAddress: '', activityId: '', amount: '' });
  const [bulk, setBulk] = useState('');
  const [msg, setMsg] = useState('');

  async function handleSingle(e) {
    e.preventDefault();
    try {
      await rewardStudent({ ...single, amount: Number(single.amount) });
      setMsg('Reward assigned!');
      setSingle({ studentAddress: '', activityId: '', amount: '' });
    } catch (err) {
      setMsg(err.response?.data?.error || err.message);
    }
  }

  async function handleBulk(e) {
    e.preventDefault();
    try {
      const rewards = JSON.parse(bulk);
      await bulkReward(rewards);
      setMsg(`Bulk distributed to ${rewards.length} students`);
      setBulk('');
    } catch (err) {
      setMsg(err.response?.data?.error || err.message);
    }
  }

  return (
    <div style={s.page}>
      <h2>Teacher Dashboard</h2>

      <section style={s.section}>
        <h3>Assign Reward</h3>
        <form onSubmit={handleSingle} style={s.form}>
          <input placeholder="Student Address" value={single.studentAddress}
            onChange={e => setSingle({ ...single, studentAddress: e.target.value })} style={s.input} required />
          <select value={single.activityId} onChange={e => setSingle({ ...single, activityId: e.target.value })} style={s.input}>
            <option value="">Select Activity</option>
            {ACTIVITY_TYPES.map(t => <option key={t} value={`${t}:${Date.now()}`}>{t}</option>)}
          </select>
          <input type="number" placeholder="Amount" value={single.amount}
            onChange={e => setSingle({ ...single, amount: e.target.value })} style={s.input} required />
          <button type="submit" style={s.btn}>Assign</button>
        </form>
      </section>

      <section style={s.section}>
        <h3>Bulk Distribution</h3>
        <p style={s.hint}>Paste JSON array: <code>[{"{"}"studentAddress":"G...","activityId":"course:1","amount":100{"}"}]</code></p>
        <form onSubmit={handleBulk} style={s.col}>
          <textarea rows={6} value={bulk} onChange={e => setBulk(e.target.value)}
            placeholder='[{"studentAddress":"G...","activityId":"course:1","amount":100}]'
            style={{ ...s.input, width: '100%', fontFamily: 'monospace' }} required />
          <button type="submit" style={s.btn}>Distribute</button>
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
  col: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: 10, borderRadius: 6, background: '#0f0f1a', color: '#fff', border: '1px solid #333' },
  btn: { padding: '10px 20px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  hint: { color: '#aaa', fontSize: 13, marginBottom: 8 },
  msg: { color: '#aaa', marginTop: 12 },
};
