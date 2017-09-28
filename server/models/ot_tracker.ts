import * as mongoose from 'mongoose';

const otAttributeSchema = new mongoose.Schema({
  name: String,
  localKey: Number,
  serializedConnection: String,
  type: Number,
  required: Boolean,
  properties: [{key: String, serializedValue: String}]
});

const otTrackerSchema = new mongoose.Schema({
  objectId: String,
  name: String,
  color: Number,
  user: {type:mongoose.Schema.Types.ObjectId, ref: 'OTTracker'},
  attributeLocalKeySeed: Number,
  onShortcut: true,
  attributes: [otAttributeSchema]
});

const OTTracker = mongoose.model('OTTracker', otTrackerSchema);

export default OTTracker;
