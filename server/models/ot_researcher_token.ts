import * as mongoose from 'mongoose';

const otResearcherTokenSchema = new mongoose.Schema({
  accessToken: String,
	expires: Date,
	clientId: String,
  user: {type: String, ref: 'OTResearcher'}
}, {timestamps: true});

const OTResearcherToken = mongoose.model('OTResearcherToken', otResearcherTokenSchema);

export default OTResearcherToken;
