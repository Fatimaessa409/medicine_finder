const mongoose = require("mongoose");
const Comment = require("../models/commentSchema");
const Pharmacy = require("../models/pharmacySchema");

exports.getCommentsForPharmacy = async (req, res) => {
  try {
    const comments = await Comment.find({ pharmacy: req.params["pharmacyId"] })
      .sort({ createdAt: -1 });

    return res.status(200).json(comments);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.getMyPharmacyComments = async (req, res) => {
  try {
    const comments = await Comment.find({ pharmacy: req.user["_id"] })
      .sort({ createdAt: -1 });

    return res.status(200).json(comments);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

exports.addComment = async (req, res) => {
  try {
    if (!req.body["name"]) {
      return res.status(400).json({ message: "name is required" });
    }
    if (!req.body["rating"]) {
      return res.status(400).json({ message: "rating is required" });
    }

    const comment = await Comment.create({
      pharmacy: req.params["pharmacyId"],
      name: req.body["name"],
      rating: req.body["rating"],
      text: req.body["text"],
    });

    return res.status(201).json(comment);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};

// OnlyAdmin
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params["id"]);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    await comment.deleteOne();
    return res.status(200).json({ message: "Comment removed" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });

  }
};
