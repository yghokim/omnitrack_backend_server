import * as mongoose from 'mongoose';

const otUserReportSchema = new mongoose.Schema({
  user: {type: String, ref: 'OTUser', required: false},
  data: {}
}, {timestamps: true});

const OTUserReport = mongoose.model('OTUserReport', otUserReportSchema);

export default OTUserReport;
