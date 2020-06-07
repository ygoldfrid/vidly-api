const Joi = require("joi");
const mongoose = require("mongoose");

const Customer = mongoose.model(
  "Customer",
  new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    phone: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
    },
    isGold: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 255,
    },
  })
);

function validateCustomer(customer) {
  const schema = {
    name: Joi.string().min(3).max(50).required(),
    phone: Joi.string().min(3).max(50).required(),
    isGold: Joi.boolean(),
    address: Joi.string().min(3).max(255),
  };

  return Joi.validate(customer, schema);
}

exports.Customer = Customer;
exports.validate = validateCustomer;
