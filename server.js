const express = require("express");
const connectDB = require("./config/db");
const Listing = require("./models/Listing");
const Booking = require("./models/Booking");
const authenticate = require("./authentication/auth");
require("dotenv").config();

const app = express();

app.use(express.json());

connectDB();


app.get("/api/listings", async (req, res) => { //get listings
    const query = {};
    if (req.query.numBeds) {
        const numBeds = parseInt(req.query.numBeds, 10);
        if (!isNaN(numBeds)) {
            query.beds = numBeds;
        }
    }

    try {
        const listings = await Listing.find(query)
            .limit(20);

        res.json(listings);
    } catch (error) {
        console.error("Error fetching listings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/listings/:id", async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .select("-reviews"); //skip reviews

        if (!listing) {
            return res.status(404).json({
                error: "Listing not found"
            });
        }

        res.json(listing);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
});

app.post("/api/listings/:id/book", authenticate, async (req, res) => {

    const { id } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({
            error: "Missing startDate or endDate"
        });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
            error: "Invalid date format"
        });
    }

    if (end <= start) {
        return res.status(400).json({
            error: "endDate must be after startDate"
        });
    }

    try {
        const listing = await Listing.findById(id);

        if (!listing) {
            return res.status(404).json({
                error: "Listing not found"
            });
        }

        const overlappingBooking = await Booking.findOne({
            listingId: id,
            status: "confirmed",
            startDate: { $lt: end },
            endDate: { $gt: start }
        });

        if (overlappingBooking) {
            return res.status(400).json({
                error: "The listing is already booked for the selected dates"
            });
        }

        const booking = await Booking.create({
            userId: req.user.$id,
            listingId: id,
            startDate: start,
            endDate: end,
            status: "confirmed"
        });

        res.status(201).json({
            message: "Booking successful",
            booking
        });

    } catch (error) {
        console.error("Error creating booking:", error);

        res.status(500).json({
            error: "Internal server error"
        });
    }
}
);

app.get("/api/bookings", authenticate, async (req, res) => {
    try {
        const bookings = await Booking.find({
            userId: req.user.$id
        }).sort({ createdAt: -1 });

        res.json(bookings);

    } catch (error) {
        console.error("Error fetching bookings:", error);

        res.status(500).json({
            error: "Internal server error"
        });
    }
});

app.get("/api/test/clear-bookings", async (req, res) => {
    try {
        const result = await Booking.deleteMany({});

        res.json({
            message: "All bookings deleted",
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Error deleting bookings:", error);

        res.status(500).json({
            error: "Failed to delete bookings"
        });
    }
});






// console.log(process.env.MONGO_URI);

app.listen(process.env.PORT, () => {
    console.log('listening on port http://localhost:' + process.env.PORT);
})
