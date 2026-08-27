const Medicine = require("../models/medicineSchema");
const searchService = require("../services/searchService");

exports.getCatalog = async (req, res) => {
  try {
    const query = req.query["query"];

    const filter = query
      ? {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { genericName: { $regex: query, $options: "i" } },
        ],
      }
      : {};

    const medicines = await Medicine.find(filter).sort({ name: 1 }).limit(50);
    return res.status(200).json(medicines);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params["id"]);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    return res.status(200).json(medicine);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.createMedicine = async (req, res) => {
  try {
    if (!req.body["name"]) {
      return res.status(400).json({ message: "Medicine name is required" });
    }

    const medicine = await Medicine.create({
      name: req.body["name"],
      genericName: req.body["genericName"],
      category: req.body["category"],
      description: req.body["description"],
      requiresPrescription: !!req.body["requiresPrescription"],
      createdBy: req.user["_id"],
    });

    return res.status(201).json(medicine);

  } catch (err) {
    console.log(err);
    if (err["code"] === 11000) {
      return res.status(409).json({ message: "This medicine is already in the catalog" });
    }
    res.status(500).json({ message: err.message });

  }
};


exports.searchMedicines = async (req, res) => {
  try {
    const query = req.query["query"];
    const lng = req.query["lng"];
    const lat = req.query["lat"];
    const maxDistance = req.query["maxDistance"];

    const data = await searchService.searchMedicines({
      query: query,
      lng: lng,
      lat: lat,
      maxDistance: maxDistance,
    });

    return res.status(200).json(data);

  } catch (err) {
    console.log(err);
    res.status(err["statusCode"] || 500).json({ message: err.message });

  }
};
