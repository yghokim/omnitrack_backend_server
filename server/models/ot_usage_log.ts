import * as mongoose from 'mongoose';

const otUsageLogSchema = new mongoose.Schema({
  user: {type: String, ref: 'OTUser'},
  name: {type: String, index: true},
  sub: {type: String, index: true},
  content: Object,
  deviceId: {type: String, index: true},
  timestamp: {type: Date, index: true},
  experiment: {type: String, ref: 'OTExperiment'},
  localId: Number
}, {timestamps: true});

const OTUsageLog = mongoose.model('OTUsageLog', otUsageLogSchema);

export default OTUsageLog;