const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: false,
  },

  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    // minLength: 11,
    // maxLength: 11,
  },

  Role: {
    type: String,
    enum: {
      values: ["admin", "pilot"],
      message: "You entered not valid value",
    },

    image: {
      type: String,
      required: false,
    },
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  hasOrder: {
    type: Boolean,
    default: false,
  },
  orders: [
    {
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
      acceptation: {
        type: String,
        enum: ["accept", "canceled"],
      },
      cancellationReason: {
        type: String,
        required: function () {
          return this.Acceptation === "canceled";
        },
      },
    },
  ],
});
userSchema.pre("find", function (next) {
  this.populate({
    path: "orders.orderId",
    select: "",
  });
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
