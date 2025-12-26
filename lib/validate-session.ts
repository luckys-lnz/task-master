/**
 * Session validation utilities
 * Ensures users still exist in database before allowing access
 */

import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { validateUserExists } from "./auth-utils";
import { UnauthorizedError } from "./errors";

/**
 * Get and validate server session
 * Returns session only if user still exists in database
 */
export async function getValidatedSession() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  // Validate user still exists in database
  const user = await validateUserExists(session.user.id);
  
  if (!user) {
    // User was deleted - invalidate session
    throw new UnauthorizedError("User account no longer exists");
  }

  return session;
}
