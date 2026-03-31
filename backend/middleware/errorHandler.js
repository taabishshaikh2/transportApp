const errorHandler = (err, req, res, next) => {
  console.error('❌', err.message);
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `Duplicate value for ${field}` });
  }
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map(e => e.message).join(', ');
    return res.status(400).json({ success: false, message: msg });
  }
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
};

module.exports = errorHandler;
