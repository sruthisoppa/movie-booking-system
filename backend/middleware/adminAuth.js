// middleware/adminAuth.js
const adminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // For development - accept the dev token
    if (token === 'dev-admin-token') {
      req.user = { id: 0, name: 'Admin', email: 'admin@moviebook.com', role: 'admin' };
      return next();
    }

    // For production, verify JWT token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Access denied. Admin only.' });
    // }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = adminAuth;