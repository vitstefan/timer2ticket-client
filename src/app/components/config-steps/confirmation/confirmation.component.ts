import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { User } from 'src/app/models/user';
import { JobService } from 'src/app/services/job.service';
import { UserService } from 'src/app/services/user.service';
import { AppData } from 'src/app/singletons/app-data';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css']
})
export class ConfirmationComponent implements OnInit, OnDestroy {

  constructor(
    private _appData: AppData,
    public app: AppComponent,
    private _router: Router,
    private _userService: UserService,
    private _jobService: JobService,
  ) { }

  private _route = 'config-steps/confirmation';

  private $_userToEditSubscription: Subscription;
  private $_stepsCountSubscription: Subscription;

  public user: User;
  public stepsCount: number;

  public steps;

  public allServices: string[];
  public primaryService: string;
  public otherServices: string[];

  ngOnInit(): void {
    this.$_userToEditSubscription = this._appData.userToEdit.subscribe(userToEdit => {
      this.user = userToEdit;

      this.allServices = [];
      this.otherServices = [];

      this.user.serviceDefinitions.forEach(serviceDefinition => {
        const label = this._appData.getServiceLabel(serviceDefinition.name);
        if (serviceDefinition.isPrimary) {
          this.primaryService = label;
        } else {
          this.otherServices.push(label);
        }
        this.allServices.push(label);
      });
    });
    this.$_stepsCountSubscription = this._appData.stepsCount.subscribe(stepsCount => this.stepsCount = stepsCount);

    this.steps = this._appData.getStepsForCurrentRoute(this._route);
  }

  ngOnDestroy(): void {
    this.$_userToEditSubscription?.unsubscribe();
    this.$_stepsCountSubscription?.unsubscribe();
  }

  public confirm(): void {
    // send request to t2t API to update user
    // if everything ok and saved in db, then send another request to start syncing
    this.app.showLoading();
    this._userService.update(this.user).subscribe(user => {
      this.user = user;

      // send another request to start sync jobs
      this._jobService.start(this.user._id).subscribe(res => {
        this._router.navigate(['overview']);
        this.app.hideLoading();
        if (res.started) {
          this.user.status = 'active';
          this.app.buildNotification('Your configuration was successfully saved and you\'re SYNCED! Amazing!');
        } else {
          this.app.buildNotification('Your configuration was successfully saved. However something went wrong with syncing. Try to sync manually.');
        }
        // set the user (not userToEdit)
        this._appData.setUser(this.user);
      }, (error) => {
        this._router.navigate(['overview']);
        // set the user (not userToEdit)
        this._appData.setUser(this.user);
        this.app.hideLoading();
        this.app.buildNotification('Your configuration was successfully saved. However something went wrong with syncing. Try to sync manually.');
      });
    }, (error) => {
      this.app.hideLoading();
      this.app.buildNotification('Something went wrong. Try to confirm once again please.');
    });
  }

}
