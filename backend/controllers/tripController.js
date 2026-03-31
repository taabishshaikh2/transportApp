const db = require('../config/db');
const { generateTripReportDocx } = require('../services/tripReportGenerator');

const TRIP_SELECT = `
  id, trip_id, vendor_name, vehicle_type, period_from, period_to, location,
  trip_amount, rate_per_trip, extra_olt_hrs, extra_olt_amount, acc_monthly_pass,
  transport_total, total_amount, status, notes, created_at,
  customers(id, company_name, phone, gstin),
  vehicles(id, reg_number, type, make, model),
  drivers(id, full_name, phone)
`;

const list = async (req, res, next) => {
  try {
    let q = db.from('trips').select(TRIP_SELECT);
    if (req.query.status)     q = q.eq('status', req.query.status);
    if (req.query.customerId) q = q.eq('customer_id', req.query.customerId);
    if (req.query.vehicleId)  q = q.eq('vehicle_id',  req.query.vehicleId);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { data: trip, error } = await db.from('trips').select(`${TRIP_SELECT}, trip_entries(*)`).eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Trip not found' });
    // Sort entries by sr_no
    if (trip.trip_entries) trip.trip_entries.sort((a,b) => (a.sr_no||0) - (b.sr_no||0));
    res.json({ success: true, data: trip });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { vendorName, vehicleType, periodFrom, periodTo, location, customerId, vehicleId, driverId,
            tripAmount, ratePerTrip, extraOltHrs, extraOltAmount, accMonthlyPass,
            transportTotal, totalAmount, status, notes, entries } = req.body;

    const { data: trip, error } = await db.from('trips').insert({
      vendor_name: vendorName || 'Lucky Transport Services',
      vehicle_type: vehicleType, period_from: periodFrom || null, period_to: periodTo || null,
      location: location || null, customer_id: customerId, vehicle_id: vehicleId || null,
      driver_id: driverId || null, trip_amount: tripAmount || 0, rate_per_trip: ratePerTrip || 0,
      extra_olt_hrs: extraOltHrs || 0, extra_olt_amount: extraOltAmount || 0,
      acc_monthly_pass: accMonthlyPass || 0, transport_total: transportTotal || 0,
      total_amount: totalAmount || 0, status: status || 'Draft',
      notes: notes || null, created_by: req.user.id,
    }).select().single();
    if (error) throw error;

    // Insert entries if provided
    if (entries?.length) {
      const rows = entries.map((e, i) => ({
        trip_id: trip.id, sr_no: e.srNo || i+1,
        entry_date: e.date || null, vehicle_no: e.vehicleNo || null,
        cha_name: e.chaName || null, vehicle_type: e.vehicleType || null,
        opening_time: e.openingTime || null, mrb_arrival_time: e.mrbArrivalTime || null,
        closing_time: e.closingTime || null, per_trip_hrs: e.perTripHrs || 0,
        total_hrs: e.totalHrs || 0, gt_in_hrs: e.gtInHrs || 0, gt_amount: e.gtAmount || 0,
      }));
      await db.from('trip_entries').insert(rows);
    }

    // Mark vehicle/driver on trip
    if (vehicleId) await db.from('vehicles').update({ status: 'On Trip' }).eq('id', vehicleId);
    if (driverId)  await db.from('drivers').update({ status: 'On Trip' }).eq('id', driverId);

    res.status(201).json({ success: true, message: 'Trip created', data: trip });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { data: existing } = await db.from('trips').select('vehicle_id,driver_id').eq('id', req.params.id).single();
    const { vendorName, vehicleType, periodFrom, periodTo, location, customerId, vehicleId, driverId,
            tripAmount, ratePerTrip, extraOltHrs, extraOltAmount, accMonthlyPass,
            transportTotal, totalAmount, status, notes } = req.body;

    const { data, error } = await db.from('trips').update({
      vendor_name: vendorName, vehicle_type: vehicleType,
      period_from: periodFrom || null, period_to: periodTo || null,
      location: location || null, customer_id: customerId,
      vehicle_id: vehicleId || null, driver_id: driverId || null,
      trip_amount: tripAmount || 0, rate_per_trip: ratePerTrip || 0,
      extra_olt_hrs: extraOltHrs || 0, extra_olt_amount: extraOltAmount || 0,
      acc_monthly_pass: accMonthlyPass || 0, transport_total: transportTotal || 0,
      total_amount: totalAmount || 0, status, notes: notes || null,
    }).eq('id', req.params.id).select().single();
    if (error) throw error;

    if (['Approved','Invoiced'].includes(status) && existing) {
      if (existing.vehicle_id) await db.from('vehicles').update({ status: 'Active' }).eq('id', existing.vehicle_id);
      if (existing.driver_id)  await db.from('drivers').update({ status: 'Active' }).eq('id', existing.driver_id);
    }
    res.json({ success: true, message: 'Trip updated', data });
  } catch (err) { next(err); }
};

