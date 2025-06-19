import { myNodeCache } from "../app.js";
export const invalidateCache = async ({ product, order, admin, review, userId, orderId, productId, }) => {
    // if (review) {
    //   await redis.del([`reviews-${productId}`]);
    // }
    if (product) {
        const productKeys = [
            "latest-products",
            "categories",
            "all-products",
        ];
        if (typeof productId === "string")
            productKeys.push(`product-${productId}`);
        if (typeof productId === "object")
            productId.forEach((i) => productKeys.push(`product-${i}`));
        myNodeCache.del(productKeys);
    }
    if (order) {
        const ordersKeys = [
            "all-orders",
            `my-orders-${userId}`,
            `order-${orderId}`,
        ];
        myNodeCache.del(ordersKeys);
    }
    if (admin) {
        myNodeCache.del([
            "admin-stats",
            "admin-pie-charts",
            "admin-bar-charts",
            "admin-line-charts",
        ]);
    }
};
