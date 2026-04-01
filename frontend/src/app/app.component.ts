import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { SocketService } from './services/socket.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'frontend';
  activeNotification: any = null;

  constructor(private socketService: SocketService, private router: Router) {
    this.socketService.notification$.subscribe(notif => {
      this.activeNotification = notif;
      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (this.activeNotification === notif) {
          this.activeNotification = null;
        }
      }, 10000);
    });
  }

  navigateToNotification(link: string) {
    this.activeNotification = null;
    this.router.navigateByUrl(link);
  }

  closeNotification() {
    this.activeNotification = null;
  }
}
