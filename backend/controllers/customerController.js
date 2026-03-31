const db = require('../config/db');

const list = async (req, res, next) => {
  try {
    let query = db.from('customers').select(`*, invoices(total_amount, status)`);
    if (req.query.search) {
      const s = `%${req.query.search}%`;
      query = query.or(`company_name.ilike.${s},contact_person.ilike.${s},phone.ilike.${s}`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    // Aggregate invoice totals
    const result = data.map(c => {
      const invs = c.invoices || [];
      return {
        ...c,
        invoices: undefined,
        total_billed:  invs.reduce((s, i) => s + (+i.total_amount || 0), 0),
        total_paid:    invs.filter(i => i.status === 'Paid').reduce((s, i) => s + (+i.total_amount || 0), 0),
        outstanding:   invs.filter(i => ['Pending','Overdue'].includes(i.status)).reduce((s, i) => s + (+i.total_amount || 0), 0),
      };
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { data, error } = await db.from('customers').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Customer not found' });
    const { data: invoices } = await db.from('invoices').select('*').eq('customer_id', req.params.id).order('invoice_date', { ascending: false }).limit(10);
    res.json({ success: true, data, recentInvoices: invoices || [] });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { companyName, contactPerson, phone, email, city, state, address, gstin, dhlGstin, creditDays, openingBalance } = req.body;
    const { data, error } = await db.from('customers').insert({
      company_name: companyName, contact_person: contactPerson || null, phone: phone || null,
      email: email || null, city: city || null, state: state || null, address: address || null,
      gstin: gstin || null, dhl_gstin: dhlGstin || null,
      credit_days: creditDays || 30, opening_balance: openingBalance || 0,
    }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, message: 'Customer added', data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { companyName, contactPerson, phone, email, city, state, address, gstin, dhlGstin, creditDays, openingBalance } = req.body;
    const { data, error } = await db.from('customers').update({
      company_name: companyName, contact_person: contactPerson || null, phone: phone || null,
      email: email || null, city: city || null, state: state || null, address: address || null,
      gstin: gstin || null, dhl_gstin: dhlGstin || null,
      credit_days: creditDays || 30, opening_balance: openingBalance || 0,
    }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, message: 'Customer updated', data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { error } = await db.from('customers').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, remove };
