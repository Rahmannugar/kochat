import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { getServerSession } from "@/lib/auth/auth"
import { userRepository } from "@/lib/users/user.repository"

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

const getErrorCode = (routeError: unknown): string | undefined => {
  if (
    routeError &&
    typeof routeError === "object" &&
    "code" in routeError &&
    typeof routeError.code === "string"
  ) {
    return routeError.code
  }

  if (
    routeError &&
    typeof routeError === "object" &&
    "cause" in routeError &&
    routeError.cause &&
    typeof routeError.cause === "object" &&
    "code" in routeError.cause &&
    typeof routeError.cause.code === "string"
  ) {
    return routeError.cause.code
  }

  return undefined
}

const isInfrastructureError = (routeError: unknown) => {
  const code = getErrorCode(routeError)

  if (code?.startsWith("08")) {
    return true
  }

  if (code === "53300" || code === "57P01" || code === "57P03") {
    return true
  }

  if (!(routeError instanceof Error)) {
    return false
  }

  const message = routeError.message.toLowerCase()

  return (
    message.includes("failed query") ||
    message.includes("connection failure") ||
    message.includes("connection terminated") ||
    message.includes("timeout expired") ||
    message.includes("the database is unavailable")
  )
}

export const handleRouteError = (routeError: unknown) => {
  if (routeError instanceof HttpError) {
    return error(routeError.status, routeError.message)
  }

  if (routeError instanceof ZodError) {
    return error(400, "Invalid request data", routeError.flatten())
  }

  if (isInfrastructureError(routeError)) {
    return error(503, "The server is temporarily unavailable. Please try again.")
  }

  if (routeError instanceof Error) {
    return error(500, routeError.message)
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

export const requireAppUser = async () => {
  const sessionUser = await requireSessionUser()
  const currentUser = await userRepository.findById(sessionUser.id)

  if (!currentUser) {
    throw new HttpError(404, "Authenticated user record was not found")
  }

  if (!currentUser.emailVerified) {
    throw new HttpError(403, "Email verification required")
  }

  if (!currentUser.username) {
    throw new HttpError(403, "Profile completion required")
  }

  return currentUser
}
