const express  = require('express');
const router   = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

const authCtrl        = require('../controllers/authController');
const dashCtrl        = require('../controllers/dashboardController');
const vehicleCtrl     = require('../controllers/vehicleController');
const driverCtrl      = require('../controllers/driverController');
const customerCtrl    = require('../controllers/customerController');
const tripCtrl        = require('../controllers/tripController');
const maintenanceCtrl = require('../controllers/maintenanceController');
const invoiceCtrl     = require('../controllers/invoiceController');

const adm = authorize('admin');
const mgr = authorize('admin','manager');

// Auth
router.post('/auth/login',            authCtrl.login);
router.get ('/auth/me',               authenticate, authCtrl.me);
router.put ('/auth/change-password',  authenticate, authCtrl.changePassword);
router.get ('/auth/users',            authenticate, adm, authCtrl.listUsers);
router.post('/auth/users',            authenticate, adm, authCtrl.createUser);
router.put ('/auth/users/:id',        authenticate, adm, authCtrl.updateUser);

// Dashboard
router.get('/dashboard', authenticate, dashCtrl.stats);

// Vehicles
router.get   ('/vehicles/expiring',  authenticate, vehicleCtrl.expiring);
router.get   ('/vehicles',           authenticate, vehicleCtrl.list);
router.get   ('/vehicles/:id',       authenticate, vehicleCtrl.getOne);
router.post  ('/vehicles',           authenticate, mgr, vehicleCtrl.create);
router.put   ('/vehicles/:id',       authenticate, mgr, vehicleCtrl.update);
router.delete('/vehicles/:id',       authenticate, adm, vehicleCtrl.remove);

// Drivers
router.get   ('/drivers',      authenticate, driverCtrl.list);
router.get   ('/drivers/:id',  authenticate, driverCtrl.getOne);
router.post  ('/drivers',      authenticate, mgr, driverCtrl.create);
router.put   ('/drivers/:id',  authenticate, mgr, driverCtrl.update);
router.delete('/drivers/:id',  authenticate, adm, driverCtrl.remove);

// Customers
router.get   ('/customers',      authenticate, customerCtrl.list);
router.get   ('/customers/:id',  authenticate, customerCtrl.getOne);
router.post  ('/customers',      authenticate, mgr, customerCtrl.create);
router.put   ('/customers/:id',  authenticate, mgr, customerCtrl.update);
router.delete('/customers/:id',  authenticate, adm, customerCtrl.remove);

// Trips
router.get   ('/trips',                   authenticate, tripCtrl.list);
router.get   ('/trips/:id',               authenticate, tripCtrl.getOne);
router.get   ('/trips/:id/export',        authenticate, tripCtrl.exportDocx);
router.post  ('/trips',                   authenticate, mgr, tripCtrl.create);
router.put   ('/trips/:id',               authenticate, mgr, tripCtrl.update);
router.put   ('/trips/:id/entries',       authenticate, mgr, tripCtrl.replaceEntries);
router.delete('/trips/:id',               authenticate, adm, tripCtrl.remove);

// Maintenance
router.get   ('/maintenance/stats',  authenticate, maintenanceCtrl.stats);
router.get   ('/maintenance',        authenticate, maintenanceCtrl.list);
router.get   ('/maintenance/:id',    authenticate, maintenanceCtrl.getOne);
router.post  ('/maintenance',        authenticate, mgr, maintenanceCtrl.create);
router.put   ('/maintenance/:id',    authenticate, mgr, maintenanceCtrl.update);
router.delete('/maintenance/:id',    authenticate, adm, maintenanceCtrl.remove);

// Invoices
router.get   ('/invoices/summary',      authenticate, invoiceCtrl.summary);
router.get   ('/invoices',              authenticate, invoiceCtrl.list);
router.get   ('/invoices/:id',          authenticate, invoiceCtrl.getOne);
router.get   ('/invoices/:id/download', authenticate, invoiceCtrl.downloadDocx);
router.post  ('/invoices',              authenticate, mgr, invoiceCtrl.create);
router.put   ('/invoices/:id',          authenticate, mgr, invoiceCtrl.update);
router.post  ('/invoices/:id/pay',      authenticate, mgr, invoiceCtrl.recordPayment);

module.exports = router;
