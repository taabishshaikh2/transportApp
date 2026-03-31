const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password required' });

    const { data: users, error } = await db.from('users').select('*').eq('username', username).eq('is_active', true).limit(1);
    if (error || !users.length || !(await bcrypt.compare(password, users[0].password_hash)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user  = users[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, fullName: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    res.json({ success: true, token, user: { id: user.id, username: user.username, fullName: user.full_name, role: user.role, email: user.email } });
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const { data, error } = await db.from('users').select('id,username,full_name,email,role,created_at').eq('id', req.user.id).single();
    if (error) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: data });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { data: users } = await db.from('users').select('password_hash').eq('id', req.user.id).single();
    if (!(await bcrypt.compare(currentPassword, users.password_hash)))
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await db.from('users').update({ password_hash: hash }).eq('id', req.user.id);
    res.json({ success: true, message: 'Password updated' });
  } catch (err) { next(err); }
};

const listUsers = async (req, res, next) => {
  try {
    const { data, error } = await db.from('users').select('id,username,full_name,email,role,is_active,created_at').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const createUser = async (req, res, next) => {
  try {
    const { username, password, fullName, email, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await db.from('users').insert({ username, password_hash: passwordHash, full_name: fullName, email: email || null, role: role || 'driver' }).select('id').single();
    if (error) throw error;
    res.status(201).json({ success: true, message: 'User created', id: data.id });
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const { fullName, email, role, isActive } = req.body;
    const update = {};
    if (fullName !== undefined)  update.full_name  = fullName;
    if (email    !== undefined)  update.email      = email;
    if (role     !== undefined)  update.role       = role;
    if (isActive !== undefined)  update.is_active  = isActive;
    const { error } = await db.from('users').update(update).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'User updated' });
  } catch (err) { next(err); }
};

module.exports = { login, me, changePassword, listUsers, createUser, updateUser };
