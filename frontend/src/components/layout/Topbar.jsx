const PAGE_META = {
  '/':            { title: 'Dashboard',        sub: 'Fleet overview & analytics' },
  '/vehicles':    { title: 'Vehicle Fleet',    sub: 'Manage your vehicles' },
  '/drivers':     { title: 'Drivers',          sub: 'Driver registry & documents' },
  '/trips':       { title: 'Trip Logs',        sub: 'Track and export trip sheets' },
  '/maintenance': { title: 'Maintenance',      sub: 'Service & repair records' },
  '/customers':   { title: 'Customers',        sub: 'Client management' },
  '/billing':     { title: 'Billing',          sub: 'Invoices & GST billing' },
  '/payments':    { title: 'Payments',         sub: 'Receivables & payment tracking' },
  '/users':       { title: 'User Management',  sub: 'Roles & access control' },
};

const Topbar = ({ pathname }) => {
  const meta = PAGE_META[pathname] || PAGE_META[Object.keys(PAGE_META).find(k => k !== '/' && pathname.startsWith(k))] || {};
  const now  = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">{meta.title}</div>
        {meta.sub && <div className="topbar-sub">{meta.sub}</div>}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{now}</div>
    </div>
  );
};

export default Topbar;
