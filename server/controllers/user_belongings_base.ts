import BaseCtrl from './base';
import * as mongoose from 'mongoose';
export default abstract class UserBelongingCtrl extends BaseCtrl {

    protected abstract convertEntryToOutput(dbEntry: any): any
    
    protected abstract convertClientEntryToDbSchema(clientEntry: any): any

    getAllByUser(userId: String): any {
        return this.model.find({ 'user': userId })
    }

    public getAllByUserOverTimestampQuery(userId: String, timestamp: number): Promise<Array<any>> {
        return this.getAllByUser(userId).where('updatedAt').gt(new Date(timestamp)).then(results => results.map(entry => {return this.convertEntryToOutput(entry)}))
    }

    public applyClientChanges(userId: String, clientChangeList: Array<any>): Promise<Array<{id:String, timestamp:number}>>{
        if(clientChangeList.length > 0)
        {
            return this.model.collection.bulkWrite(
                clientChangeList.map(element => {
                    const dataInDbSchema = this.convertClientEntryToDbSchema(element)
                    dataInDbSchema.updatedAt = new Date()
                    dataInDbSchema.user = userId

                    return {
                        updateOne: {
                            filter: {_id: element.objectId}, 
                            update:{$set: dataInDbSchema}, 
                            upsert: true
                        }
                    }
                }
            )).then(
                result=>{
                    if(result.ok == 1)
                    {
                        return this.model.find({_id:{$in: clientChangeList.map(element=>element.objectId)}}, {updatedAt:1})
                    }else throw Error("Server error while upserting.")
                }
            ).then(
                result=>result.map(entry=>{return {id: entry._id, synchronizedAt: entry.updatedAt.getTime()}})
            )
        }
        else return Promise.resolve([])
    }

    getServerChanges = (req, res) => {
        const userId = res.locals.user.uid
        if (userId != null) {
            const timestamp = (req.query.timestamp || 0) * 1
            console.log("query server changes since " + new Date(timestamp))
            this.getAllByUserOverTimestampQuery(userId, timestamp).then(
                results => {
                    console.log("server changes:")
                    console.log(results)
                    res.json(results)
                }
            ).catch(
                err=>
                {
                    console.log(err)
                    res.status(400).send({ error: err })
                }
            )
        }
        else {
            res.status(400).send({ error: "No user id was passed." })
        }
    }

    postClientChanges = (req, res) => {
        const userId = res.locals.user.uid
        if (userId != null) {
            const list = req.body
            if (list != null) {
                console.log("local changes posted.")
                console.log(list)
                this.applyClientChanges(userId, list).then(
                    resultList=>
                    {
                        res.status(200).send(
                            resultList
                        )
                    }
                ).catch(
                    err=>{
                        res.status(500).send({error: err})
                    }
                )

                if(list.length > 0)
                {
                    this.model.collection.bulkWrite(
                        list.map(element => {

                            const dataInDbSchema = this.convertClientEntryToDbSchema(element)
                            dataInDbSchema.updatedAt = new Date()
                            dataInDbSchema.user = userId

                            return {
                                updateOne: {
                                    filter: {_id: element.objectId}, 
                                    update:{$set: dataInDbSchema}, 
                                    upsert: true
                                }
                            }
                        }
                    )).then(
                        result=>{
                            console.log(result)
                            if(result.ok == 1)
                            {
                                return this.model.find({_id:{$in: list.map(element=>element.objectId)}}, {updatedAt:1})
                            }else res.status(500).send({error: "Server error while upserting."})
                        }
                    ).then(
                        result=>{
                            const mappedResult = result.map(entry=>{return {id: entry._id, synchronizedAt: entry.updatedAt.getTime()}})
                            console.log(mappedResult)
                            res.status(200).send(
                                mappedResult
                            )
                        }
                    ).catch(err=>{
                        console.log(err)
                        res.status(500).send({error: "Server error in progress of posting local changes."})
                    })
                }
                else res.status(200).send([])
            }
        }else res.status(400).send({error: "No user id was passed."})
    }
}