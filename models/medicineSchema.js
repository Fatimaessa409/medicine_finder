const mongoose = require("mongoose");
const Schema = mongoose.Schema;


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

  createdBy: {
    type: Schema.Types.ObjectId,
    required: [true, "cretor required"],
    ref: "pharmacy",

  },

},
  { timestamps: true }
);


medicineSchema.index({ name: "text", genericName: "text", category: "text" });
medicineSchema.index({ name: 1, genericName: 1 }, { unique: true });

module.exports = mongoose.model("medicine", medicineSchema);
