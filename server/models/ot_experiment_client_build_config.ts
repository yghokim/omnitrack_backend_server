import * as mongoose from 'mongoose';
import OTExperiment from './ot_experiment';

const otExperimentClientBuildConfig = new mongoose.Schema({
  experiment: {type: String, ref: OTExperiment},
  platform: {type: String, enum: ['Android', 'iOS'], required: true},
  packageName: {type: String, default: null},
  appName: {type: String, default: null},
  repository: {type: {type: String, data: mongoose.Schema.Types.Mixed}, default: null},
  iconPath: {type: String, default: null},
  disableExternalEntities: {type: Boolean, default: false},
  showTutorials: {type: Boolean, default: true},
  disableTrackerCreation: {type: Boolean, default: false},
  disableTriggerCreation: {type: Boolean, default: false},
  hideTriggersTab: {type: Boolean, default: false},
  hideServicesTab: {type: Boolean, default: false},
  credentials: {type: mongoose.Schema.Types.Mixed, default: {}}, // dictionary
  apiKeys: {type: [{key: String, value: mongoose.Schema.Types.Mixed}], default: []},
}, {timestamps: true});

const OTExperimentClientBuildConfigModel = mongoose.model('OTExperimentClientBuildConfig', otExperimentClientBuildConfig);

export {OTExperimentClientBuildConfigModel}
