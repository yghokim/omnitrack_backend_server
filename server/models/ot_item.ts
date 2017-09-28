import * as mongoose from 'mongoose';

const otItemSchema = new mongoose.Schema({
  _id: {type: String, unique: true},
  tracker: {type:String, ref: 'OTTracker', required: true},
  user: {type:String, ref: 'OTUser', required: true},
  source: String,
  timestamp: {type:Number, required: true},
  deviceId: String,
  dataTable: [{attributeId: String, serializedValue: String}],
  removed: {type: Boolean, default: false}
}, {timestamps: true});

const OTItem = mongoose.model('OTItem', otItemSchema);

export default OTItem;
