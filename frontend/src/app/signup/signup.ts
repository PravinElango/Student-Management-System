import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router,RouterLink } from '@angular/router';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-signup',
  styleUrl: './signup.css',
  templateUrl: './signup.html',
})
export class Signup {
  private http = inject(HttpClient);
  private router = inject(Router);
  signupForm = new FormGroup(
    {
      username: new FormControl('',
        [Validators.required,
        Validators.minLength(3)]), 
      email: new FormControl('',
        [Validators.required,
        Validators.email],
      ), password: new FormControl('',
        [Validators.required]
      )
    });
    onSignup (){
      if (this.signupForm.invalid){
        return;
      }
      const formData = this.signupForm.value;
      this.http.post("http://localhost:3000/api/auth/signup",formData).subscribe({
        next:(response)=>{
          console.log(response),
          this.router.navigate(['/login']);
        },
        error: (error)=>{
          console.log(error)
        }
      })
    };
    
}
