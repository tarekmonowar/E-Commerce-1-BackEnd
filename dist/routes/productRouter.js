import express from "express";
import { adminOnly } from "../middlewares/Auth.js";
import { newProduct, getLatestProducts, getAllCategory, deleteProduct, getAdminProducts, getSingleProduct, updateProduct, getAllProducts, newReview, deleteReview, allReviewsOfProduct, } from "../controllers/productController.js";
import { mutliUpload } from "../middlewares/Multer.js";
const router = express.Router();
// Create new product - /api/v1/product/new
router.post("/new", adminOnly, mutliUpload, newProduct);
// Get all product with filter - /api/v1/product/all
router.get("/all", getAllProducts);
// Get latest product - /api/v1/product/products
router.get("/latest", getLatestProducts);
// Get All category - /api/v1/product/category
router.get("/category", getAllCategory);
// Get All-Admin-product - /api/v1/product/admin-products
router.get("/admin-products", adminOnly, getAdminProducts);
// Get single product details - /api/v1/product/:id
router.get("/:id", getSingleProduct);
// Update product single - /api/v1/product/:id
router.put("/:id", adminOnly, mutliUpload, updateProduct);
// Delete Product - /api/v1/product/:id
router.delete("/:id", adminOnly, deleteProduct);
//* for rating and reviews route
router.get("/reviews/:id", allReviewsOfProduct);
router.post("/review/new/:id", newReview);
router.delete("/review/:id", deleteReview);
export default router;
