const mongoose = require("mongoose");

const yourCarSchema = new mongoose.Schema({
    make: {
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    contactInfo: {
        type: String,
        required: true,
    },
}, {
    timestamps: true
});

const CarsForSale = mongoose.model("CarsForSale", yourCarSchema);
module.exports = CarsForSale;