const db = require('../config/db');

const list = async (req, res, next) => {
  try {
    let query = db.from('vehicles').select(`*, drivers(id, full_name, phone, driver_id)`);
    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.search) {
      const s = `%${req.query.search}%`;
      query = query.or(`reg_number.ilike.${s},make.ilike.${s},model.ilike.${s}`);
    }
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { data, error } = await db.from('vehicles').select(`*, drivers(id,full_name,phone,driver_id)`).eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { regNumber, type, make, model, year, capacity, fuelType, status, insuranceExpiry, fitnessExpiry, permitExpiry, notes } = req.body;
    const { data, error } = await db.from('vehicles').insert({
      reg_number: regNumber, type, make, model, year, capacity,
      fuel_type: fuelType || 'Diesel', status: status || 'Active',
      insurance_expiry: insuranceExpiry || null, fitness_expiry: fitnessExpiry || null,
      permit_expiry: permitExpiry || null, notes: notes || null,
    }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, message: 'Vehicle added', data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { regNumber, type, make, model, year, capacity, fuelType, status, insuranceExpiry, fitnessExpiry, permitExpiry, notes } = req.body;
    const { data, error } = await db.from('vehicles').update({
      reg_number: regNumber, type, make, model, year, capacity,
      fuel_type: fuelType, status,
      insurance_expiry: insuranceExpiry || null, fitness_expiry: fitnessExpiry || null,
      permit_expiry: permitExpiry || null, notes: notes || null,
    }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, message: 'Vehicle updated', data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { error } = await db.from('vehicles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (err) { next(err); }
};

const expiring = async (req, res, next) => {
  try {
    const days   = parseInt(req.query.days) || 45;
    const today  = new Date().toISOString().slice(0, 10);
    const cutoff = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    const { data, error } = await db.from('vehicles').select('*')
      .or(`insurance_expiry.gte.${today},fitness_expiry.gte.${today},permit_expiry.gte.${today}`)
      .or(`insurance_expiry.lte.${cutoff},fitness_expiry.lte.${cutoff},permit_expiry.lte.${cutoff}`);
    if (error) throw error;
    // Filter in JS to get proper AND logic per field
    const result = data.filter(v =>
      (v.insurance_expiry >= today && v.insurance_expiry <= cutoff) ||
      (v.fitness_expiry   >= today && v.fitness_expiry   <= cutoff) ||
      (v.permit_expiry    >= today && v.permit_expiry    <= cutoff)
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, remove, expiring };
