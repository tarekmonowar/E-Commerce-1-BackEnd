import express from "express";
import { adminOnly } from "../middlewares/Auth.js";
import { allOrders, deleteOrder, getSingleOrder, myOrders, newOrder, processOrder, } from "../controllers/orderController.js";
const router = express.Router();
// route - /api/v1/order/new
router.post("/new", newOrder);
// route - /api/v1/order/my
router.get("/my", myOrders);
// route - /api/v1/order/all
router.get("/all", adminOnly, allOrders);
// route - /api/v1/order/:id
router.get("/:id", getSingleOrder);
// route - /api/v1/order/:id
router.put("/:id", adminOnly, processOrder);
// route - /api/v1/order/:id
router.delete("/:id", adminOnly, deleteOrder);
export default router;
