import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthenticationResponse } from '../../shared/model/authentication-response.model';
import { environment } from 'src/env/environment';
import { HttpClient } from '@angular/common/http';
import { TokenStorage } from './jwt/token.service';
import { Router } from '@angular/router';
import { User } from '../../shared/model/user.model';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Login } from 'src/shared/model/login-info';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$ = new BehaviorSubject<User>({ email: '', id: 0, role: '' });

  constructor(private http: HttpClient, private tokenStorage: TokenStorage, private router: Router) { }

  login(login: Login): Observable<AuthenticationResponse> {
    return this.http
      .post<AuthenticationResponse>(environment.apiHostMain + 'users/login', login)
      .pipe(
        tap((authenticationResponse) => {
          this.tokenStorage.saveAccessToken(authenticationResponse.access_token);
          this.setUser();
        }),
        catchError(() => {
          return throwError('Login failed. Please check your credentials.\nIf you haven\'t activated your account via the email link, please do so now to complete the registration process.');
        })
      );
  }

  private setUser(): void {
    const jwtHelperService = new JwtHelperService();
    const accessToken = this.tokenStorage.getAccessToken() || '';
    const user: User = {
      id: +jwtHelperService.decodeToken(accessToken).id,
      email: jwtHelperService.decodeToken(accessToken).sub,
      role: jwtHelperService.decodeToken(accessToken).role,
    };
    this.user$.next(user);
  }

  checkIfUserExists(): void {
    const accessToken = this.tokenStorage.getAccessToken();
    if (accessToken == null) {
      return;
    }
    this.setUser();
  }

  logout(): void {
    this.router.navigate(['/']).then(() => {
      this.tokenStorage.clear();
      this.user$.next({ email: '', id: 0, role: '' });
    });
  }
}
