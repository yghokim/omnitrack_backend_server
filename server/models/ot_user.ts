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
  _id: {type: String, unique: true},
  name: String,
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
  devices: [otClientDeviceSchema]
}, {timestamps: true});

const OTUser = mongoose.model('OTUser', otUserSchema);

export default OTUser;
