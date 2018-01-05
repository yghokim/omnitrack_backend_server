import * as mongoose from 'mongoose';

const otParticipantSchema = new mongoose.Schema({
  alias: String,
  user: {type: String, ref: "OTUser"},
  experiment: {type: String, ref: "OTExperiment"},
  groupId: String,
  invitation: {type: mongoose.Schema.Types.ObjectId, ref: "OTInvitation"},
  isDenied: {type: Boolean, default: false, required: true},
  deniedAt: Date,
  isConsentApproved: {type: Boolean, default: false, required: true}, approvedAt: Date,
  dropped: {type: Boolean, default: false},
  droppedReason: String,
  droppedBy: {type: String, ref: "OTResearcher", defaut: null},
  droppedAt: Date,
  information: mongoose.Schema.Types.Mixed
}, {timestamps: true});

const OTParticipant = mongoose.model('OTParticipant', otParticipantSchema);

export default OTParticipant;
