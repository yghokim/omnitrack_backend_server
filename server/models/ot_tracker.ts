import * as mongoose from 'mongoose';

const otAttributeSchema = new mongoose.Schema({
  _id: String,
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
  userCreatedAt: Number,
  userUpdatedAt: Number
});

const otTrackerSchema = new mongoose.Schema({
  _id: {type: String, unique: true},
  name: String,
  color: Number,
  user: {type: String, ref: 'OTUser'},
  isBookmarked: {type: Boolean, default: false},
  position: Number,
  attributes: {type: [otAttributeSchema], default: []},
  removedAttributes: {type: [otAttributeSchema], default:[]},
  lockedProperties: {type: Object, default: {}},
  flags: {type: Object, default: {}},
  userCreatedAt: Number,
  userUpdateAt: Number
}, {timestamps: true});

const OTTracker = mongoose.model('OTTracker', otTrackerSchema);

export default OTTracker;
