import { Injectable } from '@angular/core';
import { DayElement, DayData } from './daily-average/daily-average.component';
import * as d3 from 'd3';
import { getExperimentDateSequenceOfParticipant } from '../../../../omnitrack/experiment-utils';
import { IParticipantDbEntity } from '../../../../omnitrack/core/db-entity-types';

@Injectable()
export class EngagementDataService {

  private engageLog: Array<any>
  private dates: Array<any> = []
  private dailyData: Array<DayData> = []
  private relativeDailyData: Array<DayData> = []
  private includeWeekends: boolean = true
  private participants: Array<IParticipantDbEntity>
  private dayScope: Array<number> = []

  setEngageLog(engageLog: Array<any>, participants: Array<IParticipantDbEntity>, includeWeekends: boolean, dayScope: Array<number>) {
    this.engageLog = engageLog;
    this.participants = participants;
    this.dayScope = dayScope;
    this.dailyData = [];
    this.relativeDailyData = [];
    this.updateDates(includeWeekends)
    console.log(this.engageLog)

    for (var i: number = 0; i < this.dates.length; i++) {
      var date = this.dates[i];
      var dailyUsers: DayData = { dayElements: [] }
      var relativeUsers: DayData = { dayElements: [] }
      for (let user of engageLog) {
        var count = 0;
        let duration = 0;
        let relativeCount = 0;
        let relativeDuration = 0;
        let userData: DayElement = { date: date, user: user.user, engagements: [] }
        const relativeUserData: DayElement = { date: date, user: user.user, engagements: [] }
        let participant;
        if (this.participants) {
          participant = this.participants.find(x => x.user._id === user.user)
          if (participant) {
            const temp = getExperimentDateSequenceOfParticipant(participant, this.dates[this.dates.length - 1], includeWeekends)
          }

        }
        for (const engagement of user.engagements) {
          if (this.participants && participant) {
            if (temp[i] && engagement.start.toDateString() === temp[i].toDateString()) {
              relativeUserData.engagements.push(engagement)
              relativeCount++
              relativeDuration += engagement.duration
            }
          }
          if (date.toDateString() === engagement.start.toDateString()) {
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

  get relativeLogs(): Array<DayData> {
    return this.relativeDailyData;
  }

  get engagementDates(): Array<any> {
    return this.dates;
  }

  get relativeDates(): Array<any> {
    const dates = [];
    for (let i: number = this.dayScope[0]; i <= this.dayScope[1]; i++) {
      dates.push(i + 1)
    }
    return dates;
  }

  get totalSessionsPerDay(): number {
    if (this.dailyData.length > 0) {
      let overallSessions = 0;
      for (const date of this.dailyData) {
        for (const element of date.dayElements) {
          overallSessions += element.engagements.length
        }
      }
      overallSessions = overallSessions / this.dailyData.length
      return overallSessions;
    } else { return 0; }
  }

  get medianSessionDuration(): number {
    if (this.engageLog && this.engageLog.length > 0) {
      const engagements = this.engageLog.map(x => x.engagements).reduce(function (prev, curr) { return prev.concat(curr) })
      const sortedEngagements = engagements.sort((n1, n2) => n2.duration - n1.duration);
      if (sortedEngagements.length % 2 === 1) {
        return (sortedEngagements[Math.floor(sortedEngagements.length / 2)].duration) / 1000
      } else {
        const temp = (sortedEngagements[sortedEngagements.length / 2].duration - sortedEngagements[(sortedEngagements.length / 2) - 1].duration) / 2
        return (sortedEngagements[(sortedEngagements.length / 2) - 1].duration + temp) / 1000
      }
    }
  }

  get timePerUserPerDay(): number {
    if (this.dailyData.length > 0) {
      let overallAverage = 0;
      for (const day of this.dailyData) {
        let average = 0;
        for (const user of day.dayElements) {
          average += user.totalDuration
        }
        average = average / day.dayElements.length
        overallAverage += average
      }
      overallAverage = overallAverage / this.dailyData.length
      return overallAverage / 1000;
    } else { return 0; }
  }

  /*  setDayScope(dayScope: Array<any>){
      this.dayScope = dayScope;
      this.updateDates(this.includeWeekends)
    }*/

  updateDates(includeWeekends: boolean) {
    if (this.engageLog) {
      // find min/max Date over all users
      const filteredLog = this.engageLog.map(function (users) { if (users.engagements) { return users.engagements } });
      if (filteredLog && filteredLog.length > 0) {
        const reducedLog = filteredLog.reduce(function (prev, curr) { return prev.concat(curr) });
        const maxDate = d3.max(reducedLog.map(x => x.start + x.duration));
        const minDate = d3.min(reducedLog.map(x => x.start));

        // construct date array with all days inbetween min and max
        this.dates = [];
        const currentDate = new Date(minDate);
        for (let i = 0; currentDate.valueOf() < new Date(maxDate).valueOf(); i++) {
          if (includeWeekends === false) {
            if (currentDate.getDay() === 0) {
              currentDate.setDate(currentDate.getDate() + 1);
            } else if (currentDate.getDay() === 6) {
              currentDate.setDate(currentDate.getDate() + 2);
            }
          }
          this.dates[i] = new Date(currentDate)
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }
  }

  // calculate average, max, min
  calculateAvgRange(dayType: String, dailyUsers: DayData) {
    let countSum = 0;
    let durationSum = 0;
    for (const element of dailyUsers.dayElements) {
      countSum += element.launchCount
    }
    for (const element of dailyUsers.dayElements) {
      durationSum += element.totalDuration
    }
    dailyUsers.avgCount = Math.round((countSum / this.engageLog.length) * 100) / 100
    const avgDate = Math.round((durationSum / this.engageLog.length) * 10) / 10
    dailyUsers.avgDuration = avgDate / 60000

    const countMap = dailyUsers.dayElements.map(x => x.launchCount)
    const durMap = dailyUsers.dayElements.map(x => (x.totalDuration / 60000))

    dailyUsers.maxCount = d3.max(countMap)
    dailyUsers.minCount = d3.min(countMap)
    dailyUsers.maxDuration = d3.max(durMap)
    dailyUsers.minDuration = d3.min(durMap)
    if (dayType === "date") {
      this.dailyData.push(dailyUsers)
    } else {
      this.relativeDailyData.push(dailyUsers)
    }

  }

  constructor() { }



}
