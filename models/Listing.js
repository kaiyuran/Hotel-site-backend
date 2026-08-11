const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
    {
        _id: { type: String }
    },
    {
        collection: "listingsAndReviews",
        strict: false
    }
);

module.exports = mongoose.model("Listing", listingSchema);