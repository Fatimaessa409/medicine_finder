const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const commentSchema = new Schema({
  pharmacy: {
    type: Schema.Types.ObjectId,
    ref: "pharmacy",
    required: [true, "pharmacy is required"],

  },

  name: {
    type: String,
    required: [true, "name is required"],
    trim: true,
    maxLength: 80,

  },

rating: {
  type: Number,
  required: [true, "Rating is required"],
  min: [1, "Rating must be at least 1"],
  max: [5, "Rating cannot be greater than 5"],
},
  text: {
    type: String,
    trim: true,
    maxLength: 500,

  },

},
  { timestamps: true }
);


commentSchema.index({ pharmacy: 1, createdAt: -1 });

module.exports = mongoose.model("comment", commentSchema);
