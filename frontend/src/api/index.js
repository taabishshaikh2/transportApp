import api from './axios';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data)     => api.post('/auth/login', data),
  me:             ()         => api.get('/auth/me'),
  changePassword: (data)     => api.put('/auth/change-password', data),
  listUsers:      ()         => api.get('/auth/users'),
  createUser:     (data)     => api.post('/auth/users', data),
  updateUser:     (id, data) => api.put(`/auth/users/${id}`, data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  stats: () => api.get('/dashboard'),
};

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const vehicleAPI = {
  list:     (params) => api.get('/vehicles', { params }),
  getOne:   (id)     => api.get(`/vehicles/${id}`),
  create:   (data)   => api.post('/vehicles', data),
  update:   (id, d)  => api.put(`/vehicles/${id}`, d),
  remove:   (id)     => api.delete(`/vehicles/${id}`),
  expiring: (days)   => api.get('/vehicles/expiring', { params: { days } }),
};

// ─── Drivers ──────────────────────────────────────────────────────────────────
export const driverAPI = {
  list:   (params) => api.get('/drivers', { params }),
  getOne: (id)     => api.get(`/drivers/${id}`),
  create: (data)   => api.post('/drivers', data),
  update: (id, d)  => api.put(`/drivers/${id}`, d),
  remove: (id)     => api.delete(`/drivers/${id}`),
};

// ─── Customers ────────────────────────────────────────────────────────────────
export const customerAPI = {
  list:   (params) => api.get('/customers', { params }),
  getOne: (id)     => api.get(`/customers/${id}`),
  create: (data)   => api.post('/customers', data),
  update: (id, d)  => api.put(`/customers/${id}`, d),
  remove: (id)     => api.delete(`/customers/${id}`),
};

// ─── Trips ────────────────────────────────────────────────────────────────────
export const tripAPI = {
  list:           (params) => api.get('/trips', { params }),
  getOne:         (id)     => api.get(`/trips/${id}`),
  create:         (data)   => api.post('/trips', data),
  update:         (id, d)  => api.put(`/trips/${id}`, d),
  replaceEntries: (id, d)  => api.put(`/trips/${id}/entries`, d),
  remove:         (id)     => api.delete(`/trips/${id}`),
  exportUrl:      (id)     => `/api/trips/${id}/export`,
};

// ─── Maintenance ──────────────────────────────────────────────────────────────
export const maintenanceAPI = {
  list:   (params) => api.get('/maintenance', { params }),
  getOne: (id)     => api.get(`/maintenance/${id}`),
  create: (data)   => api.post('/maintenance', data),
  update: (id, d)  => api.put(`/maintenance/${id}`, d),
  remove: (id)     => api.delete(`/maintenance/${id}`),
  stats:  ()       => api.get('/maintenance/stats'),
};

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoiceAPI = {
  list:         (params) => api.get('/invoices', { params }),
  getOne:       (id)     => api.get(`/invoices/${id}`),
  create:       (data)   => api.post('/invoices', data),
  update:       (id, d)  => api.put(`/invoices/${id}`, d),
  recordPayment:(id, d)  => api.post(`/invoices/${id}/pay`, d),
  summary:      ()       => api.get('/invoices/summary'),
  downloadUrl:  (id)     => `/api/invoices/${id}/download`,
};
