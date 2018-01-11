import * as mongoose from 'mongoose';
var mongoosePaginate = require('mongoose-paginate');

const otAttributeSchema = new mongoose.Schema({
  objectId: String, // this object id is not used as an index in server. it is only used in client.
  name: String,
  localId: String,
  trackerId: String,
  connection: mongoose.Schema.Types.Mixed,
  fallbackPolicy: Number,
  fallbackPreset: String,
  type: Number,
  isRequired: Boolean,
  isHidden: {type: Boolean, default: false},
  isInTrashcan: {type: Boolean, default: false},
  properties: [{_id: false, key: String, sVal: String}],
  userCreatedAt: Number,
  userUpdatedAt: Number,
  lockedProperties: {type: mongoose.Schema.Types.Mixed, default: {}},
  flags: {type: Object, default: {}},
}, {_id: false});

const otTrackerSchema = new mongoose.Schema({
  _id: {type: String},
  name: String,
  color: Number,
  user: {type: String, ref: 'OTUser'},
  isBookmarked: {type: Boolean, default: false},
  position: Number,
  attributes: {type: [otAttributeSchema], default: []},
  lockedProperties: {type: mongoose.Schema.Types.Mixed, default: {}},
  flags: {type: mongoose.Schema.Types.Mixed, default: {}},
  userCreatedAt: Number,
  userUpdateAt: Number,
  removed: {type: Boolean, index: true, default: false}
}, {timestamps: true});

otTrackerSchema.plugin(mongoosePaginate)

const OTTracker = mongoose.model('OTTracker', otTrackerSchema);

export default OTTracker;
