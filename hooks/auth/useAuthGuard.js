import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Enhanced authentication and authorization hook
 * @param {Array} requiredRoles - Array of required roles for access
 * @param {string} redirectPath - Path to redirect if not authenticated (default: '/login')
 * @param {string} deniedPath - Path to redirect if not authorized (default: '/denied')
 * @param {Object} options - Additional options
 * @returns {Object} Authentication state and user info
 */
const useAuthGuard = (
  requiredRoles = [], 
  redirectPath = '/login', 
  deniedPath = '/denied',
  options = {}
) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const {
    requireAuth = true,
    allowGuest = false,
    onUnauthorized,
    onForbidden
  } = options;

  useEffect(() => {
    if (status === 'loading') {
      setIsChecking(true);
      return;
    }

    setIsChecking(false);

    // If authentication is not required and guest access is allowed
    if (!requireAuth && allowGuest) {
      setIsAuthorized(true);
      return;
    }

    // Check authentication
    if (status === 'unauthenticated') {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        router.push(redirectPath);
      }
      return;
    }

    // Check authorization (roles)
    if (requiredRoles.length > 0 && session?.user) {
      const userRoles = session.user.roles || [];
      const hasRequiredRole = requiredRoles.some(role => 
        userRoles.includes(role)
      );

      if (!hasRequiredRole) {
        if (onForbidden) {
          onForbidden();
        } else {
          router.push(deniedPath);
        }
        return;
      }
    }

    setIsAuthorized(true);
  }, [status, session, router, requiredRoles, redirectPath, deniedPath, requireAuth, allowGuest, onUnauthorized, onForbidden]);

  const hasRole = (role) => {
    return session?.user?.roles?.includes(role) || false;
  };

  const hasAnyRole = (roles) => {
    if (!session?.user?.roles) return false;
    return roles.some(role => session.user.roles.includes(role));
  };

  const hasAllRoles = (roles) => {
    if (!session?.user?.roles) return false;
    return roles.every(role => session.user.roles.includes(role));
  };

  return {
    // Auth state
    session,
    status,
    isAuthorized,
    isChecking,
    isLoading: status === 'loading' || isChecking,
    isAuthenticated: status === 'authenticated',
    
    // User info
    user: session?.user || null,
    userRoles: session?.user?.roles || [],
    userId: session?.user?.id || session?.user?.email,
    
    // Role checkers
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Convenience getters
    isAdmin: hasRole('ADMIN'),
    isITLead: hasRole('IT LEAD'),
    isUser: hasRole('USER'),
    canAccessAdmin: hasAnyRole(['ADMIN', 'IT LEAD']),
    
    // Ready state (not loading and authorized)
    isReady: !isChecking && isAuthorized && status === 'authenticated'
  };
};

/**
 * Hook specifically for admin access
 * @param {string} redirectPath - Path to redirect if not authenticated
 * @param {string} deniedPath - Path to redirect if not admin
 * @returns {Object} Admin authentication state
 */
export const useAdminGuard = (redirectPath = '/login', deniedPath = '/denied') => {
  return useAuthGuard(['ADMIN'], redirectPath, deniedPath);
};

/**
 * Hook for IT Lead access
 * @param {string} redirectPath - Path to redirect if not authenticated  
 * @param {string} deniedPath - Path to redirect if not IT Lead
 * @returns {Object} IT Lead authentication state
 */
export const useITLeadGuard = (redirectPath = '/login', deniedPath = '/denied') => {
  return useAuthGuard(['IT LEAD', 'ADMIN'], redirectPath, deniedPath);
};

/**
 * Hook for basic user access (any authenticated user)
 * @param {string} redirectPath - Path to redirect if not authenticated
 * @returns {Object} User authentication state
 */
export const useUserGuard = (redirectPath = '/login') => {
  return useAuthGuard([], redirectPath);
};

/**
 * Hook for conditional rendering based on roles
 * @param {Array} allowedRoles - Roles that can see the content
 * @returns {Object} Visibility state and role checks
 */
export const useRoleBasedVisibility = (allowedRoles = []) => {
  const { isAuthenticated, hasAnyRole, userRoles } = useAuthGuard([], '', '', { 
    requireAuth: false, 
    allowGuest: true 
  });

  const canView = isAuthenticated && (
    allowedRoles.length === 0 || hasAnyRole(allowedRoles)
  );

  return {
    canView,
    isAuthenticated,
    userRoles,
    hasRequiredRole: hasAnyRole(allowedRoles)
  };
};

export default useAuthGuard;