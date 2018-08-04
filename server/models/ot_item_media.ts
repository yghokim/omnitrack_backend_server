import * as mongoose from 'mongoose';

const otItemMediaSchema = new mongoose.Schema({
  tracker: {type: String, ref: 'OTTracker', required: true},
  user: {type: String, ref: 'OTUser', required: true},
  item: {type: String, ref: 'OTItem', required: true},
  attrLocalId: {type: String, required: true, index: true},
  mimeType: {type: String, index: true},
  fileIdentifier: {type: String, index: true},
  originalFileSize: Number,
  originalFileName: String,
  processedFileNames: {type: mongoose.SchemaTypes.Mixed, default: {}},
  isInProcessing: {type: Boolean, default: false, index: true},
  isProcessed: {type: Boolean, default: false, index: true}
}, {timestamps: true});

const OTItemMedia = mongoose.model('OTItemMedia', otItemMediaSchema);

export default OTItemMedia;
