import * as mongoose from 'mongoose';

const otItemSchema = new mongoose.Schema({
  objectId: {type: String, unique: true},
  tracker: {type:String, ref: 'OTTracker', required: true},
  user: {type:String, ref: 'OTUser', required: true},
  source: String,
  timestamp: {type:Number, required: true},
  deviceId: String,
  dataTable: [{attrLocalId: String, sVal: String}],
  removed: {type: Boolean, default: false},
  userUpdatedAt: Number
}, {timestamps: true});

const OTItem = mongoose.model('OTItem', otItemSchema);

export default OTItem;
