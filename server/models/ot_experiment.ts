import * as mongoose from 'mongoose';
import * as uuid from 'uuid';
import { ExperimentPermissions } from '../../omnitrack/core/research/experiment'
import { VisualizationConfigs } from '../../omnitrack/core/research/configs';

function generateNewExperimentId(): string {
  return "ot-exp-" + require('randomstring').generate({ length: 8, charset: 'numeric' })
}

const otExperimentGroupSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid.v1, required: true },
    name: { type: String, required: true },
    trackingPlanKey: { type: String, default: null }
  }
)

const otExperimentTrackingPlanSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, default: () => mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true, default: {} },
    updatedAt: Date
  }, { _id: false }
)



const otExperimentSchema = new mongoose.Schema({
  _id: { type: String, default: generateNewExperimentId },
  name: { type: String, required: true },
  maxExperimentalDay: { type: Number, default: Number.MAX_SAFE_INTEGER },
  finishDate: {type: Date, default: null},
  groups: { type: [otExperimentGroupSchema], default: [{ _id: uuid.v1(), name: "Default", participants: [] }] },
  manager: { type: String, ref: 'OTResearcher', required: true },
  visualizationConfigs: { type: mongoose.Schema.Types.Mixed, default: () => new VisualizationConfigs() },
  trackingPlans: { type: [otExperimentTrackingPlanSchema], default: [] },
  consent: { type: String, default: null },
  receiveConsentInApp: { type: Boolean, default: true },
  demographicFormSchema: {type: mongoose.Schema.Types.Mixed, default: null},
  participantNumberSeed: {type: Number, default: 0}, /** used for putting a suffix number to new participants */
  experimenters: {
    type: [{
      researcher: { type: String, ref: 'OTResearcher' },
      permissions: { type: mongoose.Schema.Types.Mixed, default: () => ExperimentPermissions.makeCollaboratorDefaultPermissions() }
    }], default: []
  }
}, { timestamps: true, toJSON: { virtuals: true } });

const OTExperiment = mongoose.model('OTExperiment', otExperimentSchema);

otExperimentSchema.virtual('clientBuildConfigs', {
  ref: 'OTExperimentClientBuildConfig',
  localField: '_id',
  foreignField: 'experiment',
  justOne: false
})

export default OTExperiment;
