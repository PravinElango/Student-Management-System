import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private http = inject(HttpClient);
  private router = inject(Router);
  authService = inject(AuthService);
  loginForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),
    password: new FormControl('', [
      Validators.required
    ])
  });

  onLogin() {
    if (this.loginForm.invalid) {
      return;
    }

    const formData = this.loginForm.value;

    this.http.post<{ message: string; accessToken: string }>(
      'http://localhost:3000/api/auth/login',
      formData,{ withCredentials: true }
    ).subscribe({
      next: (response) => {
        console.log(response);

        this.authService.setToken(response.accessToken);
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
}
