import { Component, OnDestroy, OnInit, SecurityContext } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { User } from 'src/app/models/user';
import { JobService } from 'src/app/services/job.service';
import { AppData } from 'src/app/singletons/app-data';
import { Utilities } from 'src/app/utilities/utilities';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

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
  ) { }

  private $_userSubscription: Subscription;
  private $_stepsCountSubscription: Subscription;

  public user: User;
  public stepsCount: number;

  public reachableSteps;
  public serviceHints: { serviceName: string, timeEntriesSyncHint: SafeHtml }[];

  public isScheduled: boolean;
  public errorCommunicatingWithCore = false;
  private _askedForScheduled: boolean;

  public isLastSuccessfullyDoneConfigToday: boolean;
  public isLastSuccessfullyDoneConfigYesterday: boolean;
  public lastSuccessfullyDoneConfig: Date | null;

  public isLastSuccessfullyDoneTimeEntriesToday: boolean;
  public isLastSuccessfullyDoneTimeEntriesYesterday: boolean;
  public lastSuccessfullyDoneTimeEntries: Date | null;

  // set to true if user turned on sync manually
  public showDatesCanBeOutdated: boolean;

  ngOnInit(): void {
    this._askedForScheduled = false;
    this.errorCommunicatingWithCore = false;

    this.$_userSubscription = this._appData.user.subscribe(user => {
      this.user = user;

      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (this.user.configSyncJobDefinition?.lastSuccessfullyDone) {
        this.lastSuccessfullyDoneConfig = new Date(this.user.configSyncJobDefinition.lastSuccessfullyDone);
        this.isLastSuccessfullyDoneConfigToday = Utilities.compareOnlyDate(today, this.lastSuccessfullyDoneConfig) === 0;
        this.isLastSuccessfullyDoneConfigYesterday = Utilities.compareOnlyDate(yesterday, this.lastSuccessfullyDoneConfig) === 0;
      }
      if (this.user.timeEntrySyncJobDefinition?.lastSuccessfullyDone) {
        this.lastSuccessfullyDoneTimeEntries = new Date(this.user.timeEntrySyncJobDefinition.lastSuccessfullyDone);
        this.isLastSuccessfullyDoneTimeEntriesToday = Utilities.compareOnlyDate(today, this.lastSuccessfullyDoneTimeEntries) === 0;
        this.isLastSuccessfullyDoneTimeEntriesYesterday = Utilities.compareOnlyDate(yesterday, this.lastSuccessfullyDoneTimeEntries) === 0;
      }

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

        this.showDatesCanBeOutdated = false;
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
    this.$_userSubscription?.unsubscribe();
    this.$_stepsCountSubscription?.unsubscribe();
  }

  public configSyncNow(): void {
    this._jobService.scheduleConfigJob(this.user._id).subscribe(res => {
      if (res.scheduled) {
        this.app.buildNotification('Config job scheduled. It may take a while to complete.');
        this.errorCommunicatingWithCore = false;
        this.showDatesCanBeOutdated = true;
      } else {
        this.app.buildNotification('Config job unfortunately NOT scheduled. Some sync server issues occured, please try it again after a while.');
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
        this.showDatesCanBeOutdated = true;
      } else {
        this.app.buildNotification('Time entry job unfortunately NOT scheduled. Some sync server issues occured, please try it again after a while.');
        this.errorCommunicatingWithCore = true;
      }
    }, (error) => {
      this._jobRequestError();
    });
  }

  public changeSync(): void {
    // locally change user status (on API's side it is changed)

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
        this.showDatesCanBeOutdated = true;
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
    this._appData.setUser(this.user);
    this.app.buildNotification('Some error occured when communicating with the sync server. Please try again after a while.');
  }

}
