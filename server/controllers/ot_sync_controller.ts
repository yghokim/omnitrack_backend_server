import OTTrackerCtrl from './ot_tracker_controller';
import OTTriggerCtrl from './ot_trigger_controller';
import OTItemCtrl from './ot_item_controller';
import UserBelongingCtrl from './user_belongings_base';

export default class OTSyncCtrl {

    constructor(private trackerCtrl: OTTrackerCtrl, private triggerCtrl: OTTriggerCtrl, private itemCtrl: OTItemCtrl){

    }

    batchGetServerChangesAfter=(req, res)=>{
        try{
        const userId = res.locals.user.uid
        const typeCount = req.query.types.length
        const queryList = Array<{type: string, timestamp: number}>()
        for(var i = 0; i<typeCount; i++)
        {
            queryList.push({type: req.query.types[i].toString(), timestamp: req.query.timestamps[i]*1})
        }
        
        Promise.all(
            queryList.map(entry=>{
                var controller: UserBelongingCtrl
                switch(entry.type.toUpperCase()){
                    case "TRACKER":
                    controller = this.trackerCtrl
                    break
                    case "TRIGGER":
                    controller = this.triggerCtrl
                    break
                    case "ITEM":
                    controller = this.itemCtrl
                    break
                }
    
                if(controller!=null)
                {
                    return controller.getAllByUserOverTimestampQuery(userId, entry.timestamp).then(l=> { console.log(l); return {type:entry.type, list: l}})
                }else return Promise.resolve({type: entry.type, list: []})
            })
        ).then(
            results=>
            {
                return results.reduce(function(map, obj) {
                    map[obj.type] = obj.list
                    return map
                }, {})
            }
        ).then(
            result=>
            {
                console.log(result)
                res.status(200).send(result)
            }
        )
        
        }catch(ex){
            console.log(ex)
            res.status(500).send({error:ex})
        }
    }

    batchPostClientChanges=(req,res)=>{
        try{
            const userId = res.locals.user.uid
            const clientChangeList: Array<{type:string, rows: Array<any>}> = req.body

            console.log("received client changes:")
            console.log(clientChangeList)
            Promise.all(clientChangeList.map(
                entry=>{
                    var controller: UserBelongingCtrl
                    switch(entry.type.toUpperCase()){
                        case "TRACKER":
                        controller = this.trackerCtrl
                        break
                        case "TRIGGER":
                        controller = this.triggerCtrl
                        break
                        case "ITEM":
                        controller = this.itemCtrl
                        break
                    }

                    if(controller==null)
                    {
                        return Promise.resolve({type: entry.type, rows: []})
                    }
                    else return controller.applyClientChanges(userId, entry.rows.map(str=>JSON.parse(str))).then(result=>{return {type: entry.type, rows: result}})
                }
            )
        ).then(results=>{
            console.log("bulk result: ")
            console.log(results)
            return results.reduce(function(map, obj) {
                map[obj.type] = obj.rows
                return map
            }, {})
        }).then(result=>{
            console.log(result)
            res.status(200).send(result)
        })

        }catch(ex){
            console.log(ex)
            res.status(500).send({error:ex})
        }
    }
}
