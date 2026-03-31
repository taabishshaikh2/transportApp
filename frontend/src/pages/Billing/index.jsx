import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { invoiceAPI, customerAPI, tripAPI } from '../../api';
import { Modal, Badge, PageHeader, FilterTags, FormGroup, Input, Select, fmtDate, fmtCurrency } from '../../components/common';
import { Spinner } from '../../components/common';

const todayStr = () => new Date().toISOString().slice(0,10);
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const curMonth = () => { const d=new Date(); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

const EMPTY = { customerId:'', tripId:'', invoiceDate:todayStr(), dueDate:'', periodFrom:'', periodTo:'', location:'', dhlGstin:'', sacNo:'996601', state:'Maharashtra', stateCode:'27', placeOfSupply:'MUMBAI, MAHARASHTRA', vehicleTypeDesc:'', invoiceMonth:curMonth(), freightDesc:'', baseAmount:0, cgstRate:9, sgstRate:9, roundOff:0, notes:'' };

const toForm = (inv) => !inv ? EMPTY : {
  customerId:      inv.customer_id       ?? '',
  tripId:          inv.trip_id           ?? '',
  invoiceDate:     inv.invoice_date      ? inv.invoice_date.slice(0,10)   : todayStr(),
  dueDate:         inv.due_date          ? inv.due_date.slice(0,10)       : '',
  periodFrom:      inv.period_from       ? inv.period_from.slice(0,10)    : '',
  periodTo:        inv.period_to         ? inv.period_to.slice(0,10)      : '',
  location:        inv.location          ?? '',
  dhlGstin:        inv.dhl_gstin         ?? '',
  sacNo:           inv.sac_no            ?? '996601',
  state:           inv.state             ?? 'Maharashtra',
  stateCode:       inv.state_code        ?? '27',
  placeOfSupply:   inv.place_of_supply   ?? 'MUMBAI, MAHARASHTRA',
  vehicleTypeDesc: inv.vehicle_type_desc ?? '',
  invoiceMonth:    inv.invoice_month     ?? curMonth(),
  freightDesc:     inv.freight_desc      ?? '',
  baseAmount:      inv.base_amount       ?? 0,
  cgstRate:        inv.cgst_rate         ?? 9,
  sgstRate:        inv.sgst_rate         ?? 9,
  roundOff:        inv.round_off         ?? 0,
  notes:           inv.notes             ?? '',
};

const InvoiceForm = ({ initial, customers, trips, onSave, onClose }) => {
  const [form, setForm] = useState(toForm(initial));
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const onTripChange = (e) => {
    const tid = e.target.value;
    const trip = trips.find(t => t.id === tid);
    if (trip) {
      setForm(f => ({
        ...f, tripId: tid,
        customerId:     trip.customer_id      || f.customerId,
        vehicleTypeDesc: trip.vehicle_type    || f.vehicleTypeDesc,
        periodFrom:     trip.period_from?.slice?.(0,10) || f.periodFrom,
        periodTo:       trip.period_to?.slice?.(0,10)   || f.periodTo,
        baseAmount:     trip.total_amount     || f.baseAmount,
      }));
    } else {
      setForm(f => ({ ...f, tripId: tid }));
    }
  };

  const base  = parseFloat(form.baseAmount) || 0;
  const cgst  = parseFloat((base * (parseFloat(form.cgstRate)||9) / 100).toFixed(2));
  const sgst  = parseFloat((base * (parseFloat(form.sgstRate)||9) / 100).toFixed(2));
  const total = parseFloat((base + cgst + sgst + (parseFloat(form.roundOff)||0)).toFixed(2));

  const submit = async () => {
    if (!form.customerId || !form.baseAmount) return toast.error('Customer and amount required');
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="form-grid">
        <FormGroup label="Link to Trip (auto-fill)">
          <Select value={form.tripId} onChange={onTripChange}>
            <option value="">— Select trip (optional) —</option>
            {trips.map(t => <option key={t.id} value={t.id}>{t.trip_id} — {t.customers?.company_name} ({fmtDate(t.period_from)})</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Customer *">
          <Select value={form.customerId} onChange={set('customerId')}>
            <option value="">— Select —</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Invoice Date"><Input type="date" value={form.invoiceDate} onChange={set('invoiceDate')} /></FormGroup>
        <FormGroup label="Due Date"><Input type="date" value={form.dueDate} onChange={set('dueDate')} /></FormGroup>
        <FormGroup label="Period From"><Input type="date" value={form.periodFrom} onChange={set('periodFrom')} /></FormGroup>
        <FormGroup label="Period To"><Input type="date" value={form.periodTo} onChange={set('periodTo')} /></FormGroup>
        <FormGroup label="Location"><Input value={form.location} onChange={set('location')} placeholder="Mumbai, MIDC" /></FormGroup>
        <FormGroup label="Invoice Month"><Input value={form.invoiceMonth} onChange={set('invoiceMonth')} placeholder="September 2025" /></FormGroup>
        <FormGroup label="Vehicle Type (description)"><Input value={form.vehicleTypeDesc} onChange={set('vehicleTypeDesc')} placeholder="17 FEET (1)" /></FormGroup>
        <FormGroup label="DHL GSTIN"><Input value={form.dhlGstin} onChange={set('dhlGstin')} /></FormGroup>
        <FormGroup label="State"><Input value={form.state} onChange={set('state')} /></FormGroup>
        <FormGroup label="State Code"><Input value={form.stateCode} onChange={set('stateCode')} /></FormGroup>
        <FormGroup label="Place of Supply" full><Input value={form.placeOfSupply} onChange={set('placeOfSupply')} /></FormGroup>
        <FormGroup label="Base Amount (₹) *"><Input type="number" value={form.baseAmount} onChange={set('baseAmount')} /></FormGroup>
        <FormGroup label="CGST Rate (%)"><Input type="number" value={form.cgstRate} onChange={set('cgstRate')} /></FormGroup>
        <FormGroup label="SGST Rate (%)"><Input type="number" value={form.sgstRate} onChange={set('sgstRate')} /></FormGroup>
        <FormGroup label="Round Off (₹)"><Input type="number" value={form.roundOff} onChange={set('roundOff')} /></FormGroup>
      </div>
      <div style={{ background:'var(--bg)', borderRadius:8, padding:16, marginTop:16 }}>
        {[['Base Amount', fmtCurrency(base)], ['CGST', fmtCurrency(cgst)], ['SGST', fmtCurrency(sgst)]].map(([l,v]) => (
          <div key={l} className="info-row"><span className="info-label">{l}</span><span>{v}</span></div>
        ))}
        <div className="divider" />
        <div className="info-row">
          <span style={{ fontWeight:700, fontSize:15 }}>Total Amount</span>
          <span style={{ fontWeight:800, fontSize:16, color:'var(--accent)' }}>{fmtCurrency(total)}</span>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : '💾 Create Invoice'}</button>
      </div>
    </>
  );
};

const PaymentModal = ({ invoice, onClose, onSaved }) => {
  const [form, setForm] = useState({ paymentDate:todayStr(), amount: invoice.total_amount, paymentMode:'Bank Transfer', referenceNo:'', notes:'' });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setSaving(true);
    try { await invoiceAPI.recordPayment(invoice.id, form); toast.success('Payment recorded'); onSaved(); }
    catch(e) { toast.error(e.response?.data?.message || 'Failed'); setSaving(false); }
  };

  return (
    <Modal title={`Record Payment — ${invoice.invoice_number}`} onClose={onClose}>
      <div style={{ background:'var(--bg)', borderRadius:8, padding:14, marginBottom:16 }}>
        <div className="info-row"><span className="info-label">Invoice Total</span><span style={{ fontWeight:700, color:'var(--accent)' }}>{fmtCurrency(invoice.total_amount)}</span></div>
        <div className="info-row"><span className="info-label">Customer</span><span>{invoice.customers?.company_name}</span></div>
      </div>
      <div className="form-grid">
        <FormGroup label="Payment Date"><Input type="date" value={form.paymentDate} onChange={set('paymentDate')} /></FormGroup>
        <FormGroup label="Amount (₹)"><Input type="number" value={form.amount} onChange={set('amount')} /></FormGroup>
        <FormGroup label="Payment Mode">
          <Select value={form.paymentMode} onChange={set('paymentMode')}>
            {['Bank Transfer','NEFT','RTGS','Cheque','UPI','Cash'].map(m => <option key={m}>{m}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Reference No"><Input value={form.referenceNo} onChange={set('referenceNo')} /></FormGroup>
        <FormGroup label="Notes" full><textarea className="form-textarea" value={form.notes} onChange={set('notes')} /></FormGroup>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : '💰 Record Payment'}</button>
      </div>
    </Modal>
  );
};

const Billing = () => {
  const [invoices,  setInvoices]  = useState([]);
  const [customers, setCustomers] = useState([]);
  const [trips,     setTrips]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('All');
  const [modal,     setModal]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ir, cr, tr] = await Promise.all([
        invoiceAPI.list({ status: filter !== 'All' ? filter : undefined }),
        customerAPI.list(), tripAPI.list(),
      ]);
      setInvoices(ir.data.data); setCustomers(cr.data.data); setTrips(tr.data.data);
    } catch(e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    if (modal.mode === 'edit') { await invoiceAPI.update(modal.data.id, form); toast.success('Invoice updated'); }
    else { await invoiceAPI.create(form); toast.success('Invoice created'); }
    setModal(null); load();
  };

  const downloadDocx = (inv) => {
    const token = localStorage.getItem('fp_token');
    fetch(`/api/invoices/${inv.id}/download`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`Invoice_${(inv.invoice_number||'').replace(/\//g,'_')}.docx`; a.click(); });
  };

  return (
    <div>
      <PageHeader title="Billing & Invoices" sub={`${invoices.length} invoices`}>
        <button className="btn btn-primary" onClick={() => setModal({ mode:'add' })}>＋ New Invoice</button>
      </PageHeader>
      <div className="flex gap-3 items-center mb-4">
        <FilterTags options={['All','Draft','Pending','Paid','Overdue','Cancelled']} value={filter} onChange={setFilter} />
      </div>
      <div className="card" style={{ padding:0 }}>
        {loading ? <Spinner center /> : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Invoice #</th><th>Date</th><th>Customer</th><th>Period</th><th>Base</th><th>CGST</th><th>SGST</th><th>Total</th><th>Due</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={11}><div className="empty-state"><div className="empty-icon">🧾</div><div>No invoices yet</div></div></td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight:600, color:'var(--accent)' }}>{inv.invoice_number}</td>
                    <td style={{ fontSize:12 }}>{fmtDate(inv.invoice_date)}</td>
                    <td>{inv.customers?.company_name || '—'}</td>
                    <td style={{ fontSize:11 }}>{fmtDate(inv.period_from)} – {fmtDate(inv.period_to)}</td>
                    <td>{fmtCurrency(inv.base_amount)}</td>
                    <td>{fmtCurrency(inv.cgst_amount)}</td>
                    <td>{fmtCurrency(inv.sgst_amount)}</td>
                    <td style={{ fontWeight:700 }}>{fmtCurrency(inv.total_amount)}</td>
                    <td style={{ fontSize:12 }}>{fmtDate(inv.due_date)}</td>
                    <td><Badge status={inv.status} /></td>
                    <td>
                      <div className="tbl-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal({ mode:'edit', data:inv })}>✏️</button>
                        <button className="btn btn-success btn-sm" onClick={() => downloadDocx(inv)}>📄 DOCX</button>
                        {inv.status !== 'Paid' && (
                          <button className="btn btn-primary btn-sm" onClick={() => setModal({ mode:'pay', data:inv })}>✓ Pay</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {(modal?.mode === 'add' || modal?.mode === 'edit') && (
        <Modal title={modal.mode === 'edit' ? `Edit ${modal.data.invoice_number}` : 'New Invoice'} onClose={() => setModal(null)} size="modal-xl">
          <InvoiceForm initial={modal.data} customers={customers} trips={trips} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.mode === 'pay' && (
        <PaymentModal invoice={modal.data} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
};

export default Billing;
