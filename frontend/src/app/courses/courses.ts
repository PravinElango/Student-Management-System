
import { Component, inject, OnInit, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router, RouterLink, ActivatedRoute, NavigationEnd } from "@angular/router";
import { filter } from "rxjs";
import { AuthService } from '../services/auth';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from "@angular/forms";

interface Student {
  _id: string;
  name: string;
  email: string;
  age: number;
  course: {
    _id: string;
    name: string;
    code: string;
  };
}

interface Course {
  _id: string;
  name: string;
  code: string;
  subjects: string[];
  duration: number;
  durationUnit: 'Days' | 'Weeks' | 'Months' | 'Years';
  students_enrolled: number;
}

interface CourseResponse {
  message: string;
  data: Course[];
}

interface CourseActionResponse {
  message: string;
  data: Course;
}

interface CourseDetailsResponse {
  message: string;
  data: {
    course: Course;
    students: Student[];
    totalStudents: number;
  };
}

interface StudentResponse {
  message: string;
  data: Student[];
}

interface CourseDeleteResponse {
  message: string;
}

@Component({
  imports: [RouterLink, ReactiveFormsModule],
  selector: 'app-courses',
  styleUrl: './courses.css',
  templateUrl: './courses.html',
})
export class Courses implements OnInit {
  router = inject(Router);
  route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  http = inject(HttpClient);
  fb = inject(FormBuilder);

  courseForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: ['', [Validators.required]],
    subjects: ['', [
      Validators.required,
      Validators.pattern(/.*\S.*/)
    ]],
    duration: [1, [
      Validators.required,
      Validators.min(1),
      Validators.pattern(/^[0-9]+$/)
    ]],
    durationUnit: ['Months', [Validators.required]]
  });

  showCourseForm = signal(false);
  students: Student[] = [];
  courses: Course[] = [];

  courseAction: CourseActionResponse | null = null;
  courseDelete: CourseDeleteResponse | null = null;
  courseDetails = signal<CourseDetailsResponse | null>(null);
  editingCourseId: string | null = null;

  dataLoaded = signal(false);
  showCourseDetails = signal(false);
  pageMode = signal<'list' | 'view' | 'edit'>('list');

  ngOnInit() {
    this.loadCourses();
    this.loadStudents();

    const handleRoute = () => {
      const courseId = this.route.snapshot.paramMap.get('courseId');

      if (!courseId) {
        this.pageMode.set('list');
        this.courseDetails.set(null);
        this.showCourseDetails.set(false);
        this.showCourseForm.set(false);
        this.editingCourseId = null;
        return;
      }

      const isEdit = this.router.url.endsWith('/edit');

      this.pageMode.set(isEdit ? 'edit' : 'view');
      this.editingCourseId = isEdit ? courseId : null;

      this.getCourseDetails(courseId, isEdit ? 'edit' : 'view');
    };

    handleRoute();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => handleRoute());
  }
  // to load course
  loadCourses() {
    this.http.post<CourseResponse>(
      "http://localhost:3000/api/courses/list",
      {}
    ).subscribe({
      next: (response) => {
        this.courses = response.data;

        console.log("Courses response:", response);
        console.log("Course count:", response.data.length);

        this.dataLoaded.set(true);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }
  // to create course
  createCourse() {

    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    const formValue = this.courseForm.value;

    const courseData = {
      name: formValue.name,
      code: formValue.code,
      subjects: formValue.subjects!
        .split(',')
        .map(subject => subject.trim())
        .filter(subject => subject !== ''),
      duration: Number(formValue.duration),
      durationUnit: formValue.durationUnit
    };

    console.log("Course payload:", courseData);

    this.http.post<CourseActionResponse>(
      "http://localhost:3000/api/courses/create",
      courseData
    ).subscribe({
      next: (response) => {
        this.courseAction = response;

        console.log("Course created:", response.data);

        this.courseForm.reset();
        this.showCourseForm.set(false);

        this.loadCourses();
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  // to get details of a course
  updateCourse(courseId: string) {
    this.router.navigate(['/courses', courseId, 'edit']);
  }

  getCourseDetails(courseId: string, mode: 'view' | 'edit') {
    this.http.post<CourseDetailsResponse>(
      `http://localhost:3000/api/courses/${courseId}/details`, {}
    ).subscribe({
      next: (response) => {

        this.courseDetails.set(response);

        const course = response.data.course;

        console.log("Course details:", course);
        console.log("Enrolled students:", response.data.students);
        console.log("Total students:", response.data.totalStudents);

        if (mode === 'edit') {

          this.courseForm.patchValue({
            name: course.name,
            code: course.code,
            subjects: course.subjects.join(', '),
            duration: course.duration,
            durationUnit: course.durationUnit
          });

          this.showCourseForm.set(true);
          this.showCourseDetails.set(false);

        } else {

          this.showCourseDetails.set(true);
          this.showCourseForm.set(false);

        }
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  // update course
  saveCourseChanges() {

    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    if (!this.editingCourseId) {
      return;
    }

    const formValue = this.courseForm.value;

    const courseData = {
      name: formValue.name,
      code: formValue.code,
      subjects: formValue.subjects!
        .split(',')
        .map(subject => subject.trim())
        .filter(subject => subject !== ''),
      duration: Number(formValue.duration),
      durationUnit: formValue.durationUnit
    };

    this.http.post<CourseActionResponse>(
      `http://localhost:3000/api/courses/${this.editingCourseId}/update`, courseData)
      .subscribe({
        next: (response) => {

          console.log("Course updated:", response.data);

          this.loadCourses();

          this.courseForm.reset();
          this.showCourseForm.set(false);
          this.editingCourseId = null;
        },
        error: (error) => {
          console.log(error);
        }
      });
  }

  //to delete a course
  deleteCourse(courseId: string) {

    if (!confirm("Are you sure you want to delete this course?")) {
      return;
    }

    this.http.post<CourseDeleteResponse>(
      `http://localhost:3000/api/courses/${courseId}/delete`,
      {}
    ).subscribe({
      next: (response) => {

        this.courseDelete = response;

        console.log(response.message);

        this.loadCourses();
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  // to open a add course form
  openAddCourseForm() {

    this.editingCourseId = null;
    this.showCourseDetails.set(false);
    this.courseForm.reset({
      name: '',
      code: '',
      subjects: '',
      duration: 1,
      durationUnit: 'Months'
    });

    this.showCourseForm.set(true);
  }

  // course form
  cancelCourseForm() {

    this.showCourseForm.set(false);
    this.showCourseDetails.set(false);
    this.editingCourseId = null;
    this.router.navigate(['/courses']);

    this.courseForm.reset({
      name: '',
      code: '',
      subjects: '',
      duration: 1,
      durationUnit: 'Months'
    });
  }

  viewCourse(courseId: string) {
    this.router.navigate(['/courses', courseId]);
  }

  logout() {
    this.authService.logout();
  }

  loadStudents() {
    this.http.post<StudentResponse>(
      "http://localhost:3000/api/students/list",
      {}
    ).subscribe({
      next: (response) => {
        this.students = response.data;
        console.log("Students loaded for course export:", this.students);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  closeStudentDetails() {
    this.showCourseDetails.set(false);
    this.router.navigate(['/courses']);
  }
  exportCoursesToExcel() {
    this.http.post("http://localhost:3000/api/courses/export", {}, { responseType: 'blob' })
      .subscribe({
        next: (response) => {
          const fileURL = window.URL.createObjectURL(response);
          const link = document.createElement('a');
          link.href = fileURL;
          link.download = 'courses.xlsx';
          link.click();
          setTimeout(() => {
            window.URL.revokeObjectURL(fileURL);
          }, 100);
        },
        error: (error) => {
          console.log(error);
        }
      })

  }
}
