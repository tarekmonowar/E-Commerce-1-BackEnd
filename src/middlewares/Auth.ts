import { User } from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { TryCatch } from "../middlewares/Error.js";

// Middleware to make sure only admin is allowed
export const adminOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new ErrorHandler("Sala Login Kr pehle", 401));

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("Sala Fake ID Deta Hai", 401));
  if (user.role !== "admin")
    return next(new ErrorHandler("Sala admin Nhi Hai Teri", 403));

  next();
});

// import NodeCache from "node-cache";
// const adminCache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// export const adminOnly = TryCatch(async (req, res, next) => {
//   const { id } = req.query;
//   if (!id) return next(new ErrorHandler("Sala Login Kr pehle", 401));

//   const cachedIsAdmin = adminCache.get(id);
//   if (cachedIsAdmin) {
//     return next();
//   }

//   const user = await User.findById(id).select("role").lean();
//   if (!user) return next(new ErrorHandler("Sala Fake ID Deta Hai", 401));
//   if (user.role !== "admin")
//     return next(new ErrorHandler("Sala admin Nhi Hai Teri", 403));

//   adminCache.set(id, true);
//   next();
// });

//* more secure use token

// middleware/adminOnly.ts
// import admin from "../utils/firebaseAdmin";
// import User from "../models/user";
// import { TryCatch } from "../middlewares/error";
// import ErrorHandler from "../utils/error";

// export const adminOnly = TryCatch(async (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return next(new ErrorHandler("Token ni diya Sala", 401));
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decodedToken = await admin.auth().verifyIdToken(token);
//     const userId = decodedToken.uid;

//     const user = await User.findById(userId);
//     if (!user) return next(new ErrorHandler("Fake User Hai Bhai", 401));
//     if (user.role !== "admin")
//       return next(new ErrorHandler("Admin Nhi Hai Bhai Tu", 403));

//     req.user = user; // Optional: pass user to controller
//     next();
//   } catch (error) {
//     return next(new ErrorHandler("Token Verify Nhi Hua Bhai", 401));
//   }
// });
