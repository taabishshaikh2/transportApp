import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { customerAPI } from '../../api';
import { Modal, PageHeader, SearchBar, FormGroup, Input, Select, fmtCurrency } from '../../components/common';
import { Spinner } from '../../components/common';

const EMPTY = { companyName:'', contactPerson:'', phone:'', email:'', city:'', state:'Maharashtra', address:'', gstin:'', dhlGstin:'', creditDays:30, openingBalance:0 };

const CustomerForm = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.companyName) return toast.error('Company name required');
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="form-grid">
        <FormGroup label="Company Name *" full><Input value={form.companyName} onChange={set('companyName')} /></FormGroup>
        <FormGroup label="Contact Person"><Input value={form.contactPerson} onChange={set('contactPerson')} /></FormGroup>
        <FormGroup label="Phone"><Input value={form.phone} onChange={set('phone')} /></FormGroup>
        <FormGroup label="Email"><Input type="email" value={form.email} onChange={set('email')} /></FormGroup>
        <FormGroup label="City"><Input value={form.city} onChange={set('city')} /></FormGroup>
        <FormGroup label="State"><Input value={form.state} onChange={set('state')} /></FormGroup>
        <FormGroup label="GSTIN"><Input value={form.gstin} onChange={set('gstin')} placeholder="27XXXXX0000X1ZX" /></FormGroup>
        <FormGroup label="DHL GSTIN (if applicable)"><Input value={form.dhlGstin} onChange={set('dhlGstin')} /></FormGroup>
        <FormGroup label="Credit Days"><Input type="number" value={form.creditDays} onChange={set('creditDays')} /></FormGroup>
        <FormGroup label="Opening Balance (₹)"><Input type="number" value={form.openingBalance} onChange={set('openingBalance')} /></FormGroup>
        <FormGroup label="Address" full><textarea className="form-textarea" value={form.address} onChange={set('address')} /></FormGroup>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : '💾 Save Customer'}</button>
      </div>
    </>
  );
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await customerAPI.list({ search: search || undefined }); setCustomers(r.data.data); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    if (modal.mode === 'edit') { await customerAPI.update(modal.data._id, form); toast.success('Updated'); }
    else { await customerAPI.create(form); toast.success('Customer added'); }
    setModal(null); load();
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.companyName}?`)) return;
    await customerAPI.remove(c._id); toast.success('Deleted'); load();
  };

  return (
    <div>
      <PageHeader title="Customers" sub={`${customers.length} accounts`}>
        <button className="btn btn-primary" onClick={() => setModal({ mode:'add' })}>＋ Add Customer</button>
      </PageHeader>

      <div className="flex gap-3 items-center mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search company, contact, phone…" />
      </div>

      <div className="card" style={{ padding:0 }}>
        {loading ? <Spinner center /> : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>ID</th><th>Company</th><th>Contact</th><th>Phone</th><th>City</th><th>GSTIN</th><th>Credit</th><th>Billed</th><th>Outstanding</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan={10}><div className="empty-state"><div className="empty-icon">🏢</div><div>No customers yet</div></div></td></tr>
                ) : customers.map(c => (
                  <tr key={c._id}>
                    <td><span className="badge badge-gray">{c.customerId}</span></td>
                    <td style={{ fontWeight:600 }}>{c.companyName}</td>
                    <td>{c.contactPerson || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.city || '—'}</td>
                    <td style={{ fontFamily:'monospace', fontSize:11 }}>{c.gstin || '—'}</td>
                    <td>{c.creditDays}d</td>
                    <td style={{ fontWeight:600 }}>{fmtCurrency(c.totalBilled || 0)}</td>
                    <td style={{ fontWeight:600, color: (c.outstanding||0) > 0 ? 'var(--red)' : 'var(--green)' }}>
                      {fmtCurrency(c.outstanding || 0)}
                    </td>
                    <td>
                      <div className="tbl-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal({ mode:'edit', data:c })}>✏️</button>
                        <button className="btn btn-danger btn-sm"    onClick={() => remove(c)}>🗑</button>
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
        <Modal title={modal.mode === 'edit' ? 'Edit Customer' : 'Add Customer'} onClose={() => setModal(null)} size="modal-lg">
          <CustomerForm initial={modal.data} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
};

export default Customers;
