import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  courseService = inject(CourseService);
  router = inject(Router);

  courses: any[] = [];
  loading = true;

  ngOnInit() {
    this.courseService.getAllCourses().subscribe({
      next: (res) => {
        this.courses = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('token');
  }

  goToLogin() {
    this.router.navigate(['/auth']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToCourse(courseId: string) {
    const token = sessionStorage.getItem('token');
    if (token) {
      this.router.navigate(['/course', courseId]);
    } else {
      this.router.navigate(['/auth']);
    }
  }
}
