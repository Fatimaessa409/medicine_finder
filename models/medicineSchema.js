const mongoose = require("mongoose");
const Schema = mongoose.Schema;


// Global medicine CATALOG - one entry shared by every pharmacy that stocks it.
// Price and stock per pharmacy live in inventorySchema, not here.
const medicineSchema = new Schema({
  name: {
    type: String,
    required: [true, "Medicine name is required"],
    trim: true,
    maxLength: 150,

  },

  genericName: {
    type: String,
    trim: true,
    maxLength: 150,

  },

  category: {
    type: String,
    trim: true,
    maxLength: 80,
    default: "General",

  },

  description: {
    type: String,
    trim: true,
    maxLength: 500,

  },

  requiresPrescription: {
    type: Boolean,
    default: false,
  },

  // catalog entries can be added by either an admin (User) or a pharmacy -
  // refPath makes this a polymorphic reference resolved by createdByModel
  createdByModel: {
    type: String,
    enum: ["User", "pharmacy"],
    required: [true, "createdByModel is required"],

  },

  createdBy: {
    type: Schema.Types.ObjectId,
    required: [true, "createdBy is required"],
    refPath: "createdByModel",

  },

},
  { timestamps: true }
);


medicineSchema.index({ name: "text", genericName: "text", category: "text" });
medicineSchema.index({ name: 1, genericName: 1 }, { unique: true });

module.exports = mongoose.model("medicine", medicineSchema);
