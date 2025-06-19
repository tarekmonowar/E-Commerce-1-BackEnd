import { TryCatch } from "../middlewares/Error.js";
import { Order } from "../models/order.model.js";
import { reduceStock } from "../utils/features.js";
import { invalidateCache } from "../utils/cache-revalidate.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { myNodeCache } from "../app.js";
// get my order - /api/v1/order/my
export const myOrders = TryCatch(async (req, res, next) => {
    const { id } = req.query;
    const key = `my-orders-${id}`;
    let orders;
    if (myNodeCache.has(key)) {
        orders = JSON.parse(myNodeCache.get(key));
    }
    else {
        orders = await Order.find({ user: id });
        if (!orders) {
            return next(new ErrorHandler("Order not found", 404));
        }
        myNodeCache.set(key, JSON.stringify(orders));
    }
    res.status(200).json({
        success: true,
        orders,
    });
});
// get all order - /api/v1/order/all
export const allOrders = TryCatch(async (req, res, next) => {
    const key = `all-orders`;
    let orders;
    if (myNodeCache.has(key)) {
        orders = JSON.parse(myNodeCache.get(key));
    }
    else {
        orders = await Order.find().populate("user", "name");
        myNodeCache.set(key, JSON.stringify(orders));
    }
    res.status(200).json({
        success: true,
        orders,
    });
});
// get single order - /api/v1/order/:id
export const getSingleOrder = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const key = `order-${id}`;
    let order;
    if (myNodeCache.has(key)) {
        order = JSON.parse(myNodeCache.get(key));
    }
    else {
        order = await Order.findById(id).populate("user", "name");
        if (!order) {
            return next(new ErrorHandler("Order Not Found", 404));
        }
        myNodeCache.set(key, JSON.stringify(order));
    }
    res.status(200).json({
        success: true,
        order,
    });
});
// create new order - /api/v1/order/new
export const newOrder = TryCatch(async (req, res, next) => {
    const { shippingInfo, orderItems, user, subtotal, tax, shippingCharges, discount, total, } = req.body;
    if (!shippingInfo || !orderItems || !user || !subtotal || !tax || !total) {
        return next(new ErrorHandler("Please Enter all field", 400));
    }
    const order = await Order.create({
        shippingInfo,
        orderItems,
        user,
        subtotal,
        tax,
        shippingCharges,
        discount,
        total,
    });
    await reduceStock(orderItems);
    await invalidateCache({
        product: true,
        order: true,
        admin: true,
        userId: user,
        productId: order.orderItems.map((i) => String(i.productId)),
    });
    res.status(201).json({
        success: true,
        message: "Order Placed Successfully",
    });
});
// order status - /api/v1/order/:id
export const processOrder = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order)
        return next(new ErrorHandler("Order Not Found", 404));
    switch (order.status) {
        case "Processing":
            order.status = "Shipped";
            break;
        case "Shipped":
            order.status = "Delivered";
            break;
        default:
            order.status = "Delivered";
            break;
    }
    await order.save();
    await invalidateCache({
        product: false,
        order: true,
        admin: true,
        userId: order.user,
        orderId: String(order._id),
    });
    res.status(200).json({
        success: true,
        message: "Order Processed Successfully",
    });
});
// delete order order - /api/v1/order/:id
export const deleteOrder = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order)
        return next(new ErrorHandler("Order Not Found", 404));
    await order.deleteOne();
    await invalidateCache({
        product: false,
        order: true,
        admin: true,
        userId: order.user,
        orderId: String(order._id),
    });
    res.status(200).json({
        success: true,
        message: "Order Deleted Successfully",
    });
});
