export const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    if (err.name === "CastError")
        err.message = "Invalid ID";
    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};
export const TryCatch = (func) => {
    return (req, res, next) => {
        return func(req, res, next).catch(next);
    };
};
//   // middleware/error.js
// const ErrorHandler = require("../utils/errorhandler");
// module.exports = (err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.message = err.message || "Internal Server Error";
//   // Wrong Mongodb Id error  //!punoray handleerror tehek next(error) call hoye akhane asbe abong error dekabe
//   if (err.name === "CastError") {
//     const message = `Resource not found. Invalid: ${err.path}`;
//     err = new ErrorHandler(message, 400);
//   }
//   //mongoose duplicate key error
//   if (err.code === 11000) {
//     const message = `Duplicate ${Object.keys(err.keyValue)} Enter`;
//     err = new ErrorHandler(message, 400);
//   }
//   //Json web token wrong error
//   if (err.name === "JsonWebTokenError") {
//     const message = `Json web token is invalid,try again...`;
//     err = new ErrorHandler(message, 400);
//   }
//   //jwt expire error
//   if (err.name === "TokenExpiredError") {
//     const message = `Json web token Expired,try again...`;
//     err = new ErrorHandler(message, 400);
//   }
//   res.status(err.statusCode).json({
//     success: false,
//     message: err.message, // message: err.stack, stack dile sobksu ay
//   });
// };
