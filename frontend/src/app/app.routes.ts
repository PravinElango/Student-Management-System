import { Routes } from '@angular/router';
import { Signup } from './signup/signup';
import { Login } from './login/login';
import { Home } from './home/home'
import { Students } from './students/students'
import { Courses } from './courses/courses';
import { authGuard } from './guards/auth-guard';
import { Classes } from './classes/classes';
import { Attendance } from './attendance/attendance';

export const routes: Routes = [
    { path: 'signup', component: Signup },
    { path: "login", component: Login },
    { path: 'students/:studentId/edit', component: Students, canActivate: [authGuard] },
    { path: 'students/:studentId', component: Students, canActivate: [authGuard] },
    { path: "students", component: Students, canActivate: [authGuard] },
    { path: 'courses/:courseId/edit', component: Courses, canActivate: [authGuard] },
    { path: 'courses/:courseId', component: Courses, canActivate: [authGuard] },
    { path: "courses", component: Courses, canActivate: [authGuard] },
    { path: "home", component: Home, canActivate: [authGuard] },
    { path: 'classes/:classId/edit', component: Classes, canActivate: [authGuard] },
    { path: 'classes/:classId', component: Classes, canActivate: [authGuard] },
    { path: 'classes', component: Classes, canActivate: [authGuard] },
    { path: 'attendance', component: Attendance, canActivate: [authGuard] },
];
