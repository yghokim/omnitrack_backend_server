import { IUsageLogDbEntity } from "../omnitrack/core/db-entity-types";

export function logsToEngagements(usageLog: Array<any>): Array<any>{
    var sessionLog = [];
    var engageLog = [];
    const MIN_SESSION_GAP = 1000

    //sort again
    for(let entry of usageLog){
        entry.logs.sort((n1,n2) => new Date(n2.timestamp).valueOf() - new Date(n1.timestamp).valueOf())
    }
    //filter sessions
    for(let entry of usageLog){
        sessionLog.push({user: entry.user, logs: entry.logs.filter(function(x){
        if(x.name === "session" 
        && x.content.session.indexOf('Fragment') < 0 
        && x.content.session.indexOf('SplashScreenActivity') < 0
        && x.content.session.indexOf('AboutActivity') < 0
        && x.content.session.indexOf('SendReportActivity') < 0
        && x.content.session.indexOf('SignInActivity') < 0){
            return x;
        }
        })})
    }
    //build engagement structure
    for(let entry of sessionLog){
        var user = entry.user;
        var engagements: Array<Engagement> = [];
        var currentEngagement: Engagement;
        var previous = entry.logs[entry.logs.length-1]
        for(var i: number = entry.logs.length-1; i >= 0; i--){
        var log = entry.logs[i];
        if(log === previous){
            currentEngagement = {start: new Date(log.content.finishedAt - log.content.elapsed), duration: log.content.elapsed, sessions: []}
            currentEngagement.sessions.push(log)
        }
        else if(previous.content.finishedAt < log.content.finishedAt - log.content.elapsed - MIN_SESSION_GAP){
            currentEngagement.duration = previous.content.finishedAt - currentEngagement.start.valueOf();
            engagements.push(currentEngagement)
            currentEngagement = {start: new Date(log.content.finishedAt - log.content.elapsed), duration: log.content.elapsed, sessions: []}
            currentEngagement.sessions.push(log)
        }
        else{
            currentEngagement.sessions.push(log)
        }
        previous = log;
        }
        engageLog.push({user: user, engagements: engagements})
    }
    return engageLog;
}

export interface Engagement{
start: Date,
duration: Number,
sessions: Array<IUsageLogDbEntity>
}
export interface EngageData{
user: String,
engagements: Array<Engagement>
}
  