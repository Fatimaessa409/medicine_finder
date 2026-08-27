const mongoose = require("mongoose");

// Builds a $facet aggregation over a pharmacy's inventory that returns, in
// one round trip: overall summary numbers, a per-category breakdown, and the
// current low-stock items needing restock.
function buildDashboardPipeline(pharmacyId, { lowStockThreshold = 5 } = {}) {
  const pharmacyObjectId = new mongoose.Types.ObjectId(pharmacyId);

  return [
    { $match: { pharmacy: pharmacyObjectId } },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalItems: { $sum: 1 },
              totalStockUnits: { $sum: "$stock" },
              totalInventoryValue: { $sum: { $multiply: ["$price", "$stock"] } },
              lowStockCount: { $sum: { $cond: [{ $lt: ["$stock", lowStockThreshold] }, 1, 0] } },
              outOfStockCount: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } },
            },
          },
          { $project: { _id: 0 } },
        ],
        byCategory: [
          { $lookup: { from: "medicines", localField: "medicine", foreignField: "_id", as: "med" } },
          { $unwind: "$med" },
          { $group: { _id: "$med.category", itemCount: { $sum: 1 }, totalStock: { $sum: "$stock" } } },
          { $sort: { itemCount: -1 } },
          { $project: { category: "$_id", itemCount: 1, totalStock: 1, _id: 0 } },
        ],
        lowStockItems: [
          { $match: { stock: { $lt: lowStockThreshold } } },
          { $lookup: { from: "medicines", localField: "medicine", foreignField: "_id", as: "med" } },
          { $unwind: "$med" },
          { $project: { name: "$med.name", stock: 1, price: 1, _id: 0 } },
          { $sort: { stock: 1 } },
          { $limit: 10 },
        ],
      },
    },
  ];
}

module.exports = buildDashboardPipeline;
