// models/team.model.js
import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  teamLeadId: {
    type: String,
    required: true,
    index: true
  },
  teamName: {
    type: String,
    required: true
  },
  memberIds: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Compound index to ensure one team per team lead
teamSchema.index({ teamLeadId: 1, isActive: 1 });

const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);
export default Team;