import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { ResearcherAuthService } from '../services/researcher.auth.service';

@Component({
  selector: 'app-research-login',
  templateUrl: './research-login.component.html',
  styleUrls: ['./research-login.component.scss']
})
export class ResearchLoginComponent implements OnInit {


  registerForm: FormGroup;

  email = new FormControl('', [Validators.required]);
  password = new FormControl('', [Validators.required]);

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: ResearcherAuthService) { }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      email: this.email,
      password: this.password
    })
  }

  authorize() {
    this.authService.authorize(this.registerForm.value.email, this.registerForm.value.password).subscribe(res => {
      this.router.navigate(['/research'])
    })
  }

}