import * as mongoose from 'mongoose';

const otClientSignatureSchema = new mongoose.Schema({
  package: { type: String, required: true },
  key: { type: String, required: true},
  alias: { type: String, required: true },
  experiments: { type: [{ type: String, ref: 'OTExperiment' }], default: [] }
});

otClientSignatureSchema.index({ package: 1, key: 1 })
const model = mongoose.model('OTClientSignature', otClientSignatureSchema);

export default model;
