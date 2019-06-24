export const DEFAULT_VALUE_POLICY_NULL = "null"
export const DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE = "intrinsic"
export const DEFAULT_VALUE_POLICY_FILL_WITH_PRESET = "preset"
export const DEFAULT_VALUE_POLICY_FILL_WITH_LAST_ITEM = "last"

export class FallbackPolicyResolver{
  constructor(public readonly label: string){}
}

export class NullValueResolver extends FallbackPolicyResolver{
  constructor(){
    super("Empty value")
  }
}

export class PreviousValueResolver extends FallbackPolicyResolver{
  constructor(){
    super("Fill with the previous logging value")
  }
}