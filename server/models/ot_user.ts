import * as mongoose from 'mongoose';

const otUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  trackers: [{type: mongoose.Schema.Types.ObjectId, ref: 'OTTracker'}]
}, {timestamps: true});

const OTUser = mongoose.model('OTUser', otUserSchema);

export default OTUser;
