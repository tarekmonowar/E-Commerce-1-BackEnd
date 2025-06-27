import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/Error.js";
import { Product } from "../models/product.model.js";
import { Reviews } from "../models/review.model.js";
import { User } from "../models/user.model.js";
import { invalidateCache } from "../utils/cache-revalidate.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { deleteFromCloudinary, findAvarageRatings, uploadToCloudinary, } from "../utils/features.js";
// import { fa, faker } from "@faker-js/faker";
// Get latest product - /api/v1/product/latest
//Revalidate on New,Update,Delete product and on New Order
export const getLatestProducts = TryCatch(async (req, res, next) => {
    let products;
    const cached = await redis.get("latest-products");
    if (cached) {
        products = JSON.parse(cached);
    }
    else {
        products = await Product.find({}).sort({ createdAt: -1 }).limit(5).lean();
        await redis.set("latest-products", JSON.stringify(products));
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
    const cached = await redis.get("categories");
    if (cached) {
        categories = JSON.parse(cached);
    }
    else {
        categories = await Product.find({}).distinct("category");
        if (!categories) {
            return next(new ErrorHandler("No category found", 404));
        }
        await redis.set("categories", JSON.stringify(categories));
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
    const cached = await redis.get("all-products");
    if (cached) {
        products = JSON.parse(cached);
    }
    else {
        products = await Product.find({});
        await redis.set("all-products", JSON.stringify(products));
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
    const key = `product-${id}`;
    let product;
    const cached = await redis.get(key);
    if (cached) {
        product = JSON.parse(cached);
    }
    else {
        product = await Product.findById(id);
        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }
        await redis.set(key, JSON.stringify(product));
    }
    res.status(200).json({
        success: true,
        product,
    });
});
// Create new product - /api/v1/product/new
//Revalidate on New,Update,Delete product and on New Order
export const newProduct = TryCatch(async (req, res, next) => {
    // console.log("FILES:", req.files);
    // console.log("BODY:", req.body);
    const { name, price, stock, category, description } = req.body;
    //after succesful pass multer middleware it will automatically add files to req.files
    const photos = req.files;
    if (!photos) {
        return next(new ErrorHandler("Please provide a photo", 400));
    }
    if (photos.length < 1) {
        return next(new ErrorHandler("Please provide at least one photo", 400));
    }
    if (photos.length > 5) {
        return next(new ErrorHandler("You can upload a maximum of 5 photos", 400));
    }
    if (!name || !price || !stock || !category || !description) {
        // rm(photo.path, () => {
        //   console.log("Photo deleted"); // Delete the photo if any field is missing because its comes from multer automatically but in cloudinary its dont need to delete
        // });
        return next(new ErrorHandler("Please provide all fields", 400));
    }
    if (price < 0 || stock < 0) {
        return next(new ErrorHandler("Price or stock cannot be negative", 400));
    }
    //uploading photos to cloudinary
    const photosurl = await uploadToCloudinary(photos);
    await Product.create({
        name,
        price,
        stock,
        description,
        category: category.toLowerCase(),
        photos: photosurl,
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
    const { name, price, stock, category, description } = req.body;
    const photos = req.files;
    const product = await Product.findById(id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    if (photos && photos.length > 0) {
        // rm(product.photo, () => {
        //   console.log("old Photo deleted"); // Delete the photo if any field is missing because its comes from multer automatically
        // });
        // product.photo = photo.path;
        const photosUrl = await uploadToCloudinary(photos);
        const ids = product.photos.map((photo) => photo.public_id);
        await deleteFromCloudinary(ids);
        product.photos.splice(0, product.photos.length, ...photosUrl);
        // product.photos = photosUrl; // Update the photos array with new photos kaj kortese na
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
    if (description) {
        product.description = description;
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
    const ids = product.photos.map((photo) => photo.public_id);
    await deleteFromCloudinary(ids);
    // rm(product.photo, () => {
    //   console.log("Product Photo deleted");
    // });
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
    const key = `products-${search}-${sort}-${category}-${price}-${page}`;
    //*or better to encode
    //  const encode = (val?: string | number) => encodeURIComponent(val ?? "all");
    // const key = `products-${encode(search)}-${encode(sort)}-${encode(category)}-${encode(price)}-${pageNumber}`;
    let products;
    let totalPage;
    const cached = await redis.get(key);
    if (cached) {
        const data = JSON.parse(cached);
        totalPage = data.totalPage;
        products = data.products;
    }
    else {
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
        const [productsResult, filteredOnlyProduct] = await Promise.all([
            productPromise,
            Product.find(basequery),
        ]);
        products = productsResult;
        totalPage = Math.ceil(filteredOnlyProduct.length / limit);
        //* use this for better
        // const [productsResult, totalCount] = await Promise.all([
        //   productPromise,
        //   Product.countDocuments(basequery),
        // ]);
        // products = productsResult;
        // totalPage = Math.ceil(totalCount / limit);
        await redis.setex(key, redisTTL, JSON.stringify({ products, totalPage }));
    }
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
//! --------------------------------------for review and rating route-------------------------------------------------------
// New reviews create - /api/v1/review/new/:id
export const newReview = TryCatch(async (req, res, next) => {
    const user = await User.findById(req.query.id);
    if (!user) {
        return next(new ErrorHandler("Not logged In", 404));
    }
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    const { comment, rating } = req.body;
    const alreadyReviewd = await Reviews.findOne({
        user: user._id,
        product: product._id,
    });
    if (alreadyReviewd) {
        alreadyReviewd.comment = comment;
        alreadyReviewd.rating = rating;
        await alreadyReviewd.save();
    }
    else {
        await Reviews.create({
            comment,
            rating,
            user: user._id,
            product: product._id,
        });
    }
    const { ratings, numOfReviews } = await findAvarageRatings(product._id);
    product.ratings = ratings;
    product.numOfReviews = numOfReviews;
    await product.save();
    await invalidateCache({
        product: true,
        productId: String(product._id),
        admin: true,
        review: true,
    });
    res.status(alreadyReviewd ? 200 : 201).json({
        success: true,
        message: alreadyReviewd ? "Review Update" : "Review Added",
    });
});
// all reviews of product - /api/v1/review/new/:id
export const allReviewsOfProduct = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    let reviews;
    const cached = await redis.get(`reviews-${id}`);
    if (cached) {
        reviews = JSON.parse(cached);
    }
    else {
        // // Validate MongoDB ObjectId
        // if (!mongoose.Types.ObjectId.isValid(id)) {
        //   return next(new ErrorHandler("Invalid ID", 400));
        // }
        reviews = await Reviews.find({ product: id })
            .populate("user", "name photo")
            .sort({ updatedAt: -1 });
        await redis.setex(`reviews-${id}`, redisTTL, JSON.stringify(reviews));
    }
    res.status(200).json({
        success: true,
        reviews,
    });
});
// delete review - /api/v1/review/:id
export const deleteReview = TryCatch(async (req, res, next) => {
    const user = await User.findById(req.query.id);
    if (!user) {
        return next(new ErrorHandler("Not logged In", 404));
    }
    const { id } = req.params;
    const review = await Reviews.findById(id);
    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }
    const isAuthenticateUser = review.user.toString() === user._id.toString();
    if (!isAuthenticateUser) {
        return next(new ErrorHandler("Not Authorised User", 404));
    }
    await review.deleteOne();
    const product = await Product.findById(review.product);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    const { ratings, numOfReviews } = await findAvarageRatings(product._id);
    product.ratings = ratings;
    product.numOfReviews = numOfReviews;
    await product.save();
    await invalidateCache({
        product: true,
        productId: String(product._id),
        admin: true,
        review: true,
    });
    res.status(200).json({
        success: true,
        message: "Review Deleted",
    });
});
