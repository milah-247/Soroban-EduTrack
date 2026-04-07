import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={s.page}>
      <h1 style={s.title}>🎓 SorobanEduTrack</h1>
      <p style={s.sub}>Blockchain-powered education rewards on Stellar</p>
      <div style={s.cards}>
        {[
          { icon: '🏆', title: 'Earn EDU Tokens', desc: 'Complete courses, quizzes, and assignments to earn tokens.' },
          { icon: '🔒', title: 'Secure Treasury', desc: 'Multisig-protected institutional fund management.' },
          { icon: '🎁', title: 'Redeem Rewards', desc: 'Exchange tokens for scholarships, resources, and more.' },
        ].map(c => (
          <div key={c.title} style={s.card}>
            <div style={s.icon}>{c.icon}</div>
            <h3>{c.title}</h3>
            <p style={s.desc}>{c.desc}</p>
          </div>
        ))}
      </div>
      <Link to="/connect" style={s.cta}>Get Started →</Link>
    </div>
  );
}

const s = {
  page: { textAlign: 'center', padding: '60px 24px', background: '#0f0f1a', minHeight: '100vh', color: '#fff' },
  title: { fontSize: 48, color: '#e94560', marginBottom: 12 },
  sub: { color: '#aaa', fontSize: 18, marginBottom: 48 },
  cards: { display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 },
  card: { background: '#1a1a2e', borderRadius: 12, padding: 28, width: 220 },
  icon: { fontSize: 36, marginBottom: 12 },
  desc: { color: '#aaa', fontSize: 14 },
  cta: { background: '#e94560', color: '#fff', padding: '14px 32px', borderRadius: 8, textDecoration: 'none', fontSize: 16 },
};
