export class RatingOptions {

  static readonly TYPE_STAR = 0
  static readonly TYPE_LIKERT = 1

  type: number = RatingOptions.TYPE_STAR
  stars = 5
  left = 1
  right = 5
  leftLabel = "strongly disagree"
  midLabel = ""
  rightLabel = "strongly agree"
  fractional = true
}