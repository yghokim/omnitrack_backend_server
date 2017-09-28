import * as mongoose from 'mongoose';

const otItemSchema = new mongoose.Schema({
  tracker: {type:mongoose.Schema.Types.ObjectId, ref: 'OTTracker', required: true},
  user: {type:mongoose.Schema.Types.ObjectId, ref: 'OTUser', required: true},
  source: String,
  timestamp: {type:Number, required: true},
  deviceId: String,
  dataTable: [{attributeId: String, serializedValue: String}]
});

const OTItem = mongoose.model('OTItem', otItemSchema);

export default OTItem;
