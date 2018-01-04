import * as mongoose from 'mongoose';

const otItemSchema = new mongoose.Schema({
  _id: {type: String},
  tracker: {type: String, ref: 'OTTracker', required: true},
  user: {type: String, ref: 'OTUser', required: true},
  source: String,
  timestamp: {type: Number, required: true},
  deviceId: String,
  dataTable: [{_id: false, attrLocalId: String, sVal: String}],
  removed: {type: Boolean, default: false},
  userUpdatedAt: Number
}, {timestamps: true});

const OTItem = mongoose.model('OTItem', otItemSchema);

export default OTItem;
