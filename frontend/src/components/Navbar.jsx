import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

export default function Navbar() {
  const { publicKey, role, disconnect } = useWallet();
  const nav = useNavigate();

  function handleDisconnect() {
    disconnect();
    nav('/');
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>🎓 EduTrack</Link>
      <div style={styles.links}>
        {publicKey ? (
          <>
            {role === 'student' && <Link to="/student" style={styles.link}>Dashboard</Link>}
            {role === 'teacher' && <Link to="/teacher" style={styles.link}>Teacher</Link>}
            {role === 'admin' && <Link to="/admin" style={styles.link}>Admin</Link>}
            <Link to="/marketplace" style={styles.link}>Marketplace</Link>
            <span style={styles.pk}>{publicKey.slice(0, 8)}…</span>
            <button onClick={handleDisconnect} style={styles.btn}>Disconnect</button>
          </>
        ) : (
          <Link to="/connect" style={styles.btn}>Connect Wallet</Link>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#1a1a2e', color: '#fff' },
  brand: { color: '#e94560', fontWeight: 700, fontSize: 20, textDecoration: 'none' },
  links: { display: 'flex', gap: 16, alignItems: 'center' },
  link: { color: '#ccc', textDecoration: 'none' },
  pk: { color: '#aaa', fontSize: 12 },
  btn: { background: '#e94560', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', textDecoration: 'none' },
};
