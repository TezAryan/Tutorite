const express = require("express");
const router = express.Router();
const Slot = require("../models/Slot");

// 1️⃣ TEACHER adds available slots
router.post("/teacher/slots", async (req, res) => {
    try {
        const { teacherId, date, time } = req.body;

        const newSlot = new Slot({ teacherId, date, time });
        await newSlot.save();

        res.status(201).json({ message: "Slot added successfully", slot: newSlot });
    } catch (error) {
        res.status(500).json({ error: "Failed to add slot" });
    }
});

// 2️⃣ STUDENT views available slots
router.get("/student/slots", async (req, res) => {
    try {
        const slots = await Slot.find({ isBooked: false }).populate("teacherId", "name email");

        res.status(200).json(slots);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch slots" });
    }
});

// 3️⃣ STUDENT books a slot
router.post("/student/book/:slotId", async (req, res) => {
    try {
        const slotId = req.params.slotId;
        const { studentId } = req.body;

        const slot = await Slot.findById(slotId);

        if (!slot || slot.isBooked) {
            return res.status(400).json({ error: "Slot not available" });
        }

        slot.isBooked = true;
        slot.studentId = studentId;
        await slot.save();

        res.status(200).json({ message: "Slot booked successfully", slot });
    } catch (error) {
        res.status(500).json({ error: "Failed to book slot" });
    }
});

module.exports = router;
