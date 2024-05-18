const mongoose = require("mongoose");
const { type } = require("os");
const OrderSchema = mongoose.Schema({
  name: {
    type: String,
  },
  address: {
    type: String,
  },

  phone: {
    type: String,
  },

  orders: {
    type: [String],
  },
  pilotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAT: {
    type: String,
    default: () => new Date().toLocaleString(),
  },
  reason: {
    type: String,
  },
  reciept: {
    type: String,
    required: false,
  },
  updatedAt: {
    type: String,
    default: () => new Date().toLocaleString(),
  },

  deliveryPrice: {
    type: Number,
  },

  status: {
    type: String,
    enum: ["delivered", "active", "canceled"],
    default: "active",
  },
});
const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
