
import OTUser from '../models/ot_user';
import { convertHashToArray } from '../../shared_lib/utils';

export interface IDataStoreEntry {
  value: any,
  updatedAt?: number
}

export interface IDataStoreEntryWithKey {
  key: string,
  value: any,
  updatedAt?: number
}

export class OTUserDataStoreController {

  private readonly hashConvertFunc = (key, entry) => ({ key: key, value: entry.value, updatedAt: entry.updatedAt } as IDataStoreEntryWithKey)

  getDataStoreOfUser(userId: string): Promise<Array<IDataStoreEntryWithKey>> {
    return OTUser.findById(userId, { dataStore: true }).lean<any>().then(user => {
      if (user) {
        const obj = user["dataStore"]
        if (obj) {
          return convertHashToArray(obj, this.hashConvertFunc, true)
        } else { return [] }
      } else { return [] }
    })
  }

  getDataStoreValue(userId: string, key: string): Promise<IDataStoreEntry> {
    const select = {}
    select["dataStore." + key] = 1
    return OTUser.findById(userId, select).then(user => {
      if (user) {
        return user["dataStore"][key]
      } else { return null }
    })
  }

  setDataStoreValue(userId: string, key: string, value: any, timestamp: number, force: boolean = false): Promise<{ latestValue: any, updatedAt: number, replaced: boolean }> {
    const nestedKey = "dataStore." + key
    const nestedUpdatedAtKey = nestedKey + ".updatedAt"
    const query = { _id: userId }
    if (force !== true) {
      const keyNull = {}
      keyNull[nestedKey] = { $exists: false }
      const keyUpdatedAt = {}
      keyUpdatedAt[nestedUpdatedAtKey] = { $lt: timestamp }
      query["$or"] = [keyNull, keyUpdatedAt]
    }

    const setter = {}
    setter[nestedKey] = { value: value, updatedAt: timestamp }

    return OTUser.findOneAndUpdate(query, setter, { new: true, select: "dataStore" }).lean<any>().then(user => {
      if (user) {
        if (user.dataStore[key]) {
          return {
            latestValue: user.dataStore[key].value,
            updatedAt: user.dataStore[key].updatedAt,
            replaced: timestamp !== user.dataStore[key].updatedAt
          }
        } else {
          throw new Error("No value inserted. check your logic.")
        }
      } else {
        return null
      }
    })
  }

  setDataStore(userId: string, dataEntryList: Array<IDataStoreEntryWithKey>, force: boolean = false): Promise<Array<IDataStoreEntryWithKey>> {
    return OTUser.findById(userId, "dataStore").then(user => {
      if (user) {
        let changed = false
        if (user["dataStore"] == null) {
          user["dataStore"] = {}
          changed = true
        }

        dataEntryList.forEach(entry => {
          if (user["dataStore"][entry.key]) {
            if (force === true || user["dataStore"][entry.key].updatedAt < entry.updatedAt) {
              user["dataStore"][entry.key].value = entry.value
              user["dataStore"][entry.key].updatedAt = entry.updatedAt
              changed = true
            }
          } else {
            user["dataStore"][entry.key] = { value: entry.value, updatedAt: entry.updatedAt }
            changed = true
          }
        })

        const finalList = dataEntryList.map(entry => {
          return { key: user["dataStore"][entry.key], updatedAt: user["dataStore"][entry.updatedAt], value: user["dataStore"][entry.key].value }
        })

        if (changed === true) {
          user.markModified("dataStore")
          return user.save().then(() => {
            return finalList
          })
        } else { return finalList }
      } else { return [] }
    })
  }

  getDataStoreChangedAfter(userId: string, minUpdatedAt: number): Promise<Array<IDataStoreEntryWithKey>> {
    return this.getDataStoreOfUser(userId)
      .then(store => convertHashToArray(store, this.hashConvertFunc, true))
      .then(store => store.filter(entry => entry.updatedAt > minUpdatedAt))
  }
}

const userDataStoreCtrl = new OTUserDataStoreController()
export { userDataStoreCtrl }
