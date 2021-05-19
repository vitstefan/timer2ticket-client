import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _usersApiUrl: string = 'api/users';

  constructor(
    private _http: HttpClient,
  ) { }

  update(user: User): Observable<User> {
    console.log("***** USER ***** update");
    return this._http.put<User>(`${this._usersApiUrl}/${user._id}`, { user: user })
      .pipe(
        catchError((error) => {
          console.error(error);
          // rethrow status back to the component
          return throwError(error);
        })
      );
  }

  changePassword(userId: string, oldPassword: string, newPassword: string, newPasswordAgain: string): Observable<User> {
    console.log("***** USER ***** changePassword");
    return this._http.post<User>(`${this._usersApiUrl}/change_password/${userId}`,
      {
        oldPassword: oldPassword,
        newPassword: newPassword,
        newPasswordAgain: newPasswordAgain,
      })
      .pipe(
        catchError((error) => {
          console.error(error);
          // rethrow status back to the component
          return throwError(error);
        })
      );
  }
}