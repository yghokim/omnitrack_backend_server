import BaseCtrl from './base';
import * as mongoose from 'mongoose';
export default abstract class UserBelongingCtrl extends BaseCtrl {

    getAllByUser(userId: String): any {
        return this.model.find({ 'user': userId })
    }

    getAllByUserOverTimestampQuery = function (userId: String, timestamp: number): any {
        return this.getAllByUser(userId).where('updatedAt').gt(new Date(timestamp))
    }

    protected abstract convertEntryToOutput(dbEntry: any): any

    protected abstract convertClientEntryToDbSchema(clientEntry: any): any

    getServerChanges = (req, res) => {
        const userId = req.query.user
        if (userId != null) {
            const timestamp = (req.query.timestamp || 0) * 1
            console.log("query server changes since " + new Date(timestamp))
            this.getAllByUserOverTimestampQuery(userId, timestamp).exec(
                (err, results) => {
                    console.log("server changes:")
                    console.log(results)
                    if (err != null) {
                        console.log(err)
                        res.status(400).send({ error: err })
                    }
                    else {
                        res.json(results.map(result => { return this.convertEntryToOutput(result) }))
                    }
                }
            )
        }
        else {
            res.status(400).send({ error: "No user id was passed." })
        }
    }

    postLocalChanges = (req, res) => {
        const userId = req.query.user
        if (userId != null) {
            const list = req.body
            if (list != null) {
                console.log("local changes posted.")
                console.log(list)
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