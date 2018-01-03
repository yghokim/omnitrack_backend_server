export class NumberStyle {
  static readonly UNIT_POS_NONE = 0
  static readonly UNIT_POS_FRONT = 1
  static readonly UNIT_POS_REAR = 2

  unitPosition: number = NumberStyle.UNIT_POS_NONE
  unit?: string = null
  pluralize = false
  fraction = 0
  comma = 3
}