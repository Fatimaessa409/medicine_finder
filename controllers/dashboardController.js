const Inventory = require("../models/inventorySchema");
const buildDashboardPipeline = require("../pipelines/dashboardPipeline");

exports.getPharmacyDashboard = async (req, res) => {
  try {
    const pipeline = buildDashboardPipeline(req.user["_id"]);
    const facetResult = await Inventory.aggregate(pipeline);

    const summary = facetResult[0]["summary"][0] || {
      totalItems: 0,
      totalStockUnits: 0,
      totalInventoryValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };

    return res.status(200).json({
      summary: summary,
      byCategory: facetResult[0]["byCategory"],
      lowStockItems: facetResult[0]["lowStockItems"],
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};
