require('dotenv').config();
const bcrypt = require('bcrypt');
const db     = require('./db');

const seed = async () => {
  console.log('🌱 Seeding Supabase...');
  const hash = async p => bcrypt.hash(p, 10);

  // Users
  await db.from('users').upsert([
    { username:'admin',   password_hash: await hash('admin123'),   full_name:'System Admin',  email:'admin@fleetpro.com',   role:'admin'   },
    { username:'manager', password_hash: await hash('manager123'), full_name:'Fleet Manager', email:'manager@fleetpro.com', role:'manager' },
    { username:'driver1', password_hash: await hash('driver123'),  full_name:'Ramesh Kumar',  email:'ramesh@fleetpro.com',  role:'driver'  },
  ], { onConflict: 'username' });

  // Vehicles
  await db.from('vehicles').upsert([
    { reg_number:'MH-01-AB-1234', type:'Truck',      make:'Tata',          model:'Prima 4028.S',  year:2021, capacity:'28T',  fuel_type:'Diesel', status:'Active',      insurance_expiry:'2025-12-31', fitness_expiry:'2025-06-30', permit_expiry:'2025-09-30' },
    { reg_number:'MH-04-CD-5678', type:'Trailer',    make:'Ashok Leyland', model:'Captain 3518',  year:2020, capacity:'35T',  fuel_type:'Diesel', status:'On Trip',     insurance_expiry:'2025-08-15', fitness_expiry:'2025-05-31', permit_expiry:'2025-07-20' },
    { reg_number:'GJ-01-EF-9012', type:'Mini Truck', make:'Mahindra',      model:'Bolero Pik-Up', year:2022, capacity:'1.5T', fuel_type:'Diesel', status:'Active',      insurance_expiry:'2026-02-28', fitness_expiry:'2026-01-15', permit_expiry:'2025-11-30' },
    { reg_number:'MH-12-GH-3456', type:'Tanker',     make:'VECV',          model:'Pro 6038',      year:2019, capacity:'22KL', fuel_type:'Diesel', status:'Maintenance', insurance_expiry:'2025-10-20', fitness_expiry:'2025-04-30', permit_expiry:'2025-08-15' },
  ], { onConflict: 'reg_number' });

  // Customers
  await db.from('customers').upsert([
    { company_name:'Reliance Industries Ltd',  contact_person:'Vikram Shah', phone:'9812345678', email:'logistics@ril.com',        city:'Mumbai', state:'Maharashtra', gstin:'27AAACR5055K1ZE', credit_days:30, opening_balance:125000 },
    { company_name:'TATA Chemicals',           contact_person:'Priya Nair',  phone:'9823456789', email:'supply@tatachemicals.com', city:'Pune',   state:'Maharashtra', gstin:'27AABCT1332L1ZF', credit_days:45, opening_balance:-18500 },
    { company_name:'Godrej Consumer Products', contact_person:'Amit Desai',  phone:'9834567890', email:'ops@godrej.com',           city:'Mumbai', state:'Maharashtra', gstin:'27AAACG0569P1ZI', credit_days:30, opening_balance:45000  },
    { company_name:'DHL Express',              contact_person:'Rahul Mehta', phone:'9898001234', email:'ops@dhl.in',               city:'Mumbai', state:'Maharashtra', gstin:'27AABCD1234E1ZA', credit_days:30, opening_balance:0      },
  ], { onConflict: 'company_name' });

  console.log('✅ Seed complete!');
  console.log('👤 admin / admin123  |  manager / manager123  |  driver1 / driver123');
  process.exit(0);
};

seed().catch(e => { console.error(e); process.exit(1); });
