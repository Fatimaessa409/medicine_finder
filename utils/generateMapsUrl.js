module.exports = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }
  const lng = coordinates[0];
  const lat = coordinates[1];
  return `https://www.google.com/maps?q=${lat},${lng}`;
};
