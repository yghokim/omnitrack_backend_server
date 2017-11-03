import * as mongoose from 'mongoose';

const otAttributeSchema = new mongoose.Schema({
  name: String,
  localId: String,
  trackerId: String,
  connection: Object,
  fallbackPolicy: Number,
  fallbackPreset: String,
  type: Number,
  isRequired: Boolean,
  position: Number,
  properties: [{key: String, serializedValue: String}],
  userCreatedAt: Number
});

const otTrackerSchema = new mongoose.Schema({
  _id: {type: String, unique: true},
  name: String,
  color: Number,
  user: {type: String, ref: 'OTUser'},
  isBookmarked: true,
  position: Number,
  attributes: [otAttributeSchema],
  removedAttributes: [otAttributeSchema],
  lockedProperties: Object,
  flags: Object,
  userCreatedAt: Number
}, {timestamps: true});

const OTTracker = mongoose.model('OTTracker', otTrackerSchema);

export default OTTracker;
