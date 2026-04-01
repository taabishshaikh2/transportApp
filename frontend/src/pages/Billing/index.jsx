import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { invoiceAPI, customerAPI, tripAPI } from '../../api';
import { Modal, Badge, PageHeader, FilterTags, FormGroup, Input, Select, fmtDate, fmtCurrency } from '../../components/common';
import { Spinner } from '../../components/common';

const today = () => new Date().toISOString().slice(0, 10);
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const curMonth = () => { const d = new Date(); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

const EMPTY = {
  customerId:'', tripId:'', invoiceDate:today(), dueDate:'',
  periodFrom:'', periodTo:'', location:'', dhlGstin:'',
  sacNo:'996601', state:'Maharashtra', stateCode:'27',
  placeOfSupply:'MUMBAI, MAHARASHTRA',
  vehicleTypeDesc:'', invoiceMonth:curMonth(), freightDesc:'',
  baseAmount:0, cgstRate:9, sgstRate:9, roundOff:0, notes:'',
};

// ─── Robust DOCX download — handles auth + binary correctly ──────────────────
const downloadDocxFile = async (url, filename) => {
  const token = localStorage.getItem('fp_token');
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      // Try to read error message from JSON response
      try {
        const err = await response.json();
        throw new Error(err.message || `Server error ${response.status}`);
      } catch (_) {
        throw new Error(`Download failed with status ${response.status}`);
      }
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const err = await response.json();
      throw new Error(err.message || 'Server returned error instead of file');
    }

    const blob = await response.blob();

    // Verify it looks like a ZIP/DOCX (magic bytes PK)
    const arrayBuf = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
      throw new Error('Downloaded file appears corrupted (not a valid DOCX)');
    }

    const docxBlob = new Blob([arrayBuf], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const blobUrl = URL.createObjectURL(docxBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    toast.success('Invoice downloaded!');
  } catch (e) {
    console.error('Download error:', e);
    toast.error(e.message || 'Download failed');
  }
};

