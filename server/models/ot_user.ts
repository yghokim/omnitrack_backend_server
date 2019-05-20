import * as mongoose from 'mongoose';
const validate = require('mongoose-validator')

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
  username: {type: String, index: true, required: true,
    min: 3, 
    max: 50
    /*
    validate: [
      validate({
        validator: 'isLength',
        arguments: [3, 50],
        message: 'Username should be between {ARGS[0]} and {ARGS[1]} characters',
      }),
      validate({
        validator: 'matches',
        passIfEmpty: true,
        arguments: /^[a-z0-9.]+@?[a-z0-9.]+[a-z0-9]$/g,
        message: 'Username should contain only the alpha-numeric characters or be an E-mail address.',
      }),
    ]*/
  },
  
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

otUserSchema.index({ username: 1, experiment: 1 }, {unique: 1})

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

const OTUser = mongoose.model('OTUser', otUserSchema);

export default OTUser;