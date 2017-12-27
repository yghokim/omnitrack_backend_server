import * as mongoose from 'mongoose';

const otInvitationSchema = new mongoose.Schema({
  _id: {type: String, unique: true},
  experiment: {type: String, ref: 'OTExperiment'},
  groupMechanism: mongoose.Schema.Types.Mixed
}, {timestamps: true});


const OTInvitation = mongoose.model('OTInvitation', otInvitationSchema);

export default OTInvitation;
