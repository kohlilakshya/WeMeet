const mongoose = require("mongoose");

// Define the schema for storing file information
const FileSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  }
});

// Create and export the File model using the schema
module.exports = mongoose.model("File", FileSchema);
