import { Routes } from '@angular/router';
import { Signup } from './signup/signup';
import { Login } from './login/login';
import { Home } from './home/home'
import { Students } from './students/students'
import { Courses } from './courses/courses';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    { path: 'signup', component: Signup },
    { path: "login", component: Login },
    { path: 'students/:studentId/edit', component: Students, canActivate: [authGuard] },
    { path: 'students/:studentId', component: Students, canActivate: [authGuard] },
    { path: "students", component: Students, canActivate: [authGuard] },
    { path: 'courses/:courseId/edit', component: Courses, canActivate: [authGuard] },
    { path: 'courses/:courseId', component: Courses, canActivate: [authGuard] },
    { path: "courses", component: Courses, canActivate: [authGuard] },
    { path: "home", component: Home, canActivate: [authGuard] }    
];
