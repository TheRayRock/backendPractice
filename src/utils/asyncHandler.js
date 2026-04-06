const asyncHandler = (requestHandle) => {
  return (req, res, next) => {
    Promise.resolve(requestHandle(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// const asyncHandler = (fn) => async (re, res, next) => {
//   try {
//     await fn(req, res, next)
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
