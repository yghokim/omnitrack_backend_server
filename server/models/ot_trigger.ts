import * as mongoose from 'mongoose';

const otTriggerSchema = new mongoose.Schema({
  _id: {type: String, unique: true},
  user: {type: String, ref: 'OTUser', required: false},
  alias: String,
  position: Number,
  conditionType: Number,
  actionType: Number,
  action: Object,
  condition: Object,
  lastTriggeredTime: Number,
  trackers: [{type: String, ref: 'OTTracker'}],
  userCreatedAt: Number,
  userUpdatedAt: Number,
  lockedProperties: {type: Object, default: {}}
}, {timestamps: true});

const OTTrigger = mongoose.model('OTTrigger', otTriggerSchema);

export default OTTrigger;
