const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Review = require('../models/Review');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/businesses
 * @desc    Discover businesses (filter by location, category, distance)
 */
router.get('/', async (req, res) => {
  try {
    const { lat, lng, dist = 5000, category } = req.query;
    let query = {};

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(dist),
        },
      };
    }

    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    const businesses = await Business.find(query);
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

/**
 * @route   GET /api/businesses/:id
 * @desc    Get a single business with its reviews
 */
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

/**
 * @route   POST /api/businesses
 * @desc    Create a new business (owner only)
 */
router.post('/', protect, authorize('owner'), async (req, res) => {
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

    const newBusiness = new Business({
      owner: req.user.id,
      name,
      category,
      description,
      address,
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

/**
 * @route   PUT /api/businesses/:id
 * @desc    Update a business (owner only, must own it)
 */
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

/**
 * @route   DELETE /api/businesses/:id
 * @desc    Delete a business (owner only, must own it)
 */
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

/**
 * @route   POST /api/businesses/:id/reviews
 * @desc    Add a review (one per user per business)
 */

// Get businesses owned by the current user
router.get('/my-businesses', protect, authorize('owner'), async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.user.id });
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your businesses' });
  }
});

router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const businessId = req.params.id;

    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    // Prevent duplicate reviews
    const existing = await Review.findOne({ user: req.user.id, business: businessId });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this business' });
    }

    const review = await Review.create({
      user: req.user.id,
      business: businessId,
      rating: parsedRating,
      comment,
    });

    const reviews = await Review.find({ business: businessId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await Business.findByIdAndUpdate(businessId, {
      avgRating: parseFloat(avgRating.toFixed(1)),
      reviewCount: reviews.length,
    });

    const populated = await review.populate('user', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: 'Error adding review', error: err.message });
  }
});

module.exports = router;