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

@Component({
    selector: 'app-home',
    imports: [RouterLink],
    templateUrl: './home.html',
    styleUrl: './home.css'
})

export class Home implements OnInit {
    private authService = inject(AuthService);
    totalStudents = 0;
    totalCourses = 0;
    dataLoaded = signal(false);
    studentsLoaded = signal(false);
    coursesLoaded = signal(false);
    students: Student[] = []
    courses: Course[] = []
    http = inject(HttpClient)
    ngOnInit() {
        this.loadStudents()
        this.loadCourses()
    }
    loadStudents() {
        this.http.post<StudentResponse>('http://localhost:3000/api/students/list', {})
            .subscribe({
                next: (response) => {
                    this.students = response.data
                    this.totalStudents = response.data.length;
                    console.log("Updated totalStudents:", this.totalStudents);
                    console.log("Students response:", response);
                    console.log("Student count:", response.data.length);
                    this.studentsLoaded.set(true);
                    this.dataLoaded.set(
                        this.studentsLoaded() && this.coursesLoaded()
                    );
                },
                error: (error) => {
                    console.log(error)
                }
            })
    }

    loadCourses() {
        this.http.post<CourseResponse>('http://localhost:3000/api/courses/list', {})
            .subscribe({
                next: (response) => {
                    this.courses = response.data
                    this.totalCourses = response.data.length;
                    console.log("Courses response:", response);
                    console.log("Course count:", response.data.length);
                    this.coursesLoaded.set(true);
                    this.dataLoaded.set(
                        this.studentsLoaded() && this.coursesLoaded()
                    );
                },
                error: (error) => {
                    console.log(error)
                }
            })
    }

    logout() {
        this.authService.logout();
    }

}

