import mongoose from "mongoose";

const DoctorSchema = new mongoose.Schema({
    name: String,
    specialty: String,
    city: String,
    rating: Number,
    reviews: Number,
    image: String,
    availableToday: Boolean,
    teleconsult: Boolean
});

export default mongoose.models.Doctor || mongoose.model("Doctor", DoctorSchema);