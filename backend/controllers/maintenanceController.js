const db = require('../config/db');

const list = async (req, res, next) => {
  try {
    let q = db.from('maintenance').select(`*, vehicles(id,reg_number,make,model,type)`);
    if (req.query.status)    q = q.eq('status', req.query.status);
    if (req.query.vehicleId) q = q.eq('vehicle_id', req.query.vehicleId);
    const { data, error } = await q.order('service_date', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { data, error } = await db.from('maintenance').select(`*, vehicles(id,reg_number,make,model)`).eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { vehicleId, serviceType, serviceDate, cost, mechanicName, workshop, odometer, status, nextDueDate, nextDueKm, notes } = req.body;
    const { data, error } = await db.from('maintenance').insert({
      vehicle_id: vehicleId, service_type: serviceType, service_date: serviceDate,
      cost: cost || 0, mechanic_name: mechanicName || null, workshop: workshop || null,
      odometer: odometer || null, status: status || 'Scheduled',
      next_due_date: nextDueDate || null, next_due_km: nextDueKm || null,
      notes: notes || null, created_by: req.user.id,
    }).select().single();
    if (error) throw error;
    if (status === 'In Progress') await db.from('vehicles').update({ status: 'Maintenance' }).eq('id', vehicleId);
    res.status(201).json({ success: true, message: 'Maintenance logged', data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { vehicleId, serviceType, serviceDate, cost, mechanicName, workshop, odometer, status, nextDueDate, nextDueKm, notes } = req.body;
    const { data, error } = await db.from('maintenance').update({
      vehicle_id: vehicleId, service_type: serviceType, service_date: serviceDate,
      cost: cost || 0, mechanic_name: mechanicName || null, workshop: workshop || null,
      odometer: odometer || null, status,
      next_due_date: nextDueDate || null, next_due_km: nextDueKm || null, notes: notes || null,
    }).eq('id', req.params.id).select().single();
    if (error) throw error;
    if (status === 'Completed')   await db.from('vehicles').update({ status: 'Active' }).eq('id', vehicleId);
    if (status === 'In Progress') await db.from('vehicles').update({ status: 'Maintenance' }).eq('id', vehicleId);
    res.json({ success: true, message: 'Updated', data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { error } = await db.from('maintenance').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

const stats = async (req, res, next) => {
  try {
    const { data, error } = await db.from('maintenance')
      .select(`cost, vehicle_id, vehicles(reg_number,make,model)`);
    if (error) throw error;
    // Group by vehicle in JS
    const grouped = {};
    data.forEach(r => {
      const key = r.vehicle_id;
      if (!grouped[key]) grouped[key] = { regNumber: r.vehicles?.reg_number, make: r.vehicles?.make, model: r.vehicles?.model, totalCost: 0, count: 0 };
      grouped[key].totalCost += +r.cost || 0;
      grouped[key].count++;
    });
    const result = Object.entries(grouped).map(([id, v]) => ({ vehicle_id: id, ...v }))
      .sort((a, b) => b.totalCost - a.totalCost);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, remove, stats };
