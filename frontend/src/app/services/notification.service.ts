import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AppNotification {
    _id: string;
    title: string;
    message: string;
    link: string;
    isRead: boolean;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${environment.apiUrl}/notifications`;

    notifications = signal<AppNotification[]>([]);
    unreadCount = signal(0);
    private pollingInterval: any;

    constructor(private http: HttpClient) {
        this.startPolling();
    }

    private getAuthHeaders() {
        const token = sessionStorage.getItem('token');
        return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    }

    startPolling() {
        // Initial fetch, then repeat every 5 seconds
        if (typeof window !== 'undefined') {
            this.fetchNotifications();
            this.pollingInterval = setInterval(() => {
                if (sessionStorage.getItem('token')) {
                    this.fetchNotifications();
                }
            }, 5000);
        }
    }

    fetchNotifications() {
        this.http.get<AppNotification[]>(this.apiUrl, { headers: this.getAuthHeaders() }).subscribe({
            next: (data) => {
                this.notifications.set(data);
                this.unreadCount.set(data.filter(n => !n.isRead).length);
            },
            error: (err) => console.error('Error fetching notifications:', err)
        });
    }

    markAsRead(id: string) {
        this.http.put(`${this.apiUrl}/${id}/read`, {}, { headers: this.getAuthHeaders() }).subscribe({
            next: () => this.fetchNotifications()
        });
    }
}
