
import { Component, inject, OnInit, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { RouterLink } from "@angular/router";
import { AuthService } from "../services/auth";

interface Student {
    _id: string;
    name: string;
    email: string;
    age: number;
}

interface StudentResponse {
    message: string;
    data: Student[];
}

interface Course {
    _id: string;
    name: string;
    code: string;
    subjects: string[];
}

interface CourseResponse {
    message: string;
    data: Course[];
}

interface MonthlyAdmission {
    month: string;
    totalAdmissions: number;
}

interface MonthlyAdmissionResponse {
    message: string;
    totalMonths: number;
    monthlyAdmissions: MonthlyAdmission[];
}

@Component({
    selector: 'app-home',
    imports: [RouterLink],
    templateUrl: './home.html',
    styleUrl: './home.css'
})
export class Home implements OnInit {

    private authService = inject(AuthService);
    private http = inject(HttpClient);

    totalStudents = 0;
    totalCourses = 0;

    dataLoaded = signal(false);

    studentsLoaded = signal(false);
    coursesLoaded = signal(false);
    admissionsLoaded = signal(false);

    monthlyAdmissionsError = signal(false);

    students: Student[] = [];
    courses: Course[] = [];
    monthlyAdmissions: MonthlyAdmission[] = [];

    ngOnInit() {
        this.loadStudents();
        this.loadCourses();
        this.loadMonthlyAdmissions();
    }

    loadStudents() {
        this.http.post<StudentResponse>(
            'http://localhost:3000/api/students/list', {}
        ).subscribe({
            next: (response) => {
                this.students = response.data;
                this.totalStudents = response.data.length;

                this.studentsLoaded.set(true);
                this.updateLoadingState();
            },
            error: (error) => {
                console.error("Students loading error:", error);

                this.studentsLoaded.set(true);
                this.updateLoadingState();
            }
        });
    }

    loadCourses() {
        this.http.post<CourseResponse>(
            'http://localhost:3000/api/courses/list', {}
        ).subscribe({
            next: (response) => {
                this.courses = response.data;
                this.totalCourses = response.data.length;

                this.coursesLoaded.set(true);
                this.updateLoadingState();
            },
            error: (error) => {
                console.error("Courses loading error:", error);

                this.coursesLoaded.set(true);
                this.updateLoadingState();
            }
        });
    }

    loadMonthlyAdmissions() {
        this.http.post<MonthlyAdmissionResponse>(
            'http://localhost:3000/api/analytics/monthly-admissions', {}
        ).subscribe({
            next: (response) => {
                this.monthlyAdmissions = response.monthlyAdmissions;

                this.admissionsLoaded.set(true);
                this.updateLoadingState();
            },
            error: (error) => {
                console.error("Monthly admissions loading error:", error);

                this.monthlyAdmissionsError.set(true);
                this.admissionsLoaded.set(true);
                this.updateLoadingState();
            }
        });
    }

    updateLoadingState() {
        this.dataLoaded.set(
            this.studentsLoaded() &&
            this.coursesLoaded() &&
            this.admissionsLoaded()
        );
    }

    getBarHeight(admissions: number): number {
        const maximum = Math.max(
            ...this.monthlyAdmissions.map(item => item.totalAdmissions),
            0
        );

        if (maximum === 0) {
            return 0;
        }

        return Math.max((admissions / maximum) * 100, 8);
    }

    getMonthLabel(month: string): string {
        const date = new Date(`${month}-01T00:00:00`);
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
    }

    logout() {
        this.authService.logout();
    }
}
