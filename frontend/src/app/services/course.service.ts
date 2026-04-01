import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Admin Routes
  createCourse(courseData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/courses`, courseData, { headers: this.getAuthHeaders() });
  }

  createChapter(formData: FormData): Observable<any> {
    // FormData for file upload doesn't need Content-Type header, browser sets it with boundary
    return this.http.post(`${this.apiUrl}/admin/chapters`, formData, { headers: this.getAuthHeaders() });
  }

  createAssignment(assignmentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/assignments`, assignmentData, { headers: this.getAuthHeaders() });
  }

  // Public/Student Routes
  getAllCourses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/courses`);
  }

  getCourseDetails(courseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/courses/${courseId}`, { headers: this.getAuthHeaders() });
  }

  getChapterDetails(chapterId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/chapters/${chapterId}`, { headers: this.getAuthHeaders() });
  }

  completeChapter(chapterId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/chapters/${chapterId}/complete`, {}, { headers: this.getAuthHeaders() });
  }

  getCertificateDetails(courseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/certificate/${courseId}`, { headers: this.getAuthHeaders() });
  }

  enrollCourse(courseId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/${courseId}/enroll`, {}, { headers: this.getAuthHeaders() });
  }

  getDashboardData(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/dashboard`, { headers: this.getAuthHeaders() });
  }

  submitAssignment(payload: { assignmentId: string, answers: number[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}/assignments/submit`, payload, { headers: this.getAuthHeaders() });
  }

  runPlaygroundCode(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/playground/execute`, data, { headers: this.getAuthHeaders() });
  }
}
