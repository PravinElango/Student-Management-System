
import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../services/auth';

interface ClassItem {
  _id: string;
  name: string;
  code: string;
  course: {
    _id: string;
    name: string;
    code: string;
  };
}

interface ClassListResponse {
  message: string;
  classes: ClassItem[];
}

interface Student {
  _id: string;
  name: string;
  email: string;
  age: number;
}

interface ClassDetailsResponse {
  message: string;
  class: ClassItem;
  students: Student[];
  totalStudents: number;
}

interface AttendanceRecord {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  class: {
    _id: string;
    name: string;
    code: string;
  };
  date: string;
  status: 'Present' | 'Absent' | 'Late';
}

interface AttendanceListResponse {
  message: string;
  attendance: AttendanceRecord[];
}

interface AttendanceActionResponse {
  message: string;
  attendance?: AttendanceRecord;
}

interface AttendanceDeleteResponse {
  message: string;
}

type AttendanceStatus = '' | 'Present' | 'Absent' | 'Late';

interface AttendanceStudent extends Student {
  status: AttendanceStatus;
  attendanceId: string | null;
}

@Component({
  selector: 'app-attendance',
  imports: [RouterLink],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css'
})
export class Attendance implements OnInit {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  classes: ClassItem[] = [];
  students: AttendanceStudent[] = [];

  selectedClassId = '';
  selectedDate = this.getTodayDate();

  classesLoaded = signal(false);
  studentsLoaded = signal(false);
  attendanceLoaded = signal(false);
  savingAttendance = signal(false);

  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit() {
    this.loadClasses();
  }

  // Get today's date in YYYY-MM-DD format
  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Load available classes
  loadClasses() {
    this.http.post<ClassListResponse>(
      'http://localhost:3000/api/classes/list',
      {}
    ).subscribe({
      next: (response) => {
        this.classes = response.classes;
        this.classesLoaded.set(true);
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.errorMessage.set(
          error.error?.message || 'Unable to load classes.'
        );
        this.classesLoaded.set(true);
      }
    });
  }

  // Handle class selection
  onClassChange(classId: string) {
    this.selectedClassId = classId;
    this.students = [];

    this.studentsLoaded.set(false);
    this.attendanceLoaded.set(false);

    this.successMessage.set('');
    this.errorMessage.set('');

    if (!classId) {
      return;
    }

    this.loadClassStudents();
  }

  // Load students belonging to the selected class
  loadClassStudents() {
    this.http.post<ClassDetailsResponse>(
      `http://localhost:3000/api/classes/${this.selectedClassId}/details`,
      {}
    ).subscribe({
      next: (response) => {
        this.students = response.students.map(student => ({
          ...student,
          status: '',
          attendanceId: null
        }));

        this.studentsLoaded.set(true);
        this.loadAttendance();
      },
      error: (error) => {
        console.error('Error loading class students:', error);
        this.errorMessage.set(
          error.error?.message || 'Unable to load enrolled students.'
        );
        this.studentsLoaded.set(true);
      }
    });
  }

  // Handle attendance date selection
  onDateChange(date: string) {
    this.selectedDate = date;
    this.successMessage.set('');
    this.errorMessage.set('');

    if (this.selectedClassId && this.studentsLoaded()) {
      this.loadAttendance();
    }
  }

  // Load attendance records for selected class and date
  loadAttendance() {
    this.attendanceLoaded.set(false);

    this.http.post<AttendanceListResponse>(
      'http://localhost:3000/api/attendance/list',
      {
        class: this.selectedClassId,
        date: this.selectedDate
      }
    ).subscribe({
      next: (response) => {
        const attendanceMap = new Map(
          response.attendance.map(record => [
            record.student._id,
            record
          ])
        );

        this.students = this.students.map(student => {
          const record = attendanceMap.get(student._id);

          return {
            ...student,
            status: record ? record.status : '',
            attendanceId: record ? record._id : null
          };
        });

        this.attendanceLoaded.set(true);
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.errorMessage.set(
          error.error?.message || 'Unable to load attendance records.'
        );
        this.attendanceLoaded.set(true);
      }
    });
  }

  // Update a student's selected attendance status
  updateStudentStatus(studentId: string, status: AttendanceStatus) {
    this.students = this.students.map(student =>
      student._id === studentId
        ? { ...student, status }
        : student
    );
  }

  // Save attendance for all students with a selected status
  saveAttendance() {
    if (!this.selectedClassId || !this.selectedDate) {
      this.errorMessage.set('Please select a class and date.');
      return;
    }

    const selectedStudents = this.students.filter(
      student => student.status !== ''
    );

    if (selectedStudents.length === 0) {
      this.errorMessage.set('Please select attendance status for at least one student.');
      return;
    }

    this.savingAttendance.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const requests = selectedStudents.map(student => {
      const payload = {
        status: student.status,
        date: this.selectedDate
      };

      if (student.attendanceId) {
        return this.http.post<AttendanceActionResponse>(
          `http://localhost:3000/api/attendance/${student.attendanceId}/update`,
          payload
        );
      }

      return this.http.post<AttendanceActionResponse>(
        'http://localhost:3000/api/attendance/mark',
        {
          student: student._id,
          class: this.selectedClassId,
          date: this.selectedDate,
          status: student.status
        }
      );
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.savingAttendance.set(false);
        this.successMessage.set('Attendance saved successfully!');
        this.loadAttendance();
      },
      error: (error) => {
        this.savingAttendance.set(false);
        console.error('Error saving attendance:', error);
        this.errorMessage.set(
          error.error?.message || 'Unable to save attendance.'
        );
        this.loadAttendance();
      }
    });
  }

  // Delete an existing attendance record
  deleteAttendance(attendanceId: string) {
    if (!confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    this.http.post<AttendanceDeleteResponse>(
      `http://localhost:3000/api/attendance/${attendanceId}/delete`,
      {}
    ).subscribe({
      next: (response) => {
        this.successMessage.set(response.message);
        this.loadAttendance();
      },
      error: (error) => {
        console.error('Error deleting attendance:', error);
        this.errorMessage.set(
          error.error?.message || 'Unable to delete attendance record.'
        );
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
