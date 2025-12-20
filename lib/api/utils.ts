/**
 * API Route Utilities
 * 
 * Provides consistent error handling, auth checks, and response formatting
 * for all API routes.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { userIsAdmin } from "@/lib/auth/permissions";
import { logger } from "@/lib/logger";
import { RATE_LIMIT_ADMIN, RATE_LIMIT_PUBLIC, RATE_LIMIT_WINDOW_MS } from "@/lib/constants";

// Simple in-memory rate limiter (replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Create a successful JSON response
 */
export function jsonSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error JSON response
 */
export function jsonError(error: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Create a 401 Unauthorized response
 */
export function unauthorized(message = "Unauthorized"): NextResponse {
  return jsonError(message, 401);
}

/**
 * Create a 403 Forbidden response
 */
export function forbidden(message = "Forbidden"): NextResponse {
  return jsonError(message, 403);
}

/**
 * Create a 404 Not Found response
 */
export function notFound(message = "Not found"): NextResponse {
  return jsonError(message, 404);
}

/**
 * Create a 429 Too Many Requests response
 */
export function tooManyRequests(message = "Too many requests"): NextResponse {
  return jsonError(message, 429);
}

/**
 * Create a 500 Internal Server Error response
 */
export function serverError(message = "Internal server error"): NextResponse {
  return jsonError(message, 500);
}

/**
 * Check if request is rate limited
 */
function isRateLimited(
  identifier: string,
  limit: number
): { limited: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { limited: false, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { limited: true, remaining: 0 };
  }

  record.count++;
  return { limited: false, remaining: limit - record.count };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? (forwarded.split(",")[0]?.trim() ?? "unknown") : "unknown";
  return ip;
}

/**
 * Wrapper for admin-only API routes with auth check and error handling
 */
export function withAdminAuth<T>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T): Promise<NextResponse> => {
    try {
      // Check authentication
      const { userId } = await auth();
      if (!userId) {
        return unauthorized("Not authenticated");
      }

      // Check admin permission
      const isAdmin = await userIsAdmin();
      if (!isAdmin) {
        return forbidden("Admin access required");
      }

      // Rate limiting
      const clientId = `admin:${userId}`;
      const { limited, remaining } = isRateLimited(clientId, RATE_LIMIT_ADMIN);
      if (limited) {
        logger.warn("Rate limit exceeded", { userId, route: request.url });
        return tooManyRequests();
      }

      // Execute handler
      const response = await handler(request, context);
      
      // Add rate limit headers
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      
      return response;
    } catch (error) {
      logger.exception(error, { route: request.url, method: request.method });
      return serverError();
    }
  };
}

/**
 * Wrapper for public API routes with rate limiting and error handling
 */
export function withRateLimit<T>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T): Promise<NextResponse> => {
    try {
      // Rate limiting
      const clientId = getClientIdentifier(request);
      const { limited, remaining } = isRateLimited(clientId, RATE_LIMIT_PUBLIC);
      if (limited) {
        logger.warn("Rate limit exceeded", { clientId, route: request.url });
        return tooManyRequests();
      }

      // Execute handler
      const response = await handler(request, context);
      
      // Add rate limit headers
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      
      return response;
    } catch (error) {
      logger.exception(error, { route: request.url, method: request.method });
      return serverError();
    }
  };
}

/**
 * Parse JSON body safely
 */
export async function parseJsonBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
