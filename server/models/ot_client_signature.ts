import * as mongoose from 'mongoose';

const otClientSignatureSchema = new mongoose.Schema({
  package: { type: String, required: true },
  key: { type: String, required: true}, //fingerprint signature
  alias: { type: String, required: true },
  experiment: {type: String, ref: 'OTExperiment', default: null}
});

otClientSignatureSchema.index({ package: 1, key: 1, experiment: 1 })
const model = mongoose.model('OTClientSignature', otClientSignatureSchema);

export default model;
