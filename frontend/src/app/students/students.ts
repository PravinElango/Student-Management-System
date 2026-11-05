import { Component, inject, OnInit, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router, RouterLink, ActivatedRoute, NavigationEnd } from "@angular/router";
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from "@angular/forms";
import { AuthService } from '../services/auth';
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
  emailSent?: boolean;
  data: any;
}

interface StudentDeleteResponse {
  message: string;
}

interface StudentCourse {
  _id: string;
  name: string;
  code: string;
}

interface ImportRecord {
  row: number;
  name: string;
  email?: string;
  status?: string;
  reason?: string;
}

interface ImportResponse {
  message: string;
  totalRecords: number;
  importedCount: number;
  failedCount: number;
  emailSentCount: number;
  emailFailedCount: number;
  importedRecords: ImportRecord[];
  invalidRecords: ImportRecord[];
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
  profileImageUrl: string | null = null;
  editingStudentId: string | null = null;
  selectedProfileImage: File | null = null;
  removeProfileImage = false;
  dataLoaded = signal(false);
  studentsLoaded = signal(false);
  coursesLoaded = signal(false);
  showStudentDetails = signal(false);
  showImportResults = signal(false);
  importResult = signal<ImportResponse | null>(null);
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

    const studentData = new FormData();

    studentData.append("name", this.studentForm.value.name!);
    studentData.append("email", this.studentForm.value.email!);
    studentData.append("age", String(this.studentForm.value.age));
    studentData.append("course", this.studentForm.value.course!);

    if (this.selectedProfileImage) {
      studentData.append("profileImage", this.selectedProfileImage);
    }

    this.http.post<StudentActionResponse>(
      "http://localhost:3000/api/students/create",
      studentData
    ).subscribe({
      next: (response) => {
        this.studentAction = response;

        if (response.emailSent) {
          alert("Student created successfully! Registration email sent.");
        } else {
          alert("Student created successfully, but the registration email could not be sent.");
        }

        this.studentForm.reset();
        this.selectedProfileImage = null;
        this.showStudentForm.set(false);
        this.loadStudents();
      },
      error: (error) => {
        console.log("Student creation error:", error);
      }
    });
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
    this.http.post<StudentActionResponse>(
      `http://localhost:3000/api/students/${studentId}/details`,
      {}
    ).subscribe({
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

          this.selectedProfileImage = null;
          this.removeProfileImage = false;

          this.showStudentForm.set(true);
          this.showStudentDetails.set(false);

        } else {

          this.showStudentForm.set(false);
          this.showStudentDetails.set(true);
        }

        console.log(response.message);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }



  saveStudentChanges() {

    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    if (!this.editingStudentId) {
      return;
    }

    const studentData = new FormData();

    studentData.append("name", this.studentForm.value.name!);
    studentData.append("email", this.studentForm.value.email!);
    studentData.append("age", String(this.studentForm.value.age));
    studentData.append("course", this.studentForm.value.course!);

    if (this.selectedProfileImage) {
      studentData.append("profileImage", this.selectedProfileImage);
    }

    if (this.removeProfileImage) {
      studentData.append("removeProfileImage", "true");
    }

    this.http.post<StudentActionResponse>(
      `http://localhost:3000/api/students/${this.editingStudentId}/update`,
      studentData
    ).subscribe({
      next: (response) => {

        alert(response.message || "Student updated successfully!");

        console.log("Student updated:", response.data);

        this.loadStudents();

        this.studentForm.reset();
        this.selectedProfileImage = null;
        this.removeProfileImage = false;

        this.showStudentForm.set(false);
        this.editingStudentId = null;
        this.router.navigate(['/students']);
      },
      error: (error) => {
        console.log("Student update error:", error);
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
    this.pageMode.set('view');
    this.showStudentDetails.set(true);
    this.getStudentDetails(studentId);
    this.loadProfileImage(studentId);
  }

  closeStudentDetails() {
    this.showStudentDetails.set(false);
    this.studentDetails.set(null);
    this.pageMode.set('list');
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

  importStudents(event: Event) {

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<ImportResponse>(
      'http://localhost:3000/api/students/import',
      formData
    ).subscribe({
      next: (response) => {
        console.log("Import response:", response);

        this.importResult.set(response);
        this.showImportResults.set(true);

        this.loadStudents();

        input.value = '';
      },
      error: (error) => {
        console.log("Import error:", error);

        alert(error.error?.message || "Excel import failed!");

        input.value = '';
      }
    });
  }

  loadProfileImage(studentId: string) {
    this.http.get(
      `http://localhost:3000/api/students/${studentId}/profile-image`,
      { responseType: 'blob' }
    ).subscribe({
      next: (imageBlob) => {
        this.profileImageUrl = URL.createObjectURL(imageBlob);
      },
      error: (error) => {
        console.log("Failed to load profile image:", error);
        this.profileImageUrl = null;
      }
    });
  }

  onProfileImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.selectedProfileImage = file;
    }
  }

  removeExistingProfileImage() {
    this.removeProfileImage = true;
    this.selectedProfileImage = null;
  }

  downloadStudentPdf(studentId: string) {
    if (!studentId) {
      return;
    }
    this.http.post(
      `http://localhost:3000/api/students/${studentId}/pdf`,
      {},
      { responseType: 'blob' }
    ).subscribe({
      next: (pdfBlob) => {
        const pdfUrl = URL.createObjectURL(pdfBlob);

        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'student-profile.pdf';

        link.click();

        URL.revokeObjectURL(pdfUrl);
      },
      error: (error) => {
        console.error("PDF download failed:", error);
        alert("Failed to download student PDF!");
      }
    });
  }
}

