import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { vehicleAPI } from '../../api';
import { Modal, Badge, PageHeader, SearchBar, FilterTags, FormGroup, Input, Select, fmtDate } from '../../components/common';
import { Spinner } from '../../components/common';

const EMPTY = {
  regNumber: '', type: 'Truck', make: '', model: '',
  year: new Date().getFullYear(), capacity: '',
  fuelType: 'Diesel', status: 'Active',
  insuranceExpiry: '', fitnessExpiry: '', permitExpiry: '', notes: '',
};

const toForm = (v) => ({
  regNumber:       v.reg_number        || '',
  type:            v.type              || 'Truck',
  make:            v.make              || '',
  model:           v.model             || '',
  year:            v.year              || new Date().getFullYear(),
  capacity:        v.capacity          || '',
  fuelType:        v.fuel_type         || 'Diesel',
  status:          v.status            || 'Active',
  insuranceExpiry: v.insurance_expiry?.slice(0, 10) || '',
  fitnessExpiry:   v.fitness_expiry?.slice(0, 10)   || '',
  permitExpiry:    v.permit_expiry?.slice(0, 10)     || '',
  notes:           v.notes             || '',
});

const VehicleForm = ({ initial, onSave, onClose }) => {
  const [form,   setForm]   = useState(initial ? toForm(initial) : EMPTY);
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.regNumber.trim()) return toast.error('Registration number required');
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
          <Input type="date" value={form.insuranceExpiry} onChange={set('insuranceExpiry')} />
        </FormGroup>
        <FormGroup label="Fitness Certificate Expiry">
          <Input type="date" value={form.fitnessExpiry} onChange={set('fitnessExpiry')} />
        </FormGroup>
        <FormGroup label="Permit Expiry">
          <Input type="date" value={form.permitExpiry} onChange={set('permitExpiry')} />
        </FormGroup>
        <FormGroup label="Notes" full>
          <textarea className="form-textarea" value={form.notes} onChange={set('notes')} />
        </FormGroup>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : '💾 Save Vehicle'}
        </button>
      </div>
    </>
  );
};

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('All');
  const [modal,    setModal]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await vehicleAPI.list({
        search: search || undefined,
        status: filter !== 'All' ? filter : undefined,
      });
      setVehicles(r.data.data);
    } catch (e) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    if (modal.mode === 'edit') {
      const id = modal.data?.id;
      if (!id) return toast.error('Vehicle ID missing');
      await vehicleAPI.update(id, form);
      toast.success('Vehicle updated');
    } else {
      await vehicleAPI.create(form);
      toast.success('Vehicle added');
    }
    setModal(null);
    load();
  };

  const remove = async (v) => {
    if (!v?.id) return toast.error('Vehicle ID missing');
    if (!window.confirm(`Delete ${v.reg_number}?`)) return;
    try {
      await vehicleAPI.remove(v.id);
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const isExpiring = (d) => {
    if (!d) return false;
    const diff = (new Date(d) - Date.now()) / 86400000;
    return diff >= 0 && diff <= 30;
  };

  return (
    <div>
      <PageHeader title="Vehicle Fleet" sub={`${vehicles.length} vehicles registered`}>
        <button className="btn btn-primary" onClick={() => setModal({ mode: 'add' })}>＋ Add Vehicle</button>
      </PageHeader>

      <div className="flex gap-3 items-center mb-4" style={{ flexWrap: 'wrap' }}>
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
                  <tr><td colSpan={11}>
                    <div className="empty-state">
                      <div className="empty-icon">🚛</div>
                      <div className="empty-text">No vehicles found</div>
                    </div>
                  </td></tr>
                ) : vehicles.map(v => (
                  <tr key={v.id}>
                    <td><span className="badge badge-gray">{v.vehicle_id}</span></td>
                    <td style={{ fontWeight: 600 }}>{v.reg_number}</td>
                    <td>{v.type}</td>
                    <td>{v.make} {v.model} {v.year && `(${v.year})`}</td>
                    <td>{v.capacity || '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      {v.drivers?.[0]?.full_name || <span style={{ color: 'var(--text3)' }}>Unassigned</span>}
                    </td>
                    <td><Badge status={v.status} /></td>
                    <td style={{ color: isExpiring(v.insurance_expiry) ? 'var(--red)' : 'inherit', fontSize: 12 }}>
                      {fmtDate(v.insurance_expiry)}
                    </td>
                    <td style={{ color: isExpiring(v.fitness_expiry) ? 'var(--red)' : 'inherit', fontSize: 12 }}>
                      {fmtDate(v.fitness_expiry)}
                    </td>
                    <td style={{ color: isExpiring(v.permit_expiry) ? 'var(--red)' : 'inherit', fontSize: 12 }}>
                      {fmtDate(v.permit_expiry)}
                    </td>
                    <td>
                      <div className="tbl-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal({ mode: 'edit', data: v })}>✏️</button>
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
        <Modal
          title={modal.mode === 'edit' ? 'Edit Vehicle' : 'Add Vehicle'}
          onClose={() => setModal(null)}
          size="modal-lg"
        >
          <VehicleForm initial={modal.data} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
};

export default Vehicles;
