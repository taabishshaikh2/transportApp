import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../../api';
import { Modal, Badge, PageHeader, FormGroup, Input, Select, fmtDate } from '../../components/common';
import { Spinner } from '../../components/common';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { username:'', password:'', fullName:'', email:'', role:'driver' };

const UserForm = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial ? { ...initial, password:'' } : EMPTY);
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!initial && (!form.username || !form.password)) return toast.error('Username and password required');
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch(e) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="form-grid">
        <FormGroup label="Full Name *"><Input value={form.fullName} onChange={set('fullName')} /></FormGroup>
        <FormGroup label="Username *"><Input value={form.username} onChange={set('username')} disabled={!!initial} /></FormGroup>
        <FormGroup label={initial ? 'New Password (leave blank to keep)' : 'Password *'}>
          <Input type="password" value={form.password} onChange={set('password')} placeholder={initial ? 'Leave blank to keep' : ''} />
        </FormGroup>
        <FormGroup label="Email"><Input type="email" value={form.email} onChange={set('email')} /></FormGroup>
        <FormGroup label="Role">
          <Select value={form.role} onChange={set('role')}>
            {['admin','manager','driver'].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
          </Select>
        </FormGroup>
        {initial && (
          <FormGroup label="Active">
            <Select value={form.isActive?.toString()} onChange={e=>setForm(f=>({...f,isActive:e.target.value==='true'}))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </FormGroup>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving?'Saving…':'💾 Save User'}</button>
      </div>
    </>
  );
};

const Users = () => {
  const { user: me } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);

  const load = async () => {
    setLoading(true);
    try { const r = await authAPI.listUsers(); setUsers(r.data.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (form) => {
    if (modal.mode === 'edit') { await authAPI.updateUser(modal.data._id, form); toast.success('User updated'); }
    else { await authAPI.createUser(form); toast.success('User created'); }
    setModal(null); load();
  };

  const ROLE_COLOR = { admin:'badge-red', manager:'badge-blue', driver:'badge-green' };

  return (
    <div>
      <PageHeader title="User Management" sub={`${users.length} users`}>
        <button className="btn btn-primary" onClick={() => setModal({ mode:'add' })}>＋ Add User</button>
      </PageHeader>

      <div className="card" style={{ padding:0 }}>
        {loading ? <Spinner center /> : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight:600 }}>{u.fullName}</td>
                    <td style={{ fontFamily:'monospace', fontSize:12 }}>{u.username}</td>
                    <td style={{ fontSize:12 }}>{u.email || '—'}</td>
                    <td><span className={`badge ${ROLE_COLOR[u.role]||'badge-gray'}`}>{u.role}</span></td>
                    <td><Badge status={u.isActive ? 'Active' : 'Inactive'} /></td>
                    <td style={{ fontSize:12 }}>{fmtDate(u.createdAt)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal({ mode:'edit', data:u })} disabled={u._id===me?.id}>✏️ Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode==='edit'?'Edit User':'Add User'} onClose={()=>setModal(null)}>
          <UserForm initial={modal.data} onSave={save} onClose={()=>setModal(null)} />
        </Modal>
      )}
    </div>
  );
};

export default Users;
