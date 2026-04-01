import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
    const router = inject(Router);
    const authService = inject(AuthService);

    // Minimal logic for SSR/CSR init check
    const token = sessionStorage.getItem('token');

    if (token) {
        return true;
    }

    router.navigate(['/auth']);
    return false;
};
