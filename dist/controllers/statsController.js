import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/Error.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { calculatePercentage, getChartData } from "../utils/features.js";
//!----------------------------------------------------------- get stats - /api/v1/dashboard/stats-----------------------------------------------
export const getDashboardStats = TryCatch(async (req, res, next) => {
    let stats;
    const key = "admin-stats";
    const cached = await redis.get(key);
    if (cached) {
        stats = JSON.parse(cached);
    }
    else {
        //*--------------------------------------------------------------------- code start here ----------------------------------------
        const today = new Date();
        const sixMonthAgo = new Date();
        sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);
        const thisMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today,
        };
        const lastMonth = {
            start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0),
        };
        const thisMonthProductPromise = Product.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthProductPromise = Product.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const thisMonthUserPromise = User.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthUserPromise = User.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const thisMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const lastSixMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today,
            },
        });
        const latestTransactionPromise = Order.find({})
            .select(["orderItems", "discount", "status", "total"])
            .limit(4);
        const [thisMonthProducts, thisMonthUsers, thisMonthOrders, lastMonthProducts, lastMonthUsers, lastMonthOrders, productsCount, usersCount, allOrders, lastSixMonthOrders, categories, femaleUserCount, latestTransaction,] = await Promise.all([
            thisMonthProductPromise,
            thisMonthUserPromise,
            thisMonthOrdersPromise,
            lastMonthProductPromise,
            lastMonthUserPromise,
            lastMonthOrdersPromise,
            Product.countDocuments(),
            User.countDocuments(),
            Order.find({}).select("total"),
            lastSixMonthOrdersPromise,
            Product.distinct("category"),
            User.countDocuments({ gender: "female" }),
            latestTransactionPromise,
        ]);
        const thisMonthRevenue = thisMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const changePercent = {
            revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
            product: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
            user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
            order: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length),
        };
        const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0);
        const count = {
            revenue: revenue,
            user: usersCount,
            product: productsCount,
            order: allOrders.length,
        };
        //*-------------------------6 month revenu and transaction chart--------
        const orderMonthCounts = new Array(6).fill(0); //const orderMonthCounts = [0, 0, 0, 0, 0, 0];
        const orderMonthlyRevenue = new Array(6).fill(0); //const orderMonthlyRevenue = [0, 0, 0, 0, 0, 0];
        lastSixMonthOrders.forEach((order) => {
            const creationDate = order.createdAt;
            // const monthDiff = today.getMonth() - creationDate.getMonth()+12;
            const monthDiff = (today.getFullYear() - creationDate.getFullYear()) * 12 +
                (today.getMonth() - creationDate.getMonth());
            if (monthDiff < 6) {
                orderMonthCounts[6 - monthDiff - 1] += 1;
                //orderMonthCounts[6 - monthDiff - 1] = orderMonthCounts[6 - monthDiff - 1] + 1;
                //orderMonthCounts[2] = orderMonthCounts[2] + 1;
                //oi index a set=agerta+1    ....kun monyh a koyta order seti bosbe 1+1+1 abae bere
                orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
            }
        });
        //*--------------inventory------------
        //shudu category na kun category koyti product seti lagbe tai ati  => categories=[laptop,pc,mobile]
        const categoriesCountPromise = categories.map((category) => {
            return Product.countDocuments({ category });
        });
        const categoriesCunt = await Promise.all(categoriesCountPromise);
        //category alada array,categoryCunt alada array 2 ta index and value aksate same korte
        const categoryCount = [];
        categories.forEach((category, i) => {
            categoryCount.push({
                [category]: Math.round((categoriesCunt[i] / productsCount) * 100), // [category]: categoriesCunt[i]
            });
        });
        //*----------------------male/female ratio----------
        const userRatio = {
            male: usersCount - femaleUserCount,
            female: femaleUserCount,
        };
        //* --------------- top transaction ---------------------------------------------------
        const modifiedLatestTransaction = latestTransaction.map((i) => ({
            _id: i._id,
            discount: i.discount,
            amount: i.total,
            quantity: i.orderItems.length,
            status: i.status,
        }));
        //*------------------main stats---------------
        stats = {
            categoryCount,
            changePercent,
            count,
            chart: { order: orderMonthCounts, revenue: orderMonthlyRevenue },
            userRatio,
            latestTransaction: modifiedLatestTransaction,
        };
        await redis.setex(key, redisTTL, JSON.stringify(stats));
    } //end block
    res.status(200).json({
        success: true,
        stats,
    });
});
//!      ------------------------------------------------------- get pie - /api/v1/dashboard/pie-----------------------------------------------
export const getPieCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-pie-charts";
    const cached = await redis.get(key);
    if (cached) {
        charts = JSON.parse(cached);
    }
    else {
        //
        //
        //
        //
        const [processingOrder, shippedOrder, deliveredOrder, categories, productsCount, outOfStock, allOrders, usersWithDOB, admin, users,] = await Promise.all([
            Order.countDocuments({ status: "Processing" }),
            Order.countDocuments({ status: "Shipped" }),
            Order.countDocuments({ status: "Delivered" }),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({ stock: 0 }),
            Order.find({}).select([
                "total",
                "discount",
                "subtotal",
                "tax",
                "shippingCharges",
            ]),
            User.find({}).select(["dob"]),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ role: "user" }),
        ]);
        const orderFullfilment = {
            processing: processingOrder,
            shipped: shippedOrder,
            delivered: deliveredOrder,
        };
        const categoriesCountPromise = categories.map((category) => {
            return Product.countDocuments({ category });
        });
        const categoriesCunt = await Promise.all(categoriesCountPromise);
        //category alada array,categoryCunt alada array 2 ta index and value aksate same korte
        const categoryCount = [];
        categories.forEach((category, i) => {
            categoryCount.push({
                [category]: Math.round((categoriesCunt[i] / productsCount) * 100), // [category]: categoriesCunt[i]
            });
        });
        const stockAvailability = {
            inStock: productsCount - outOfStock,
            outOfStock: outOfStock,
        };
        const grossIncome = allOrders.reduce((prev, order) => {
            return prev + (order.total || 0);
        }, 0);
        const discount = allOrders.reduce((prev, order) => {
            return prev + (order.discount || 0);
        }, 0);
        const productionCost = allOrders.reduce((prev, order) => {
            return prev + (order.shippingCharges || 0);
        }, 0);
        const burnt = allOrders.reduce((prev, order) => {
            return prev + (order.tax || 0);
        }, 0);
        const marketingCost = Math.round(grossIncome * (30 / 100));
        const netMargin = grossIncome - discount - productionCost - burnt - marketingCost;
        const revenueDistribution = {
            netMargin,
            discount,
            productionCost,
            burnt,
            marketingCost,
        };
        const usersAgeGroup = {
            teen: usersWithDOB.filter((i) => i.age < 20).length,
            adult: usersWithDOB.filter((i) => i.age >= 20 && i.age < 40).length,
            old: usersWithDOB.filter((i) => i.age >= 40).length,
        };
        const adminCustomer = {
            admin: admin,
            customer: users,
        };
        charts = {
            orderFullfilment,
            productcategories: categoryCount,
            stockAvailability,
            revenueDistribution,
            usersAgeGroup,
            adminCustomer,
        };
        await redis.setex(key, redisTTL, JSON.stringify(charts));
    }
    res.status(200).json({
        success: true,
        charts,
    });
});
//!      ------------------------------------------------------- get bar--- /api/v1/dashboar/bar-----------------------------------------------
export const getBarCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-bar-charts";
    const cached = await redis.get(key);
    if (cached) {
        charts = JSON.parse(cached);
    }
    else {
        const today = new Date();
        const sixMonthAgo = new Date();
        sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);
        const twelveMonthAgo = new Date();
        twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);
        const lastSixMonthProductsPromise = Product.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today,
            },
        }).select("createdAt");
        const lastSixMonthUsersPromise = User.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today,
            },
        }).select("createdAt");
        const lasttwelveMonthOrderPromise = Order.find({
            createdAt: {
                $gte: twelveMonthAgo,
                $lte: today,
            },
        }).select("createdAt");
        const [products, users, orders] = await Promise.all([
            lastSixMonthProductsPromise,
            lastSixMonthUsersPromise,
            lasttwelveMonthOrderPromise,
        ]);
        //* ata alada components leka upore /stats a ase details aikhan theke bujo tm-------
        const productCounts = getChartData({ length: 6, today, docArr: products });
        const usersCounts = getChartData({ length: 6, today, docArr: users });
        const ordersCounts = getChartData({
            length: 12,
            today,
            docArr: orders,
        });
        charts = {
            users: usersCounts,
            products: productCounts,
            orders: ordersCounts,
        };
        await redis.setex(key, redisTTL, JSON.stringify(charts));
    }
    res.status(200).json({
        success: true,
        charts,
    });
});
//!      ------------------------------------------------------- get line - /api/v1/dashboard/line-----------------------------------------------
export const getLineCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-line-charts";
    const cached = await redis.get(key);
    if (cached) {
        charts = JSON.parse(cached);
    }
    else {
        const today = new Date();
        const twelveMonthAgo = new Date();
        twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);
        const lasttwelveMonthProductsPromise = Product.find({
            createdAt: {
                $gte: twelveMonthAgo,
                $lte: today,
            },
        }).select("createdAt");
        const lasttwelveMonthUsersPromise = User.find({
            createdAt: {
                $gte: twelveMonthAgo,
                $lte: today,
            },
        }).select("createdAt");
        const lasttwelveMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: twelveMonthAgo,
                $lte: today,
            },
        }).select(["createdAt", "discount", "total"]);
        const [products, users, orders] = await Promise.all([
            lasttwelveMonthProductsPromise,
            lasttwelveMonthUsersPromise,
            lasttwelveMonthOrdersPromise,
        ]);
        //* ata alada components leka upore /stats a ase details aikhan theke bujo tm-------
        const productCounts = getChartData({ length: 12, today, docArr: products });
        const usersCounts = getChartData({ length: 12, today, docArr: users });
        const discount = getChartData({
            length: 12,
            today,
            docArr: orders,
            property: "discount",
        });
        const revenue = getChartData({
            length: 12,
            today,
            docArr: orders,
            property: "total",
        });
        charts = {
            users: usersCounts,
            products: productCounts,
            discount,
            revenue,
        };
        await redis.setex(key, redisTTL, JSON.stringify(charts));
    }
    res.status(200).json({
        success: true,
        charts,
    });
});
