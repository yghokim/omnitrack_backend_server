import * as mongoose from 'mongoose';

const otUserSchema = new mongoose.Schema({
  _id: {type: String, unique: true},
  name: String,
  email: String,
  trackers: [{type: String, ref: 'OTTracker'}]
}, {timestamps: true});

const OTUser = mongoose.model('OTUser', otUserSchema);

export default OTUser;
