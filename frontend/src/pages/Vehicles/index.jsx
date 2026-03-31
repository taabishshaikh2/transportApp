import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { vehicleAPI } from '../../api';
import { Modal, Badge, PageHeader, SearchBar, FilterTags, FormGroup, Input, Select, fmtDate } from '../../components/common';
import { Spinner } from '../../components/common';

const EMPTY = { regNumber:'', type:'Truck', make:'', model:'', year:new Date().getFullYear(), capacity:'', fuelType:'Diesel', status:'Active', insuranceExpiry:'', fitnessExpiry:'', permitExpiry:'', notes:'' };

const VehicleForm = ({ initial, vehicles, onSave, onClose }) => {
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.regNumber) return toast.error('Registration number required');
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="form-grid">
        <FormGroup label="Registration Number *">
          <Input value={form.regNumber} onChange={set('regNumber')} placeholder="MH-01-AB-1234" />
        </FormGroup>
        <FormGroup label="Vehicle Type">
          <Select value={form.type} onChange={set('type')}>
            {['Truck','Trailer','Tanker','Mini Truck','Container','Tipper','Bus','Van'].map(t => <option key={t}>{t}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Make / Brand">
          <Input value={form.make} onChange={set('make')} placeholder="Tata, Ashok Leyland…" />
        </FormGroup>
        <FormGroup label="Model">
          <Input value={form.model} onChange={set('model')} placeholder="Prima 4028.S" />
        </FormGroup>
        <FormGroup label="Year">
          <Input type="number" value={form.year} onChange={set('year')} min={2000} max={2035} />
        </FormGroup>
        <FormGroup label="Capacity">
          <Input value={form.capacity} onChange={set('capacity')} placeholder="28T / 22KL" />
        </FormGroup>
        <FormGroup label="Fuel Type">
          <Select value={form.fuelType} onChange={set('fuelType')}>
            {['Diesel','Petrol','CNG','Electric'].map(f => <option key={f}>{f}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Status">
          <Select value={form.status} onChange={set('status')}>
            {['Active','On Trip','Maintenance','Inactive'].map(s => <option key={s}>{s}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Insurance Expiry">
          <Input type="date" value={form.insuranceExpiry?.slice?.(0,10) || ''} onChange={set('insuranceExpiry')} />
        </FormGroup>
        <FormGroup label="Fitness Certificate Expiry">
          <Input type="date" value={form.fitnessExpiry?.slice?.(0,10) || ''} onChange={set('fitnessExpiry')} />
        </FormGroup>
        <FormGroup label="Permit Expiry">
          <Input type="date" value={form.permitExpiry?.slice?.(0,10) || ''} onChange={set('permitExpiry')} />
        </FormGroup>
        <FormGroup label="Notes" full>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} />
        </FormGroup>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : '💾 Save Vehicle'}</button>
      </div>
    </>
  );
};

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const [filter,  setFilter]    = useState('All');
  const [modal,   setModal]     = useState(null); // null | { mode:'add'|'edit', data? }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await vehicleAPI.list({ search: search || undefined, status: filter !== 'All' ? filter : undefined });
      setVehicles(r.data.data);
    } finally { setLoading(false); }
  }, [search, filter]);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    if (modal.mode === 'edit') {
      await vehicleAPI.update(modal.data._id, form);
      toast.success('Vehicle updated');
    } else {
      await vehicleAPI.create(form);
      toast.success('Vehicle added');
    }
    setModal(null); load();
  };

  const remove = async (v) => {
    if (!window.confirm(`Delete ${v.regNumber}?`)) return;
    await vehicleAPI.remove(v._id);
    toast.success('Deleted'); load();
  };

  const isExpiring = (d) => { if (!d) return false; const diff = (new Date(d) - Date.now()) / 86400000; return diff >= 0 && diff <= 30; };

  return (
    <div>
      <PageHeader title="Vehicle Fleet" sub={`${vehicles.length} vehicles registered`}>
        <button className="btn btn-primary" onClick={() => setModal({ mode:'add' })}>＋ Add Vehicle</button>
      </PageHeader>

      <div className="flex gap-3 items-center mb-4" style={{ flexWrap:'wrap' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search reg, make, model…" />
        <FilterTags options={['All','Active','On Trip','Maintenance','Inactive']} value={filter} onChange={setFilter} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <Spinner center /> : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th><th>Registration</th><th>Type</th><th>Make / Model</th>
                  <th>Capacity</th><th>Driver</th><th>Status</th>
                  <th>Insurance</th><th>Fitness</th><th>Permit</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr><td colSpan={11}><div className="empty-state"><div className="empty-icon">🚛</div><div className="empty-text">No vehicles found</div></div></td></tr>
                ) : vehicles.map(v => (
                  <tr key={v._id}>
                    <td><span className="badge badge-gray">{v.vehicleId}</span></td>
                    <td style={{ fontWeight:600 }}>{v.regNumber}</td>
                    <td>{v.type}</td>
                    <td>{v.make} {v.model} {v.year && `(${v.year})`}</td>
                    <td>{v.capacity || '—'}</td>
                    <td style={{ fontSize:12 }}>{v.driver?.fullName || <span style={{color:'var(--text3)'}}>Unassigned</span>}</td>
                    <td><Badge status={v.status} /></td>
                    <td style={{ color: isExpiring(v.insuranceExpiry) ? 'var(--red)' : 'inherit', fontSize:12 }}>{fmtDate(v.insuranceExpiry)}</td>
                    <td style={{ color: isExpiring(v.fitnessExpiry)   ? 'var(--red)' : 'inherit', fontSize:12 }}>{fmtDate(v.fitnessExpiry)}</td>
                    <td style={{ color: isExpiring(v.permitExpiry)    ? 'var(--red)' : 'inherit', fontSize:12 }}>{fmtDate(v.permitExpiry)}</td>
                    <td>
                      <div className="tbl-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal({ mode:'edit', data:v })}>✏️</button>
                        <button className="btn btn-danger btn-sm"    onClick={() => remove(v)}>🗑</button>
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
        <Modal title={modal.mode === 'edit' ? 'Edit Vehicle' : 'Add Vehicle'} onClose={() => setModal(null)} size="modal-lg">
          <VehicleForm initial={modal.data} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
};

export default Vehicles;
