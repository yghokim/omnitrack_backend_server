import * as mongoose from 'mongoose';

const otClientDeviceSchema = new mongoose.Schema({
  localKey: {type: String, required: true},
  deviceId: {type: String, required: true},
  instanceId: {type: String, required: true},
  os: String,
  firstLoginAt: Date,
  appVersion: String
})

const otUserSchema = new mongoose.Schema({
  _id: {type: String},
  name: String,
  nameUpdatedAt: {type: Date, default: Date.now},
  picture: String,
  email: String,
  accountCreationTime: Date,
  accountLastSignInTime: Date,
  activatedRoles: [{
    role: {type: String, required: true},
    isConsentApproved: {type: Boolean, default: false, required: true},
    information: mongoose.Schema.Types.Mixed
  }],
  deviceLocalKeySeed: {type: Number, required: true, default: 0},
  devices: [otClientDeviceSchema],
  dataStore: {type: mongoose.Schema.Types.Mixed, default: {}}
}, {timestamps: true, toJSON: {virtuals: true}});

otUserSchema.virtual('trackers', {
  ref: 'OTTracker',
  localField: '_id',
  foreignField: 'user',
  justOne: false
})

otUserSchema.virtual('triggers', {
  ref: 'OTTrigger',
  localField: '_id',
  foreignField: 'user',
  justOne: false
})

otUserSchema.virtual('items', {
  ref: 'OTItem',
  localField: '_id',
  foreignField: 'user',
  justOne: false
})

otUserSchema.virtual("participantIdentities", {
  ref: 'OTParticipant',
  localField: '_id',
  foreignField: 'user',
  justOne: false
})

const OTUser = mongoose.model('OTUser', otUserSchema);

export default OTUser;
