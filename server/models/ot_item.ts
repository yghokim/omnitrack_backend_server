import * as mongoose from 'mongoose';
var mongoosePaginate = require('mongoose-paginate');

const otItemSchema = new mongoose.Schema({
  _id: {type: String},
  tracker: {type: String, ref: 'OTTracker', required: true},
  user: {type: String, ref: 'OTUser', required: true},
  source: String,
  timestamp: {type: Number, index: true, required: true},
  deviceId: String,
  dataTable: [{_id: false, attrLocalId: String, sVal: String}],
  removed: {type: Boolean, index: true, default: false},
  userUpdatedAt: Number
}, {timestamps: true});

otItemSchema.plugin(mongoosePaginate)

const OTItem = mongoose.model('OTItem', otItemSchema);

export default OTItem;
