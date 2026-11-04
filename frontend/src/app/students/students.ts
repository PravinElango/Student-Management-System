import { Component, inject, OnInit, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router, RouterLink, ActivatedRoute, NavigationEnd } from "@angular/router";
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from "@angular/forms";
import { AuthService } from '../services/auth';
import * as XLSX from 'xlsx';
import { filter } from 'rxjs';

interface Student {
  _id: string;
  name: string;
  email: string;
  age: number;
  course: StudentCourse;
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

interface StudentActionResponse {
  message: string;
  data: Student;
}

interface StudentDeleteResponse {
  message: string;
}

interface StudentCourse {
  _id: string;
  name: string;
  code: string;
}

@Component({
  imports: [RouterLink, ReactiveFormsModule],
  selector: 'app-students',
  styleUrl: './students.css',
  templateUrl: './students.html',
})
export class Students implements OnInit {
  router = inject(Router)
  route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  http = inject(HttpClient)
  fb = inject(FormBuilder);
  studentForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    age: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(100)]),
    course: ['', Validators.required]
  });
  showStudentForm = signal(false);
  students: Student[] = []
  courses: Course[] = [];
  studentAction: StudentActionResponse | null = null;
  studentDelete: StudentDeleteResponse | null = null;
  studentDetails = signal<StudentActionResponse | null>(null);
  editingStudentId: string | null = null;
  dataLoaded = signal(false);
  studentsLoaded = signal(false);
  coursesLoaded = signal(false);
  showStudentDetails = signal(false);
  pageMode = signal<'list' | 'view' | 'edit'>('list');
  ngOnInit() {
    this.loadStudents();
    this.loadCourses();

    const handleRoute = () => {
      const studentId = this.route.snapshot.paramMap.get('studentId');

      if (!studentId) {
        this.pageMode.set('list');
        this.studentDetails.set(null);
        this.showStudentDetails.set(false);
        this.showStudentForm.set(false);
        this.editingStudentId = null;
        return;
      }

      const isEdit = this.router.url.endsWith('/edit');

      this.pageMode.set(isEdit ? 'edit' : 'view');
      this.editingStudentId = isEdit ? studentId : null;

      this.getStudentDetails(studentId);
    };

    // Handle the URL when the component first loads.
    handleRoute();

    // Handle subsequent navigation.
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => handleRoute());
  }
  loadStudents() {
    this.http.post<StudentResponse>('http://localhost:3000/api/students/list', {})
      .subscribe({
        next: (response) => {
          this.students = response.data
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
    this.http.post<CourseResponse>("http://localhost:3000/api/courses/list", {})
      .subscribe({
        next: (response) => {
          this.courses = response.data
          console.log("Course response:", response);
          console.log("Course Count:", response.data.length);
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

  createStudent() {

    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    const studentData = {
      ...this.studentForm.value,
      age: Number(this.studentForm.value.age)
    };
    console.log("Payload", studentData);

    this.http.post<StudentActionResponse>("http://localhost:3000/api/students/create", studentData)
      .subscribe({
        next: (response) => {
          this.studentAction = response
          this.studentForm.reset();
          this.showStudentForm.set(false);
          console.log("Student response:", response.data);
          this.loadStudents();
        },
        error: (error) => {
          console.log(error)
        }
      })
  }

  updateStudent(studentId: string) {
    this.router.navigate(['/students', studentId, 'edit']);
  }
  deleteStudent(studentId: string) {
    if (!confirm("Are you sure you want to delete this student?"))
      return;
    this.http.post<StudentDeleteResponse>(`http://localhost:3000/api/students/${studentId}/delete`, {})
      .subscribe({
        next: (response) => {
          this.studentDelete = response
          this.loadStudents();
          console.log(response.message);
        },
        error: (error) => {
          console.log(error)
        }
      })
  }

  getStudentDetails(studentId: string) {
    this.http.post<StudentActionResponse>(`http://localhost:3000/api/students/${studentId}/details`, {})
      .subscribe({
        next: (response) => {
          this.studentDetails.set(response);
          console.log("Student details API response:", response);
          console.log("Course received:", response.data.course);
          console.log("Complete student:", response.data);
          this.studentForm.patchValue({
            name: response.data.name,
            email: response.data.email,
            age: response.data.age,
            course: response.data.course._id
          });
          if (this.pageMode() === 'edit') {
            this.showStudentForm.set(true);
            this.showStudentDetails.set(false);
          } else {
            this.showStudentForm.set(false);
            this.showStudentDetails.set(true);
          }

          console.log(response.message);
        },
        error: (error) => {
          console.log(error)
        }
      })
  }

  saveStudentChanges() {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }
    if (!this.editingStudentId) {
      return;
    }

    const studentData = {
      ...this.studentForm.value,
      age: Number(this.studentForm.value.age)
    };
    this.http.post<StudentActionResponse>(
      `http://localhost:3000/api/students/${this.editingStudentId}/update`, studentData).subscribe({
        next: (response) => {
          console.log("Student updated:", response.data);
          this.loadStudents();
          this.studentForm.reset();
          this.showStudentForm.set(false);
          this.editingStudentId = null;
        },
        error: (error) => {
          console.log(error);
        }
      });
  }

  openAddStudentForm() {
    this.editingStudentId = null;
    this.studentForm.reset({
      name: '',
      email: '',
      age: null,
      course: ''
    });
    this.showStudentForm.set(true);
  }

  cancelStudentForm() {
    this.showStudentForm.set(false);
    this.editingStudentId = null;
    this.studentForm.reset();
    this.router.navigate(['/students']);
  }

  viewStudent(studentId: string) {
    this.router.navigate(['/students', studentId]);
  }

  closeStudentDetails() {
    this.showStudentDetails.set(false);
    this.router.navigate(['/students']);
  }
  logout() {
    this.authService.logout();
  }

  exportStudentsToExcel() {
    this.http.post("http://localhost:3000/api/students/export", {}, { responseType: 'blob' })
      .subscribe({
        next: (response) => {
          const fileURL = window.URL.createObjectURL(response);
          const link = document.createElement('a');
          link.href = fileURL;
          link.download = 'students.xlsx';
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

