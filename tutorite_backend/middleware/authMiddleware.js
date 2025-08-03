const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header with Bearer token exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user data to request based on role
      if (decoded.role === 'student') {
        req.user = await Student.findById(decoded.id).select('-password');
        req.user.role = 'student';
      } else if (decoded.role === 'teacher') {
        req.user = await Teacher.findById(decoded.id).select('-password');
        req.user.role = 'teacher';
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = protect;
