import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AppData } from '../singletons/app-data';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private _appData: AppData,
    private _router: Router,
  ) { }

  //inspiration: https://jasonwatmore.com/post/2020/07/09/angular-10-jwt-authentication-example-tutorial
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError(err => {
      if (err.status === 401 && this._appData.userValue !== null) {
        //auto logout if 401 response returned from api
        console.log('LOGOUT via HttpErrorInterceptor');
        this._router.navigate(['/login'], { replaceUrl: true });
        this._appData.setUser(null);
      }

      return throwError(err.status);
    }))
  }
}