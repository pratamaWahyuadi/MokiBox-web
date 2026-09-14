// Error class standar yang meniru format error dari API contract.
// Bentuk: { error: { code, message, details } }

export class ApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} status
   * @param {Array<{field:string,message:string}>} [details]
   */
  constructor(code, message, status = 400, details) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

// Helper untuk error umum
export const notFound = (msg = "Resource not found") => new ApiError("NOT_FOUND", msg, 404);
export const unauthorized = (msg = "Missing or invalid access token") => new ApiError("UNAUTHORIZED", msg, 401);
export const forbidden = (msg = "You are not allowed to perform this action") => new ApiError("FORBIDDEN", msg, 403);
export const validation = (details, msg = "Validation failed") => new ApiError("VALIDATION_ERROR", msg, 400, details);
export const videoNotReady = (msg = "Video is not ready") => new ApiError("VIDEO_NOT_READY", msg, 409);
export const videoStatusConflict = (msg = "Video is not in a confirmable state") => new ApiError("VIDEO_STATUS_CONFLICT", msg, 409);
export const selfFollow = () => new ApiError("SELF_FOLLOW_NOT_ALLOWED", "You cannot follow yourself", 400);
export const internal = (msg = "Internal server error") => new ApiError("INTERNAL_ERROR", msg, 500);
