import { ExperimentTemplate } from "../../../omnitrack/core/research/experiment-template";
import OTExperiment from "../../models/ot_experiment";

import C from "../../server_consts";
import { AInvitation } from "../../../omnitrack/core/research/invitation";

export default class OTExperimentTemplateCtrl {
  extractTemplate(experimentId: string): Promise<ExperimentTemplate> {
    return OTExperiment.findById(experimentId).populate("invitations").lean().then(experiment => {
      if (experiment) {
        const template = {} as ExperimentTemplate

        template.name = experiment.name

        template.consent = experiment.consent

        template.demographicFormSchema = experiment.demographicFormSchema

        template.receiveConsentInApp = experiment.receiveConsentInApp

        template.groups = experiment.groups.map(g => ({
          name: g.name,
          trackingPlanKey: g.trackingPlanKey
        }))

        template.invitations = experiment.invitations.map(invitation => {
          const obj = {
            code: invitation.code,
            groupMechanism: {
              type: invitation.groupMechanism.type
            } as any
          }

          switch (invitation.groupMechanism.type) {
            case AInvitation.RandomGroupType:
              obj.groupMechanism.groups = invitation.groupMechanism.groups.map(groupId => experiment.groups.indexOf(g => g._id === groupId))
              break;
            case AInvitation.SpecificGroupType:
              obj.groupMechanism.group = experiment.groups.indexOf(g => g._id === invitation.groupMechanism.group)
              break;
          }
          return obj
        })

        template.trackingPlans = experiment.trackingPlans.map(p => ({
          key: p.key,
          name: p.name,
          data: p.data
        }))

        console.log("extracted experiment template of " + experimentId + ":")
        console.log(template)

        return template
      } else throw { error: C.ERROR_CODE_ILLEGAL_ARGUMENTS }
    })
  }
}