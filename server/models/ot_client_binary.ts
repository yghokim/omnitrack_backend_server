import * as mongoose from 'mongoose';

const otClientBinarySchema = new mongoose.Schema({
  version: {type: String, required: true},
  versionCode: {type: Number, default: 0},
  platform: {type: String, enum: ['Android', 'iOS']},
  fileSize: {type: Number, required: true},
  minimumOsVersion: {type: String},
  minimumOsVersionReadable: {type: String},
  fileName: {type: String, required: true},
  originalFileName: {type: String, required: true},
  checksum: {type: String, unique: true, required: true},
  downloadCount: {type: Number, default: 0}
}, {timestamps: true});

const OTClientBinary = mongoose.model('OTClientBinary', otClientBinarySchema);

export default OTClientBinary;
