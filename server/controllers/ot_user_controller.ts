import BaseCtrl from './base';
import * as mongoose from 'mongoose';
import OTUser from '../models/ot_user';
import * as firebaseAdmin from 'firebase-admin';

export default class OTUserCtrl extends BaseCtrl {
    model = OTUser

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
                            return OTUser.findOne({_id:uid})
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

    getDevices = (req, res)=>{
        const userId = res.locals.user.uid
        OTUser.findOne({_id: userId}).then(
            result=>
            {
                if(result==null)
                {
                    res.json([])
                }
                else res.json(result.devices || [])
            }
        ).catch(
            error=>{
                console.log(error)
                res.status(500).send(error)  
            }
        )
    }

    putDeviceInfo = (req, res)=>{
        const userId = res.locals.user.uid
        const deviceInfo = req.body
        this.getUserOrInsert(userId).then(
            user=>{
                console.log("insertedUser: ")
                console.log(user)
                var updated = false
                var localKey = null
                user.devices.forEach(device=>{
                    if(device.deviceId == deviceInfo.deviceId)
                    {
                        localKey = device.localKey
                        device.deviceId = deviceInfo.deviceId
                        device.instanceId = deviceInfo.instanceId
                        device.appVersion = deviceInfo.appVersion
                        device.firstLoginAt = deviceInfo.firstLoginAt
                        device.os = deviceInfo.os
                        updated = true
                    }
                })
                if(updated == false)
                {
                    localKey = user.deviceLocalKeySeed + 1
                    deviceInfo.localKey = localKey
                    user.deviceLocalKeySeed ++
                    user.devices.push(deviceInfo)
                    user.save(err=>{
                        console.log(err)
                        if(err==null)
                        {
                            res.json({result: "added", deviceLocalKey: localKey.toString(16)})
                        }
                        else res.status(500).send({error: "deviceinfo db update failed."})
                    })
                }
                else{
                    res.json({result: "updated", deviceLocalKey: localKey.toString(16)})
                }
            }
        )
    }
}