const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// Helper function to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// ---------------- Student Signup ----------------
const registerStudent = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await Student.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Student already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const student = await Student.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      _id: student._id,
      name: student.name,
      email: student.email,
      token: generateToken(student._id, 'student'),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Student Login ----------------
const loginStudent = async (req, res) => {
  const { email, password } = req.body;
  try {
    const student = await Student.findOne({ email });
    if (!student) return res.status(400).json({ message: 'Student not found' });

    const match = await bcrypt.compare(password, student.password);
    if (!match) return res.status(401).json({ message: 'Incorrect password' });

    res.json({
      _id: student._id,
      name: student.name,
      email: student.email,
      token: generateToken(student._id, 'student'),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Teacher Signup ----------------
const registerTeacher = async (req, res) => {
  const { name, email, password, specialization, availableSlots } = req.body;
  try {
    const exists = await Teacher.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Teacher already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const teacher = await Teacher.create({
      name,
      email,
      password: hashedPassword,
      specialization,
      availableSlots,
    });

    res.status(201).json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      specialization: teacher.specialization,
      availableSlots: teacher.availableSlots,
      token: generateToken(teacher._id, 'teacher'),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Teacher Login ----------------
const loginTeacher = async (req, res) => {
  const { email, password } = req.body;
  try {
    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(400).json({ message: 'Teacher not found' });

    const match = await bcrypt.compare(password, teacher.password);
    if (!match) return res.status(401).json({ message: 'Incorrect password' });

    res.json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      specialization: teacher.specialization,
      availableSlots: teacher.availableSlots,
      token: generateToken(teacher._id, 'teacher'),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  registerTeacher,
  loginTeacher,
};
