import { base44 } from '@/api/base44Client';

/**
 * Call this before navigating to any booking-related page.
 * If the user is not authenticated, redirect to login and return false.
 * If authenticated, return true.
 */
export async function requireAuth(navigate, targetPath) {
  const isAuth = await base44.auth.isAuthenticated();
  if (!isAuth) {
    base44.auth.redirectToLogin(window.location.origin + '/' + targetPath);
    return false;
  }
  return true;
}