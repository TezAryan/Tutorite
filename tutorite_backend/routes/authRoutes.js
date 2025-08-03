const express = require('express');
const router = express.Router();
const {
  registerStudent,
  loginStudent,
  registerTeacher,
  loginTeacher
} = require('../controllers/authController');

// Student Auth Routes
router.post('/student/signup', registerStudent);
router.post('/student/login', loginStudent);

// Teacher Auth Routes
router.post('/teacher/signup', registerTeacher);
router.post('/teacher/login', loginTeacher);

module.exports = router;
