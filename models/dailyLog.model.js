// models/dailyLog.model.js
import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema({
  logDate: { type: Date, required: true },
  taskDescription: { type: String, required: true },
  timeSpent: { type: Number, required: true },
  detail: String,
  envDetail: { type: String }, // ช่องใหม่สำหรับ Environment Detail
  sqlDetail: { type: String }, // ช่องใหม่สำหรับ SQL Detail
  options: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LogOption' }],
  jiraId: { type: mongoose.Schema.Types.ObjectId, ref: 'Jira', required: true },
}, { timestamps: true });

const DailyLog = mongoose.models.DailyLog || mongoose.model('DailyLog', dailyLogSchema);

export default DailyLog;