import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>🚚</div>
          <div style={{ fontFamily: 'var(--fhead)', fontSize: 28, fontWeight: 800 }}>FleetPro</div>
          <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>Transport Management System</div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <div style={{ fontFamily: 'var(--fhead)', fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Sign in to your account</div>
          <form onSubmit={submit}>
            <div className="form-group mb-4">
              <label className="form-label">Username</label>
              <input className="form-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="admin" autoFocus />
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
          <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--surface2)', borderRadius: 8, fontSize: 12, color: 'var(--text3)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Default accounts:</div>
            <div>admin / admin123 &nbsp;·&nbsp; manager / manager123 &nbsp;·&nbsp; driver1 / driver123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
