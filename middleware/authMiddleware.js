const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
const Pharmacy = require("../models/pharmacySchema");


// Verifies the JWT and attaches req.user - regardless of whether the token
// belongs to a User (admin/customer) or a pharmacy logging in with its own
// email/password. Both end up as req.user with a consistent "role" field so
// the rest of the app (authorize, ownership checks) doesn't need to care
// which collection the account actually lives in.
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded["type"] === "pharmacy") {
      const pharmacy = await Pharmacy.findById(decoded["id"]);
      if (!pharmacy) {
        return res.status(401).json({ message: "Not authorized, pharmacy no longer exists" });
      }

      // normalize into the same shape the rest of the app expects: an
      // object with _id and role, so authorize("pharmacy") and ownership
      // checks (req.user["_id"]) work identically for both account types
      req.user = {
        _id: pharmacy["_id"],
        role: "pharmacy",
        name: pharmacy["name"],
        email: pharmacy["email"],
        isActive: pharmacy["isActive"],
      };

    } else {
      const user = await User.findById(decoded["id"]);
      if (!user) {
        return res.status(401).json({ message: "Not authorized, user no longer exists" });
      }

      req.user = user;
    }

    next();

  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: "Not authorized, invalid or expired token" });

  }
};
