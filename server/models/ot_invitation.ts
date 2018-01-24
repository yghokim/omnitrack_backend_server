import * as mongoose from 'mongoose';

const otInvitationSchema = new mongoose.Schema({
  code: {type: String, required: true},
  experiment: {type: String, ref: 'OTExperiment'},
  isPublic: {type: Boolean, default: false},
  groupMechanism: mongoose.Schema.Types.Mixed
}, {timestamps: true, toObject: {virtuals: true}, toJSON: {virtuals: true}});


otInvitationSchema.virtual('participants', {
  ref: 'OTParticipant',
  localField: '_id',
  foreignField: 'invitation',
  justOne: false
})

const OTInvitation = mongoose.model('OTInvitation', otInvitationSchema);

export default OTInvitation;
