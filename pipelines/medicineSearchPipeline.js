// Builds the aggregation pipeline for the core "find my medicine nearby" feature.
// Starts from pharmacy (so $geoNear can use its 2dsphere index), joins in
// inventory + medicine, and filters/sorts the result.
//
// query        - required, matched against medicine name/genericName (case-insensitive)
// lng, lat     - optional customer coordinates; when given, results are geo-sorted
// maxDistance  - meters, only used when lng/lat are given (default 20km)
function buildMedicineSearchPipeline({ query, lng, lat, maxDistance = 20000 }) {
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
        $or: [
          { "medicine.name": { $regex: query, $options: "i" } },
          { "medicine.genericName": { $regex: query, $options: "i" } },
        ],
      },
    },
    {
      $project: {
        _id: "$inventoryItem._id",
        price: "$inventoryItem.price",
        stock: "$inventoryItem.stock",
        medicine: {
          _id: "$medicine._id",
          name: "$medicine.name",
          genericName: "$medicine.genericName",
          category: "$medicine.category",
          requiresPrescription: "$medicine.requiresPrescription",
        },
        pharmacy: {
          _id: "$_id",
          name: "$name",
          address: "$address",
          phone: "$phone",
          openingHours: "$openingHours",
          location: "$location",
        },
        distanceMeters: hasLocation ? { $round: ["$distanceMeters", 0] } : "$$REMOVE",
      },
    }
  );

  pipeline.push(hasLocation ? { $sort: { distanceMeters: 1 } } : { $sort: { price: 1 } });

  return pipeline;
}

module.exports = buildMedicineSearchPipeline;
