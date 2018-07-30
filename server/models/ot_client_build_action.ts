import * as mongoose from 'mongoose';

const otClientBuildActionSchema = new mongoose.Schema({
  jobId: {type: String, index: true},
  experiment: {type: String, ref: 'OTExperiment'},
  config: {type: String, ref: 'OTExperimentClientBuildConfig'},
  platform: {type: String, enum: ['Android', 'iOS'], required: true, index: true},
  configHash: {type: String, required: true, index: true},
  runAt: {type: Date, index: true, default: (()=>new Date())},
  finishedAt: {type: Date, default: null, index: true},
  result: {type: String, enum: ["succeeded", "canceled", "failed"], index: true},
  lastError: {type: mongoose.Schema.Types.Mixed, default: null},
  binaryFileName: String
}, {timestamps: true});

const model = mongoose.model('OTClientBuildAction', otClientBuildActionSchema);

export default model;
