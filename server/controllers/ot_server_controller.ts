import OTTracker from '../models/ot_tracker';
import OTItem from '../models/ot_item';

export default class ServerCtrl{
  initialize(){
    try{
      OTItem.collection.dropIndex("objectId_1")
      OTTracker.collection.dropIndex("objectId_1")
    }catch(err){
      
    }
  }
}