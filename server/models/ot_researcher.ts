import * as mongoose from 'mongoose';
import * as uuid from 'uuid';

const otResearcherSchema = new mongoose.Schema({
  _id: {type: String, default: uuid.v1},
  alias: String,
  email: { type: String, unique: true, required: true },
  hashed_password: { type: String, required: true },
  passwordSetAt: Date, 
  password_reset_token: { type: String },
  reset_token_expires: Date,
}, {timestamps: true, toJSON: {virtuals: true}});

otResearcherSchema.virtual('managingExperiments', {
  ref: 'OTExperiment',
  localField: '_id',
  foreignField: 'manager',
  justOne: false
})

otResearcherSchema.virtual('collaboratingExperiments', {
  ref: 'OTExperiment',
  localField: '_id',
  foreignField: 'experimenters.researcher',
  justOne: false
})

const OTResearcher = mongoose.model('OTResearcher', otResearcherSchema);


export default OTResearcher;
