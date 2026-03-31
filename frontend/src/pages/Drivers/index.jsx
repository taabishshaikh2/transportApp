import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { driverAPI, vehicleAPI } from '../../api';
import { Modal, Badge, PageHeader, SearchBar, FormGroup, Input, Select, fmtDate } from '../../components/common';
import { Spinner } from '../../components/common';

const EMPTY = { fullName:'', phone:'', licenseNumber:'', licenseExpiry:'', age:'', experienceYrs:'', address:'', status:'Active', vehicleId:'' };

const DriverForm = ({ initial, vehicles, onSave, onClose }) => {
  const [form, setForm] = useState(initial ? { ...initial, vehicleId: initial.vehicleId?._id || initial.vehicleId || '', licenseExpiry: initial.licenseExpiry?.slice?.(0,10)||'' } : EMPTY);
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.fullName || !form.phone || !form.licenseNumber) return toast.error('Name, phone and license required');
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="form-grid">
        <FormGroup label="Full Name *"><Input value={form.fullName} onChange={set('fullName')} /></FormGroup>
        <FormGroup label="Phone *"><Input value={form.phone} onChange={set('phone')} /></FormGroup>
        <FormGroup label="License Number *"><Input value={form.licenseNumber} onChange={set('licenseNumber')} /></FormGroup>
        <FormGroup label="License Expiry"><Input type="date" value={form.licenseExpiry} onChange={set('licenseExpiry')} /></FormGroup>
        <FormGroup label="Age"><Input type="number" value={form.age} onChange={set('age')} /></FormGroup>
        <FormGroup label="Experience (years)"><Input type="number" value={form.experienceYrs} onChange={set('experienceYrs')} /></FormGroup>
        <FormGroup label="Status">
          <Select value={form.status} onChange={set('status')}>
            {['Active','On Trip','On Leave','Inactive'].map(s => <option key={s}>{s}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Assign Vehicle">
          <Select value={form.vehicleId} onChange={set('vehicleId')}>
            <option value="">— None —</option>
            {vehicles.map(v => <option key={v._id} value={v._id}>{v.regNumber} ({v.type})</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Address" full><textarea className="form-textarea" value={form.address} onChange={set('address')} /></FormGroup>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : '💾 Save Driver'}</button>
      </div>
    </>
  );
};

const Drivers = () => {
  const [drivers,  setDrivers]  = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dr, vr] = await Promise.all([driverAPI.list({ search: search || undefined }), vehicleAPI.list()]);
      setDrivers(dr.data.data); setVehicles(vr.data.data);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    if (modal.mode === 'edit') { await driverAPI.update(modal.data._id, form); toast.success('Driver updated'); }
    else { await driverAPI.create(form); toast.success('Driver added'); }
    setModal(null); load();
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete ${d.fullName}?`)) return;
    await driverAPI.remove(d._id); toast.success('Deleted'); load();
  };

  const isExpiring = (d) => { if (!d) return false; const diff = (new Date(d) - Date.now()) / 86400000; return diff >= 0 && diff <= 30; };

  return (
    <div>
      <PageHeader title="Drivers" sub={`${drivers.length} registered drivers`}>
        <button className="btn btn-primary" onClick={() => setModal({ mode:'add' })}>＋ Add Driver</button>
      </PageHeader>

      <div className="flex gap-3 items-center mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, phone, license…" />
      </div>

      {loading ? <Spinner center /> : (
        <div className="grid-3" style={{ marginBottom: 20 }}>
          {drivers.map(d => (
            <div className="card" key={d._id}>
              <div className="flex gap-3 items-center" style={{ marginBottom: 14 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--purple))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {d.fullName[0]}
                </div>
                <div>
                  <div style={{ fontFamily:'var(--fhead)', fontWeight:700, fontSize:14 }}>{d.fullName}</div>
                  <div style={{ color:'var(--text3)', fontSize:12 }}>{d.phone}</div>
                </div>
                <div style={{ marginLeft:'auto' }}><Badge status={d.status} /></div>
              </div>
              <div className="info-row"><span className="info-label">Driver ID</span><span className="info-val">{d.driverId}</span></div>
              <div className="info-row"><span className="info-label">License</span><span className="info-val" style={{ fontSize:11, fontFamily:'monospace' }}>{d.licenseNumber}</span></div>
              <div className="info-row">
                <span className="info-label">Lic. Expiry</span>
                <span className="info-val" style={{ color: isExpiring(d.licenseExpiry) ? 'var(--red)' : 'inherit' }}>{fmtDate(d.licenseExpiry)}</span>
              </div>
              <div className="info-row"><span className="info-label">Experience</span><span className="info-val">{d.experienceYrs || '—'} yrs</span></div>
              <div className="info-row"><span className="info-label">Vehicle</span><span className="info-val" style={{ fontSize:12 }}>{d.vehicleId?.regNumber || '—'}</span></div>
              <div className="flex gap-2 mt-4">
                <button className="btn btn-secondary btn-sm flex-1" onClick={() => setModal({ mode:'edit', data:d })}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(d)}>🗑</button>
              </div>
            </div>
          ))}
          <div className="card" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:180, cursor:'pointer', border:'2px dashed var(--border2)' }} onClick={() => setModal({ mode:'add' })}>
            <div style={{ textAlign:'center', color:'var(--text3)' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>＋</div><div>Add Driver</div>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === 'edit' ? 'Edit Driver' : 'Add Driver'} onClose={() => setModal(null)} size="modal-lg">
          <DriverForm initial={modal.data} vehicles={vehicles} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
};

export default Drivers;
