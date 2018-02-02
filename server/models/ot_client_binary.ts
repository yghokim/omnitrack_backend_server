import * as mongoose from 'mongoose';

const otClientBinarySchema = new mongoose.Schema({
  version: {type: String, required: true},
  os: {type: String, enum: ['Android']},
  fileSize: {type: Number, required: true},
  minimumOsVersion: {type: String},
  filename: {type: String, required: true},
  filepath: {type: String, required: true}
}, {timestamps: true});

const OTClientBinary = mongoose.model('OTClientBinary', otClientBinarySchema);

export default OTClientBinary;
