import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  authService = inject(AuthService);
  router = inject(Router);

  activeTab: 'login' | 'register' | 'otp' = 'login';

  loginData = { email: '', password: '' };
  registerData = { name: '', email: '', password: '', mobile: '', role: 'Student' };
  otpData = { mobile: '', otp: '' };

  otpSent = false;
  errorMsg = '';

  login() {
    this.authService.login(this.loginData).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => this.errorMsg = err.error?.error || 'Login failed'
    });
  }

  register() {
    this.authService.register(this.registerData).subscribe({
      next: () => {
        this.activeTab = 'login';
        this.loginData.email = this.registerData.email;
        this.errorMsg = 'Registration successful. Please login.';
      },
      error: (err) => this.errorMsg = err.error?.error || 'Registration failed'
    });
  }

  sendOtp() {
    this.authService.sendOtp(this.otpData.mobile).subscribe({
      next: () => {
        this.otpSent = true;
        this.errorMsg = 'OTP sent (Check server console)';
      },
      error: (err) => this.errorMsg = 'Failed to send OTP'
    });
  }

  verifyOtp() {
    this.authService.verifyOtp(this.otpData.mobile, this.otpData.otp).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => this.errorMsg = err.error?.error || 'Invalid OTP'
    });
  }
}
