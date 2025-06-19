// utils/errorHandler.js
class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message); //ErrorHandler inherits everything from the native Error class (like .message, .stack, etc.), and adds custom logic like statusCode.
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
export default ErrorHandler;
//! ati error toiri kore abong next() dewar karone Next(error) ati call hoy next() call hole exprexx ar erro-handle middlware automatic seti recive kore ja app js middlware add error.js tyheke
//* new ErrorHandler("Product not found", 404) creates an error object with a message and status code.
// ErrorHandler objext dekte airokom {
//   message: 'Product not found',
//   statusCode: 404,
//   stack: 'Error: Product not found\n    at ...' // This will show the stack trace of where the error occurred
// }
//* next(notuntoiriclassbyerrorhandler) passes that error to the next middleware, which is the error handler in error.js where you can deal with it...in async it automatic passed dont need write next(error) just need throw
//tokhon err.mesage/statuscode/stack diye deka jay
