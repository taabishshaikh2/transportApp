const db = require('../config/db');

const stats = async (req, res, next) => {
  try {
    const today  = new Date().toISOString().slice(0, 10);
    const in45   = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10);
    const ago6m  = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);

    const [vRes, dRes, cRes, invRes, maintRes, tripsRes, expiringRes, overdueRes, monthlyRes] = await Promise.all([
      db.from('vehicles').select('status'),
      db.from('drivers').select('status'),
      db.from('customers').select('id', { count: 'exact', head: true }),
      db.from('invoices').select('total_amount, status'),
      db.from('maintenance').select('cost').eq('status', 'Completed'),
      db.from('trips').select(`id, trip_id, period_from, period_to, status, customers(company_name), vehicles(reg_number), drivers(full_name)`).order('created_at', { ascending: false }).limit(5),
      db.from('vehicles').select('id, reg_number, make, model, insurance_expiry, fitness_expiry, permit_expiry')
        .or(`insurance_expiry.gte.${today},fitness_expiry.gte.${today},permit_expiry.gte.${today}`),
      db.from('invoices').select(`invoice_number, total_amount, due_date, status, customers(company_name)`)
        .in('status', ['Pending','Overdue']).lt('due_date', today).order('due_date').limit(5),
      db.from('invoices').select('invoice_date, total_amount, status').gte('invoice_date', ago6m),
    ]);

    // Vehicles stats
    const vData = vRes.data || [];
    const vehicles = { total: vData.length, active: 0, onTrip: 0, maintenance: 0, inactive: 0 };
    vData.forEach(v => {
      if (v.status === 'Active')      vehicles.active++;
      if (v.status === 'On Trip')     vehicles.onTrip++;
      if (v.status === 'Maintenance') vehicles.maintenance++;
      if (v.status === 'Inactive')    vehicles.inactive++;
    });

    // Drivers stats
    const dData = dRes.data || [];
    const drivers = { total: dData.length, active: 0, onTrip: 0 };
    dData.forEach(d => { if (d.status==='Active') drivers.active++; if (d.status==='On Trip') drivers.onTrip++; });

    // Invoice stats
    const iData = invRes.data || [];
    const invoices = { totalBilled:0, collected:0, pending:0, overdue:0, overdueCount:0 };
    iData.forEach(i => {
      invoices.totalBilled += +i.total_amount;
      if (i.status==='Paid')    invoices.collected  += +i.total_amount;
      if (i.status==='Pending') invoices.pending    += +i.total_amount;
      if (i.status==='Overdue') { invoices.overdue  += +i.total_amount; invoices.overdueCount++; }
    });

    // Monthly revenue
    const mMap = {};
    (monthlyRes.data || []).forEach(i => {
      const m = i.invoice_date?.slice(0,7);
      if (!m) return;
      if (!mMap[m]) mMap[m] = { _id: m, billed:0, collected:0 };
      mMap[m].billed    += +i.total_amount;
      if (i.status==='Paid') mMap[m].collected += +i.total_amount;
    });
    const monthlyRevenue = Object.values(mMap).sort((a,b)=>a._id.localeCompare(b._id));

    // Expiring docs (filter properly)
    const expiringDocs = (expiringRes.data||[]).filter(v =>
      (v.insurance_expiry >= today && v.insurance_expiry <= in45) ||
      (v.fitness_expiry   >= today && v.fitness_expiry   <= in45) ||
      (v.permit_expiry    >= today && v.permit_expiry    <= in45)
    );

    res.json({
      success: true,
      data: {
        vehicles,
        drivers,
        customers: { total: cRes.count || 0 },
        invoices,
        maintenanceCost: (maintRes.data||[]).reduce((s,m)=>s+(+m.cost||0),0),
        recentTrips:     tripsRes.data    || [],
        expiringDocs,
        overdueInvoices: overdueRes.data  || [],
        monthlyRevenue,
      }
    });
  } catch (err) { next(err); }
};

module.exports = { stats };
