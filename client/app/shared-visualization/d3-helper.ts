import * as d3 from "d3";
import * as moment from 'moment-timezone';

export class D3Helper {
  static makeTranslate(x: number = 0, y: number = 0): string {
    return "translate(" + x + ", " + y + ")"
  }

  static makeDateSequence(dates: Array<Date>, includeToday: boolean = true, overrideStartDate: number = null): Array<Date> {
    var minDate = d3.min(dates, (date) => date)
    var maxDate = d3.max(dates, (date) => date)
    
    if(includeToday){
      const today = moment().startOf('day').toDate()
      if(maxDate.getTime() < today.getTime()){
        maxDate = today
      }
    }

    if(overrideStartDate){
      const startDate = moment(overrideStartDate).startOf('day').toDate()
      if(minDate.getTime() > startDate.getTime()){
        minDate = startDate
      }
    }

    return d3.timeDays(new Date(minDate), moment(maxDate).add(1, 'd').toDate())

  }
}