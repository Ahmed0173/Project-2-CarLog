const express = require('express')
const router = express.Router()
const multer = require('multer')
const Listing = require('../models/listing-for-sale.js');
const Comment = require('../models/comments');
const comment = require('./comment.controller.js');
const isSignedIn = require('../middleware/is-signed-in.js');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage })

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
router.post('/cars', isSignedIn, upload.single('image'), async (req, res) => {
    try {
        console.log('Form data received:', req.body);
        console.log('User session:', req.session.user);
        console.log('Uploaded file:', req.file);

        // Validate required fields
        if (!req.body.make || !req.body.model || !req.body.year || !req.body.price || !req.body.contactInfo) {
            return res.status(400).send('Missing required fields')
        }

        // Create a new listing object
        const newListing = {
            make: req.body.make,
            model: req.body.model,
            year: parseInt(req.body.year),
            price: parseFloat(req.body.price),
            description: req.body.description || '',
            contactInfo: req.body.contactInfo,
            seller: req.session.user._id
        }

        // Add image path if file was uploaded
        if (req.file) {
            newListing.image = '/uploads/' + req.file.filename
        }

        console.log('Creating listing:', newListing);
        await Listing.create(newListing)
        res.redirect('/cars-for-sale')
    } catch (error) {
        console.error('Error creating listing:', error)
        res.status(500).send('Error creating listing: ' + error.message)
    }
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