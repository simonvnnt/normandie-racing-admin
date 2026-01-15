import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {AuthService} from 'app/core/auth/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FuseAlertComponent, FuseAlertType} from '@fuse/components/alert';
import {fuseAnimations} from '@fuse/animations';
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatInputModule} from "@angular/material/input";
import {MatFormFieldModule} from "@angular/material/form-field";
import {NgIf} from "@angular/common";

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        FuseAlertComponent,
        NgIf,
        ReactiveFormsModule
    ],
})
export class LoginComponent implements OnInit {
    loginForm!: FormGroup;
    alert: { type: FuseAlertType; message: string };
    showAlert: boolean = false;

    constructor(
        public auth: AuthService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private formBuilder: FormBuilder,
    ) {}

    ngOnInit(): void {
        this.loginForm = this.formBuilder.group({
            'username': ['', Validators.required],
            'password': ['', Validators.required]
        });
    }

    loginUser(): void {
        // Return if the form is invalid
        if (this.loginForm.invalid)
        {
            return;
        }

        // Disable the form
        this.loginForm.disable();

        // Hide the alert
        this.showAlert = false;

        this.auth.login(this.loginForm.getRawValue()).subscribe({
            next: () => {
                const redirectURL = this.activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/management';

                this.router.navigateByUrl(redirectURL);
            },
            error: () => {
                // Re-enable the form
                this.loginForm.enable();

                // Set the alert
                this.alert = {
                    type   : 'error',
                    message: 'Mauvais identifiant ou mot de passe'
                };

                // Show the alert
                this.showAlert = true;
            }
        });
    }
}
