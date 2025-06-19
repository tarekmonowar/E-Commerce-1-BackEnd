import mongoose from "mongoose";
const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, "Please enter Coupon  code"],
        unique: true,
    },
    amount: {
        type: Number,
        required: [true, "Please enter Dscount Amount"],
    },
});
export const Coupon = mongoose.model("Coupon", CouponSchema);
