// models/jira.model.js
import mongoose from 'mongoose';

const jiraSchema = new mongoose.Schema({
  dueDate: { type: Date  },
  projectName: { type: String, required: true }, 
  jiraNumber: { type: String, required: true },
  description: String,
  serviceName: { type: String },
  assignee: String,
  effortEstimation: Number,
  jiraStatus: String,
  actualStatus: String,
  relatedJira: String,
  environment:String,
  envDetail: { type: String },
  sqlDetail: { type: String },
  dailyLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DailyLog' }],
  userId: {
    type: String, 
    required: true,
    index: true
  },
}, { timestamps: true });

const Jira = mongoose.models.Jira || mongoose.model('Jira', jiraSchema);

export default Jira;