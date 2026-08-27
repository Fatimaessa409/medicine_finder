const Inventory = require("../models/inventorySchema");
// const mongoose = require("mongoose");
const Medicine = require("../models/medicineSchema");

exports.addInventory = async (req, res) => {
  try {
    if (!req.user || req.user["role"] !== "pharmacy") {
      return res.status(403).json({
        message: "Only a pharmacy can manage inventory",
      });
    }

    if (req.body["price"] === undefined || req.body["stock"] === undefined) {
      return res.status(400).json({ message: "price and stock are required" });
    }

    const price = Number(req.body["price"]);
    const stock = Number(req.body["stock"]);

    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({
        message: "Price must be a valid number greater than or equal to 0",
      });
    }

    if (!Number.isFinite(stock) || stock < 0) {
      return res.status(400).json({
        message: "Stock must be a valid number greater than or equal to 0",
      });
    }

    const medicineId = req.body["medicineId"];
    const newMedicine = req.body["newMedicine"];
    let medicine;

    if (medicineId) {
      medicine = await Medicine.findById(medicineId);
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found in catalog" });
      }

    } else if (newMedicine && newMedicine["name"]) {
      medicine = await Medicine.findOneAndUpdate(
        { name: newMedicine["name"], genericName: newMedicine["genericName"] || "" },
        {
          $setOnInsert: {
            name: newMedicine["name"],
            genericName: newMedicine["genericName"],
            category: newMedicine["category"] || "General",
            description: newMedicine["description"],
            requiresPrescription: !!newMedicine["requiresPrescription"],
            createdBy: req.user["_id"],
          },
        },
        { upsert: true, new: true }
      ); // findOneAndUpdate + upsert: avoids creating duplicates

    } else {
      return res.status(400).json({ message: "Provide medicineId or newMedicine.name" });
    }

    const inventory = await Inventory.findOneAndUpdate(
      { pharmacy: req.user["_id"], medicine: medicine["_id"] },
      {
        $set: {
          price: price,
          stock: stock,
          addedBy: req.user["_id"],
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).populate("medicine");


    const result = {
      ...inventory.toObject(),
      availability: inventory["stock"] > 0
        ? "In stock"
        : "Out of stock",
    };
    return res.status(201).json(result);

  } catch (err) {
    console.log(err);

    if (err["code"] === 11000) {
      return res.status(409).json({
        message:
          "This medicine already exists in this pharmacy's inventory",
      });
    }
    res.status(500).json({ message: err.message });

  }
};

exports.getMyInventory = async (req, res) => {
  try {

    if (!req.user || req.user["role"] !== "pharmacy") {
      return res.status(403).json({
        message: "Only a pharmacy can manage inventory",
      });
    }
    const items = await Inventory.find({ pharmacy: req.user["_id"] })
      .populate("medicine")
      .sort({ createdAt: -1 });

    const result = items.map((item) => ({
      ...item.toObject(),
      availability: item["stock"] > 0 ? "In stock" : "Out of stock",
    }));

    return res.status(200).json(result);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.getInventoryByPharmacy = async (req, res) => {
  try {
    const filter = { pharmacy: req.params["pharmacyId"] };
    if (req.query["inStock"] === "true") {
      filter["stock"] = { $gt: 0 };
    }

    const items = await Inventory.find(filter).populate("medicine").sort({ "medicine.name": 1 });

    const result = items.map((item) => ({
      ...item.toObject(),
      availability: item["stock"] > 0 ? "In stock" : "Out of stock",
    }));

    return res.status(200).json(result);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

// only the pharmacy that owns the inventory can update
exports.updateInventory = async (req, res) => {
  try {

    if (!req.user || req.user["role"] !== "pharmacy") {
      return res.status(403).json({
        message: "Only a pharmacy can manage inventory",
      });
    }

    const item = await Inventory.findById(req.params["id"]);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    if (item["pharmacy"].toString() !== req.user["_id"].toString()) {
      return res.status(403).json({ message: "Not authorized to update this inventory item" });
    }

    // if (req.body["price"] !== undefined) item["price"] = Number(req.body["price"]);
    // if (req.body["stock"] !== undefined) item["stock"] = Number(req.body["stock"]);

    if (req.body["price"] !== undefined) {
      const price = Number(req.body["price"]);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          message: "Price must be a valid number greater than or equal to 0",
        });
      }

      item["price"] = price;
    }

    if (req.body["stock"] !== undefined) {
      const stock = Number(req.body["stock"]);

      if (!Number.isFinite(stock) || stock < 0) {
        return res.status(400).json({
          message: "Stock must be a valid number greater than or equal to 0",
        });
      }

      item["stock"] = stock;
    }

    await item.save();
    await item.populate("medicine");

    const result = {
      ...item.toObject(),
      availability:
        item["stock"] > 0
          ? "In stock"
          : "Out of stock",
    };

    return res.status(200).json(result);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.deleteInventory = async (req, res) => {
  try {

    if (!req.user || req.user["role"] !== "pharmacy") {
      return res.status(403).json({
        message: "Only a pharmacy can manage inventory",
      });
    }
    const item = await Inventory.findById(req.params["id"]);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    if (item["pharmacy"].toString() !== req.user["_id"].toString()) {
      return res.status(403).json({ message: "Not authorized to delete this inventory item" });
    }

    await item.deleteOne();
    return res.status(200).json({ message: "Inventory item removed" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};