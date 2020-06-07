const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { Rental } = require("../models/rental");
const { Movie } = require("../models/movie");
const Joi = require("joi");
const express = require("express");
const router = express.Router();

router.post("/", [auth, validate(validateReturn)], async (req, res) => {
  const rental = await Rental.lookup(req.body.customerId, req.body.movieId);
  if (!rental) return res.status(404).send("Rental not found");

  if (rental.dateReturned)
    return res.status(400).send("Return already processed");

  rental.return();
  await rental.save();

  await Movie.update({ _id: rental.movie._id }, { $inc: { numberInStock: 1 } });

  res.send(rental);
});

function validateReturn(genre) {
  const schema = {
    customerId: Joi.objectId().required(),
    movieId: Joi.objectId().required(),
  };

  return Joi.validate(genre, schema);
}

module.exports = router;
