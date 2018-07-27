import OTClientSignature from '../models/ot_client_signature';

export default class OTClientSignatureCtrl {

  matchSignature(clientSignature: string, pkg: string): Promise<boolean> {
    return OTClientSignature.findOne({ key: clientSignature, package: pkg }).lean().then(doc => doc != null).catch(err => false)
  }

  /**
   * return: whether changed or not
   */
  upsertSignature(_id: string = null, key: string, packageName: string, alias: string, notify: boolean = true): Promise<boolean> {
    return new Promise((resolve, reject) => {
      OTClientSignature.findOneAndUpdate(_id ? { _id: _id } : { key: key, package: packageName }, { key: key, package: packageName, alias: alias }, { upsert: true, new: false, rawResult: true }, (err, raw: any) => {
        if (err) {
          reject(err)
        } else {
          let collectionChanged = false
          if (raw) {
            if (raw.ok === 1) {
              if (raw.lastErrorObject.updatedExisting) {
                if (raw.lastErrorObject.key !== key || raw.lastErrorObject.alias !== alias || raw.lastErrorObject.package !== packageName) {
                  resolve(true)
                  collectionChanged = true
                } else {
                  resolve(false)
                  collectionChanged = false
                }
              } else {
                // new inserted
                resolve(true)
                collectionChanged = true
              }
            } else {
              reject("raw query ok is 0")
            }
          } else {
            // new result was null -> new upserted.
            resolve(true)
            collectionChanged = true
          }

          if (collectionChanged === true && notify === true) {
            // notify via socket
          }
        }
      })
    })
  }

  // admin only apis
  getSignatures = (req, res) => {
    OTClientSignature.find({}).lean().then(
      signatures => {
        res.status(200).send(signatures)
      }
    ).catch(err => {
      res.status(500).send(err)
    })
  }

  postSignature = (req, res) => {
    this.upsertSignature(req.body._id, req.body.key, req.body.package, req.body.alias, true).then(updated => {
      res.status(200).send(updated)
    }).catch(err => {
      res.status(500).send(err)
    })
  }

  removeSignature = (req, res) => {
    OTClientSignature.findByIdAndRemove(req.params.id).then(
      removed => {
        res.status(200).send(removed != null)
      }
    ).catch(err => {
      res.status(500).send(err)
    })
  }
}

const clientSignatureCtrl = new OTClientSignatureCtrl()
export { clientSignatureCtrl }