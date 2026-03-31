import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { section: 'Overview', items: [
    { path: '/',            icon: '📊', label: 'Dashboard' },
  ]},
  { section: 'Fleet', items: [
    { path: '/vehicles',    icon: '🚛', label: 'Vehicles' },
    { path: '/drivers',     icon: '👨‍✈️', label: 'Drivers' },
    { path: '/trips',       icon: '🗺️',  label: 'Trip Logs' },
    { path: '/maintenance', icon: '🔧', label: 'Maintenance' },
  ]},
  { section: 'Business', items: [
    { path: '/customers',   icon: '🏢', label: 'Customers' },
    { path: '/billing',     icon: '🧾', label: 'Billing' },
    { path: '/payments',    icon: '💳', label: 'Payments' },
  ]},
];

const Sidebar = ({ alerts = {} }) => {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-wrap">
          <div className="logo-icon">🚚</div>
          <div>
            <div className="logo-name">FleetPro</div>
            <div className="logo-sub">Transport ERP</div>
          </div>
        </div>
      </div>

      <div className="sidebar-nav">
        {NAV.map(group => (
          <div key={group.section}>
            <div className="nav-group-label">{group.section}</div>
            {group.items.map(item => {
              const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              const badge  = alerts[item.path];
              return (
                <div
                  key={item.path}
                  className={`nav-item${active ? ' active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {badge > 0 && (
                    <span className={`nav-badge${item.path === '/vehicles' ? ' amber' : ''}`}>{badge}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="nav-group-label">Admin</div>
            <div className={`nav-item${pathname === '/users' ? ' active' : ''}`} onClick={() => navigate('/users')}>
              <span className="nav-icon">👤</span>
              <span>Users</span>
            </div>
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="avatar">{user?.fullName?.[0] || 'U'}</div>
        <div className="avatar-info">
          <div className="avatar-name">{user?.fullName}</div>
          <div className="avatar-role">{user?.role}</div>
        </div>
        <button className="btn-ghost btn btn-sm" onClick={logout} title="Logout">⎋</button>
      </div>
    </div>
  );
};

export default Sidebar;
