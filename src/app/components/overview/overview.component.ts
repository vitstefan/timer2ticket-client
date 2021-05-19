import { Component, OnDestroy, OnInit, SecurityContext } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { interval, Subscription } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { JobLog } from 'src/app/models/jobLog';
import { User } from 'src/app/models/user';
import { JobService } from 'src/app/services/job.service';
import { JobLogsService } from 'src/app/services/jobLogs.service';
import { AppData } from 'src/app/singletons/app-data';
import { Utilities } from 'src/app/utilities/utilities';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { JobLogsModalComponent } from './job-logs/job-logs-modal.component';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit, OnDestroy {

  constructor(
    private _appData: AppData,
    public app: AppComponent,
    public dialog: MatDialog,
    private _sanitizer: DomSanitizer,
    private _jobService: JobService,
    private _jobLogsService: JobLogsService,
  ) { }

  public utilities = Utilities;

  private $_userSubscription: Subscription;
  private $_stepsCountSubscription: Subscription;

  public user: User;
  public stepsCount: number;

  public reachableSteps;
  public serviceHints: { serviceName: string, timeEntriesSyncHint: SafeHtml }[];

  public isScheduled: boolean;
  public errorCommunicatingWithCore = false;
  private _askedForScheduled: boolean;

  public lastConfigJobLog: JobLog;
  public lastTimeEntriesJobLog: JobLog;

  public jobLogs: JobLog[];
  private _jobLogsIntervalHandler;
  private _jobLogsModal: MatDialogRef<JobLogsModalComponent, any>;

  ngOnInit(): void {
    this._askedForScheduled = false;
    this.errorCommunicatingWithCore = false;

    this.$_userSubscription = this._appData.user.subscribe(user => {
      this.user = user;

      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      // ask for schedule only once after user's data were subscribed
      // if this check is not here => infinite calling (since there is _appData.setUser)
      if (!this._askedForScheduled) {
        this._askedForScheduled = true;
        this._jobService.scheduled(this.user._id).subscribe(res => {
          this.isScheduled = res.scheduled;

          if (this.isScheduled) {
            this.user.status = 'active';
          } else {
            this.user.status = 'inactive';
          }
          this.errorCommunicatingWithCore = false;

          this._appData.setUser(this.user);
        }, (error) => {
          this._jobRequestError();
        });

        this._pollJobLogs();
      }
    });

    this.$_stepsCountSubscription = this._appData.stepsCount.subscribe(stepsCount => this.stepsCount = stepsCount);

    this.reachableSteps = this._appData.getAllReachableSteps();
    this.serviceHints = [];
    this.reachableSteps.forEach(step => {
      if (step.isService) {
        this.serviceHints.push({
          serviceName: step.serviceName,
          timeEntriesSyncHint: this._sanitizer.sanitize(SecurityContext.HTML, step.timeEntriesSyncHint),
        });
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this._jobLogsIntervalHandler);
    this.$_userSubscription?.unsubscribe();
    this.$_stepsCountSubscription?.unsubscribe();
  }

  public configSyncNow(): void {
    this._jobService.scheduleConfigJob(this.user._id).subscribe(res => {
      if (res.scheduled) {
        this.app.buildNotification('Config job scheduled. It may take a while to complete.');
        this.errorCommunicatingWithCore = false;
      } else {
        this.app.buildNotification('Config job unfortunately NOT scheduled. Some sync server issues occured, please try it again after a while.', 8);
        this.errorCommunicatingWithCore = true;
      }
    }, (error) => {
      this._jobRequestError();
    });
  }

  public timeEntrySyncNow(): void {
    this._jobService.scheduleTimeEntriesJob(this.user._id).subscribe(res => {
      if (res.scheduled) {
        this.app.buildNotification('Time entry job scheduled. It may take a while to complete.');
        this.errorCommunicatingWithCore = false;
      } else {
        this.app.buildNotification('Time entry job unfortunately NOT scheduled. Some sync server issues occured, please try it again after a while.', 8);
        this.errorCommunicatingWithCore = true;
      }
    }, (errorStatus) => {
      if (errorStatus === 409) {
        this.app.buildNotification('Time entry job NOT scheduled. Last config job is not successfully done. Please try it again after a while OR try to schedule config job first.', 8);
        return;
      }
      this._jobRequestError();
    });
  }

  public changeSync(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '40em',
      data: {
        title: this.isScheduled ? 'Really want to stop syncing?' : 'Really want to start syncing?',
        body: '',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      // also locally change user status (on API's side it is changed)
      if (this.isScheduled) {
        this._stopSync();
      } else {
        this._startSync();
      }
    });
  }

  private _startSync(): void {
    this._jobService.start(this.user._id).subscribe(res => {
      this.isScheduled = res.started;

      if (this.isScheduled) {
        this.user.status = 'active';
        this.app.buildNotification('Jobs correctly started.');
      } else {
        this.user.status = 'inactive';
      }
      this.errorCommunicatingWithCore = false;

      this._appData.setUser(this.user);
    }, (error) => {
      this._jobRequestError();
    });
  }

  private _stopSync(): void {
    this._jobService.stop(this.user._id).subscribe(res => {
      // if successfully stopped, then isNotScheduled
      this.isScheduled = !res.stopped;

      if (!this.isScheduled) {
        this.user.status = 'inactive';
        this.app.buildNotification('Jobs correctly stopped.');
      }
      this.errorCommunicatingWithCore = false;

      this._appData.setUser(this.user);
    }, (error) => {
      this._jobRequestError();
    });
  }

  private _jobRequestError() {
    this.errorCommunicatingWithCore = true;
    this.app.buildNotification('Some error occured when communicating with the sync server. Please try again after a while.', 8);
  }

  public openJobLogs(): void {
    this._jobLogsModal = this.dialog.open(JobLogsModalComponent, {
      width: '95%',
      height: '75%',
      data: {
        jobLogs: this.jobLogs,
      }
    });

    this._jobLogsModal.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
    });
  }

  private _pollJobLogs() {
    this.jobLogs = [];

    const intervalFunction = () => {
      this._jobLogsService.get(this.user._id).subscribe(res => {
        this.jobLogs = res;

        this.lastConfigJobLog = this.jobLogs.find(jobLog => jobLog.type === 'config');
        this.lastTimeEntriesJobLog = this.jobLogs.find(jobLog => jobLog.type === 'time-entries');

        // update modal's data
        if (this._jobLogsModal?.componentInstance) {
          this._jobLogsModal.componentInstance.data = { jobLogs: this.jobLogs, };
        }
      }, (error) => {
        // provide info about error? - not needed
      });
    };

    // call now
    intervalFunction();
    // and set interval to call again each 10 seconds
    this._jobLogsIntervalHandler = setInterval(intervalFunction, 10000);
  }
}
