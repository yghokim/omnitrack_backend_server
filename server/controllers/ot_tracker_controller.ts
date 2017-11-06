import * as mongoose from 'mongoose';
import OTTracker from '../models/ot_tracker';
import UserBelongingCtrl from './user_belongings_base';

export default class OTTrackerCtrl extends UserBelongingCtrl {
  model = OTTracker;
  

    protected convertEntryToOutput(dbEntry: any): any {
        const obj = JSON.parse(JSON.stringify(dbEntry))

        obj["objectId"] = obj._id
        delete obj._id

        if(obj.attributes != null)
        {
            obj.attributes.forEach(attr=>{
                attr["objectId"] = attr._id 
                delete attr._id })
        }

        if(obj.removedAttributes != null)
        {
            obj.removedAttributes.forEach(attr=>{
                attr["objectId"] = attr._id 
                delete attr._id })
        }

        console.log(obj)

        return obj
    }
    
    protected convertClientEntryToDbSchema(clientEntry: any): any {
        const obj = JSON.parse(JSON.stringify(clientEntry))
        
        obj["_id"] = obj.objectId
        delete obj.objectId

        if(obj.attributes != null)
        {
            obj.attributes.forEach(attr=>{
                attr["_id"] = attr.objectId 
                delete attr.objectId })
        }

        if(obj.removedAttributes != null)
        {
            obj.removedAttributes.forEach(attr=>{
                attr["_id"] = attr.objectId 
                delete attr.objectId })
        }

        delete obj.synchronizedAt

        console.log(obj)

        return obj
    }
}