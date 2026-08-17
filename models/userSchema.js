const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");


const userSchema = new Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
    minLength: 3,
    maxLength: 50,

  },

  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
    minLength: 3,
    maxLength: 50,

  },

  username: {
    type: String,
    unique: true,
    required: [true, "username is required"],
    trim: true,
    maxLength: 20,

  },

  Email: {
    type: String,
    unique: true,
    required: [true, "Email is required"],
    trim: true,
    maxLength: 150,
    lowercase: true,

  },

  phonenumber: {
    type: String,
    unique: true,
    required: [true, "phone number is required"],
    trim: true,
    maxLength: 150,

  },


  password: {
    type: String,
    required: true,
    trim: true,
    minLength: 8,
    //    select: false, // never returned by default - use .select("+password") in login

  },
  passwordConfirm: {
    type: String,
    required: true,
    trim: true,
    minLength: 8,

  },
  passwordChangedAt: Date,

  role: {
    type: String,
    //enum: ['admin', 'pharmacy', 'customer'],
      enum: ['admin','customer'],
    default: 'customer',
  },


  // pharmacy: {
  //   type: Schema.Types.ObjectId,
  //   ref: "pharmacy",
  //   default: null,
  // },

  savedMedicines:[{
    type: Schema.Types.ObjectId,
    ref: "medicine",
  }],


  isActive: {
    type: Boolean,
    default: true,
  },

},
  { timestamps: true }
);


userSchema.pre("save", async function (next) {
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
userSchema.methods.checkPassword = async function (
  candidatePassword,//coming from the frontend 
  userPassword//the hashed saved password coming from the DB
) {
  return await bcrypt.compare(candidatePassword, userPassword);

}
module.exports = mongoose.model("User", userSchema);
