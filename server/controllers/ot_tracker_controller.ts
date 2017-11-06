import * as mongoose from 'mongoose';
import OTTracker from '../models/ot_tracker';
import UserBelongingCtrl from './user_belongings_base';

export default class OTTrackerCtrl extends UserBelongingCtrl {
  model = OTTracker;
  

    protected convertEntryToOutput(dbEntry: any): any {
        const obj = JSON.parse(JSON.stringify(dbEntry))

        obj.synchronizedAt = dbEntry.updatedAt.getTime()

        return obj
    }
    
    protected convertClientEntryToDbSchema(clientEntry: any): any {
        const obj = JSON.parse(JSON.stringify(clientEntry))
        
        delete obj.synchronizedAt

        console.log(obj)

        return obj
    }
}