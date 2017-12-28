import * as mongoose from 'mongoose';
import * as uuid from 'uuid';

const otExperimentGroupSchema = new mongoose.Schema(
  {
    _id: {type: String, unique: true, default: uuid.v1()},
    name: {type: String, required: true},
    maxSize: {type: Number, required: true, default: 20},
    participants: {type: [{type: String, ref: "OTUser"}], default: []}
  }
)

const otExperimentSchema = new mongoose.Schema({
  _id: {type: String, unique: true, default: uuid.v1()},
  name: {type: String, required: true},
  groups: {type: [otExperimentGroupSchema], default: [{name: "Default", maxSize: 100, participants:[]}]},
  manager: {type:String, ref: 'OTResearcher', required: true},
  experimenters: {type: [{type:String, ref: 'OTResearcher'}], default: []}
}, {timestamps: true});

const OTExperiment = mongoose.model('OTExperiment', otExperimentSchema);

export default OTExperiment;
