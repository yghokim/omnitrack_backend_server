import { IParticipantDbEntity } from "./core/db-entity-types";
import * as d3 from 'd3';
import * as moment from 'moment';

export function getExperimentDateSequenceOfParticipant(participant: IParticipantDbEntity, to: Date, includeWeekends: boolean): Array<Date> {
  let sequence = d3.timeDays(moment(participant.experimentRange.from).startOf('day').toDate(), to, 1)

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