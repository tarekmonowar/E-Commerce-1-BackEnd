import express from "express";
import { deleteUser, getAllUsers, getUser, newUser, } from "../controllers/userController.js";
import { adminOnly } from "../middlewares/Auth.js";
const router = express.Router();
// route - /api/v1/user/new
router.post("/new", newUser);
// Route - /api/v1/user/all
router.get("/all", adminOnly, getAllUsers);
// Route - /api/v1/user/dynamicID
router.get("/:id", getUser);
router.delete("/:id", adminOnly, deleteUser);
export default router;
