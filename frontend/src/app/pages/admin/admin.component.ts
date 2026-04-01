import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  courseService = inject(CourseService);
  router = inject(Router);

  activeTab: 'course' | 'chapter' | 'assignment' = 'course';

  courses: any[] = [];
  message = '';

  // Data Models
  courseData = { title: '', description: '', thumbnailUrl: '', price: 0 };
  chapterData = { courseId: '', title: '', order: 1, durationMinutes: 10 };
  selectedVideoFile: File | null = null;

  // Multi-Question Assignment
  assignmentData = {
    chapterId: '',
    passingScore: 40,
    questions: [this.createNewQuestion()]
  };

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.courseService.getAllCourses().subscribe(res => this.courses = res);
  }

  createNewQuestion() {
    return {
      questionText: '',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false }
      ]
    };
  }

  addQuestion() {
    this.assignmentData.questions.push(this.createNewQuestion());
  }

  removeQuestion(index: number) {
    this.assignmentData.questions.splice(index, 1);
  }

  addOption(qIndex: number) {
    this.assignmentData.questions[qIndex].options.push({ text: '', isCorrect: false });
  }

  prepareChapter(courseId: string) {
    this.chapterData.courseId = courseId;
    this.activeTab = 'chapter';
    window.scrollTo(0, 0);
  }

  goToCourse(courseId: string) {
    this.router.navigate(['/course', courseId]);
  }

  prepareAssignment(chapterId: string) {
    this.assignmentData.chapterId = chapterId;
    this.activeTab = 'assignment';
    window.scrollTo(0, 0);
  }

  createCourse() {
    this.courseService.createCourse(this.courseData).subscribe({
      next: (res) => {
        this.message = `Course created successfully!`;
        this.loadCourses();
        this.courseData = { title: '', description: '', thumbnailUrl: '', price: 0 };
      },
      error: (err) => this.message = 'Error creating course'
    });
  }

  onFileSelected(event: any) {
    this.selectedVideoFile = event.target.files[0];
  }

  createChapter() {
    if (!this.selectedVideoFile) {
      this.message = 'Please select a video file.';
      return;
    }

    const formData = new FormData();
    formData.append('courseId', this.chapterData.courseId);
    formData.append('title', this.chapterData.title);
    formData.append('order', this.chapterData.order.toString());
    formData.append('durationMinutes', this.chapterData.durationMinutes.toString());
    formData.append('video', this.selectedVideoFile);

    this.courseService.createChapter(formData).subscribe({
      next: (res) => {
        this.message = `Chapter '${this.chapterData.title}' added successfully!`;
        this.prepareAssignment(res._id); // Offer to add assignment immediately
        this.chapterData = { courseId: '', title: '', order: 1, durationMinutes: 10 };
        this.selectedVideoFile = null;
      },
      error: (err) => this.message = 'Error creating chapter'
    });
  }

  createAssignment() {
    const payload = {
      chapterId: this.assignmentData.chapterId,
      passingScore: this.assignmentData.passingScore,
      questions: this.assignmentData.questions
    };

    this.courseService.createAssignment(payload).subscribe({
      next: (res) => {
        this.message = 'Multi-question assignment created successfully!';
        this.assignmentData = { chapterId: '', passingScore: 40, questions: [this.createNewQuestion()] };
        this.activeTab = 'course';
      },
      error: (err) => this.message = 'Error creating assignment'
    });
  }
}
