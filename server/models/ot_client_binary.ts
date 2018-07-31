import * as mongoose from 'mongoose';

const otClientBinarySchema = new mongoose.Schema({
  experiment: {type: String, ref: 'OTExperiment', default: null}, // if experiment is not designate, this client is global.
  needsConfirm: {type: Boolean, default: false, index: true},
  version: {type: String, required: true, index: true},
  versionCode: {type: Number, default: 0},
  platform: {type: String, enum: ['Android', 'iOS'], index: true},
  fileSize: {type: Number, required: true},
  minimumOsVersion: {type: String},
  minimumOsVersionReadable: {type: String},
  fileName: {type: String, required: true},
  originalFileName: {type: String, required: true},
  checksum: {type: String, unique: true, required: true},
  downloadCount: {type: Number, default: 0},
  changelog: {type: [String], default: []}
}, {timestamps: true});

const OTClientBinary = mongoose.model('OTClientBinary', otClientBinarySchema);

export default OTClientBinary;
