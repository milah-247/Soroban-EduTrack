import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { authSep10, authVerify } from '../services/api';

export default function ConnectWallet() {
  const { connect, setRole } = useWallet();
  const [status, setStatus] = useState('');
  const [roleInput, setRoleInput] = useState('student');
  const nav = useNavigate();

  async function handleConnect() {
    setStatus('Connecting wallet…');
    try {
      const pk = await connect();
      setStatus('Requesting challenge…');

      // SEP-10 flow
      const { data: challenge } = await authSep10(pk);

      // In production: sign with Freighter. Here we simulate.
      setStatus('Verifying…');
      // For dev: skip actual signing, use a mock verify endpoint
      // const { signTransaction } = await import('@stellar/freighter-api');
      // const signed = await signTransaction(challenge.transaction, { networkPassphrase: '...' });
      // const { data } = await authVerify(signed, pk);

      // Mock token for dev
      const mockToken = 'dev_mock_token';
      localStorage.setItem('edu_token', mockToken);
      localStorage.setItem('edu_role', roleInput);
      setRole(roleInput);

      setStatus('Connected!');
      setTimeout(() => nav(`/${roleInput === 'admin' ? 'admin' : roleInput === 'teacher' ? 'teacher' : 'student'}`), 500);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2>Connect Wallet</h2>
        <p style={s.sub}>Connect your Freighter wallet to access EduTrack</p>
        <select value={roleInput} onChange={e => setRoleInput(e.target.value)} style={s.select}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={handleConnect} style={s.btn}>Connect with Freighter</button>
        {status && <p style={s.status}>{status}</p>}
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: '#0f0f1a' },
  card: { background: '#1a1a2e', borderRadius: 12, padding: 40, textAlign: 'center', color: '#fff', width: 320 },
  sub: { color: '#aaa', marginBottom: 24 },
  select: { width: '100%', padding: 10, marginBottom: 16, borderRadius: 6, background: '#0f0f1a', color: '#fff', border: '1px solid #333' },
  btn: { width: '100%', padding: 12, background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15 },
  status: { marginTop: 16, color: '#aaa', fontSize: 13 },
};
