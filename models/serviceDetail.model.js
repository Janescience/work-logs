// models/serviceDetail.model.js
import mongoose from 'mongoose';

const serviceDetailSchema = new mongoose.Schema({
  // Reference to the parent Service
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service', // Refers to the 'Service' model
    required: true,
    index: true // Index for efficient lookup by service
  },
  env: { // Environment
    type: String,
    required: true,
    enum: ['SIT', 'UAT', 'PREPROD', 'PROD'] // Example enums, adjust as needed
  },
  url: String,
  database1: String,
  database2: String,
  database3: String,
  server: String,
  soap: String,
}, { timestamps: true }); // Automatically add createdAt and updatedAt fields

// Optional: Ensure unique environment per service
serviceDetailSchema.index({ service: 1, env: 1 }, { unique: true });

const ServiceDetail = mongoose.models.ServiceDetail || mongoose.model('ServiceDetail', serviceDetailSchema);

export default ServiceDetail;
