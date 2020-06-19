import * as mongoose from 'mongoose';

const otFieldSchema = new mongoose.Schema({
  _id: String, // this object id is not used as an index in server. it is only used in client.
  name: String,
  localId: String,
  trackerId: String,
  connection: mongoose.Schema.Types.Mixed,
  fallbackPolicy: String,
  fallbackPreset: String,
  type: Number,
  isRequired: Boolean,
  isHidden: { type: Boolean, default: false },
  isInTrashcan: { type: Boolean, default: false },
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  validators: { type: [{ _id: false, type: { type: String, required: true }, params: { type: [mongoose.Schema.Types.Mixed], required: false, default: null } }], defualt: [] },
  userCreatedAt: Number,
  userUpdatedAt: Number,
  lockedProperties: { type: mongoose.Schema.Types.Mixed, default: {} },
  flags: { type: Object, default: {} },
}, { _id: false });

const otDescriptionPanelSchema = new mongoose.Schema({
  localId: String,
  descriptionContent: { type: String, default: "No content", required: true }
}, { timestamps: false, _id: false })

const otTrackerSchema = new mongoose.Schema({
  _id: { type: String },
  name: String,
  color: Number,
  user: { type: String, ref: 'OTUser' },
  isBookmarked: { type: Boolean, default: false },
  position: Number,
  fields: { type: [otFieldSchema], default: [] },
  descriptionPanels: { type: [otDescriptionPanelSchema], default: [] },

  layout: {
    type: [
      {
        type: {
          type: String,
          enum: ["field", "desc"], required: true
        },
        reference: {
          type: String,
          required: true
        }
      }
    ], default: undefined
  },

  lockedProperties: { type: mongoose.Schema.Types.Mixed, default: {} },
  flags: { type: mongoose.Schema.Types.Mixed, default: {} },
  redirectUrl: { type: String, default: null },
  userCreatedAt: Number,
  userUpdateAt: Number,
  removed: { type: Boolean, index: true, default: false }
}, { timestamps: true });

const OTTracker = mongoose.model('OTTracker', otTrackerSchema);

OTTracker.collection.createIndex({ "flags.experiment": 1 })
OTTracker.collection.createIndex({ "flags.injectedId": 1 })


export default OTTracker;
