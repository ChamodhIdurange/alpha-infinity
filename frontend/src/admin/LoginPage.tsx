import { useEffect, useState, type FormEvent } from 'react';
import { api } from './api';
import './login.css';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'ALFA · Owner Sign In';
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await api('/api/admin/login', 'POST', { username: form.get('username'), password: form.get('password') });
      location.href = '/admin';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login details did not match. Please try again.');
      setBusy(false);
    }
  };

  return (
    <main className="frame">
      <div className="tag">ALFA · PRIVATE CONTROL ROOM</div>
      <div className="logo">ALFA<span style={{ color: '#3bd17c' }}>.</span></div>
      <div className="sub">Your collection. Your campaigns. Your store.</div>
      <h1>Owner sign in.</h1>
      <p className="error" id="error" role="alert" style={error ? { display: 'block' } : undefined}>{error}</p>
      <form onSubmit={submit}>
        <label htmlFor="username">Username</label>
        <input autoComplete="username" name="username" id="username" defaultValue="owner" required />
        <label htmlFor="password">Password</label>
        <input autoComplete="current-password" name="password" id="password" type="password" required autoFocus />
        <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Enter ALFA dashboard ↗'}</button>
      </form>
      <p className="note">First-time setup: run <code>npm run set-password</code> on the server. No default password is supplied. <br /><br /><a href="/">← Return to the shop</a></p>
    </main>
  );
}
