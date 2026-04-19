import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
    userId: String,
    doctorId: String,
    date: String,
    time: String,
    status: { type: String, default: "upcoming" },
    type: String
});

export default mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);