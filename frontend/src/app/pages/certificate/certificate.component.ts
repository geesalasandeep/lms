import { Component, inject, OnInit } from '@angular/core'; // Added comment to trigger rebuild
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../services/course.service';

@Component({
    selector: 'app-certificate',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './certificate.component.html',
    styleUrls: ['./certificate.component.scss']
})
export class CertificateComponent implements OnInit {
    route = inject(ActivatedRoute);
    router = inject(Router);
    courseService = inject(CourseService);

    courseId: string | null = null;
    certificateData: any = null;
    loading = true;
    error = '';

    ngOnInit() {
        this.courseId = this.route.snapshot.paramMap.get('courseId');
        if (this.courseId) {
            this.courseService.getCertificateDetails(this.courseId).subscribe({
                next: (data) => {
                    this.certificateData = data;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = 'Certificate not found or course not fully completed.';
                    this.loading = false;
                }
            });
        } else {
            this.error = 'Invalid course.';
            this.loading = false;
        }
    }

    printCertificate() {
        window.print();
    }

    goBack() {
        this.router.navigate(['/dashboard']);
    }
}
