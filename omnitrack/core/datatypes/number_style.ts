export class NumberStyle{
  static readonly UNIT_POS_NONE = 0
  static readonly UNIT_POS_FRONT = 1
  static readonly UNIT_POS_REAR = 2

  unitPosition: number = NumberStyle.UNIT_POS_NONE
  unit?: string = null
  pluralize?: boolean = false
  fraction: number = 0
  comma: number = 3
}