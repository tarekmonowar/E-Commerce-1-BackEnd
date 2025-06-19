import { TryCatch } from "../middlewares/Error.js";
import { Coupon } from "../models/coupron.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//craete new coupon -- /api/v1/payment/coupon/new
export const newCoupon = TryCatch(async (req, res, next) => {
    const { coupon, amount } = req.body;
    console.log(req.body);
    if (!coupon || !amount) {
        return next(new ErrorHandler("Please enter both coupon and amount", 400));
    }
    await Coupon.create({ code: coupon, amount });
    res.status(202).json({
        success: true,
        message: `coupon : ${coupon}, successfully created`,
    });
});
//get discount coupon -- /api/v1/payment/discount
export const applyDiscount = TryCatch(async (req, res, next) => {
    const { coupon } = req.query;
    const discount = await Coupon.findOne({ code: coupon });
    if (!discount) {
        return next(new ErrorHandler("Please enter valid coupon code", 400));
    }
    res.status(200).json({
        success: true,
        discount: discount.amount,
    });
});
//get all coupon -- /api/v1/payment/coupon/all
export const allCoupon = TryCatch(async (req, res, next) => {
    const coupons = await Coupon.find({});
    if (!coupons) {
        return next(new ErrorHandler("No coupon found", 400));
    }
    res.status(200).json({
        success: true,
        coupons,
    });
});
//delete coupon -- /api/v1/payment/coupon/:id
export const deleteCoupon = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
        return next(new ErrorHandler("invalid coupon id", 400));
    }
    res.status(200).json({
        success: true,
        message: `coupon :${coupon?.code} , deleted successfuly`,
    });
});
//*------------------------payments----------------------------
export const createPaymentIntent = TryCatch(async (req, res, next) => {
    const { id } = req.query;
    const user = await User.findById(id).select("name");
    if (!user)
        return next(new ErrorHandler("Please login first", 401));
    const { items, shippingInfo, coupon, } = req.body;
    if (!items)
        return next(new ErrorHandler("Please send items", 400));
    if (!shippingInfo)
        return next(new ErrorHandler("Please send shipping info", 400));
    let discountAmount = 0;
    if (coupon) {
        const discount = await Coupon.findOne({ code: coupon });
        if (!discount)
            return next(new ErrorHandler("Invalid Coupon Code", 400));
        discountAmount = discount.amount;
    }
    const productIDs = items.map((item) => item.productId);
    const products = await Product.find({
        _id: { $in: productIDs },
    });
    const subtotal = products.reduce((prev, curr) => {
        const item = items.find((i) => i.productId === curr._id.toString());
        if (!item)
            return prev;
        return curr.price * item.quantity + prev;
    }, 0);
    const tax = subtotal * 0.18;
    const shipping = subtotal > 1000 ? 0 : 200;
    const total = Math.floor(subtotal + tax + shipping - discountAmount);
    const paymentIntent = await stripe.paymentIntents.create({
        amount: total * 100,
        currency: "inr",
        description: "MERN-Ecommerce",
        shipping: {
            name: user.name,
            address: {
                line1: shippingInfo.address,
                postal_code: shippingInfo.pinCode.toString(),
                city: shippingInfo.city,
                state: shippingInfo.state,
                country: shippingInfo.country,
            },
        },
    });
    res.status(201).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
    });
});
