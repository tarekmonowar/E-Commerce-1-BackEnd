import { Product } from "../models/product.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { TryCatch } from "../middlewares/Error.js";
import { rm } from "fs";
import { myNodeCache } from "../app.js";
import { invalidateCache } from "../utils/cache-revalidate.js";
// import { fa, faker } from "@faker-js/faker";
// Get latest product - /api/v1/product/latest
//Revalidate on New,Update,Delete product and on New Order
export const getLatestProducts = TryCatch(async (req, res, next) => {
    let products;
    if (myNodeCache.has("latest-products")) {
        products = JSON.parse(myNodeCache.get("latest-products"));
    }
    else {
        products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
        myNodeCache.set("latest-products", JSON.stringify(products));
    }
    res.status(200).json({
        success: true,
        products,
    });
});
// Get All category - /api/v1/user/product/category
//Revalidate on New,Update,Delete product and on New Order
export const getAllCategory = TryCatch(async (req, res, next) => {
    let categories;
    if (myNodeCache.has("categories")) {
        categories = JSON.parse(myNodeCache.get("categories"));
    }
    else {
        categories = await Product.find({}).distinct("category");
        if (!categories) {
            return next(new ErrorHandler("No category found", 404));
        }
        myNodeCache.set("categories", JSON.stringify(categories));
    }
    res.status(200).json({
        success: true,
        categories,
    });
});
// Get Admin Products - /api/v1/product/admin-products
//Revalidate on New,Update,Delete product and on New Order
export const getAdminProducts = TryCatch(async (req, res, next) => {
    let products;
    if (myNodeCache.has("all-products")) {
        products = JSON.parse(myNodeCache.get("all-products"));
    }
    else {
        products = await Product.find({});
        myNodeCache.set("all-products", JSON.stringify(products));
    }
    res.status(200).json({
        success: true,
        products,
    });
});
// Get single product details - /api/v1/product/:id
//Revalidate on New,Update,Delete product and on New Order
export const getSingleProduct = TryCatch(async (req, res, next) => {
    const id = req.params.id;
    let product;
    if (myNodeCache.has(`product-${id}`)) {
        product = JSON.parse(myNodeCache.get(`product-${id}`));
    }
    else {
        product = await Product.findById(id);
        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }
        myNodeCache.set(`product-${id}`, JSON.stringify(product));
    }
    res.status(200).json({
        success: true,
        product,
    });
});
// Create new product - /api/v1/product/new
//Revalidate on New,Update,Delete product and on New Order
export const newProduct = TryCatch(async (req, res, next) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    if (!photo) {
        return next(new ErrorHandler("Please provide a photo", 400));
    }
    if (!name || !price || !stock || !category) {
        rm(photo.path, () => {
            console.log("Photo deleted"); // Delete the photo if any field is missing because its comes from multer automatically
        });
        return next(new ErrorHandler("Please provide all fields", 400));
    }
    if (price < 0 || stock < 0) {
        return next(new ErrorHandler("Price or stock cannot be negative", 400));
    }
    if (!photo) {
        return next(new ErrorHandler("Please provide a photo", 400));
    }
    await Product.create({
        name,
        price,
        stock,
        category: category.toLowerCase(),
        photo: photo.path,
    });
    await invalidateCache({ product: true, admin: true });
    res.status(200).json({
        success: true,
        message: `Product created successfully ${name}`,
    });
});
// update-single-product  - /api/v1/product/:id
export const updateProduct = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    const product = await Product.findById(id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    if (photo) {
        rm(product.photo, () => {
            console.log("old Photo deleted"); // Delete the photo if any field is missing because its comes from multer automatically
        });
        product.photo = photo.path;
    }
    if (name) {
        product.name = name;
    }
    if (price) {
        product.price = price;
    }
    if (stock) {
        product.stock = stock;
    }
    if (category) {
        product.category = category.toLowerCase();
    }
    await product.save();
    await invalidateCache({
        product: true,
        productId: String(product._id),
        admin: true,
    });
    res.status(200).json({
        success: true,
        message: `Product updated successfully ${name}`,
    });
});
// Delete Product - /api/v1/product/:id
export const deleteProduct = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    rm(product.photo, () => {
        console.log("Product Photo deleted");
    });
    await product.deleteOne();
    await invalidateCache({
        product: true,
        productId: String(product._id),
        admin: true,
    });
    res.status(200).json({
        success: true,
        message: "product deleted successfully",
    });
});
// Get All product by search - /api/v1/product/all
export const getAllProducts = TryCatch(async (req, res, next) => {
    const { search, price, category, sort, page } = req.query;
    const pageNumber = Number(page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (pageNumber - 1) * limit;
    const basequery = {};
    if (search) {
        basequery.name = {
            $regex: search,
            $options: "i",
        };
    }
    if (price) {
        basequery.price = { $lte: Number(price) };
    }
    if (category) {
        basequery.category = category;
    }
    const productPromise = Product.find(basequery)
        .limit(limit)
        .skip(skip)
        .sort(sort && { price: sort === "asc" ? 1 : -1 });
    const [products, filteredOnlyProduct] = await Promise.all([
        productPromise,
        Product.find(basequery),
    ]);
    const totalPage = Math.ceil(filteredOnlyProduct.length / limit);
    res.status(200).json({
        success: true,
        products,
        totalPage,
    });
});
// Generate fake data
// export const generateFakeData = async (count: number = 10) => {
//   const fakeProducts = [];
//   for (let i = 0; i < count; i++) {
//     fakeProducts.push({
//       name: faker.commerce.productName(),
//       price: faker.commerce.price({ min: 1500, max: 50000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       photo: "uploads\\f40d1fae-1a52-42c9-b174-89afc53e784d.png",
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     });
//   }
//   await Product.create(fakeProducts);
//   console.log({ success: true, message: "Fake data generated successfully" });
// };
// generateFakeData(100);
//delete all products
// const deleteRandomProducts = async (count: number = 10) => {
//   const products = await Product.find({}).skip(2);
//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }
//   console.log({ success: true, message: "All products deleted successfully" });
// };
// deleteRandomProducts(35);
