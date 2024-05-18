const Order = require("../models/order.schema");
const User = require("../models/user.schema");
const io = require("../app");
const { Socket } = require("socket.io");
const path = require("path");
exports.CreateOrder = async (req, res, next) => {
  const { name, phone, address, orders = [], deliveryPrice } = req.body;
  const unifiedName = name.toLowerCase().trim();

  try {
    // const parsedOrders = JSON.parse(orders);
    const newOrder = new Order({
      name: unifiedName,
      address: address,
      phone: phone,
      orders: orders,
      deliveryPrice: deliveryPrice,
    });

    await newOrder.save();
    return res.status(200).json({
      status: 200,
      message: "Order created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// get order by Id

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        status: 404,
        message: "order not found",
      });
    }
    return res.status(200).json({
      status: 200,
      message: "order found successfully",
      data: {
        id: order._id,
        name: order.name,
        address: order.address,
        phone: order.phone,
        order: order.orders,
        createdAT: order.createdAT,
        updatedAt: order.updatedAt,
        status: order.status,
        deliveryPrice: order.deliveryPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    // Parse query parameters into integers
    const page = parseInt(req.query.page) || 1;
    const pagination = parseInt(req.query.pagination) || 10;
    const filter = {};
    console.log(new Date(req.query.date).toLocaleDateString());
    req.query.status ? (filter.status = req.query.status) : "";
    req.query.date
      ? (filter.createdAT = {
          $regex: new Date(req.query.date).toLocaleDateString(),
        })
      : "";
    req.query.pilotId ? (filter.pilotId = req.query.pilotId) : "";
    // Count total orders
    const totalOrders = await Order.countDocuments(filter);
    console.log(filter);
    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / pagination);

    // Find orders for the current page
    const orders = await Order.find(filter)
      .sort({ createdAT: 1 }) // Fix typo in createdAt
      .skip((page - 1) * pagination)
      .limit(pagination)
      .populate({ path: "pilotId", select: "username -_id " });

    return res.status(200).json({
      status: 200,
      message: "Orders found successfully",
      data: orders,
      meta: {
        currentPage: page,
        totalPages: totalPages,
        lastPage: totalPages, // Assuming last page equals total pages
        totalOrders: totalOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.editOrder = async (req, res, next) => {
  const { name, address, phone, orders, deliveryPrice } = req.body;

  const unifiedName = name?.toLowerCase()?.trim();

  try {
    const updatedValues = {
      name: unifiedName,
      address: address,
      phone: phone,
      orders,
      deliveryPrice: deliveryPrice,
      updatedAt: new Date().toLocaleString(),
    };

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: req.params.id },
      updatedValues,
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        status: 404,
        message: "Order not found",
      });
    } else {
      // Emit event to pilot if pilotId is found
      if (updatedOrder.pilotId) {
        const pilotId = updatedOrder.pilotId;
        const socketId = req.userSocketIds[pilotId]; // Retrieve socket ID using user ID
        if (socketId) {
          req.io.to(socketId).emit("orderUpdated", { updatedOrder, pilotId });
        }
      }

      return res.status(200).json({
        status: 200,
        message: "Order updated successfully",
        data: {
          id: updatedOrder._id,
          name: updatedOrder.name,
          address: updatedOrder.address,
          phone: updatedOrder.phone,
          orders: updatedOrder.orders,
          createdAT: updatedOrder.createdAT,
          updatedAt: updatedOrder.updatedAt,
          deliveryPrice: updatedOrder.deliveryPrice,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  const id = req.params.id;
  try {
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({
        status: 404,
        message: "Order not found",
      });
    }

    await User.findByIdAndUpdate(order.pilotId, {
      $set: { hasOrder: false, orders: [] },
    });

    // Emit event to pilot if pilotId is found
    if (order.pilotId) {
      const pilotId = order.pilotId;
      const socketId = req.userSocketIds[pilotId]; // Retrieve socket ID using user ID
      if (socketId) {
        req.io.to(socketId).emit("orderDeleted", { order, pilotId });
      }
    }

    return res.status(200).json({
      status: 200,
      message: "Order deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.orderAssignment = async (req, res, next) => {
  const { orderId, userId } = req.body;

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    // Check if the user is a pilot and active
    if (user.Role === "pilot" && user.isActive && !user.hasOrder) {
      // Update user's hasOrder and orders array
      await User.findByIdAndUpdate(userId, {
        $set: { hasOrder: true, orders: [{ orderId: orderId }] },
      });
      await Order.findByIdAndUpdate(orderId, { pilotId: userId });

      // Emit a notification to the pilot's client
      const socketId = req.userSocketIds[userId]; // Retrieve socket ID using user ID
      if (socketId) {
        req.io.to(socketId).emit("order_assigned", { orderId, userId }); // Emit notification to the specific user
      }

      return res.status(200).json({
        status: 200,
        message: `Order Assigned to ${user.username}`,
      });
    } else {
      return res.status(403).json({
        status: 403,
        message:
          "Pilot is not available to deliver orders or is not active or User already has an order ",
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.orderAcceptation = async (req, res, next) => {
  const { orderId, userId, acceptation, reason = "" } = req.body;

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    // Check if the user is a pilot and active
    if (acceptation === "accept") {
      const { image } = req.files;

      if (!image) {
        return res.status(404).json({
          status: 404,
          message: "Reciept is required",
        });
      }

      const imageURL = process.env.BASE_URL + image[0].filename;

      // User accepts the order
      await User.findByIdAndUpdate(userId, {
        $set: {
          hasOrder: false,
          orders: [
            {
              orderId: orderId,
              acceptation: acceptation,
              reason,
              image: imageURL,
            },
          ],
        },
      });

      await Order.findByIdAndUpdate(orderId, {
        status: "delivered",
        reason,
        reciept: imageURL,
      });
      return res.status(200).json({
        status: 200,
        message: `Order accepted by ${user.username}`,
        data: user,
      });
    } else if (acceptation === "cancel") {
      // User cancels the order
      await User.findByIdAndUpdate(userId, {
        $set: {
          hasOrder: false,
          orders: [
            {
              orderId: orderId,
              acceptation: acceptation,
              reason,
            },
          ],
        },
      });
      await Order.findByIdAndUpdate(orderId, { status: "canceled", reason });

      return res.status(200).json({
        status: 200,
        message: `Order cancelled by ${user.username}`,
        data: user,
      });
    } else {
      return res.status(403).json({
        status: 403,
        message:
          "Pilot is not available to deliver orders or is not active or user does not have an order",
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.filterOrder = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedPage = parseInt(page, 10);
    const pasredlimit = parseInt(limit, 10);
    const filter = {};
    req.query.status ? (filter["status"] = req.query.status) : "";
    req.query.date ? (filter.createdAT = req.query.date) : "";
    req.query.pilotId ? (filter.pilotId = req.query.pilotId) : "";
    const countOrders = await Order.countDocuments(filter);
    const numberPages = Math.ceil(countOrders / pasredlimit);
    const skip = (parsedPage - 1) * pasredlimit;
    console.log(filter);
    const orders = await Order.find(filter)
      .skip(skip)
      .limit(pasredlimit)
      .select("-__v");
    console.log(orders);
    res.status(200).json({
      status: 200,
      message: " Get filteration result successfully",
      numberPages: numberPages,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};
