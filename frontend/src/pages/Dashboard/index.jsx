import { useEffect, useState } from 'react';
import { dashboardAPI } from '../../api';
import { StatCard, fmtCurrency, fmtDate, Badge, Alert } from '../../components/common';
import { Spinner } from '../../components/common';

const Dashboard = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.stats()
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner center />;
  if (!data)   return <div className="empty-state"><div className="empty-icon">⚠️</div><div>Failed to load</div></div>;

  const { vehicles, drivers, invoices, maintenanceCost, recentTrips, expiringDocs, overdueInvoices, monthlyRevenue } = data;

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="🚛" value={vehicles.total} label="Total Vehicles"  sub={`${vehicles.active} active · ${vehicles.onTrip} on trip`} color="amber" />
        <StatCard icon="👨‍✈️" value={drivers.total}  label="Drivers"        sub={`${drivers.active} active · ${drivers.onTrip} on trip`}  color="blue" />
        <StatCard icon="💰" value={fmtCurrency(invoices.collected)} label="Revenue Collected" sub={`${fmtCurrency(invoices.pending)} pending`} color="green" />
        <StatCard icon="⚠️" value={fmtCurrency(invoices.overdue)}  label="Overdue Amount"    sub={`${invoices.overdueCount} invoice(s) overdue`} color="red" />
      </div>

      {/* Alerts */}
      {(expiringDocs.length > 0 || overdueInvoices.length > 0) && (
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {expiringDocs.slice(0,3).map(v => (
            <Alert key={v._id} type="warn">
              <span>⚠️</span>
              <div>
                <strong>{v.regNumber}</strong> — Document expiring soon:
                {v.insuranceExpiry && <span> Insurance: {fmtDate(v.insuranceExpiry)}</span>}
                {v.fitnessExpiry   && <span> · Fitness: {fmtDate(v.fitnessExpiry)}</span>}
                {v.permitExpiry    && <span> · Permit: {fmtDate(v.permitExpiry)}</span>}
              </div>
            </Alert>
          ))}
          {overdueInvoices.slice(0,2).map(inv => (
            <Alert key={inv._id} type="danger">
              <span>🔴</span>
              <div><strong>{inv.invoiceNumber}</strong> — {inv.customerId?.companyName} — {fmtCurrency(inv.totalAmount)} overdue since {fmtDate(inv.dueDate)}</div>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Recent Trips */}
        <div className="card">
          <div style={{ fontFamily: 'var(--fhead)', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Recent Trips</div>
          {recentTrips.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}><div>No trips yet</div></div>
          ) : recentTrips.map(t => (
            <div key={t._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{t.tripId}</span>
                <Badge status={t.status} />
              </div>
              <div style={{ color: 'var(--text2)', fontSize: 12 }}>
                {t.customerId?.companyName} · {t.vehicleId?.regNumber}
              </div>
              <div style={{ color: 'var(--text3)', fontSize: 11 }}>
                {fmtDate(t.periodFrom)} → {fmtDate(t.periodTo)}
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Revenue */}
        <div className="card">
          <div style={{ fontFamily: 'var(--fhead)', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Monthly Revenue (6m)</div>
          {monthlyRevenue.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}><div>No data</div></div>
          ) : monthlyRevenue.map(m => {
            const pct = m.billed > 0 ? Math.round((m.collected / m.billed) * 100) : 0;
            return (
              <div key={m._id} style={{ marginBottom: 14 }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{m._id}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{fmtCurrency(m.collected)} <span style={{ color: 'var(--text3)' }}>/ {fmtCurrency(m.billed)}</span></span>
                </div>
                <div style={{ height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
          <div className="divider" />
          <div className="info-row"><span className="info-label">Total Maintenance Cost</span><span className="info-val" style={{ color: 'var(--red)' }}>{fmtCurrency(maintenanceCost)}</span></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
