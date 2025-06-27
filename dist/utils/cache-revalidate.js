import { redis } from "../app.js";
export const invalidateCache = async ({ product, order, admin, review, userId, orderId, productId, }) => {
    if (review) {
        await redis.del([`reviews-${productId}`]);
    }
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
        // Delete all keys that match the filter pattern because after crued search key cannot delete this is extra 8pack
        let cursor = "0";
        do {
            const [nextCursor, matchedKeys] = await redis.scan(cursor, "MATCH", "products:filter:*", "COUNT", 100);
            cursor = nextCursor;
            productKeys.push(...matchedKeys);
        } while (cursor !== "0");
        //extra end
        await redis.del(productKeys);
    }
    if (order) {
        const ordersKeys = [
            "all-orders",
            `my-orders-${userId}`,
            `order-${orderId}`,
        ];
        await redis.del(ordersKeys);
    }
    if (admin) {
        await redis.del([
            "admin-stats",
            "admin-pie-charts",
            "admin-bar-charts",
            "admin-line-charts",
        ]);
    }
};
