import OTClientSignature from '../models/ot_client_signature';

export default class OTClientSignatureCtrl {

  matchSignature(clientSignature: string, pkg: string, experimentId?: string): Promise<boolean> {
    const query = { key: clientSignature, package: pkg, experiment: experimentId }
    return OTClientSignature.countDocuments(query).lean().then(count => count > 0).catch(err => false)
  }

  /**
   * return: whether changed or not
   */
  upsertSignature(_id: string = null, key: string, packageName: string, alias: string, experimentId: string = null, notify: boolean = true): Promise<boolean> {
    return OTClientSignature.findOneAndUpdate(_id ? { _id: _id } : { key: key, package: packageName, experiment: experimentId }, {
      key: key, package: packageName, experimentId: experimentId, alias: alias
    }, {upsert: true}).lean().then(result => true)
  }

  // admin only apis
  getSignatures = (req, res) => {
    OTClientSignature.find({}).populate("experiment", { name: 1 }).lean().then(
      signatures => {
        res.status(200).send(signatures)
      }
    ).catch(err => {
      res.status(500).send(err)
    })
  }

  postSignature = (req, res) => {
    console.log(JSON.stringify(req.body))
    this.upsertSignature(req.body._id, req.body.key, req.body.package, req.body.alias, req.body.experiment, true).then(updated => {
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
