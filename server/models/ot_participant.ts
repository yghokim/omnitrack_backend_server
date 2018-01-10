import * as mongoose from 'mongoose';

const otParticipantSchema = new mongoose.Schema({
  alias: String,
  user: {type: String, ref: "OTUser"},
  experiment: {type: String, ref: "OTExperiment"},
  groupId: String,
  invitation: {type: mongoose.Schema.Types.ObjectId, ref: "OTInvitation"},
  isDenied: {type: Boolean, index: true, default: false, required: true},
  deniedAt: Date,
  isConsentApproved: {type: Boolean, index: true, default: false, required: true}, 
  approvedAt: Date,
  dropped: {type: Boolean, index: true, default: false},
  droppedReason: String,
  droppedBy: {type: String, ref: "OTResearcher", defaut: null},
  droppedAt: Date,
  information: mongoose.Schema.Types.Mixed
}, {timestamps: true});

otParticipantSchema.index({dropped: 1, isDenied: 1, isConsentApproved: 1})
const OTParticipant = mongoose.model('OTParticipant', otParticipantSchema);

export default OTParticipant;
