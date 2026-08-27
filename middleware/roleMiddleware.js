// usage: authorize("admin", "pharmacy") - must run AFTER authMiddleware.protect
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user["role"])) {
      return res.status(403).json({ message: `Role '${req.user ? req.user["role"] : "guest"}' is not permitted to do this` });
    }
    next();

  };
};
