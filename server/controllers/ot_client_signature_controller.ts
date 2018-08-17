import OTClientSignature from '../models/ot_client_signature';

export default class OTClientSignatureCtrl {

  matchSignature(clientSignature: string, pkg: string): Promise<boolean> {
    return OTClientSignature.findOne({ key: clientSignature, package: pkg }).lean().then(doc => doc != null).catch(err => false)
  }

  /**
   * return: whether changed or not
   */
  upsertSignature(_id: string = null, key: string, packageName: string, alias: string, experimentId?: string, notify: boolean = true): Promise<boolean> {
    return OTClientSignature.findOne(_id ? { _id: _id } : { key: key, package: packageName }).then(
      doc => {
        if (doc) {
          let changed = false
          if (experimentId != null) {
            if (doc["experiments"] == null) {
              doc["experiments"] = [experimentId]
            } else if (doc["experiments"].indexOf(experimentId) === -1) {
              doc["experiments"].push(experimentId)
            }
            changed = true
          }
          if (doc["alias"] !== alias) {
            doc["alias"] = alias
            changed = true
          }
          if (changed === true) {
            return doc.save().then(() => true)
          } else return false
        } else {
          const val = {
            key: key,
            package: packageName,
            alias: alias,
            experiments: []
          } as any
          if (experimentId != null) {
            val.experiments.push(experimentId)
          }
          return new OTClientSignature(val).save().then(()=>true)
        }
      }
    )
  }

  // admin only apis
  getSignatures = (req, res) => {
    OTClientSignature.find({}).populate("experiments", {name: 1}).lean().then(
      signatures => {
        res.status(200).send(signatures)
      }
    ).catch(err => {
      res.status(500).send(err)
    })
  }

  postSignature = (req, res) => {
    this.upsertSignature(req.body._id, req.body.key, req.body.package, req.body.alias, req.body.experimentId, true).then(updated => {
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