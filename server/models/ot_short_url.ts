import * as mongoose from 'mongoose';
const ShortId = require("shortid");

const otShortUrlSchema = new mongoose.Schema({
  shortId: {type: String, required: true, unique: true, default: ShortId.generate},
  longUrl: { type: String, required: true, unique: true },
  visited: { type: Number, default: 0}
}, { timestamps: true });


const OTShortUrl = mongoose.model('OTShortUrl', otShortUrlSchema);


export default OTShortUrl;
