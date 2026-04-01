import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, tap } from 'rxjs/operators';
import { throwError, Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.checkToken();
  }

  private checkToken() {
    const token = sessionStorage.getItem('token');
    const userStr = sessionStorage.getItem('user');
    if (token && userStr) {
      this.currentUser.set(JSON.parse(userStr));
    }
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((res: any) => this.setSession(res))
    );
  }

  sendOtp(mobile: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/otp/send`, { mobile });
  }

  verifyOtp(mobile: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/otp/verify`, { mobile, otp }).pipe(
      tap((res: any) => this.setSession(res))
    );
  }

  private setSession(authResult: any) {
    sessionStorage.setItem('token', authResult.token);
    sessionStorage.setItem('user', JSON.stringify(authResult.user));
    this.currentUser.set(authResult.user);
  }

  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/auth']);
  }
}
