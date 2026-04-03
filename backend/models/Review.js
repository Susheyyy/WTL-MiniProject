const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String
}, { timestamps: true });

reviewSchema.statics.calculateAverageRating = async function(businessId) {
  const stats = await this.aggregate([
    { $match: { business: businessId } },
    { $group: { _id: '$business', nRating: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Business').findByIdAndUpdate(businessId, {
      avgRating: stats[0].avgRating.toFixed(1),
      reviewCount: stats[0].nRating
    });
  }
};

reviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.business);
});

module.exports = mongoose.model('Review', reviewSchema);