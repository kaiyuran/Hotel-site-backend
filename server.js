const express = require("express");
const connectDB = require("./config/db");
const Listing = require("./models/Listing");

require("dotenv").config();

const app = express();

app.use(express.json());

connectDB();


app.get("/api/listings", async (req, res) => {
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

app.post("/api/listings/:id/book", async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.body;

    // 1. Basic validation
    if (!startDate || !endDate) {
        return res.status(400).json({ error: "Missing startDate or endDate" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid date format for startDate or endDate" });
    }

    if (end <= start) {
        return res.status(400).json({ error: "endDate must be after startDate" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startCompare = new Date(start);
    startCompare.setHours(0, 0, 0, 0);
    if (startCompare < today) {
        return res.status(400).json({ error: "startDate cannot be in the past" });
    }

    try {
        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ error: "Listing not found" });
        }

        // Initialize bookings if they don't exist
        if (!listing.bookings) {
            listing.bookings = [];
        }

        // 2. Overlap check: (newStart < existingEnd) AND (newEnd > existingStart)
        const hasOverlap = listing.bookings.some(booking => {
            const existingStart = new Date(booking.startDate);
            const existingEnd = new Date(booking.endDate);
            return (start < existingEnd) && (end > existingStart);
        });

        if (hasOverlap) {
            return res.status(400).json({ error: "The listing is already booked for the selected dates" });
        }

        // 3. Save booking
        const newBooking = { startDate: start, endDate: end };
        listing.bookings.push(newBooking);
        await listing.save();

        res.status(201).json({
            message: "Booking successful",
            booking: newBooking
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        if (error.name === "CastError" && error.kind === "ObjectId") {
            return res.status(400).json({ error: "Invalid listing ID format" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

// console.log(process.env.MONGO_URI);

app.listen(process.env.PORT, () => {
    console.log('listening on port http://localhost:'+ process.env.PORT);
})
