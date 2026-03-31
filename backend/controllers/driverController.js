const db = require('../config/db');

const list = async (req, res, next) => {
  try {
    let query = db.from('drivers').select(`*, vehicles(id,reg_number,type,make,model)`);
    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.search) {
      const s = `%${req.query.search}%`;
      query = query.or(`full_name.ilike.${s},phone.ilike.${s},license_number.ilike.${s}`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { data, error } = await db.from('drivers').select(`*, vehicles(id,reg_number,type,make,model)`).eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { fullName, phone, licenseNumber, licenseExpiry, age, experienceYrs, address, status, vehicleId } = req.body;
    const { data, error } = await db.from('drivers').insert({
      full_name: fullName, phone, license_number: licenseNumber,
      license_expiry: licenseExpiry || null, age: age || null,
      experience_yrs: experienceYrs || null, address: address || null,
      status: status || 'Active', vehicle_id: vehicleId || null,
    }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, message: 'Driver added', data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { fullName, phone, licenseNumber, licenseExpiry, age, experienceYrs, address, status, vehicleId } = req.body;
    const { data, error } = await db.from('drivers').update({
      full_name: fullName, phone, license_number: licenseNumber,
      license_expiry: licenseExpiry || null, age: age || null,
      experience_yrs: experienceYrs || null, address: address || null,
      status, vehicle_id: vehicleId || null,
    }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, message: 'Driver updated', data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { error } = await db.from('drivers').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Driver deleted' });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, remove };
