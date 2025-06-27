import { kMaxLength } from "buffer";
import mongoose from "mongoose";

const ReviewsSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      maxlength: [200, " comment must not be more than 200 char"],
    },
    rating: {
      type: Number,
      required: [true, "Please give rating"],
      min: [1, "Rating must Be at least 1"],
      max: [5, "Rating maximum 5"],
    },
    user: {
      type: String,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Reviews = mongoose.model("Reviews", ReviewsSchema);
