import * as mongoose from 'mongoose';
const randomstring = require('randomstring');

export function generateNewExperimentId(): string {
  return "ot-tpkg-" + randomstring.generate({ length: 8, charset: 'numeric' })
}

const otTrackingPackageSchema = new mongoose.Schema({
  _id: { type: String, default: generateNewExperimentId },
  name: { String, required: true },
  user: { type: String, ref: 'OTUser', required: true },
  description: { type: String, default: "" },
  data: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

const model = mongoose.model('OTTrackingPackage', otTrackingPackageSchema);

export default model;