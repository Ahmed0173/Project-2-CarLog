const mongoose = require('mongoose')

const maintenanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    cost: {
        type: Number,
        default: 0
    },
    mileage: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const modificationSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    cost: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const garageSchema = new mongoose.Schema({
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
    description: {
        type: String,
        default: '',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    image: {
        type: String,
        default: '',
    },
    maintenanceLog: [maintenanceSchema],
    modifications: [modificationSchema]
}, {
    timestamps: true
});

const Garage = mongoose.model("Garage", garageSchema);
module.exports = Garage;