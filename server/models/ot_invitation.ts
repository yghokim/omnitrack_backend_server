import * as mongoose from 'mongoose';

const otInvitationSchema = new mongoose.Schema({
  code: {type: String, required: true},
  experiment: {type: String, ref: 'OTExperiment'},
  isActive: {type: Boolean, default: true},
  groupMechanism: mongoose.Schema.Types.Mixed
}, {timestamps: true});


const OTInvitation = mongoose.model('OTInvitation', otInvitationSchema);

export default OTInvitation;
