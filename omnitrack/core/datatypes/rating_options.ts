export class RatingOptions{

  static readonly TYPE_STAR = 0
  static readonly TYPE_LIKERT = 1
  
  type: number = RatingOptions.TYPE_STAR
  stars?: number = 5
  left?: number = 1
  right?: number = 5
  leftLabel?: string = "strongly disagree"
  midLabel?: string = ""
  rightLabel?: string = "strongly agree"
  fractional?: boolean = true
}