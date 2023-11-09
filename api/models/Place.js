const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  owner: {type:mongoose.Schema.Types.ObjectId, ref:'User'},
  title: String,
  address: String,
  photos: [String],
  description: String,
  perks: [String],
  extraInfo: String,
  checkIn: Number,
  checkOut: Number,
  maxGuests: Number,
  price: Number,
});

const imageURL = (doc) => {
  if (doc.photos) {
    const photos = [];
    doc.photos.forEach((image) => {
      const imageUrl = `${process.env.BASE_URL}/${image}`;
      photos.push(imageUrl);
    });
    doc.photos = photos;
  }
};

placeSchema.post("init", (doc) => {
  imageURL(doc);
});
placeSchema.post("save", (doc) => {
  imageURL(doc);
});

const PlaceModel = mongoose.model('Place', placeSchema);

module.exports = PlaceModel;