import * as mongoose from 'mongoose';

const otExperimentClientBuildConfigSchema = new mongoose.Schema({
  experiment: {type: String, ref: 'OTExperiment'},
  platform: {type: String, enum: ['Android', 'iOS'], required: true},
  packageName: {type: String, default: null},
  appName: {type: String, default: null},
  sourceCode: {type: {sourceType: String, data: mongoose.Schema.Types.Mixed}, default: {sourceType: 'github', data: {useOfficial: true}}},
  iconPath: {type: String, default: null},
  disableExternalEntities: {type: Boolean, default: false},
  showTutorials: {type: Boolean, default: true},
  disableTrackerCreation: {type: Boolean, default: false},
  disableTriggerCreation: {type: Boolean, default: false},
  hideTriggersTab: {type: Boolean, default: false},
  hideServicesTab: {type: Boolean, default: false},
  credentials: {type: mongoose.Schema.Types.Mixed, default: {}}, // dictionary
  apiKeys: {type: [{key: String, value: String}], default: []}
}, {timestamps: true});

const OTExperimentClientBuildConfigModel = mongoose.model('OTExperimentClientBuildConfig', otExperimentClientBuildConfigSchema);

export default OTExperimentClientBuildConfigModel;
