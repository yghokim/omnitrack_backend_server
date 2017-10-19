import * as mongoose from 'mongoose';

const otUserReportSchema = new mongoose.Schema({
  _id: {type: mongoose.Schema.Types.ObjectId, unique: true},
  user: {type: String, ref: 'OTUser', required: false},
  data: {}
}, {timestamps: true});

const OTUserReport = mongoose.model('OTUserReport', otUserReportSchema);

export default OTUserReport;
