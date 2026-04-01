import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();
    if (user && user.role === 'Admin') {
        return true;
    }

    // Redirect to home if not admin
    router.navigate(['/']);
    return false;
};
