import d3 = require("d3");
import * as moment from 'moment-timezone';

export class D3Helper {
  static makeTranslate(x: number = 0, y: number = 0): string {
    return "translate(" + x + ", " + y + ")"
  }

  static makeDateSequence(dates: Array<Date>, includeToday: boolean = true): Array<Date> {
    const minDate = d3.min(dates, (date) => date)
    var maxDate = d3.max(dates, (date) => date)
    
    if(includeToday){
      const today = moment().startOf('day').toDate()
      if(maxDate.getTime() < today.getTime()){
        maxDate = today
      }
    }

    return d3.timeDays(new Date(minDate), moment(maxDate).add(1, 'd').toDate())

  }
}