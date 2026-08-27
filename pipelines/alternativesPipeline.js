// When a search comes back empty, this builds a pipeline that suggests in-stock medicines from the SAME CATEGORY as the one the customer searched
//  for, so the customer isn't left with a dead end.
function buildAlternativesPipeline({ category, excludeMedicineId, lng, lat, maxDistance = 20000 }) {
  const pipeline = [];
  const hasLocation = lng !== undefined && lat !== undefined && lng !== "" && lat !== "";

  if (hasLocation) {
    pipeline.push({
      $geoNear: {
        near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        distanceField: "distanceMeters",
        maxDistance: Number(maxDistance),
        spherical: true,
        query: { isActive: true },
      },
    });
  } else {
    pipeline.push({ $match: { isActive: true } });
  }

  pipeline.push(
    { $lookup: { from: "inventories", localField: "_id", foreignField: "pharmacy", as: "inventoryItem" } },
    { $unwind: "$inventoryItem" },
    { $match: { "inventoryItem.stock": { $gt: 0 } } },
    { $lookup: { from: "medicines", localField: "inventoryItem.medicine", foreignField: "_id", as: "medicine" } },
    { $unwind: "$medicine" },
    {
      $match: {
        "medicine.category": category,
        "medicine._id": { $ne: excludeMedicineId },
      },
    },
    {
      $group: {
        _id: "$medicine._id",
        medicine: { $first: "$medicine" },
        cheapestPrice: { $min: "$inventoryItem.price" },
        pharmacyCount: { $sum: 1 },
      },
    },
    { $sort: { cheapestPrice: 1 } },
    { $limit: 6 },
    {
      $project: {
        _id: 0,
        medicine: { _id: "$medicine._id", name: "$medicine.name", genericName: "$medicine.genericName", category: "$medicine.category" },
        cheapestPrice: 1,
        pharmacyCount: 1,
      },
    }
  );

  return pipeline;
}

module.exports = buildAlternativesPipeline;
