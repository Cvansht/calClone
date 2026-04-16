import { StatusCodes } from "http-status-codes";

export class AppError extends Error {
  public readonly statusCode: Number;
  public readonly isOperational: boolean;
  constructor(message: string, statusCode = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    //“Attach a stack trace to this error, but hide all constructor-related noise and show only the real origin of the error.”
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, StatusCodes.CONFLICT);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, StatusCodes.NOT_FOUND);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY);
  }
}
