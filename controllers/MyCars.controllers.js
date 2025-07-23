const express = require('express');
const router = express.Router();
const multer = require('multer');
const Garage = require('../models/Garag.js');
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

// VIEW USER'S CAR GARAGE (maintenance tracking & mods showcase)
router.get('/show.MyCars', isSignedIn, async (req, res) => {
    try {
        console.log('=== GARAGE ROUTE HIT ===');
        console.log('Accessing garage for user:', req.session.user._id);
        console.log('User ID type:', typeof req.session.user._id);
        
        // Try different query approaches
        const userId = req.session.user._id;
        console.log('Searching for cars with owner:', userId);
        
        // First, check all cars in garage collection
        const allGarageCars = await Garage.find({});
        console.log('Total cars in garage collection:', allGarageCars.length);
        
        // Then find user's cars
        const userCars = await Garage.find({ owner: userId }).sort({ createdAt: -1 });
        console.log('Found cars for user:', userCars.length);
        
        if (userCars.length > 0) {
            console.log('User cars:', userCars);
        } else {
            console.log('No cars found for user. Checking if any cars exist with different owner format...');
            const allCarsWithOwners = await Garage.find({}).select('owner');
            console.log('All car owners in database:', allCarsWithOwners);
        }
        
        res.render('MyCars/show-my-cars', {
            title: 'My Car Garage',
            userCars: userCars
        });
    } catch (error) {
        console.error('=== GARAGE ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).send('Error loading your garage: ' + error.message);
    }
});

// ADD NEW CAR TO GARAGE (for tracking, not for sale)
router.get('/add-car-to-garage', isSignedIn, (req, res) => {
    res.render('MyCars/add-car', {
        title: 'Add Car to Garage'
    });
});

// CREATE NEW CAR IN GARAGE
router.post('/add-car-to-garage', isSignedIn, upload.single('image'), async (req, res) => {
    try {
        console.log('Adding car to garage');
        console.log('Form data:', req.body);
        console.log('Uploaded file:', req.file);
        console.log('User:', req.session.user._id);
        
        const newCar = {
            make: req.body.make,
            model: req.body.model,
            year: parseInt(req.body.year),
            description: req.body.description || '',
            owner: req.session.user._id
        };

        // Add image path if file was uploaded
        if (req.file) {
            newCar.image = '/uploads/' + req.file.filename;
        } else {
            newCar.image = ''; // No image uploaded
        }

        console.log('Creating car:', newCar);
        const createdCar = await Garage.create(newCar);
        console.log('Car created successfully:', createdCar);
        
        res.redirect('/show.MyCars');
    } catch (error) {
        console.error('Error adding car to garage:', error);
        console.error('Error stack:', error.stack);
        res.status(500).send('Error adding car to garage: ' + error.message);
    }
});

// VIEW CAR DETAILS (maintenance & mods)
router.get('/my-cars/:id', isSignedIn, async (req, res) => {
    try {
        const car = await Garage.findOne({ 
            _id: req.params.id, 
            owner: req.session.user._id 
        }).populate('owner', 'username');
        
        if (!car) {
            return res.status(404).send('Car not found in your garage');
        }
        
        res.render('MyCars/car-detail', {
            title: `${car.make} ${car.model} - Details`,
            car: car
        });
    } catch (error) {
        console.error('Error fetching car details:', error);
        res.status(500).send('Error loading car details');
    }
});

// DEBUG: Check both collections for user's cars
router.get('/debug-cars', isSignedIn, async (req, res) => {
    try {
        console.log('=== DEBUG CARS ===');
        console.log('User ID:', req.session.user._id);
        
        // Check Garage collection
        const garageCars = await Garage.find({ owner: req.session.user._id });
        console.log('Cars in Garage collection:', garageCars.length, garageCars);
        
        // Check Listing collection
        const Listing = require('../models/listing-for-sale.js');
        const listingCars = await Listing.find({ seller: req.session.user._id });
        console.log('Cars in Listing collection:', listingCars.length, listingCars);
        
        res.json({
            garage: garageCars,
            listings: listingCars,
            userId: req.session.user._id
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE CAR FROM GARAGE
router.delete('/my-cars/:id', isSignedIn, async (req, res) => {
    try {
        console.log('Deleting car:', req.params.id);
        console.log('User:', req.session.user._id);
        
        const car = await Garage.findOne({ 
            _id: req.params.id, 
            owner: req.session.user._id 
        });
        
        if (!car) {
            return res.status(404).send('Car not found in your garage or you do not own this car');
        }
        
        await Garage.findByIdAndDelete(req.params.id);
        console.log('Car deleted successfully');
        
        res.redirect('/show.MyCars');
    } catch (error) {
        console.error('Error deleting car from garage:', error);
        res.status(500).send('Error deleting car from garage: ' + error.message);
    }
});

// SHOW EDIT FORM FOR CAR IN GARAGE
router.get('/my-cars/:id/edit', isSignedIn, async (req, res) => {
    try {
        console.log('Editing car:', req.params.id);
        const car = await Garage.findOne({ 
            _id: req.params.id, 
            owner: req.session.user._id 
        });
        
        if (!car) {
            return res.status(404).send('Car not found in your garage or you do not own this car');
        }
        
        res.render('MyCars/edit-my-car', {
            title: `Edit ${car.make} ${car.model}`,
            car: car
        });
    } catch (error) {
        console.error('Error loading edit form:', error);
        res.status(500).send('Error loading edit form: ' + error.message);
    }
});

// UPDATE CAR IN GARAGE
router.put('/my-cars/:id', isSignedIn, upload.single('image'), async (req, res) => {
    try {
        console.log('Updating car:', req.params.id);
        console.log('Update data:', req.body);
        console.log('Uploaded file:', req.file);
        
        const car = await Garage.findOne({ 
            _id: req.params.id, 
            owner: req.session.user._id 
        });
        
        if (!car) {
            return res.status(404).send('Car not found in your garage or you do not own this car');
        }
        
        // Update the car with new data
        const updatedData = {
            make: req.body.make,
            model: req.body.model,
            year: parseInt(req.body.year),
            description: req.body.description || ''
        };
        
        // Handle image update
        if (req.file) {
            // New file uploaded
            updatedData.image = '/uploads/' + req.file.filename;
        } else if (req.body.image) {
            // URL provided
            updatedData.image = req.body.image;
        } else {
            // Keep existing image
            updatedData.image = car.image;
        }
        
        await Garage.findByIdAndUpdate(req.params.id, updatedData);
        console.log('Car updated successfully');
        
        res.redirect(`/my-cars/${req.params.id}`);
    } catch (error) {
        console.error('Error updating car:', error);
        res.status(500).send('Error updating car: ' + error.message);
    }
});

// ADD MAINTENANCE RECORD
router.post('/my-cars/:id/maintenance', isSignedIn, async (req, res) => {
    try {
        console.log('Adding maintenance record to car:', req.params.id);
        console.log('Maintenance data:', req.body);
        
        const car = await Garage.findOne({ 
            _id: req.params.id, 
            owner: req.session.user._id 
        });
        
        if (!car) {
            return res.status(404).send('Car not found in your garage or you do not own this car');
        }

        const maintenanceRecord = {
            date: new Date(req.body.date),
            type: req.body.type,
            description: req.body.description,
            cost: parseFloat(req.body.cost) || 0,
            mileage: parseInt(req.body.mileage) || 0,
            createdAt: new Date()
        };

        // Initialize maintenanceLog if it doesn't exist
        if (!car.maintenanceLog) {
            car.maintenanceLog = [];
        }
        
        car.maintenanceLog.push(maintenanceRecord);
        await car.save();

        console.log('Maintenance record added successfully');
        res.redirect(`/my-cars/${req.params.id}`);
    } catch (error) {
        console.error('Error adding maintenance record:', error);
        res.status(500).send('Error adding maintenance record: ' + error.message);
    }
});

// ADD MODIFICATION RECORD
router.post('/my-cars/:id/modifications', isSignedIn, async (req, res) => {
    try {
        console.log('Adding modification to car:', req.params.id);
        console.log('Modification data:', req.body);
        
        const car = await Garage.findOne({ 
            _id: req.params.id, 
            owner: req.session.user._id 
        });
        
        if (!car) {
            return res.status(404).send('Car not found in your garage or you do not own this car');
        }

        const modification = {
            date: new Date(req.body.date),
            name: req.body.name,
            description: req.body.description,
            cost: parseFloat(req.body.cost) || 0,
            category: req.body.category,
            createdAt: new Date()
        };

        // Initialize modifications if it doesn't exist
        if (!car.modifications) {
            car.modifications = [];
        }
        
        car.modifications.push(modification);
        await car.save();

        console.log('Modification added successfully');
        res.redirect(`/my-cars/${req.params.id}`);
    } catch (error) {
        console.error('Error adding modification:', error);
        res.status(500).send('Error adding modification: ' + error.message);
    }
});

module.exports = router;
