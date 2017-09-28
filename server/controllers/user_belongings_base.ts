import BaseCtrl from './base';
import * as mongoose from 'mongoose';
export default abstract class UserBelongingCtrl extends BaseCtrl {

    getAllByUser(userId: String): any {
        return this.model.find({ 'user._id': userId })
    }

    getAllByUserOverTimestampQuery = function (userId: String, timestamp: Number): any {
        return this.getAllByUser(userId).where('updatedAt').gt(timestamp)
    }

    protected abstract convertEntryToOutput(dbEntry: any): any

    protected abstract convertClientEntryToDbSchema(clientEntry: any): any

    getServerChanges = (req, res) => {
        const userId = req.query.user
        if (userId != null) {
            const timestamp = req.query.timestamp | 0
            this.getAllByUserOverTimestampQuery(userId, timestamp).exec(
                (err, results) => {
                    if (err != null) {
                        res.status(500).send({ error: err })
                    }
                    else {
                        res.json(results.map(result => { return this.convertEntryToOutput(result) }))
                    }
                }
            )
        }
        else {
            res.status(500).send({ error: "No user id was passed." })
        }
    }

    postLocalChanges = (req, res) => {
        const userId = req.body.user
        if (userId != null) {
            const list = req.body.list
            if (list != null) {
                list.map(clientEntry => {
                    new Promise((resolve, reject) => {
                        this.model.findOneAndUpdate({ _id: clientEntry.objectId },
                            {$set: this.convertClientEntryToDbSchema(clientEntry)}, { new: true },
                            (error, doc) => {
                                if (error) {
                                    console.error(JSON.stringify(error))
                                    reject(error)
                                }
                                if(doc){
                                    if(doc == null)
                                    {
                                        //create new row
                                        //this.model.
                                    }
                                    else resolve(doc)
                                }
                            }
                        )
                    })
                }
                )
            }
        }
    }
}