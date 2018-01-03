import * as mongoose from 'mongoose';

const otResearcherClientSchema = new mongoose.Schema({
  _id: {type: String, index: true},
  userId: {type: String, index: true},
  clientSecret: String
}, {timestamps: true});
const OTResearcherClient = mongoose.model('OTResearcherClient', otResearcherClientSchema);

export default OTResearcherClient;
