import { Injectable } from '@angular/core';
import { DayElement, DayData } from './daily-average/daily-average.component';
import d3 = require('d3');

@Injectable()
export class EngagementDataService {
  
  private engageLog: Array<any>
  private dates: Array<any> = []
  private dailyData: Array<DayData> = []

  setEngageLog(engageLog: Array<any>){
    this.engageLog = engageLog;
    this.dailyData = [];
    this.updateDates()

    for(let date of this.dates){
      var dailyUsers: DayData = {dayElements: []}
      for(let user of engageLog){
        var count = 0;
        var duration = 0;
        var userData: DayElement = {date: date, user: user.user, engagements: []}
        for(let engagement of user.engagements){
          if(date.getDate() === engagement.start.getDate()){
            userData.engagements.push(engagement)
              count++
              duration += engagement.duration
          }
        }
        userData.launchCount = count
        userData.totalDuration = duration
        dailyUsers.dayElements.push(userData)
      }
      this.dailyData.push(dailyUsers)
      var countSum = 0;
      var durationSum = 0;
      for(var i: number = 0; i < dailyUsers.dayElements.length ; i++){
        countSum += dailyUsers.dayElements[i].launchCount
        durationSum += dailyUsers.dayElements[i].totalDuration
      }
      dailyUsers.avgCount = Math.round((countSum / engageLog.length)*10)/10
      var avgDate = Math.round((durationSum/ engageLog.length)*10)/10
      dailyUsers.avgDuration = avgDate / 60000

      var countMap = dailyUsers.dayElements.map(x => x.launchCount)
      var durMap = dailyUsers.dayElements.map(x => (x.totalDuration /60000))

      dailyUsers.maxCount = d3.max(countMap)
      dailyUsers.minCount = d3.min(countMap)
      dailyUsers.maxDuration = d3.max(durMap)
      dailyUsers.minDuration = d3.min(durMap)
    }
    console.log(this.dailyData)
  }

  get engagementLogs(): Array<DayData> {
    return this.dailyData;
  }

  get engagementDates(): Array<any>{
    return this.dates;
  }
  updateDates(){
    //find min/max Date over all users
    var filteredLog = this.engageLog.map(function(users){if(users.engagements){return users.engagements}});
    if(filteredLog && filteredLog.length > 0){
      var reducedLog = filteredLog.reduce(function(prev,curr){ return prev.concat(curr)});
      var maxDate = d3.max(reducedLog.map(x => x.start + x.duration));
      var minDate = d3.min(reducedLog.map(x => x.start));
      //construct date array with all days inbetween min and max
      this.dates = [];
      this.dates[0] = new Date(minDate)
      var currentDate = new Date(minDate);
      for(var i: number = 1; currentDate.getDate() < new Date(maxDate).getDate(); i++){
        var helper = currentDate;
        currentDate.setDate(helper.getDate()+1);
        this.dates[i] = new Date(currentDate)
      }
    }
  }

  constructor() { }



}
