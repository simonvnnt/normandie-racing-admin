import { inject, Injectable } from '@angular/core';
import { StorageService } from 'app/core/storage/storage.service';
import { environment } from 'environments/environment';
import {catchError, Observable, of, switchMap} from 'rxjs';
import {Router} from '@angular/router';
import {HttpClient} from "@angular/common/http";
import {Login, User} from "app/modules/auth/login/types/user.types";
import {AuthUtils} from "./auth.utils";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private authenticated: boolean = false;
    private storage = inject(StorageService);
    private httpClient = inject(HttpClient);
    private router = inject(Router);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    set token(token: string) {
        localStorage.setItem('token', token);
    }

    get token(): string {
        return localStorage.getItem('token') ?? '';
    }

    set user(user: User) {
        this.storage.setInLocalStorage('user', user);
    }

    get user(): User {
        return this.storage.getInLocalStorage(('user')) ?? null;
    }

    login(user: Login): Observable<{ token: string; username: string }>
    {
        return this.httpClient.post<{ token: string; username: string }>(`${environment.apiUrl}/api/login`, user).pipe(
            switchMap((response: any) => {
                // Store the access token in the local storage
                this.token = response.token;
                this.user = response.user;

                // Set the authenticated flag to true
                this.authenticated = true;

                // Return a new observable with the response
                return of(response);
            })
        );
    }

    loginUsingToken(): Observable<any>
    {
        // Sign in using the token
        return this.httpClient
            .post(`${environment.apiUrl}/api/token_check`, {
                token: this.token,
            })
            .pipe(
                catchError(() =>
                    of(false)
                ),
                switchMap((response: any) => {
                    // Replace the access token with the new one if it's available on
                    // the response object.
                    //
                    // This is an added optional step for better security. Once you sign
                    // in using the token, you should generate a new one on the server
                    // side and attach it to the response object. Then the following
                    // piece of code can replace the token with the refreshed one.
                    if (response.accessToken) {
                        this.token = response.accessToken;
                    }

                    // Set the authenticated flag to true
                    this.authenticated = true;

                    // Store the user
                    this.user = response.user;

                    // Return true
                    return of(true);
                })
            );
    }

    logout(): void
    {
        this.storage.clearSessionStorage();
        this.authenticated = false;

        this.router.navigate(['login']);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean>
    {
        // Check if the user is logged in
        if (this.authenticated) {
            return of(true);
        }

        // Check the access token availability
        if (!this.token) {
            return of(false);
        }

        // Check the access token expire date
        if (AuthUtils.isTokenExpired(this.token)) {
            return of(false);
        }

        return this.loginUsingToken();
    }
}
