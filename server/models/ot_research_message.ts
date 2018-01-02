import * as mongoose from 'mongoose';

const otResearchMessageSchema = new mongoose.Schema({
  label: String,
  type: {type: String, default: "push", required: true},
  receiverRule: mongoose.Schema.Types.Mixed,
  receivers: {type: [{type: String, ref: "OTUser"}]},
  experiment: {type: String, ref: "OTExperiment", default: undefined},
  from: {type: String, ref: "OTResearcher"},
  messageTitle: String,
  messageBody: String,
  isDraft: {type: Boolean, default: false, required: true},
  reservedTime: Date,
  sentAt: Date
}, {timestamps: true});

const model = mongoose.model('OTResearchMessage', otResearchMessageSchema);

export default model;
