import { HTTPSTATUS, type HttpStatusCode } from "../config/http.js";

export const ERROR_CODES = {
  INTERNAL: "ERR_INTERNAL",
  BAD_REQUEST: "ERR_BAD_REQUEST",
  UNAUTHORIZED: "ERR_UNAUTHORIZED",
  FORBIDDEN: "ERR_FORBIDDEN",
  NOT_FOUND: "ERR_NOT_FOUND",
  VALIDATION: "ERR_VALIDATION",
  CONFLICT: "ERR_CONFLICT",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly errorCode: ErrorCode;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HTTPSTATUS.INTERNAL_SERVER_ERROR,
    errorCode: ErrorCode = ERROR_CODES.INTERNAL,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InternalServerException extends AppError {
  constructor(message = "Internal server error") {
    super(message, HTTPSTATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL);
  }
}

export class BadRequestException extends AppError {
  constructor(message = "Bad request") {
    super(message, HTTPSTATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST);
  }
}

export class NotFoundException extends AppError {
  constructor(message = "Resource not found") {
    super(message, HTTPSTATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
}

export class UnauthorizedException extends AppError {
  constructor(message = "Unauthorized") {
    super(message, HTTPSTATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }
}

export class ForbiddenException extends AppError {
  constructor(message = "Forbidden") {
    super(message, HTTPSTATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
}

export class ConflictException extends AppError {
  constructor(message = "Conflict") {
    super(message, HTTPSTATUS.CONFLICT, ERROR_CODES.CONFLICT);
  }
}
