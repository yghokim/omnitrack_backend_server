import * as mongoose from 'mongoose';
import * as uuid from 'uuid';

const otResearcherSchema = new mongoose.Schema({
  _id: {type: String, unique: true, default: uuid.v1()},
  alias: String,
  email: { type: String, unique: true, required: true },
  hashed_password: { type: String, required: true },
  password_reset_token: { type: String, unique: true },
  reset_token_expires: Date,

  experiments: [{experiment:{type:String, ref: 'OTExperiment'}, permission: String}]
}, {timestamps: true});

const OTResearcher = mongoose.model('OTResearcher', otResearcherSchema);

export default OTResearcher;
