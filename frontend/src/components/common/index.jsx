// ─── Shared small components ──────────────────────────────────────────────────

export const Spinner = ({ center }) =>
  center
    ? <div className="loading-center"><div className="spinner" /></div>
    : <div className="spinner" />;

export const Modal = ({ title, onClose, children, size = '' }) => (
  <div className="modal-overlay" onClick={e => e.target.className === 'modal-overlay' && onClose()}>
    <div className={`modal ${size}`}>
      <div className="modal-header">
        <div className="modal-title">{title}</div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

export const Badge = ({ status }) => {
  const map = {
    Active: 'badge-green', 'On Trip': 'badge-blue', Maintenance: 'badge-amber',
    Inactive: 'badge-gray', 'On Leave': 'badge-gray',
    Paid: 'badge-green', Pending: 'badge-amber', Overdue: 'badge-red',
    Cancelled: 'badge-gray', Draft: 'badge-gray',
    Completed: 'badge-green', Scheduled: 'badge-blue', 'In Progress': 'badge-orange',
    Submitted: 'badge-blue', Approved: 'badge-purple', Invoiced: 'badge-green',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
};

export const FormGroup = ({ label, children, full }) => (
  <div className={`form-group${full ? ' full' : ''}`}>
    <label className="form-label">{label}</label>
    {children}
  </div>
);

export const Input = ({ ...props }) => <input className="form-input" {...props} />;
export const Select = ({ children, ...props }) => <select className="form-select" {...props}>{children}</select>;
export const Textarea = ({ ...props }) => <textarea className="form-textarea" {...props} />;

export const PageHeader = ({ title, sub, children }) => (
  <div className="page-header">
    <div><div className="page-title">{title}</div>{sub && <div className="page-sub">{sub}</div>}</div>
    <div className="flex gap-2 items-center">{children}</div>
  </div>
);

export const SearchBar = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="search-bar flex-1">
    <span style={{ color: 'var(--text3)' }}>🔍</span>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

export const InfoRow = ({ label, value }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <span className="info-val">{value ?? '—'}</span>
  </div>
);

export const StatCard = ({ icon, value, label, sub, color = 'amber' }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-val">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

export const FilterTags = ({ options, value, onChange }) => (
  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
    {options.map(o => (
      <div key={o} className={`tag ${value === o ? 'active' : ''}`} onClick={() => onChange(o)}>{o}</div>
    ))}
  </div>
);

export const Alert = ({ type = 'warn', children }) => (
  <div className={`alert alert-${type}`}>{children}</div>
);

export const fmtCurrency = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const downloadFile = (url, filename) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
};
