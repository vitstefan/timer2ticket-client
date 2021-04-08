import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppData } from '../singletons/app-data';

@Injectable()
export class HttpHeaderInterceptor implements HttpInterceptor {

  constructor(
    private _appData: AppData,
  ) { }

  //inspiration: https://jasonwatmore.com/post/2020/07/09/angular-10-jwt-authentication-example-tutorial
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    //add contentType header and authorization header with jwt token (if available)
    console.log('http intercept, adding token from user and content to http header');
    let currentUser = this._appData.userValue;
    request = (currentUser && currentUser.token)
      ? request.clone({
        headers: request.headers.set('Content-Type', 'application/json').set('x-access-token', currentUser.token)
      })
      : request.clone({
        headers: request.headers.set('Content-Type', 'application/json')
      });

    return next.handle(request);
  }
}