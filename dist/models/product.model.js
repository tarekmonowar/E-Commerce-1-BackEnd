import mongoose from "mongoose";
const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter Product Name"],
    },
    photos: [
        {
            public_id: {
                type: String,
                required: [true, "Please enter product image public_id"],
            },
            url: {
                type: String,
                required: [true, "Please enter product image URL"],
            },
        },
    ],
    price: {
        type: Number,
        required: [true, "Please enter product Price"],
    },
    stock: {
        type: Number,
        required: [true, "Please enter product Stock"],
    },
    category: {
        type: String,
        required: [true, "Please enter product category"],
        trim: true,
    },
}, {
    timestamps: true,
});
export const Product = mongoose.model("Product", ProductSchema);
