import * as mongoose from 'mongoose';

const otClientSignatureSchema = new mongoose.Schema({
  package: {type: String, required: true},
  key: {type: String, required: true, unique: true},
  alias: {type: String, required: true},
  experiment: {type: String, ref: 'OTExperiment', default: null}
});

otClientSignatureSchema.index({package: 1, key: 1})
const model = mongoose.model('OTClientSignature', otClientSignatureSchema);

export default model;
