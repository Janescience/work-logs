// models/jira.model.js
import mongoose from 'mongoose';

const jiraSchema = new mongoose.Schema({
  dueDate: { type: Date  },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectName: { type: String }, // Keep temporarily for backward compatibility during migration
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
  deploySitDate: { type: Date },
  deployUatDate: { type: Date },
  deployPreprodDate: { type: Date },
  deployProdDate: { type: Date },
  dailyLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DailyLog' }],
  userId: {
    type: String, 
    required: true,
    index: true
  },
}, { timestamps: true });

const Jira = mongoose.models.Jira || mongoose.model('Jira', jiraSchema);

export default Jira;