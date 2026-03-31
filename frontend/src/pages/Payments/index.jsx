import { useEffect, useState } from 'react';
import { invoiceAPI } from '../../api';
import { Badge, PageHeader, StatCard, fmtDate, fmtCurrency } from '../../components/common';
import { Spinner } from '../../components/common';
import toast from 'react-hot-toast';

const Payments = () => {
  const [invoices, setInvoices] = useState([]);
  const [summary,  setSummary]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const [ir, sr] = await Promise.all([invoiceAPI.list(), invoiceAPI.summary()]);
      setInvoices(ir.data.data); setSummary(sr.data.data || {});
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markPaid = async (inv) => {
    const today = new Date().toISOString().slice(0,10);
    try {
      await invoiceAPI.recordPayment(inv._id, { paymentDate: today, amount: inv.totalAmount, paymentMode: 'Bank Transfer' });
      toast.success('Marked as paid'); load();
    } catch(e) { toast.error('Failed'); }
  };

  const filtered = invoices.filter(i => filter === 'All' || i.status === filter);

  const daysOverdue = (d) => {
    const diff = Math.round((Date.now() - new Date(d)) / 86400000);
    return diff > 0 ? diff : 0;
  };

  return (
    <div>
      <PageHeader title="Payment Tracking" sub="Receivables & outstanding dues" />

      <div className="stats-grid">
        <StatCard icon="✅" value={fmtCurrency(summary.collected||0)} label={`Collected (${invoices.filter(i=>i.status==='Paid').length} invoices)`} color="green" />
        <StatCard icon="⏳" value={fmtCurrency(summary.pending||0)}   label={`Pending (${invoices.filter(i=>i.status==='Pending').length} invoices)`} color="amber" />
        <StatCard icon="🔴" value={fmtCurrency(summary.overdue||0)}   label={`Overdue (${summary.overdueCount||0} invoices)`} color="red" />
        <StatCard icon="📊" value={fmtCurrency(summary.totalBilled||0)} label="Total Billed" color="blue" />
      </div>

      <div className="flex gap-3 mb-4" style={{ flexWrap:'wrap' }}>
        {['All','Pending','Overdue','Paid'].map(s => (
          <div key={s} className={`tag ${filter===s?'active':''}`} onClick={()=>setFilter(s)}>
            {s} ({s==='All' ? invoices.length : invoices.filter(i=>i.status===s).length})
          </div>
        ))}
      </div>

      <div className="card" style={{ padding:0 }}>
        {loading ? <Spinner center /> : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Invoice #</th><th>Customer</th><th>Amount</th><th>Invoice Date</th><th>Due Date</th><th>Days</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">💳</div><div>No records</div></div></td></tr>
                ) : filtered.map(inv => {
                  const overdue = daysOverdue(inv.dueDate);
                  return (
                    <tr key={inv._id}>
                      <td style={{ fontWeight:600, color:'var(--accent)' }}>{inv.invoiceNumber}</td>
                      <td>{inv.customerId?.companyName || '—'}</td>
                      <td style={{ fontWeight:700 }}>{fmtCurrency(inv.totalAmount)}</td>
                      <td style={{ fontSize:12 }}>{fmtDate(inv.invoiceDate)}</td>
                      <td style={{ fontSize:12 }}>{fmtDate(inv.dueDate)}</td>
                      <td>
                        {inv.status === 'Paid' ? (
                          <span style={{ color:'var(--green)', fontSize:12 }}>Paid</span>
                        ) : overdue > 0 ? (
                          <span style={{ color:'var(--red)', fontWeight:600, fontSize:12 }}>{overdue}d overdue</span>
                        ) : (
                          <span style={{ color:'var(--text3)', fontSize:12 }}>
                            {Math.round((new Date(inv.dueDate)-Date.now())/86400000)}d left
                          </span>
                        )}
                      </td>
                      <td><Badge status={inv.status} /></td>
                      <td>
                        {inv.status !== 'Paid' && (
                          <button className="btn btn-primary btn-sm" onClick={() => markPaid(inv)}>✓ Mark Paid</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
