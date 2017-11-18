import BaseCtrl from './base';
import * as mongoose from 'mongoose';
import { Request, Response } from 'express';
export default abstract class UserBelongingCtrl extends BaseCtrl {

    protected convertEntryToOutput(dbEntry: any): any {
        const obj = JSON.parse(JSON.stringify(dbEntry))
  
        obj.objectId = obj._id.toString()
        delete obj._id
  
        obj.synchronizedAt = dbEntry.updatedAt.getTime()
  
        return obj
      }
      
      protected convertClientEntryToDbSchema(clientEntry: any): any {
        const obj = JSON.parse(JSON.stringify(clientEntry))
         
        delete obj.synchronizedAt
  
        obj._id  = obj.objectId.toString()
        delete obj.objectId
  
        return obj
      }

    getAllByUser(userId: String): any {
        return this.model.find({ 'user': userId })
    }

    public getAllByUserOverTimestampQuery(userId: String, timestamp: number): Promise<Array<any>> {
        return this.getAllByUser(userId).where('updatedAt').gt(new Date(timestamp)).then(results => results.map(entry => {
            return this.convertEntryToOutput(entry)
        }))
    }

    public applyClientChanges(userId: String, clientChangeList: Array<any>): Promise<Array<{id:String, timestamp:number}>>{
        if(clientChangeList.length > 0)
        {
            return this.model.collection.bulkWrite(
                clientChangeList.map(element => {
                    const dataInDbSchema = this.convertClientEntryToDbSchema(element)
                    dataInDbSchema.updatedAt = new Date()
                    dataInDbSchema.user = userId

                    console.log("db schema:")
                    console.log(dataInDbSchema)

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
                    console.log("bulkwrite result: ")
                    console.log(result)
                    console.log(result.hasWriteErrors())
                    console.log(result.getWriteErrors())
                    result.getWriteErrors().forEach(error=>{
                        console.log(error.toJSON())
                    })
                    console.log("ok: " + result.ok + ", nIn: " + result.nInserted + ", nUp: " + result.nUpserted + ", nMatched: " + result.nMatched )
                    if(result.ok == 1)
                    {
                        return this.model.find({_id:{$in: clientChangeList.map(element=>element.objectId)}}, {updatedAt:1})
                    }else throw Error("Server error while upserting.")
                }
            ).then(
                result=>result.map(entry=>{ console.log("haha"); console.log(entry);  return {id: entry._id, synchronizedAt: entry.updatedAt.getTime()}})
            )
        }
        else return Promise.resolve([])
    }

    getServerChanges = (req:Request, res: Response) => {
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

    postClientChanges = (req:Request, res: Response) => {
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
                                    filter: {_id: element._id}, 
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
