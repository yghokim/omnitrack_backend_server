import * as mongoose from 'mongoose';

const otResearcherAuthorizationCodeSchema = new mongoose.Schema({
  authorizationCode: {type:String, index: true, required: true},
  expiresAt: {type: Date, required: true},
  redirectUri: {type: String, required: true},
  scope: {type: String},
  userId: {type:String, required: true},
  clientId: {type: String, required: true}
}, {timestamps: true});
const OTResearcherAuthorizationCode = mongoose.model('OTResearcherAuthorizationCode', otResearcherAuthorizationCodeSchema);

export default OTResearcherAuthorizationCode;
