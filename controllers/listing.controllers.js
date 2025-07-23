const express = require('express')
const router = express.Router()
const Listing = require('../models/listing-for-sale.js');
const Comment = require('../models/comments');
const comment = require('./comment.controller.js');
const isSignedIn = require('../middleware/is-signed-in.js');

// VIEW ALL CARS FOR SALE
router.get('/cars-for-sale', async (req, res) => {
    const foundListings = await Listing.find({}).populate('seller', 'username').sort({ createdAt: -1 })
    res.render('listings/cars-for-sale', {
        title: 'Cars for Sale',
        foundListings: foundListings
    });
});

// VIEW NEW CAR LISTING FORM (requires authentication)
router.get('/add-car-for-sale', isSignedIn, (req, res) => {
    res.render('listings/Add-Car-For-Sale', {
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

    // Get comments for this listing
    const comments = await Comment.find({ listing: req.params.id })
        .populate('author', 'username')
        .sort({ createdAt: -1 })

    res.render('listings/show', {
        title: 'Car Details',
        listing,
        comments
    })
});

// VIEW EDIT CAR LISTING FORM (requires authentication and ownership)
router.get('/cars/:id/edit', isSignedIn, async (req, res) => {
    const listing = await Listing.findById(req.params.id)
    if (!listing) {
        return res.status(404).send('Listing not found')
    }
    // Check if current user is the owner
    if (listing.seller.toString() !== req.session.user._id) {
        return res.status(403).send('You can only edit your own listings')
    }
    res.render('listings/edit', {
        user: req.session.user,
        title: 'Edit Car Listing',
        listing
    })
});

// UPDATE CAR LISTING (requires authentication and ownership)
router.put('/cars/:id', isSignedIn, async (req, res) => {
    const listing = await Listing.findById(req.params.id)
    if (!listing) {
        return res.status(404).send('Listing not found')
    }
    // Check if current user is the owner
    if (listing.seller.toString() !== req.session.user._id) {
        return res.status(403).send('You can only edit your own listings')
    }

    await Listing.findByIdAndUpdate(req.params.id, req.body)
    res.redirect(`/cars/${req.params.id}`)
});

// DELETE CAR LISTING (requires authentication and ownership)
router.delete('/cars/:id', isSignedIn, async (req, res) => {
    const listing = await Listing.findById(req.params.id)
    if (!listing) {
        return res.status(404).send('Listing not found')
    }
    // Check if current user is the owner
    if (listing.seller.toString() !== req.session.user._id) {
        return res.status(403).send('You can only delete your own listings')
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
        title: 'Edit Car Listing',
        listing
    });
});

module.exports = router;