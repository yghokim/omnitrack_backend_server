import * as mongoose from 'mongoose';

const otUsageLogSchema = new mongoose.Schema({
  user: {type: String, ref: 'OTUser'},
  name: {type: String, index: true},
  sub: String,
  content: Object,
  deviceId: {type: String, index: true},
  timestamp: Date,
  localId: Number
}, {timestamps: true});

const OTUsageLog = mongoose.model('OTUsageLog', otUsageLogSchema);

export default OTUsageLog;