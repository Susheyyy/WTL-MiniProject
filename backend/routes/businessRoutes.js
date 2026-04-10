const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Review = require('../models/Review');
const { protect, authorize } = require('../middleware/auth');

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary Config (Ensure these are in your .env file)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { 
    folder: 'local-distro-businesses', 
    allowed_formats: ['jpg', 'png', 'jpeg'] 
  },
});

const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const { lat, lng, dist = 5000, category, page = 1, limit = 10 } = req.query;
    let query = {};
    const skip = (page - 1) * limit;

    if (lat && lng) {
      const radiusInRadians = parseFloat(dist) / 6378100; 
      query.location = {
        $geoWithin: {
          $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians]
        }
      };
    }
    
    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    const businesses = await Business.find(query)
      .limit(parseInt(limit))
      .skip(skip);
      
    const total = await Business.countDocuments(query);

    res.json({
      businesses,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error("Geospatial Error:", err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).populate('owner', 'name');
    if (!business) return res.status(404).json({ message: 'Business not found' });

    const reviews = await Review.find({ business: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ ...business.toObject(), reviews });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

router.post('/', protect, authorize('owner'), upload.single('image'), async (req, res) => {
  try {
    const { name, category, description, address, lng, lat } = req.body;

    if (!name || !category || !address || lng == null || lat == null) {
      return res.status(400).json({ message: 'Name, category, address, and coordinates are required' });
    }

    const parsedLng = parseFloat(lng);
    const parsedLat = parseFloat(lat);
    
    if (isNaN(parsedLng) || isNaN(parsedLat) ||
        parsedLng < -180 || parsedLng > 180 ||
        parsedLat < -90 || parsedLat > 90) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const imageUrl = req.file ? req.file.path : ''; 

    const newBusiness = new Business({
      owner: req.user.id,
      name,
      category,
      description,
      address,
      images: imageUrl ? [imageUrl] : [], 
      location: {
        type: 'Point',
        coordinates: [parsedLng, parsedLat],
      },
    });

    const savedBusiness = await newBusiness.save();
    res.status(201).json(savedBusiness);
  } catch (err) {
    res.status(400).json({ message: 'Error creating business', error: err.message });
  }
});

router.put('/:id', protect, authorize('owner'), async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    if (business.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this business' });
    }

    const { name, category, description, address, lng, lat } = req.body;
    const updates = { name, category, description, address };

    if (lng != null && lat != null) {
      const parsedLng = parseFloat(lng);
      const parsedLat = parseFloat(lat);
      if (isNaN(parsedLng) || isNaN(parsedLat)) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }
      updates.location = { type: 'Point', coordinates: [parsedLng, parsedLat] };
    }

    const updated = await Business.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Error updating business', error: err.message });
  }
});

router.get('/user/my-reviews', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('business', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your reviews' });
  }
});

router.get('/owner/customer-feedback', protect, authorize('owner'), async (req, res) => {
  try {
    const myBusinesses = await Business.find({ owner: req.user.id });
    const businessIds = myBusinesses.map(b => b._id);

    const reviews = await Review.find({ business: { $in: businessIds } })
      .populate('business', 'name')
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching customer feedback' });
  }
});

router.delete('/:id', protect, authorize('owner'), async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    if (business.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this business' });
    }

    await Business.findByIdAndDelete(req.params.id);
    await Review.deleteMany({ business: req.params.id });
    res.json({ message: 'Business deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting business', error: err.message });
  }
});

router.get('/my-businesses', protect, authorize('owner'), async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.user.id }); 
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your listings', error: err.message });
  }
});

router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const businessId = req.params.id;

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    if (business.owner.toString() === req.user.id) {
      return res.status(403).json({ message: "Owners cannot review their own business." });
    }

    const existing = await Review.findOne({ user: req.user.id, business: businessId });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this business' });
    }

    const review = await Review.create({
      user: req.user.id,
      business: businessId,
      rating: Number(rating),
      comment,
    });

    const reviews = await Review.find({ business: businessId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    await Business.findByIdAndUpdate(businessId, {
      avgRating: parseFloat(avgRating.toFixed(1)),
      reviewCount: reviews.length,
    });

    res.status(201).json(await review.populate('user', 'name'));
  } catch (err) {
    res.status(400).json({ message: 'Error adding review', error: err.message });
  }
});

module.exports = router;