exports.notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

exports.errorHandler = (err, req, res, next) => {
  console.log(err);

  let statusCode = err["statusCode"] || 500;
  let message = err["message"] || "Server error";

  if (err["code"] === 11000) {
    statusCode = 409;
    const field = Object.keys(err["keyValue"] || {}).join(", ");
    message = `Duplicate value for: ${field}`;
  }

  res.status(statusCode).json({ message: message });
};
