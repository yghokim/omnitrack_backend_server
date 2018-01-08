import * as mongoose from 'mongoose';

const otInvitationSchema = new mongoose.Schema({
  code: {type: String, required: true},
  experiment: {type: String, ref: 'OTExperiment'},
  isActive: {type: Boolean, default: true},
  groupMechanism: mongoose.Schema.Types.Mixed
}, {timestamps: true, toJSON: {virtuals: true}});


otInvitationSchema.virtual('participants', {
  ref: 'OTParticipant',
  localField: '_id',
  foreignField: 'invitation',
  justOne: false
})

const OTInvitation = mongoose.model('OTInvitation', otInvitationSchema);

export default OTInvitation;
