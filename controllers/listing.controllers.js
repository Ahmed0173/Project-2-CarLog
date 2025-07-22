const express = require('express')
const router = express.Router()
const Listing = require('../models/listing-for-sale.js');

// Simple authentication middleware
const isSignedIn = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/auth/sign-in');
    }
};

// VIEW ALL CARS FOR SALE
router.get('/cars-for-sale', async (req, res) => {
    const foundListings = await Listing.find({}).populate('seller', 'username').sort({ createdAt: -1 })
    res.render('listings/cars-for-sale', {
        user: req.session.user,
        title: 'Cars for Sale',
        foundListings: foundListings
    });
});

// VIEW NEW CAR LISTING FORM (requires authentication)
router.get('/add-car-for-sale', isSignedIn, (req, res) => {
    res.render('listings/Add-Car-For-Sale', {
        user: req.session.user,
        title: 'Add Car for Sale'
    });
});

// POST FORM DATA TO DATABASE (requires authentication)
router.post('/cars', isSignedIn, async (req, res) => {
    // Add the current user as the seller
    req.body.seller = req.session.user._id
    
    await Listing.create(req.body)
    res.redirect('/cars-for-sale')
});

// VIEW INDIVIDUAL CAR LISTING
router.get('/cars/:id', async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate('seller', 'username')
    if (!listing) {
        return res.status(404).send('Listing not found')
    }

    res.render('listings/show', {
        user: req.session.user,
        title: 'Car Details',
        listing
    })
});

// VIEW EDIT CAR LISTING FORM (requires authentication)
router.get('/cars/:id/edit', isSignedIn, async (req, res) => {
    const listing = await Listing.findById(req.params.id)
    if (!listing) {
        return res.status(404).send('Listing not found')
    }
    res.render('listings/edit', {
        user: req.session.user,
        title: 'Edit Car Listing',
        listing
    })
});

// UPDATE CAR LISTING (requires authentication)
router.put('/cars/:id', isSignedIn, async (req, res) => {
    const listing = await Listing.findById(req.params.id)
    if (!listing) {
        return res.status(404).send('Listing not found')
    }

    await Listing.findByIdAndUpdate(req.params.id, req.body)
    res.redirect(`/cars/${req.params.id}`)
});

// DELETE CAR LISTING (requires authentication)
router.delete('/cars/:id', isSignedIn, async (req, res) => {
    const listing = await Listing.findById(req.params.id)
    if (!listing) {
        return res.status(404).send('Listing not found')
    }
    await Listing.findByIdAndDelete(req.params.id)
    res.redirect('/cars-for-sale')
});

// Edit car listing details (requires authentication)
router.get('/cars/:id/edit', isSignedIn, async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        return res.status(404).send('Listing not found');
    }
    res.render('listings/edit', {
        user: req.session.user,
        title: 'Edit Car Listing',
        listing
    });
});

module.exports = router;