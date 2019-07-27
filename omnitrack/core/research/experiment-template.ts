export interface ExperimentTemplate {
  name: string,
  groups: Array<{
    name: string,
    trackingPlanKey?: string
  }>,
  consent: string,
  demographicFormSchema: any,
  receiveConsentInApp: boolean,
  trackingPlans: Array<{
    key: string,
    name: string,
    data: any
  }>,
  clientBuildConfigs?: Array<any>,
  invitations: Array<{
    code: string,
    groupMechanism: { type: string, group: string } | { type: string, groups: Array<string> }
  }>
}