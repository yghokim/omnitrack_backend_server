import * as mongoose from 'mongoose';

const otAttributeSchema = new mongoose.Schema({
  name: String,
  localKey: Number,
  serializedConnection: String,
  type: Number,
  required: Boolean,
  properties: [{key: String, serializedValue: String}],
  removed: {type: Boolean, default: false}
});

const otTrackerSchema = new mongoose.Schema({
  _id: {type: String, unique: true},
  objectId: String,
  name: String,
  color: Number,
  user: {type: String, ref: 'OTUser'},
  attributeLocalKeySeed: Number,
  onShortcut: true,
  attributes: [otAttributeSchema]
});

const OTTracker = mongoose.model('OTTracker', otTrackerSchema);

export default OTTracker;
