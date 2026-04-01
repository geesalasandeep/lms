import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnInit {
  courseService = inject(CourseService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  data: any = null;
  loading = true;
  isEnrolled = false;
  isAdmin = false;
  unlockedChapters: string[] = [];

  ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('id');
    const user = this.authService.currentUser();
    this.isAdmin = user?.role === 'Admin';

    if (courseId) {
      this.courseService.getCourseDetails(courseId).subscribe({
        next: (res) => {
          this.data = res;
          this.checkEnrollment(courseId);
        },
        error: () => this.loading = false
      });
    }
  }

  checkEnrollment(courseId: string) {
    const user = this.authService.currentUser();
    if (!user) {
      this.loading = false;
      return;
    }

    this.courseService.getDashboardData(user.id).subscribe({
      next: (res) => {
        const enrolled = res.enrolledCourses.find((c: any) => c.courseId._id.toString() === courseId);
        this.isEnrolled = !!enrolled;
        this.unlockedChapters = enrolled ? enrolled.unlockedChapters.map((id: any) => id.toString()) : [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  isChapterUnlocked(chapterId: string): boolean {
    if (this.isAdmin) return true;
    if (!this.data || !this.data.chapters) return false;

    const index = this.data.chapters.findIndex((c: any) => c._id === chapterId);
    if (index === 0) return true; // First chapter is always unlocked

    // Current chapter is unlocked if the PREVIOUS one is in unlockedChapters
    const previousChapterId = this.data.chapters[index - 1]._id;
    return this.unlockedChapters.includes(previousChapterId);
  }

  enroll() {
    this.courseService.enrollCourse(this.data.course._id).subscribe({
      next: () => {
        alert('You have successfully enrolled! You can now access the course content.');
        this.isEnrolled = true;
      },
      error: (err) => alert(err.error?.error || 'Failed to enroll')
    });
  }

  adminGoLive() {
    if (this.data && this.data.course) {
      this.router.navigate(['/live'], { queryParams: { courseId: this.data.course._id } });
    }
  }

  playChapter(chapter: any) {
    if (!this.data || !this.data.course) return;

    if (this.isChapterUnlocked(chapter._id)) {
      this.router.navigate(['/player', this.data.course._id, chapter._id]);
    } else {
      alert('This chapter is locked. Please pass the previous assessment with at least 40% marks to unlock it.');
    }
  }
}

