
import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../services/auth';
import { DatePipe } from '@angular/common';

interface Course {
  _id: string;
  name: string;
  code: string;
}

interface CourseResponse {
  message: string;
  data: Course[];
}

interface ClassItem {
  _id: string;
  name: string;
  code: string;
  course: Course;
  capacity: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: 'Active' | 'Inactive';
  totalStudents: number;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  age: number;
}

interface ClassListResponse {
  message: string;
  totalClasses: number;
  classes: ClassItem[];
}

interface ClassActionResponse {
  message: string;
  class: ClassItem;
}

interface ClassDetailsResponse {
  message: string;
  class: ClassItem & {
    availableSeats: number;
  };
  students: Student[];
  totalStudents: number;
}

interface ClassDeleteResponse {
  message: string;
}

@Component({
  selector: 'app-classes',
  imports: [RouterLink, ReactiveFormsModule, DatePipe],
  templateUrl: './classes.html',
  styleUrl: './classes.css'
})
export class Classes implements OnInit {

  router = inject(Router);
  route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  http = inject(HttpClient);
  fb = inject(FormBuilder);

  classForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: ['', Validators.required],
    course: ['', Validators.required],
    capacity: [25, [Validators.required, Validators.min(1)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    status: ['Active', Validators.required]
  });

  classes: ClassItem[] = [];
  courses: Course[] = [];

  classDetails = signal<ClassDetailsResponse | null>(null);

  dataLoaded = signal(false);
  showClassForm = signal(false);
  showClassDetails = signal(false);

  pageMode = signal<'list' | 'view' | 'edit'>('list');

  editingClassId: string | null = null;

  ngOnInit() {
    this.loadClasses();
    this.loadCourses();

    const handleRoute = () => {
      const classId = this.route.snapshot.paramMap.get('classId');

      if (!classId) {
        this.pageMode.set('list');
        this.classDetails.set(null);
        this.showClassDetails.set(false);
        this.showClassForm.set(false);
        this.editingClassId = null;
        return;
      }

      const isEdit = this.router.url.endsWith('/edit');

      this.pageMode.set(isEdit ? 'edit' : 'view');
      this.editingClassId = isEdit ? classId : null;

      this.getClassDetails(classId, isEdit ? 'edit' : 'view');
    };

    handleRoute();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => handleRoute());
  }

  // Load all classes
  loadClasses() {
    this.http.post<ClassListResponse>(
      'http://localhost:3000/api/classes/list',
      {}
    ).subscribe({
      next: (response) => {
        this.classes = response.classes;
        this.dataLoaded.set(true);
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.dataLoaded.set(true);
      }
    });
  }

  // Load courses for dropdown
  loadCourses() {
    this.http.post<CourseResponse>(
      'http://localhost:3000/api/courses/list',
      {}
    ).subscribe({
      next: (response) => {
        this.courses = response.data;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
      }
    });
  }

  // Open add class form
  openAddClassForm() {
    this.editingClassId = null;
    this.showClassDetails.set(false);

    this.classForm.reset({
      name: '',
      code: '',
      course: '',
      capacity: 25,
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      status: 'Active'
    });

    this.showClassForm.set(true);
  }

  // Create class
  createClass() {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }

    this.http.post<ClassActionResponse>(
      'http://localhost:3000/api/classes/create',
      this.classForm.getRawValue()
    ).subscribe({
      next: (response) => {
        console.log('Class created:', response);

        this.cancelClassForm();
        this.loadClasses();
      },
      error: (error) => {
        console.error('Error creating class:', error);
        alert(error.error?.message || 'Unable to create class.');
      }
    });
  }

  // Navigate to class details
  viewClass(classId: string) {
    this.router.navigate(['/classes', classId]);
  }

  // Navigate to edit class
  updateClass(classId: string) {
    this.router.navigate(['/classes', classId, 'edit']);
  }

  // Fetch class details
  getClassDetails(classId: string, mode: 'view' | 'edit') {
    this.http.post<ClassDetailsResponse>(
      `http://localhost:3000/api/classes/${classId}/details`,
      {}
    ).subscribe({
      next: (response) => {
        this.classDetails.set(response);

        const classData = response.class;

        if (mode === 'edit') {
          this.classForm.patchValue({
            name: classData.name,
            code: classData.code,
            course: classData.course?._id || '',
            capacity: classData.capacity,
            startDate: classData.startDate?.substring(0, 10),
            endDate: classData.endDate?.substring(0, 10),
            startTime: classData.startTime,
            endTime: classData.endTime,
            status: classData.status
          });

          this.showClassForm.set(true);
          this.showClassDetails.set(false);
        } else {
          this.showClassDetails.set(true);
          this.showClassForm.set(false);
        }
      },
      error: (error) => {
        console.error('Error fetching class details:', error);
        alert(error.error?.message || 'Unable to fetch class details.');
        this.router.navigate(['/classes']);
      }
    });
  }

  // Save class changes
  saveClassChanges() {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }

    if (!this.editingClassId) {
      return;
    }

    this.http.post<ClassActionResponse>(
      `http://localhost:3000/api/classes/${this.editingClassId}/update`,
      this.classForm.getRawValue()
    ).subscribe({
      next: (response) => {
        console.log('Class updated:', response);

        this.cancelClassForm();
        this.loadClasses();
      },
      error: (error) => {
        console.error('Error updating class:', error);
        alert(error.error?.message || 'Unable to update class.');
      }
    });
  }

  // Delete class
  deleteClass(classId: string) {
    if (!confirm('Are you sure you want to delete this class?')) {
      return;
    }

    this.http.post<ClassDeleteResponse>(
      `http://localhost:3000/api/classes/${classId}/delete`,
      {}
    ).subscribe({
      next: (response) => {
        alert(response.message);
        this.loadClasses();
      },
      error: (error) => {
        console.error('Error deleting class:', error);
        alert(error.error?.message || 'Unable to delete class.');
      }
    });
  }

  // Cancel form and return to list
  cancelClassForm() {
    this.showClassForm.set(false);
    this.showClassDetails.set(false);
    this.editingClassId = null;

    this.classForm.reset({
      name: '',
      code: '',
      course: '',
      capacity: 25,
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      status: 'Active'
    });

    this.router.navigate(['/classes']);
  }

  // Close details modal
  closeClassDetails() {
    this.showClassDetails.set(false);
    this.classDetails.set(null);
    this.router.navigate(['/classes']);
  }

  logout() {
    this.authService.logout();
  }
}
