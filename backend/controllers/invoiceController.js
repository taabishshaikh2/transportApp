const db  = require('../config/db');
const { generateInvoiceDocx } = require('../services/invoiceGenerator');

const company = () => ({
  name:        process.env.COMPANY_NAME        || 'Lucky Transport Services',
  tagline:     process.env.COMPANY_TAGLINE     || 'Transport Contractors & Commission Agent',
  address:     process.env.COMPANY_ADDRESS     || '3, Dina Nasrat Chawl, Chimatpada, Marol Naka, A.K Road, Andheri (East) Mumbai-400059',
  email:       process.env.COMPANY_EMAIL       || 'Luckytransportservices@yahoo.in',
  phone:       process.env.COMPANY_PHONE       || '(022)28500577',
  mobile:      process.env.COMPANY_MOBILE      || '9821287755',
  gstin:       process.env.COMPANY_GSTIN       || '27BCWPS2519D1Z8',
  pan:         process.env.COMPANY_PAN         || 'BCWPS2519D',
  sac:         process.env.COMPANY_SAC         || '996601',
  bankName:    process.env.COMPANY_BANK_NAME   || 'Kotak Mahindra Bank',
  bankAccount: process.env.COMPANY_BANK_ACCOUNT|| '2511234714',
  bankIfsc:    process.env.COMPANY_BANK_IFSC   || 'KKBK0000681',
});

const INV_SELECT = `
  *, customers(id,company_name,gstin,dhl_gstin,city,state,address,contact_person,phone,email),
  vehicles(id,reg_number,make,model,type), trips(id,trip_id,vehicle_type)
`;

const list = async (req, res, next) => {
  try {
    let q = db.from('invoices').select(`id, invoice_number, invoice_date, due_date, period_from, period_to,
      base_amount, cgst_amount, sgst_amount, total_amount, status,
      customers(company_name, gstin), trips(trip_id)`);
    if (req.query.status)     q = q.eq('status', req.query.status);
    if (req.query.customerId) q = q.eq('customer_id', req.query.customerId);
    const { data, error } = await q.order('invoice_date', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { data, error } = await db.from('invoices').select(INV_SELECT).eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const { data: payments } = await db.from('payments').select('*').eq('invoice_id', req.params.id).order('payment_date', { ascending: false });
    res.json({ success: true, data, payments: payments || [] });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const base   = parseFloat(req.body.baseAmount)  || 0;
    const cgstR  = parseFloat(req.body.cgstRate)    || 9;
    const sgstR  = parseFloat(req.body.sgstRate)    || 9;
    const cgst   = parseFloat((base * cgstR / 100).toFixed(2));
    const sgst   = parseFloat((base * sgstR / 100).toFixed(2));
    const total  = parseFloat((base + cgst + sgst + (parseFloat(req.body.roundOff)||0)).toFixed(2));

    const { data, error } = await db.from('invoices').insert({
      customer_id:       req.body.customerId,
      trip_id:           req.body.tripId     || null,
      vehicle_id:        req.body.vehicleId  || null,
      invoice_date:      req.body.invoiceDate,
      due_date:          req.body.dueDate    || null,
      period_from:       req.body.periodFrom || null,
      period_to:         req.body.periodTo   || null,
      location:          req.body.location   || null,
      dhl_gstin:         req.body.dhlGstin   || null,
      sac_no:            req.body.sacNo      || '996601',
      state:             req.body.state      || 'Maharashtra',
      state_code:        req.body.stateCode  || '27',
      place_of_supply:   req.body.placeOfSupply || 'MUMBAI, MAHARASHTRA',
      vehicle_type_desc: req.body.vehicleTypeDesc || null,
      invoice_month:     req.body.invoiceMonth    || null,
      freight_desc:      req.body.freightDesc     || null,
      base_amount:       base,
      cgst_rate:         cgstR, sgst_rate: sgstR,
      cgst_amount:       cgst,  sgst_amount: sgst,
      round_off:         parseFloat(req.body.roundOff) || 0,
      total_amount:      total,
      notes:             req.body.notes    || null,
      created_by:        req.user.id,
    }).select().single();
    if (error) throw error;
    if (req.body.tripId) await db.from('trips').update({ status: 'Invoiced' }).eq('id', req.body.tripId);
    res.status(201).json({ success: true, message: 'Invoice created', data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const base  = parseFloat(req.body.baseAmount) || 0;
    const cgstR = parseFloat(req.body.cgstRate)   || 9;
    const sgstR = parseFloat(req.body.sgstRate)   || 9;
    const cgst  = parseFloat((base * cgstR / 100).toFixed(2));
    const sgst  = parseFloat((base * sgstR / 100).toFixed(2));
    const total = parseFloat((base + cgst + sgst + (parseFloat(req.body.roundOff)||0)).toFixed(2));

    const { data, error } = await db.from('invoices').update({
      invoice_date: req.body.invoiceDate, due_date: req.body.dueDate || null,
      period_from: req.body.periodFrom || null, period_to: req.body.periodTo || null,
      location: req.body.location || null, dhl_gstin: req.body.dhlGstin || null,
      state: req.body.state, state_code: req.body.stateCode,
      place_of_supply: req.body.placeOfSupply,
      vehicle_type_desc: req.body.vehicleTypeDesc, invoice_month: req.body.invoiceMonth,
      base_amount: base, cgst_rate: cgstR, sgst_rate: sgstR,
      cgst_amount: cgst, sgst_amount: sgst,
      round_off: parseFloat(req.body.roundOff)||0, total_amount: total,
      status: req.body.status, notes: req.body.notes || null,
    }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, message: 'Invoice updated', data });
  } catch (err) { next(err); }
};

const recordPayment = async (req, res, next) => {
  try {
    const { data: inv } = await db.from('invoices').select('total_amount').eq('id', req.params.id).single();
    await db.from('payments').insert({
      invoice_id:   req.params.id,
      payment_date: req.body.paymentDate,
      amount:       req.body.amount,
      payment_mode: req.body.paymentMode,
      reference_no: req.body.referenceNo || null,
      notes:        req.body.notes       || null,
      recorded_by:  req.user.id,
    });
    const { data: psum } = await db.from('payments').select('amount').eq('invoice_id', req.params.id);
    const paidTotal = (psum || []).reduce((s, p) => s + (+p.amount || 0), 0);
    if (paidTotal >= +inv.total_amount) {
      await db.from('invoices').update({ status: 'Paid', payment_date: req.body.paymentDate, payment_mode: req.body.paymentMode }).eq('id', req.params.id);
    }
    res.json({ success: true, message: 'Payment recorded' });
  } catch (err) { next(err); }
};

const summary = async (req, res, next) => {
  try {
    const { data, error } = await db.from('invoices').select('total_amount, status');
    if (error) throw error;
    const s = { totalBilled:0, collected:0, pending:0, overdue:0, overdueCount:0, totalInvoices: data.length };
    data.forEach(i => {
      s.totalBilled += +i.total_amount;
      if (i.status === 'Paid')    { s.collected  += +i.total_amount; }
      if (i.status === 'Pending') { s.pending    += +i.total_amount; }
      if (i.status === 'Overdue') { s.overdue    += +i.total_amount; s.overdueCount++; }
    });
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
};

const downloadDocx = async (req, res, next) => {
  try {
    const { data: invoice, error } = await db.from('invoices').select(INV_SELECT).eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const buffer   = await generateInvoiceDocx(invoice, invoice.customers, invoice.trips, company());
    const filename = `Invoice_${(invoice.invoice_number||'').replace(/\//g,'_')}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, recordPayment, summary, downloadDocx };
