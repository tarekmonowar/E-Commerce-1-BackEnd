import express from "express";
import { adminOnly } from "../middlewares/Auth.js";
import { allCoupon, createPaymentIntent, applyDiscount, deleteCoupon, newCoupon, singleCoupon, updateCoupon, } from "../controllers/paymentsController.js";
const router = express.Router();
// route - /api/v1/payment/create
router.post("/create", createPaymentIntent);
// route - /api/v1/payment/discount
router.get("/discount", applyDiscount);
// route - /api/v1/payment/coupon/all
router.get("/coupon/all", adminOnly, allCoupon);
// route - /api/v1/payment/coupon/new
router.post("/coupon/new", adminOnly, newCoupon);
// route - /api/v1/payment/coupon/:id
router.get("/coupon/:id", adminOnly, singleCoupon);
// route - /api/v1/payment/coupon/:id
router.put("/coupon/:id", updateCoupon);
// route - /api/v1/payment/coupon/:id
router.delete("/coupon/:id", adminOnly, deleteCoupon);
export default router;
