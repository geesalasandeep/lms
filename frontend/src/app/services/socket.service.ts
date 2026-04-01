import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket: Socket;
    private notificationSubject = new Subject<any>();
    notification$ = this.notificationSubject.asObservable();

    constructor() {
        const socketUrl = environment.apiUrl.replace('/api', '');
        this.socket = io(socketUrl);

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket Server');
            const userData = sessionStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                this.socket.emit('join-user-room', user.id || user._id);
            }
        });

        this.socket.on('new-notification', (data: any) => {
            console.log('New WebSocket Notification:', data);
            this.notificationSubject.next(data);
        });
    }

    // Allow manual rejoin if user logs in later
    rejoin() {
        const userData = sessionStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            this.socket.emit('join-user-room', user.id || user._id);
        }
    }

    getSocket(): Socket {
        return this.socket;
    }
}
