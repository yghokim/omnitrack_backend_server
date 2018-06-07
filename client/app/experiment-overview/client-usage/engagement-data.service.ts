import { Injectable } from '@angular/core';
import { DayElement, DayData } from './daily-average/daily-average.component';
import d3 = require('d3');
import { getExperimentDateSequenceOfParticipant } from '../../../../omnitrack/experiment-utils';
import { ExperimentService } from '../../services/experiment.service';
import { IParticipantDbEntity } from '../../../../omnitrack/core/db-entity-types';
import { Subscription } from 'rxjs/Subscription';

@Injectable()
export class EngagementDataService {
  
  private engageLog: Array<any>
  private dates: Array<any> = []
  private dailyData: Array<DayData> = []
  private relativeDailyData: Array<DayData> = []
  private includeWeekends: boolean = true
  private participants: Array<IParticipantDbEntity>

  setEngageLog(engageLog: Array<any>, participants: Array<IParticipantDbEntity>, includeWeekends: boolean){
    this.engageLog = engageLog;
    this.participants = participants;
    this.dailyData = [];
    this.relativeDailyData = [];
    this.updateDates(includeWeekends)
    console.log(this.engageLog)

    for(var i: number = 0; i < this.dates.length; i++){
      var date = this.dates[i];
      var dailyUsers: DayData = {dayElements: []}
      var relativeUsers: DayData = {dayElements: []}
      for(let user of engageLog){
        var count = 0;
        var duration = 0;
        var relativeCount = 0;
        var relativeDuration = 0;
        var userData: DayElement = {date: date, user: user.user, engagements: []}
        var relativeUserData: DayElement = {date: date, user: user.user, engagements: []}
        var participant = this.participants.find(x => x.user._id === user.user)
        if(this.participants && participant){
          var temp = getExperimentDateSequenceOfParticipant(participant, this.dates[this.dates.length-1], includeWeekends)
        }
        for(let engagement of user.engagements){
          if(this.participants && participant){
            if(temp[i] && engagement.start.getDate() === temp[i].getDate()){
              relativeUserData.engagements.push(engagement)
              relativeCount++
              relativeDuration += engagement.duration
            }
          }
          if(date.getDate() === engagement.start.getDate()){
            userData.engagements.push(engagement)
            count++
            duration += engagement.duration
          }
        }
        userData.launchCount = count
        userData.totalDuration = duration
        dailyUsers.dayElements.push(userData)
        relativeUserData.launchCount = relativeCount
        relativeUserData.totalDuration = relativeDuration
        relativeUsers.dayElements.push(relativeUserData)
      }
      
      this.calculateAvgRange("date", dailyUsers)
      this.calculateAvgRange("relative", relativeUsers)
      
    }
  }

  get engagementLogs(): Array<DayData> {
    return this.dailyData;
  }
  
  get relativeLogs():Array<DayData> {
    return this.relativeDailyData;
  } 

  get engagementDates(): Array<any>{
    return this.dates.map(x => x.toDateString());
  }

  get relativeDates(): Array<any>{
    var dates = [];
    for(let date in this.dates){dates.push(date)}
    return dates;
  }
  updateDates(includeWeekends: boolean){
    //find min/max Date over all users
    var filteredLog = this.engageLog.map(function(users){if(users.engagements){return users.engagements}});
    if(filteredLog && filteredLog.length > 0){
      var reducedLog = filteredLog.reduce(function(prev,curr){ return prev.concat(curr)});
      var maxDate = d3.max(reducedLog.map(x => x.start + x.duration));
      var minDate = d3.min(reducedLog.map(x => x.start));
      //construct date array with all days inbetween min and max
      this.dates = [];
      var currentDate = new Date(minDate);
      for(var i: number = 0; currentDate.getDate() < new Date(maxDate).getDate(); i++){
        if(includeWeekends === false){
          if(currentDate.getDay() === 0){
            currentDate.setDate(currentDate.getDate()+1);
          }
          else if(currentDate.getDay() === 6){
            currentDate.setDate(currentDate.getDate()+2);
          }
        }
        this.dates[i] = new Date(currentDate)
        currentDate.setDate(currentDate.getDate()+1);
      }
    }
  }

  //calculate average, max, min
  calculateAvgRange(dayType: String, dailyUsers: DayData){
    var countSum = 0;
    var durationSum = 0;
    for(let element of dailyUsers.dayElements){
      countSum += element.launchCount
    }
    for(let element of dailyUsers.dayElements){
      durationSum += element.totalDuration
    }
    dailyUsers.avgCount = Math.round((countSum / this.engageLog.length)*100)/100
    var avgDate = Math.round((durationSum/ this.engageLog.length)*10)/10
    dailyUsers.avgDuration = avgDate / 60000

    var countMap = dailyUsers.dayElements.map(x => x.launchCount)
    var durMap = dailyUsers.dayElements.map(x => (x.totalDuration /60000))

    dailyUsers.maxCount = d3.max(countMap)
    dailyUsers.minCount = d3.min(countMap)
    dailyUsers.maxDuration = d3.max(durMap)
    dailyUsers.minDuration = d3.min(durMap)
    if(dayType === "date"){
      this.dailyData.push(dailyUsers)
    }
    else{
      this.relativeDailyData.push(dailyUsers)
    }
    
  }

  constructor() { }



}
