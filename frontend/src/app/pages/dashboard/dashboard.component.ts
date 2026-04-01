import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService, AppNotification } from '../../services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  courseService = inject(CourseService);
  router = inject(Router);
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  showNotifications = false;

  get user() {
    return this.authService.currentUser();
  }

  dashboardData: any = null;
  loading = true;

  ngOnInit() {
    this.notificationService.fetchNotifications();
    this.courseService.getDashboardData('currentUserId').subscribe({
      next: (res) => {
        console.log('Dashboard Data Received:', res);
        this.dashboardData = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  resumeCourse(courseId: string) {
    this.router.navigate(['/course', courseId]);
  }

  goToPlayground(courseId: string) {
    this.router.navigate(['/playground', courseId]);
  }

  viewCertificate(courseId: string) {
    this.router.navigate(['/certificate', courseId]);
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }

  logout() {
    this.authService.logout();
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  handleNotificationClick(notif: AppNotification) {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif._id);
    }
    this.showNotifications = false;
    if (notif.link) {
      this.router.navigateByUrl(notif.link);
    }
  }
}
