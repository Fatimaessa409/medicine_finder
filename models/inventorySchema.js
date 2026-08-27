const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const inventorySchema = new Schema({
  pharmacy: {
    type: Schema.Types.ObjectId,
    ref: "pharmacy",
    required: [true, "pharmacy is required"],

  },

  medicine: {
    type: Schema.Types.ObjectId,
    ref: "medicine",
    required: [true, "required"],

  },

  price: {
    type: Number,
    required: [true, "required"],
    min: [0,"price can not be negative"],
    default:0,

  },

  stock: {
    type: Number,
    required: [true, "required"],
    min: [0,"stock can not be negative"],
    default: 0,

  },

  addedBy: {
    type: Schema.Types.ObjectId,
    ref: "pharmacy",
    required: [true, "addedBy is required"],

  },

},
  { timestamps: true }
);

inventorySchema.index({ pharmacy: 1, medicine: 1 }, { unique: true });//pharmacy can only have 1 inventory row permedicine
module.exports = mongoose.model("inventory", inventorySchema);
