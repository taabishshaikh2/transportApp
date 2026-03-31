import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Topbar  from './components/layout/Topbar';
import { Spinner } from './components/common';

import Login      from './pages/Auth/Login';
import Users      from './pages/Auth/Users';
import Dashboard  from './pages/Dashboard';
import Vehicles   from './pages/Vehicles';
import Drivers    from './pages/Drivers';
import Customers  from './pages/Customers';
import Trips      from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Billing    from './pages/Billing';
import Payments   from './pages/Payments';

import './styles/global.css';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}><Spinner /></div>;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar pathname={location.pathname} />
        <div className="page-content">
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/vehicles"    element={<Vehicles />} />
            <Route path="/drivers"     element={<Drivers />} />
            <Route path="/customers"   element={<Customers />} />
            <Route path="/trips"       element={<Trips />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/billing"     element={<Billing />} />
            <Route path="/payments"    element={<Payments />} />
            <Route path="/users"       element={<Users />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background:'var(--surface)', color:'var(--text)', border:'1px solid var(--border2)' },
          success: { iconTheme: { primary:'var(--green)', secondary:'#000' } },
          error:   { iconTheme: { primary:'var(--red)',   secondary:'#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*"     element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
