const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();

// Load environment variables from .env file
dotenv.config();

// Middlewares
app.use(cors());
app.use(express.json()); // To parse JSON data

// Routes
const authRoutes = require('./routes/authRoutes');
const studentAuthRoutes = require("./routes/studentAuth");
const teacherAuthRoutes = require("./routes/teacherAuth");

// Use Routes
app.use('/api/auth', authRoutes);
app.use("/api/student", studentAuthRoutes);
app.use("/api/teacher", teacherAuthRoutes);


const slotRoutes = require("./routes/slotRoutes");
app.use("/api", slotRoutes);


// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
