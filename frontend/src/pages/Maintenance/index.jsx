import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { maintenanceAPI, vehicleAPI } from '../../api';
import { Modal, Badge, PageHeader, FilterTags, FormGroup, Input, Select, fmtDate, fmtCurrency } from '../../components/common';
import { Spinner } from '../../components/common';

const today = () => new Date().toISOString().slice(0,10);
const EMPTY = { vehicleId:'', serviceType:'Oil Change', serviceDate:today(), cost:0, mechanicName:'', workshop:'', odometer:'', status:'Scheduled', nextDueDate:'', nextDueKm:'', notes:'' };
const SERVICE_TYPES = ['Oil Change','Engine Overhaul','Tyre Replacement','Brake Service','Battery Replacement','AC Service','Body Repair','General Service','Suspension','Electrical','Transmission','Other'];

const MaintenanceForm = ({ initial, vehicles, onSave, onClose }) => {
  const [form, setForm] = useState(initial ? { ...initial, vehicleId: initial.vehicleId?._id||initial.vehicleId||'', serviceDate: initial.serviceDate?.slice?.(0,10)||today(), nextDueDate: initial.nextDueDate?.slice?.(0,10)||'' } : EMPTY);
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.vehicleId || !form.serviceType) return toast.error('Vehicle and service type required');
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="form-grid">
        <FormGroup label="Vehicle *">
          <Select value={form.vehicleId} onChange={set('vehicleId')}>
            <option value="">— Select —</option>
            {vehicles.map(v=><option key={v._id} value={v._id}>{v.regNumber} ({v.make} {v.model})</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Service Type *">
          <Select value={form.serviceType} onChange={set('serviceType')}>
            {SERVICE_TYPES.map(s=><option key={s}>{s}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Service Date"><Input type="date" value={form.serviceDate} onChange={set('serviceDate')} /></FormGroup>
        <FormGroup label="Cost (₹)"><Input type="number" value={form.cost} onChange={set('cost')} /></FormGroup>
        <FormGroup label="Mechanic Name"><Input value={form.mechanicName} onChange={set('mechanicName')} /></FormGroup>
        <FormGroup label="Workshop"><Input value={form.workshop} onChange={set('workshop')} /></FormGroup>
        <FormGroup label="Odometer (km)"><Input type="number" value={form.odometer} onChange={set('odometer')} /></FormGroup>
        <FormGroup label="Status">
          <Select value={form.status} onChange={set('status')}>
            {['Scheduled','In Progress','Completed'].map(s=><option key={s}>{s}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Next Due Date"><Input type="date" value={form.nextDueDate} onChange={set('nextDueDate')} /></FormGroup>
        <FormGroup label="Next Due (km)"><Input type="number" value={form.nextDueKm} onChange={set('nextDueKm')} /></FormGroup>
        <FormGroup label="Notes" full><textarea className="form-textarea" value={form.notes} onChange={set('notes')} /></FormGroup>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : '💾 Save Record'}</button>
      </div>
    </>
  );
};

const Maintenance = () => {
  const [records,  setRecords]  = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stats,    setStats]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('All');
  const [modal,    setModal]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mr, vr, sr] = await Promise.all([
        maintenanceAPI.list({ status: filter !== 'All' ? filter : undefined }),
        vehicleAPI.list(),
        maintenanceAPI.stats(),
      ]);
      setRecords(mr.data.data); setVehicles(vr.data.data); setStats(sr.data.data);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    if (modal.mode === 'edit') { await maintenanceAPI.update(modal.data._id, form); toast.success('Updated'); }
    else { await maintenanceAPI.create(form); toast.success('Maintenance logged'); }
    setModal(null); load();
  };

  const remove = async (r) => {
    if (!window.confirm('Delete this record?')) return;
    await maintenanceAPI.remove(r._id); toast.success('Deleted'); load();
  };

  const totalCost = records.reduce((s,r)=>s+(r.cost||0),0);

  return (
    <div>
      <PageHeader title="Maintenance Logs" sub={`Total cost: ${fmtCurrency(totalCost)}`}>
        <button className="btn btn-primary" onClick={() => setModal({ mode:'add' })}>＋ Log Maintenance</button>
      </PageHeader>

      {/* Per-vehicle cost stats */}
      {stats.length > 0 && (
        <div className="card mb-6">
          <div style={{ fontFamily:'var(--fhead)', fontWeight:700, marginBottom:12 }}>Cost by Vehicle</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {stats.slice(0,6).map(s => (
              <div key={s._id} style={{ padding:'8px 14px', background:'var(--surface2)', borderRadius:8, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:12, fontWeight:600 }}>{s.regNumber}</div>
                <div style={{ fontSize:13, color:'var(--red)', fontWeight:700 }}>{fmtCurrency(s.totalCost)}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{s.count} service(s)</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 items-center mb-4">
        <FilterTags options={['All','Scheduled','In Progress','Completed']} value={filter} onChange={setFilter} />
      </div>

      <div className="card" style={{ padding:0 }}>
        {loading ? <Spinner center /> : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>ID</th><th>Vehicle</th><th>Service Type</th><th>Date</th><th>Cost</th><th>Workshop</th><th>Status</th><th>Next Due</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">🔧</div><div>No maintenance records</div></div></td></tr>
                ) : records.map(r => (
                  <tr key={r._id}>
                    <td><span className="badge badge-gray">{r.maintenanceId}</span></td>
                    <td style={{ fontWeight:600 }}>{r.vehicleId?.regNumber || '—'}</td>
                    <td>{r.serviceType}</td>
                    <td>{fmtDate(r.serviceDate)}</td>
                    <td style={{ fontWeight:600, color:'var(--red)' }}>{fmtCurrency(r.cost)}</td>
                    <td style={{ fontSize:12 }}>{r.workshop || r.mechanicName || '—'}</td>
                    <td><Badge status={r.status} /></td>
                    <td style={{ fontSize:12 }}>{fmtDate(r.nextDueDate)}</td>
                    <td>
                      <div className="tbl-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal({ mode:'edit', data:r })}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(r)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === 'edit' ? 'Edit Record' : 'Log Maintenance'} onClose={() => setModal(null)} size="modal-lg">
          <MaintenanceForm initial={modal.data} vehicles={vehicles} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
};

export default Maintenance;