// ─── Invoice Form ─────────────────────────────────────────────────────────────
const InvoiceForm = ({ initial, customers, trips, onSave, onClose }) => {
  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY;
    return {
      customerId:      initial.customer_id        || initial.customerId        || '',
      tripId:          initial.trip_id            || initial.tripId            || '',
      invoiceDate:     initial.invoice_date?.slice(0,10) || today(),
      dueDate:         initial.due_date?.slice(0,10)     || '',
      periodFrom:      initial.period_from?.slice(0,10)  || '',
      periodTo:        initial.period_to?.slice(0,10)    || '',
      location:        initial.location           || '',
      dhlGstin:        initial.dhl_gstin          || '',
      sacNo:           initial.sac_no             || '996601',
      state:           initial.state              || 'Maharashtra',
      stateCode:       initial.state_code         || '27',
      placeOfSupply:   initial.place_of_supply    || 'MUMBAI, MAHARASHTRA',
      vehicleTypeDesc: initial.vehicle_type_desc  || '',
      invoiceMonth:    initial.invoice_month      || curMonth(),
      freightDesc:     initial.freight_desc       || '',
      baseAmount:      initial.base_amount        || 0,
      cgstRate:        initial.cgst_rate          || 9,
      sgstRate:        initial.sgst_rate          || 9,
      roundOff:        initial.round_off          || 0,
      notes:           initial.notes              || '',
    };
  });

  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Auto-fill from selected trip
  const onTripChange = (e) => {
    const tid = e.target.value;
    const trip = trips.find(t => t.id === tid);
    if (trip) {
      setForm(f => ({
        ...f,
        tripId:          tid,
        customerId:      trip.customer_id   || f.customerId,
        vehicleTypeDesc: trip.vehicle_type  || f.vehicleTypeDesc,
        periodFrom:      trip.period_from?.slice(0,10) || f.periodFrom,
        periodTo:        trip.period_to?.slice(0,10)   || f.periodTo,
        baseAmount:      trip.total_amount  || f.baseAmount,
      }));
    } else {
      setForm(f => ({ ...f, tripId: tid }));
    }
  };

  const base  = parseFloat(form.baseAmount)  || 0;
  const cgstR = parseFloat(form.cgstRate)    || 9;
  const sgstR = parseFloat(form.sgstRate)    || 9;
  const cgst  = parseFloat((base * cgstR / 100).toFixed(2));
  const sgst  = parseFloat((base * sgstR / 100).toFixed(2));
  const total = parseFloat((base + cgst + sgst + (parseFloat(form.roundOff) || 0)).toFixed(2));

  const submit = async () => {
    if (!form.customerId) return toast.error('Please select a customer');
    if (!form.baseAmount || form.baseAmount <= 0) return toast.error('Base amount must be greater than 0');
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
            {trips.filter(t => t.status !== 'Invoiced' || form.tripId === t.id).map(t => (
              <option key={t.id} value={t.id}>
                {t.trip_id} — {t.customers?.company_name} ({fmtDate(t.period_from)})
              </option>
            ))}
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
        <FormGroup label="Base Amount (₹) *"><Input type="number" value={form.baseAmount} onChange={set('baseAmount')} min={0} /></FormGroup>
        <FormGroup label="CGST Rate (%)"><Input type="number" value={form.cgstRate} onChange={set('cgstRate')} min={0} max={28} /></FormGroup>
        <FormGroup label="SGST Rate (%)"><Input type="number" value={form.sgstRate} onChange={set('sgstRate')} min={0} max={28} /></FormGroup>
        <FormGroup label="Round Off (₹)"><Input type="number" value={form.roundOff} onChange={set('roundOff')} step={0.01} /></FormGroup>
        <FormGroup label="Notes" full><textarea className="form-textarea" value={form.notes} onChange={set('notes')} /></FormGroup>
      </div>

      {/* Tax summary preview */}
      <div style={{ background:'var(--bg)', borderRadius:8, padding:16, marginTop:16 }}>
        <div style={{ fontFamily:'var(--fhead)', fontWeight:700, fontSize:13, marginBottom:10 }}>Tax Summary</div>
        {[['Base Amount', fmtCurrency(base)], [`CGST (${cgstR}%)`, fmtCurrency(cgst)], [`SGST (${sgstR}%)`, fmtCurrency(sgst)], ['Round Off', fmtCurrency(parseFloat(form.roundOff)||0)]].map(([l,v]) => (
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
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : '💾 Create Invoice'}
        </button>
      </div>
    </>
  );
};

// ─── Payment Modal ────────────────────────────────────────────────────────────
const PaymentModal = ({ invoice, onClose, onSaved }) => {
  const [form, setForm] = useState({
    paymentDate: today(),
    amount: invoice.total_amount || 0,
    paymentMode: 'Bank Transfer',
    referenceNo: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.amount || form.amount <= 0) return toast.error('Amount required');
    setSaving(true);
    try {
      await invoiceAPI.recordPayment(invoice.id, form);
      toast.success('Payment recorded');
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
      setSaving(false);
    }
  };

  return (
    <Modal title={`Record Payment — ${invoice.invoice_number}`} onClose={onClose}>
      <div style={{ background:'var(--bg)', borderRadius:8, padding:14, marginBottom:16 }}>
        <div className="info-row">
          <span className="info-label">Invoice Total</span>
          <span style={{ fontWeight:700, color:'var(--accent)' }}>{fmtCurrency(invoice.total_amount)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Customer</span>
          <span>{invoice.customers?.company_name || '—'}</span>
        </div>
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
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : '💰 Record Payment'}
        </button>
      </div>
    </Modal>
  );
};

// ─── Main Billing Page ────────────────────────────────────────────────────────
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
        customerAPI.list(),
        tripAPI.list(),
      ]);
      setInvoices(ir.data.data);
      setCustomers(cr.data.data);
      setTrips(tr.data.data);
    } catch (e) {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    if (modal.mode === 'edit') {
      await invoiceAPI.update(modal.data.id, form);
      toast.success('Invoice updated');
    } else {
      await invoiceAPI.create(form);
      toast.success('Invoice created');
    }
    setModal(null);
    load();
  };

  const handleDownload = (inv) => {
    downloadDocxFile(
      `/api/invoices/${inv.id}/download`,
      `Invoice_${(inv.invoice_number || '').replace(/\//g, '_')}.docx`
    );
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
                <tr>
                  <th>Invoice #</th><th>Date</th><th>Customer</th><th>Period</th>
                  <th>Base</th><th>CGST</th><th>SGST</th><th>Total</th>
                  <th>Due</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={11}>
                    <div className="empty-state"><div className="empty-icon">🧾</div><div>No invoices yet</div></div>
                  </td></tr>
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
                        <button className="btn btn-success btn-sm" onClick={() => handleDownload(inv)}>📄 DOCX</button>
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
        <Modal
          title={modal.mode === 'edit' ? `Edit ${modal.data.invoice_number}` : 'New Invoice'}
          onClose={() => setModal(null)}
          size="modal-xl"
        >
          <InvoiceForm
            initial={modal.mode === 'edit' ? modal.data : null}
            customers={customers}
            trips={trips}
            onSave={save}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.mode === 'pay' && (
        <PaymentModal
          invoice={modal.data}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
};

export default Billing;
