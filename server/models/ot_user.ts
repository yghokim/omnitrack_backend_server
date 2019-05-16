import * as mongoose from 'mongoose';
import * as uuid from 'uuid';

function generateNewUserId(): string {
  return "ot-usr-" + require('randomstring').generate({ length: 12, charset: 'hex' })
}

const otParticipationSchema = new mongoose.Schema({
  alias: {type: String, default: null},
  groupId: {type: String, default: null},
  excludedDays: { type: [Date], default: [] },
  invitation: { type: mongoose.Schema.Types.ObjectId, ref: "OTInvitation"},
  approvedAt: Date,
  dropped: { type: Boolean, index: true, default: false },
  droppedReason: String,
  droppedBy: { type: String, ref: "OTResearcher", defaut: null },
  droppedAt: Date,
  experimentRange: { from: Date, to: Date },
  demographic: { type: mongoose.SchemaTypes.Mixed, default: {} }
}, { timestamps: true, minimize: false });

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
  name: {type: String, required: false},
  nameUpdatedAt: {type: Date, default: Date.now},
  picture: String,
  email: {type: String, index: true, required: true},
  
  hashed_password: { type: String, required: true },
  passwordSetAt: Date,
  password_reset_token: { type: String },
  reset_token_expires: Date,
  
  
  deviceLocalKeySeed: {type: Number, required: true, default: 0},
  devices: {type: [otClientDeviceSchema], default: []},
  dataStore: {type: mongoose.Schema.Types.Mixed, default: {}},
  
  experiment: { type: String, ref: "OTExperiment" },
  participationInfo: {
    type: otParticipationSchema,
    default: ()=>({})
  }

}, {
  timestamps: true, 
  minimize: false,
  toJSON: {virtuals: true}});

otUserSchema.index({ email: 1, experiment: 1 }, {unique: 1})

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