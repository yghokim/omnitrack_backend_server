import * as mongoose from 'mongoose';
import * as uuid from 'uuid';

function generateNewUserId(): string {
  return "ot-usr-" + require('randomstring').generate({ length: 12, charset: 'numeric' })
}

const otParticipationSchema = new mongoose.Schema({
  experiment: { type: String, ref: "OTExperiment" },
  groupId: String,
  excludedDays: { type: [Date], default: [] },
  invitation: { type: mongoose.Schema.Types.ObjectId, ref: "OTInvitation" },
  approvedAt: Date,
  dropped: { type: Boolean, index: true, default: false },
  droppedReason: String,
  droppedBy: { type: String, ref: "OTResearcher", defaut: null },
  droppedAt: Date,
  experimentRange: { from: Date, to: Date },
  demographic: { type: mongoose.SchemaTypes.Mixed, default: {} }
}, { timestamps: true });

const otClientDeviceSchema = new mongoose.Schema({
  localKey: {type: String, required: true},
  deviceId: {type: String, required: true},
  instanceId: {type: String, required: true},
  os: String,
  firstLoginAt: Date,
  appVersion: String
})

const otUserSchema = new mongoose.Schema({
  _id: {type: String, default: generateNewUserId},
  name: String,
  nameUpdatedAt: {type: Date, default: Date.now},
  picture: String,
  email: String,
  
  hashed_password: { type: String, required: true },
  passwordSetAt: Date,
  password_reset_token: { type: String },
  reset_token_expires: Date,
  
  deviceLocalKeySeed: {type: Number, required: true, default: 0},
  devices: [otClientDeviceSchema],
  dataStore: {type: mongoose.Schema.Types.Mixed, default: {}},
  participationInfo: {
    type: otParticipationSchema
  }

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
