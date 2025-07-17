// models/service.model.js
import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true 
  },
  repository: String,
  deployBy: String,
}, { 
  timestamps: true,
  // *** START: เพิ่มการตั้งค่า toJSON และ toObject ***
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
  // *** END: เพิ่มการตั้งค่า ***
});

// *** START: สร้าง Virtual Field สำหรับ Populate ***
serviceSchema.virtual('details', {
  ref: 'ServiceDetail',      // The model to use
  localField: '_id',         // Find ServiceDetail where `localField`
  foreignField: 'service',   // is equal to `foreignField`
});
// *** END: สร้าง Virtual Field ***

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

export default Service;