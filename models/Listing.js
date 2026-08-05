const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
}, { _id: false });

const listingSchema = new mongoose.Schema(
    {
        _id: { type: String },
        bookings: [bookingSchema]
    },
    {
        collection: "listingsAndReviews",
        strict: false
    }
);

module.exports = mongoose.model("Listing", listingSchema);