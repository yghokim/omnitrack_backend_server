import { IParticipantDbEntity, IUsageLogDbEntity, ISessionUsageLog } from "./core/db-entity-types";
import * as d3 from 'd3';
import * as moment from 'moment-timezone';
import { deepclone } from "../shared_lib/utils";

export function getExperimentDateSequenceOfParticipant(participant: IParticipantDbEntity, to: Date, includeWeekends: boolean): Array<Date> {
  let sequence = d3.timeDays(moment(participant.experimentRange.from).tz("Asia/Seoul").startOf('day').toDate(), to, 1)

  if (participant.excludedDays) {
    const excludedMoments = participant.excludedDays.map(d => moment(d))
    sequence = sequence.filter(sd => {
      return !excludedMoments.find(ed => {
        return ed.isSame(sd, 'day')
      })
    })
  }

  if (includeWeekends === false) {
    return sequence.filter(s => s.getDay() !== 0 && s.getDay() !== 6)
  }

  return sequence
}

export function isSessionLog(log: IUsageLogDbEntity): boolean{
  return log.name === "session"
}

export function convertUsageLogToSessionLog(log: IUsageLogDbEntity, makeCopy: boolean = false): ISessionUsageLog{
  if(isSessionLog(log) === true){
    let body: IUsageLogDbEntity
    if(makeCopy === true){
      body = deepclone(log)
    }
    else body = log

    if(!body["session"]){
      const sessionSplits = body.content.session.split(".")
      body["session"] = sessionSplits[sessionSplits.length-1]
      body["startedAt"] = body.content.finishedAt - body.content.elapsed
      body["endedAt"] = body.content.finishedAt
      body["duration"] = body.content.elapsed
    }

    return body as any
  }
  else return null
}