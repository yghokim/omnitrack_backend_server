import * as mongoose from 'mongoose';

const otExperimentSchema = new mongoose.Schema({
  _id: {type: String, unique: true},
  name: {type: String, required: true},
  groups: [{name: String, participants: [{type: String, ref: 'OTUser'}]}],
  manager: {type:String, ref: 'OTResearcher', required: true},
  experimenters: {type: [{type:String, ref: 'OTResearcher'}], default: []}
}, {timestamps: true});

const OTExperiment = mongoose.model('OTExperiment', otExperimentSchema);

export default OTExperiment;
