import * as mongoose from 'mongoose';
import * as uuid from 'uuid';

const otResearcherSchema = new mongoose.Schema({
  _id: {type: String, default: uuid.v1},
  alias: String,
  email: { type: String, unique: true, required: true },
  hashed_password: { type: String, required: true },
  passwordSetAt: Date, 
  password_reset_token: { type: String, unique: true },
  reset_token_expires: Date,
  experiments: {type: [{type: String, ref: 'OTExperiment'}], default: []}
}, {timestamps: true});

const OTResearcher = mongoose.model('OTResearcher', otResearcherSchema);

export default OTResearcher;
