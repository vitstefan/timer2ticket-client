import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { JobLog } from '../models/jobLog';

@Injectable({
  providedIn: 'root'
})
export class JobLogsService {
  private _jobLogsApiUrl: string = 'api/job_logs';

  constructor(
    private _http: HttpClient,
  ) { }

  get(userId: string): Observable<JobLog[]> {
    console.log("***** JOB LOGS ***** Get");
    return this._http.get<[]>(`${this._jobLogsApiUrl}/${userId}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          // rethrow status back to the component
          return throwError(error);
        })
      );
  }
}
