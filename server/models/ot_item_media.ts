import * as mongoose from 'mongoose';

const otItemMediaSchema = new mongoose.Schema({
  tracker: {type:String, ref: 'OTTracker', required: true},
  user: {type:String, ref: 'OTUser', required: true},
  item: {type:String, ref: 'OTItem', required: true},
  attrLocalId: {type: String, required: true, index: true},
  mimeType: {type: String, index: true},
  fileIdentifier: {type: String, index: true},
  originalFileSize: Number,
  originalFileName: String,
  processedFileNames: {type: [{processingType: String, fileName: String}], default: []}
}, {timestamps: true});

const OTItemMedia = mongoose.model('OTItemMedia', otItemMediaSchema);

export default OTItemMedia;
