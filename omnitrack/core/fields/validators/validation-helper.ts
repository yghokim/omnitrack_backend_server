export enum ValidatorType {
  SameDayTimeInputValidator = "same_day"
}

export interface ValidatorSpec {
  name: string,
  type: ValidatorType,
  description: string
}

const validatorSpecs: { [key: string]: ValidatorSpec } = {
  [ValidatorType.SameDayTimeInputValidator]: {
    name: "Same Day",
    type: ValidatorType.SameDayTimeInputValidator,
    description: "Time input should be fall within the same day with the item entry."
  }
}

export function getValidatorSpec(type: ValidatorType): ValidatorSpec {
  return validatorSpecs[type]
}
