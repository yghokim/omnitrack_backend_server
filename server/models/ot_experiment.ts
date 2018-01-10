import * as mongoose from 'mongoose';
import * as uuid from 'uuid';
import { ExperimentPermissions } from '../../omnitrack/core/research/experiment'
import { ExperimentDashboardConfigs, TrackingItemListTableConfig, VisualizationConfigs } from '../../omnitrack/core/research/configs';

const otExperimentGroupSchema = new mongoose.Schema(
  {
    _id: {type: String, default: uuid.v1},
    name: {type: String, required: true},
    maxSize: {type: Number, required: true, default: 20},
    trackingPackageKey: {type: String, default: null}
  }
)

const otExperimentInjectionPackageSchema = new mongoose.Schema(
  {
    key: {type: String, unique: true, default: () => mongoose.Types.ObjectId().toString()},
    name: {type: String, required: true},
    data: {type: mongoose.Schema.Types.Mixed, required: true, default: {}},
    updatedAt: Date
  }, {_id: false}
)



const otExperimentSchema = new mongoose.Schema({
  _id: {type: String, default: uuid.v1},
  name: {type: String, required: true},
  groups: {type: [otExperimentGroupSchema], default: [{name: "Default", maxSize: 100, participants: []}]},
  manager: {type: String, ref: 'OTResearcher', required: true},
  visualizationConfigs: {type: mongoose.Schema.Types.Mixed, default: ()=>{return new VisualizationConfigs()}},
  trackingPackages: {type: [otExperimentInjectionPackageSchema]},
  experimenters: {type: [{
      researcher: {type: String, ref: 'OTResearcher'}, 
      permissions: {type: mongoose.Schema.Types.Mixed, default: ()=>{return ExperimentPermissions.makeCollaboratorDefaultPermissions()}}
    }], default: []}
}, {timestamps: true});

const OTExperiment = mongoose.model('OTExperiment', otExperimentSchema);

export default OTExperiment;
