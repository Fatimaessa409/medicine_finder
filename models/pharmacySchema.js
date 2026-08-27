const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const pharmacySchema = new Schema({
  name: {
    type: String,
    required: [true, "Pharmacy name is required"],
    trim: true,
    minLength: 3,
    maxLength: 50,

  },
  email: {
    type: String,
    unique: true,
    required: [true, "email is required"],
    trim: true,
    maxLength: 150,
    lowercase: true,

  },
  password: {
    type: String,
    required: true,
    trim: true,
    minLength: 8,
  },
  passwordConfirm: {
    type: String,
    required: true,
    trim: true,
    minLength: 8,

  },
  passwordChangedAt: Date,


  ownerFirstName: {
    type: String,
    trim: true,
    required: [true, "FirstName is required"],
    maxLength:50,
  },

  ownerLastName: {
    type: String,
    trim: true,
    required: [true, "LastName  is required"],
    maxLength:50,
  },

    address: {
    type: String,
    required: [true, "Address is required"],
    trim: true,
    minLength: 3,
    maxLength: 50,
  },

  phone: {
    type: String,
    trim: true,
    maxLength: 30,

  },

  openingHours: {
    type: String,
    trim: true,
    default: "9:00 AM - 9:00 PM",

  },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // longitude, latitude
    },
  },

  isActive: {
    type: Boolean,
    default: true,
  },

},
  { timestamps: true }
);

pharmacySchema.index({ location: "2dsphere" });


pharmacySchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      return next();

    }

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
  } catch (err) {
    console.log(err)

  }
});
pharmacySchema.methods.checkPassword = async function (
  candidatePassword,//coming from the frontend 
  pharmacyPassword//the hashed saved password coming from the DB
) {
  return await bcrypt.compare(candidatePassword,pharmacyPassword);

}

module.exports = mongoose.model("pharmacy", pharmacySchema);