const replaceEntries = async (req, res, next) => {
  try {
    const { entries } = req.body;
    // Delete old entries
    await db.from('trip_entries').delete().eq('trip_id', req.params.id);
    // Insert new
    if (entries?.length) {
      const rows = entries.map((e, i) => ({
        trip_id: req.params.id, sr_no: e.srNo || i+1,
        entry_date: e.date || null, vehicle_no: e.vehicleNo || null,
        cha_name: e.chaName || null, vehicle_type: e.vehicleType || null,
        opening_time: e.openingTime || null, mrb_arrival_time: e.mrbArrivalTime || null,
        closing_time: e.closingTime || null, per_trip_hrs: e.perTripHrs || 0,
        total_hrs: e.totalHrs || 0, gt_in_hrs: e.gtInHrs || 0, gt_amount: e.gtAmount || 0,
      }));
      await db.from('trip_entries').insert(rows);
    }
    // Recalculate totals
    const totalAmt = entries.reduce((s, e) => s + (+e.gtAmount || 0), 0);
    const { data: trip } = await db.from('trips').select('extra_olt_amount,acc_monthly_pass').eq('id', req.params.id).single();
    await db.from('trips').update({
      transport_total: totalAmt,
      total_amount: totalAmt + (+trip?.extra_olt_amount||0) + (+trip?.acc_monthly_pass||0),
    }).eq('id', req.params.id);
    res.json({ success: true, message: 'Entries updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { data: trip } = await db.from('trips').select('vehicle_id,driver_id').eq('id', req.params.id).single();
    await db.from('trips').delete().eq('id', req.params.id);
    if (trip?.vehicle_id) await db.from('vehicles').update({ status: 'Active' }).eq('id', trip.vehicle_id);
    if (trip?.driver_id)  await db.from('drivers').update({ status: 'Active' }).eq('id', trip.driver_id);
    res.json({ success: true, message: 'Trip deleted' });
  } catch (err) { next(err); }
};

const exportDocx = async (req, res, next) => {
  try {
    const { data: trip, error } = await db.from('trips')
      .select(`*, customers(company_name), vehicles(reg_number,type), trip_entries(*)`)
      .eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Trip not found' });
    if (trip.trip_entries) trip.trip_entries.sort((a,b)=>(a.sr_no||0)-(b.sr_no||0));
    // Map snake_case entries to camelCase for generator
    trip.entries = (trip.trip_entries || []).map(e => ({
      srNo: e.sr_no, date: e.entry_date, vehicleNo: e.vehicle_no, chaName: e.cha_name,
      vehicleType: e.vehicle_type, openingTime: e.opening_time, mrbArrivalTime: e.mrb_arrival_time,
      closingTime: e.closing_time, perTripHrs: e.per_trip_hrs, totalHrs: e.total_hrs,
      gtInHrs: e.gt_in_hrs, gtAmount: e.gt_amount,
    }));
    const buffer = await generateTripReportDocx(trip, trip.customers);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="TripReport_${trip.trip_id}.docx"`);
    res.send(buffer);
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, replaceEntries, remove, exportDocx };
