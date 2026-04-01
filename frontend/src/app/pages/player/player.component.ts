import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../services/course.service';

import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit {
  courseService = inject(CourseService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  sanitizer = inject(DomSanitizer);

  courseId: string | null = null;
  chapterId: string | null = null;
  readonly VAPID_PUBLIC_KEY = "BDX7GdseSgWzglE11hFGadhq-1rsxeHuYvHTliS_cEoyCB6Te-OJz4aSxcsu1q-8V0KBFHILAdKIr1WxZ1HPrZY";

  data: any = null;
  safeVideoUrl: SafeUrl | null = null;
  loading = true;

  showAssignment = false;
  selectedAnswers: number[] = [];
  assignmentResult = '';
  assignmentPassed = false;

  ngOnInit() {
    this.courseId = this.route.snapshot.paramMap.get('courseId');
    this.chapterId = this.route.snapshot.paramMap.get('videoId');

    if (this.chapterId) {
      this.courseService.getChapterDetails(this.chapterId).subscribe({
        next: (res) => {
          this.data = res;
          if (res.chapter?.videoUrl) {
            const encoded = 'https://cool-pets-lay.loca.lt' + encodeURI(res.chapter.videoUrl);
            this.safeVideoUrl = this.sanitizer.bypassSecurityTrustUrl(encoded);
          }
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }

  onVideoEnded() {
    if (this.data?.assignment) {
      this.showAssignment = true;
    } else {
      // Logic to auto-unlock next chapter
      this.completeChapter();
    }
  }

  onVideoError(event: any) {
    console.error('Video Error Occurred!', event.target.error);
    alert('Video loading error: ' + (event.target.error?.message || 'Unknown code ' + event.target.error?.code));
  }

  submitAssignment() {
    if (!this.data?.assignment) return;

    this.courseService.submitAssignment({
      assignmentId: this.data.assignment._id,
      answers: this.selectedAnswers
    }).subscribe({
      next: (res) => {
        this.assignmentResult = res.message;
        this.assignmentPassed = res.passed;
        if (res.passed) {
          setTimeout(() => this.completeChapter(), 2000);
        }
      },
      error: (err) => {
        this.assignmentResult = 'Error submitting assignment. Please try again.';
      }
    });
  }

  completeChapter() {
    if (this.chapterId) {
      this.courseService.completeChapter(this.chapterId).subscribe({
        next: () => {
          this.router.navigate(['/course', this.courseId]);
        },
        error: (err) => {
          console.error('Failed to update chapter progress', err);
          // Navigate anyway so the user isn't stuck
          this.router.navigate(['/course', this.courseId]);
        }
      });
    } else {
      this.router.navigate(['/course', this.courseId]);
    }
  }
}
