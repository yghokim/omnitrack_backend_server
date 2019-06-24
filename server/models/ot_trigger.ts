import * as mongoose from 'mongoose';

const otTriggerSchema = new mongoose.Schema({
  _id: {type: String},
  user: {type: String, ref: 'OTUser', required: false},
  alias: {type: String, default: ""},
  position: {type: Number, default: 0},
  conditionType: {type: Number, default: 0},
  actionType: {type: Number, default: 0},
  action: Object,
  condition: Object,
  script: String,
  checkScript: {type: Boolean, default: false},
  lastTriggeredTime: Number,
  trackers: [{type: String, ref: 'OTTracker'}],
  userCreatedAt: Number,
  userUpdatedAt: Number,
  lockedProperties: {type: mongoose.Schema.Types.Mixed, default: {}},
  flags: {type: mongoose.Schema.Types.Mixed, default: {}},
  isOn: {type: Boolean, default: false},
  removed: {type: Boolean, index: true, default: false}
}, {timestamps: true});

const OTTrigger = mongoose.model('OTTrigger', otTriggerSchema);
OTTrigger.collection.createIndex({"flags.experiment": 1})
OTTrigger.collection.createIndex({"flags.injectedId": 1})


export default OTTrigger;
