import { RouterWrapper } from './server_utils';
import OTShortUrl from './models/ot_short_url';

export class ShortUrlRouter extends RouterWrapper {
  constructor(){
    super()

    this.router.get("/:shortId", (req, res) => {
      const shortId = req.params.shortId
      OTShortUrl.findOneAndUpdate({shortId: shortId}, {$inc: {visited: 1}}).then(
        doc => {
          if(doc){
            res.redirect("../../"+doc["longUrl"])
          }else{
            res.status(404).send("No shortened URL.")
          }
        }
      )
    })
  }
}