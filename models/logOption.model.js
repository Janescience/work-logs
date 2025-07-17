// models/logOption.model.js
import mongoose from 'mongoose';

const logOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  colorCode: { type: String, required: true },
}, { timestamps: true });

const LogOption = mongoose.models.LogOption || mongoose.model('LogOption', logOptionSchema);

export default LogOption;