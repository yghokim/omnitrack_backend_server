import * as mongoose from 'mongoose';
import OTItem from '../models/ot_item';
import UserBelongingCtrl from './user_belongings_base';

export default class OTItemCtrl extends UserBelongingCtrl {
  model = OTItem;

  protected convertEntryToOutput(dbEntry: any) {
    var serverTable = {}
    if(dbEntry.dataTable != null)
    {
      dbEntry.dataTable.forEach(
        entry=>
        {
          serverTable[entry.attributeId] = entry.serializedValue
        }
      )
    }
    
    return {
      objectId: dbEntry.objectId,
      trackerId: dbEntry.tracker,
      source: dbEntry.source,
      timestamp: dbEntry.timestamp,
      deviceId: dbEntry.deviceId,
      serializedValueTable: serverTable,
      removed: dbEntry.removed,
      userUpdateAt: dbEntry.userUpdatedAt,
      synchronizedAt: dbEntry.updatedAt.getTime()
    }
  }

  protected convertClientEntryToDbSchema(clientEntry: any) {
    var clientTable = []
    if(clientEntry.serializedValueTable!=null)
    {
      clientTable = Object.keys(clientEntry.serializedValueTable).map(key=>{ return {attributeId: key, serializedValue: clientEntry.serializedValueTable[key]} })
    }
    
    return {
      tracker: clientEntry.trackerId,
      source: clientEntry.source,
      timestamp: clientEntry.timestamp,
      deviceId: clientEntry.deviceId,
      dataTable: clientTable,
      userUpdatedAt: clientEntry.userUpdatedAt,
      removed: clientEntry.removed
    }
  }
}