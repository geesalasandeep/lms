import { Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth.component';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CourseDetailComponent } from './pages/course-detail/course-detail.component';
import { PlayerComponent } from './pages/player/player.component';
import { AdminComponent } from './pages/admin/admin.component';
import { LiveStreamComponent } from './pages/live-stream/live-stream.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { CertificateComponent } from './pages/certificate/certificate.component';
import { PlaygroundComponent } from './pages/playground/playground.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'auth', component: AuthComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'course/:id', component: CourseDetailComponent, canActivate: [authGuard] },
    { path: 'player/:courseId/:videoId', component: PlayerComponent, canActivate: [authGuard] },
    { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] },
    { path: 'live', component: LiveStreamComponent, canActivate: [authGuard] },
    { path: 'certificate/:courseId', component: CertificateComponent, canActivate: [authGuard] },
    { path: 'playground/:courseId', component: PlaygroundComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' }
];


