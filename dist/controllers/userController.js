import { User } from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { TryCatch } from "../middlewares/Error.js";
// Create new user - /api/v1/user/new
export const newUser = TryCatch(async (req, res, next) => {
    const { name, email, photo, gender, _id, dob } = req.body;
    let user = await User.findById(_id);
    if (user) {
        res.status(200).json({
            success: true,
            message: `welcome ${user.name}`,
        });
        return;
    }
    if (!name || !email || !photo || !_id || !dob || !gender) {
        next(new ErrorHandler("Please provide all fields", 400));
        return;
    }
    user = await User.create({
        name,
        email,
        photo,
        gender,
        _id,
        dob,
    });
    res.status(200).json({
        success: true,
        message: `welcome ${user.name}`,
    });
});
// Get All users - /api/v1/user/all
export const getAllUsers = TryCatch(async (req, res, next) => {
    const users = await User.find({});
    res.status(200).json({
        success: true,
        users,
    });
});
// Get User details - /api/v1/user/:id
export const getUser = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        return next(new ErrorHandler("Invalid ID", 404));
    }
    res.status(200).json({
        success: true,
        user,
    });
});
// Delete User - /api/v1/user/:id
export const deleteUser = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        return next(new ErrorHandler("Invalid ID", 404));
    }
    await user.deleteOne();
    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});
