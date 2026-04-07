import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { getServerSession } from "@/lib/auth/auth"

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const success = <T>(data: T, init?: ResponseInit) => {
  return NextResponse.json({ data }, init)
}

export const error = (status: number, message: string, details?: unknown) => {
  return NextResponse.json(
    {
      error: {
        message,
        ...(details ? { details } : {}),
      },
    },
    { status },
  )
}

export const handleRouteError = (routeError: unknown) => {
  if (routeError instanceof HttpError) {
    return error(routeError.status, routeError.message)
  }

  if (routeError instanceof ZodError) {
    return error(400, "Invalid request data", routeError.flatten())
  }

  if (routeError instanceof Error) {
    return error(400, routeError.message)
  }

  return error(500, "Internal server error")
}

export const requireSessionUser = async () => {
  const session = await getServerSession()

  if (!session) {
    throw new HttpError(401, "Authentication required")
  }

  return session.user
}
