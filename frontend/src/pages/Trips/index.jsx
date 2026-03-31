import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { tripAPI, vehicleAPI, driverAPI, customerAPI } from '../../api';
import { Modal, Badge, PageHeader, SearchBar, FilterTags, FormGroup, Input, Select, fmtDate, fmtCurrency } from '../../components/common';
import { Spinner } from '../../components/common';

const today = () => new Date().toISOString().slice(0,10);

const EMPTY_TRIP = { vendorName:'Lucky Transport Services', vehicleType:'17 FEET (1)', periodFrom:'', periodTo:'', location:'', customerId:'', vehicleId:'', driverId:'', tripAmount:0, ratePerTrip:0, extraOltHrs:0, extraOltAmount:0, accMonthlyPass:0, status:'Draft', notes:'' };

// ─── Entry row editor ─────────────────────────────────────────────────────────
const EntryTable = ({ entries, onChange }) => {
  const set = (i, k, v) => {
    const updated = entries.map((e,idx) => idx === i ? { ...e, [k]: v } : e);
    onChange(updated);
  };
  const addRow = () => onChange([...entries, { srNo: entries.length+1, date: today(), vehicleNo:'', chaName:'', vehicleType:'17 FEET', openingTime:'', mrbArrivalTime:'', closingTime:'', perTripHrs:8, totalHrs:0, gtInHrs:0, gtAmount:0 }]);
  const removeRow = (i) => onChange(entries.filter((_,idx)=>idx!==i).map((e,idx)=>({...e,srNo:idx+1})));

  const COLS = ['Sr','Date','Vehicle No','CHA Name','Veh Type','Open Time','MRB Arrival','Close Time','Per Trip Hrs','Total Hrs','GT Hrs','GT Amount',''];

  return (
    <div style={{ marginTop:16 }}>
      <div className="flex justify-between items-center mb-4">
        <div style={{ fontFamily:'var(--fhead)', fontWeight:700 }}>Trip Entries ({entries.length} rows)</div>
        <button className="btn btn-secondary btn-sm" onClick={addRow}>＋ Add Row</button>
      </div>
      <div className="entry-table-wrap">
        <table className="entry-table">
          <thead><tr>{COLS.map(c=><th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {entries.length === 0 && (
              <tr><td colSpan={13} style={{ padding:20, color:'var(--text3)', textAlign:'center' }}>No entries yet. Click "+ Add Row"</td></tr>
            )}
            {entries.map((e,i) => (
              <tr key={i}>
                <td><input className="entry-input" style={{width:36}} value={e.srNo||i+1} readOnly /></td>
                <td><input className="entry-input" type="date" style={{width:110}} value={e.date?.slice?.(0,10)||''} onChange={ev=>set(i,'date',ev.target.value)} /></td>
                <td><input className="entry-input" style={{width:110}} value={e.vehicleNo||''} onChange={ev=>set(i,'vehicleNo',ev.target.value)} /></td>
                <td><input className="entry-input" style={{width:100}} value={e.chaName||''} onChange={ev=>set(i,'chaName',ev.target.value)} /></td>
                <td><input className="entry-input" style={{width:80}} value={e.vehicleType||''} onChange={ev=>set(i,'vehicleType',ev.target.value)} /></td>
                <td><input className="entry-input" style={{width:70}} value={e.openingTime||''} onChange={ev=>set(i,'openingTime',ev.target.value)} placeholder="12:05" /></td>
                <td><input className="entry-input" style={{width:70}} value={e.mrbArrivalTime||''} onChange={ev=>set(i,'mrbArrivalTime',ev.target.value)} /></td>
                <td><input className="entry-input" style={{width:70}} value={e.closingTime||''} onChange={ev=>set(i,'closingTime',ev.target.value)} /></td>
                <td><input className="entry-input" type="number" style={{width:60}} value={e.perTripHrs||0} onChange={ev=>set(i,'perTripHrs',+ev.target.value)} /></td>
                <td><input className="entry-input" type="number" style={{width:60}} value={e.totalHrs||0} onChange={ev=>set(i,'totalHrs',+ev.target.value)} /></td>
                <td><input className="entry-input" type="number" style={{width:60}} value={e.gtInHrs||0} onChange={ev=>set(i,'gtInHrs',+ev.target.value)} /></td>
                <td><input className="entry-input" type="number" style={{width:80}} value={e.gtAmount||0} onChange={ev=>set(i,'gtAmount',+ev.target.value)} /></td>
                <td><button className="btn btn-danger btn-xs" onClick={()=>removeRow(i)}>✕</button></td>
              </tr>
            ))}
          </tbody>
          {entries.length > 0 && (
            <tfoot>
              <tr style={{ background:'var(--surface3)', fontWeight:700 }}>
                <td colSpan={10} style={{ padding:'8px 10px', textAlign:'right', fontSize:12 }}>TOTAL:</td>
                <td style={{ padding:'8px 10px', textAlign:'center' }}>{entries.reduce((s,e)=>s+(+e.gtInHrs||0),0).toFixed(2)}</td>
                <td style={{ padding:'8px 10px', textAlign:'center' }}>{fmtCurrency(entries.reduce((s,e)=>s+(+e.gtAmount||0),0))}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

// ─── Trip Form ────────────────────────────────────────────────────────────────
const TripForm = ({ initial, customers, vehicles, drivers, onSave, onClose }) => {
  const [form,    setForm]    = useState(initial ? {
    ...initial,
    customerId: initial.customerId?._id || initial.customerId || '',
    vehicleId:  initial.vehicleId?._id  || initial.vehicleId  || '',
    driverId:   initial.driverId?._id   || initial.driverId   || '',
    periodFrom: initial.periodFrom?.slice?.(0,10)||'',
    periodTo:   initial.periodTo?.slice?.(0,10)||'',
  } : EMPTY_TRIP);
  const [entries, setEntries] = useState(initial?.entries || []);
  const [saving,  setSaving]  = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  const submit = async () => {
    if (!form.customerId) return toast.error('Customer required');
    setSaving(true);
    try {
      const totalAmt = entries.reduce((s,e)=>s+(+e.gtAmount||0),0);
      await onSave({ ...form, entries, transportTotal: totalAmt, totalAmount: totalAmt+(+form.extraOltAmount||0)+(+form.accMonthlyPass||0) });
      onClose();
    } catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="form-grid">
        <FormGroup label="Vendor Name"><Input value={form.vendorName} onChange={set('vendorName')} /></FormGroup>
        <FormGroup label="Vehicle Type Desc"><Input value={form.vehicleType} onChange={set('vehicleType')} placeholder="17 FEET (1)" /></FormGroup>
        <FormGroup label="Period From"><Input type="date" value={form.periodFrom} onChange={set('periodFrom')} /></FormGroup>
        <FormGroup label="Period To"><Input type="date" value={form.periodTo} onChange={set('periodTo')} /></FormGroup>
        <FormGroup label="Customer *">
          <Select value={form.customerId} onChange={set('customerId')}>
            <option value="">— Select —</option>
            {customers.map(c=><option key={c._id} value={c._id}>{c.companyName}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Location"><Input value={form.location} onChange={set('location')} placeholder="Mumbai, MIDC" /></FormGroup>
        <FormGroup label="Vehicle">
          <Select value={form.vehicleId} onChange={set('vehicleId')}>
            <option value="">— Select —</option>
            {vehicles.map(v=><option key={v._id} value={v._id}>{v.regNumber} ({v.type})</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Driver">
          <Select value={form.driverId} onChange={set('driverId')}>
            <option value="">— Select —</option>
            {drivers.map(d=><option key={d._id} value={d._id}>{d.fullName}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Trip Count"><Input type="number" value={form.tripAmount} onChange={set('tripAmount')} /></FormGroup>
        <FormGroup label="Rate Per Trip (₹)"><Input type="number" value={form.ratePerTrip} onChange={set('ratePerTrip')} /></FormGroup>
        <FormGroup label="Extra OLT Hrs"><Input type="number" value={form.extraOltHrs} onChange={set('extraOltHrs')} /></FormGroup>
        <FormGroup label="Extra OLT Amount (₹)"><Input type="number" value={form.extraOltAmount} onChange={set('extraOltAmount')} /></FormGroup>
        <FormGroup label="ACC Monthly Pass (₹)"><Input type="number" value={form.accMonthlyPass} onChange={set('accMonthlyPass')} /></FormGroup>
        <FormGroup label="Status">
          <Select value={form.status} onChange={set('status')}>
            {['Draft','Submitted','Approved','Invoiced'].map(s=><option key={s}>{s}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Notes" full><textarea className="form-textarea" value={form.notes} onChange={set('notes')} /></FormGroup>
      </div>

      <EntryTable entries={entries} onChange={setEntries} />

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : '💾 Save Trip'}</button>
      </div>
    </>
  );
};

// ─── Main Trips page ──────────────────────────────────────────────────────────
const Trips = () => {
  const [trips,     setTrips]     = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles,  setVehicles]  = useState([]);
  const [drivers,   setDrivers]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('All');
  const [modal,     setModal]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tr, cu, ve, dr] = await Promise.all([
        tripAPI.list({ status: filter !== 'All' ? filter : undefined }),
        customerAPI.list(), vehicleAPI.list(), driverAPI.list(),
      ]);
      setTrips(tr.data.data); setCustomers(cu.data.data); setVehicles(ve.data.data); setDrivers(dr.data.data);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    if (modal.mode === 'edit') { await tripAPI.update(modal.data._id, form); toast.success('Trip updated'); }
    else { await tripAPI.create(form); toast.success('Trip created'); }
    setModal(null); load();
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete trip ${t.tripId}?`)) return;
    await tripAPI.remove(t._id); toast.success('Deleted'); load();
  };

  const exportDocx = (id) => {
    const token = localStorage.getItem('fp_token');
    const a = document.createElement('a');
    a.href = `/api/trips/${id}/export`;
    // Add auth header via fetch
    fetch(`/api/trips/${id}/export`, { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.blob())
      .then(blob => { a.href = URL.createObjectURL(blob); a.download = `TripReport_${id}.docx`; a.click(); });
  };

  return (
    <div>
      <PageHeader title="Trip Logs" sub={`${trips.length} trips recorded`}>
        <button className="btn btn-primary" onClick={() => setModal({ mode:'add' })}>＋ New Trip</button>
      </PageHeader>

      <div className="flex gap-3 items-center mb-4">
        <FilterTags options={['All','Draft','Submitted','Approved','Invoiced']} value={filter} onChange={setFilter} />
      </div>

      <div className="card" style={{ padding:0 }}>
        {loading ? <Spinner center /> : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Trip ID</th><th>Period</th><th>Customer</th><th>Vehicle Type</th><th>Vehicle</th><th>Driver</th><th>Trips</th><th>Total Amt</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr><td colSpan={10}><div className="empty-state"><div className="empty-icon">🗺️</div><div>No trips yet</div></div></td></tr>
                ) : trips.map(t => (
                  <tr key={t._id}>
                    <td style={{ fontWeight:600, color:'var(--blue)' }}>{t.tripId}</td>
                    <td style={{ fontSize:12 }}>{fmtDate(t.periodFrom)} – {fmtDate(t.periodTo)}</td>
                    <td>{t.customerId?.companyName || '—'}</td>
                    <td>{t.vehicleType || '—'}</td>
                    <td style={{ fontSize:12 }}>{t.vehicleId?.regNumber || '—'}</td>
                    <td style={{ fontSize:12 }}>{t.driverId?.fullName || '—'}</td>
                    <td style={{ textAlign:'center' }}>{t.tripAmount || 0}</td>
                    <td style={{ fontWeight:600 }}>{fmtCurrency(t.totalAmount)}</td>
                    <td><Badge status={t.status} /></td>
                    <td>
                      <div className="tbl-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal({ mode:'edit', data:t })}>✏️</button>
                        <button className="btn btn-success btn-sm" title="Export DOCX" onClick={() => exportDocx(t._id)}>📄 Export</button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(t)}>🗑</button>
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
        <Modal title={modal.mode === 'edit' ? 'Edit Trip' : 'New Trip'} onClose={() => setModal(null)} size="modal-xl">
          <TripForm initial={modal.data} customers={customers} vehicles={vehicles} drivers={drivers} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
};

export default Trips;
