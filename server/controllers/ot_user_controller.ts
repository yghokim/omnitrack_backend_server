import BaseCtrl from './base';
import * as mongoose from 'mongoose';
import OTUser from '../models/ot_user';
import * as firebaseAdmin from 'firebase-admin';

export default class OTUserCtrl {
    
    private fetchUserDataToDb(uid: string): Promise<any>{
        console.log("Firebase app:")
        console.log(firebaseAdmin.auth().app.name)
        return firebaseAdmin.auth().getUser(uid)
            .then(
                userRecord=>{
                    console.log("fetched Firebase auth user account:")
                    console.log(userRecord)
                    return OTUser.update({_id: uid}, {$set: {
                        name: userRecord.displayName,
                        email: userRecord.email,
                        picture: userRecord.photoURL,
                        accountCreationTime: userRecord.metadata.creationTime,
                        accountLastSignInTime: userRecord.metadata.lastSignInTime,
                    }}, {upsert: true}).then(
                        result=>{
                            if(result > 0)
                            {
                                return OTUser.findOne({_id:uid})
                            }
                            else return null
                        }
                    )
                }
            )
    }

    private getUserOrInsert(userId: string): Promise<any>{
        return OTUser.findOne({_id: userId}).then(
            result=>
            {
                if(result==null)
                {
                    return this.fetchUserDataToDb(userId)
                }
                else return Promise.resolve(result)
            }
        )
    }

    getRoles = (req, res) => {
        const userId = res.locals.user.uid
        OTUser.findOne({_id: userId}).then(
            result=>
            {
                if(result==null)
                {
                    res.json([])
                }
                else res.json(result.activatedRoles || [])
            }
        ).catch(
            error=>{
                console.log(error)
                res.status(500).send(error)  
            }
        )
    }

    postRole = (req, res)=>{
        try{
            const userId = res.locals.user.uid
            this.getUserOrInsert(userId).then(
                user=>{
                    const newRole = req.body
                    if(newRole!=null)
                    {
                        var updated = false
                        user.activatedRoles.forEach(role=>{
                            if(role.role == newRole.role)
                            {
                                role.isConsentApproved = newRole.isConsentApproved
                                role.information = newRole.information
                                updated = true
                            }
                        })
                        if(updated == false)
                        {
                            user.activatedRoles.push(newRole)
                        }
                        user.save().then(
                            result=>{
                                res.status(200).send(true)
                            }
                        ).catch(err=>{
                            res.status(500).send({error: err})
                        })
                    }
                }
            )
        }
        catch(ex){
            console.log(ex)
            res.status(500).send(ex)
        }
    }
}