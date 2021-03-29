import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { DefaultTimeEntryActivity } from 'src/app/models/service_definition/config/config';
import { ServiceDefinition } from 'src/app/models/service_definition/service_definition';
import { User } from 'src/app/models/user';
import { SyncedServicesConfigService } from 'src/app/services/synced-services-config.service';
import { AppData } from 'src/app/singletons/app-data';

@Component({
  selector: 'app-redmine-configuration',
  templateUrl: './redmine-configuration.component.html',
  styleUrls: ['./redmine-configuration.component.css']
})
export class RedmineConfigurationComponent implements OnInit, OnDestroy {

  constructor(
    private _appData: AppData,
    private _syncedServicesConfigService: SyncedServicesConfigService,
    public app: AppComponent,
  ) { }

  private _route = 'config-steps/redmine-configuration';

  private $_userToEditSubscription: Subscription;
  private $_stepsCountSubscription: Subscription;

  public user: User;
  public stepsCount: number;

  public steps;

  public defaultTimeEntryActivity: TimeEntryActivity;

  public inputDataChecked: boolean;

  public timeEntryActivities: TimeEntryActivity[];

  public serviceDefinition: ServiceDefinition;

  ngOnInit(): void {
    this.$_userToEditSubscription = this._appData.userToEdit.subscribe(user => {
      this.user = user;

      const redmineServiceDefinition = this.user.serviceDefinitions.find(sd => sd.name === 'Redmine');
      if (redmineServiceDefinition) {
        this.serviceDefinition = redmineServiceDefinition;
        // but will be disabled till checked if data correct
        this.defaultTimeEntryActivity = redmineServiceDefinition.config.defaultTimeEntryActivity
          ? new TimeEntryActivity(
            redmineServiceDefinition.config.defaultTimeEntryActivity.id,
            redmineServiceDefinition.config.defaultTimeEntryActivity.name
          )
          : null;
        if (this.defaultTimeEntryActivity) {
          this.timeEntryActivities = [
            this.defaultTimeEntryActivity
          ];
        }
      } else {
        // for now Redmine is primary
        this.serviceDefinition = new ServiceDefinition('Redmine', true);
        this.timeEntryActivities = [];
        this.defaultTimeEntryActivity = null;
      }
    });
    this.$_stepsCountSubscription = this._appData.stepsCount.subscribe(stepsCount => this.stepsCount = stepsCount);

    this.steps = this._appData.getStepsForCurrentRoute(this._route);

    this.inputDataChecked = false;
  }

  ngOnDestroy(): void {
    this.$_userToEditSubscription?.unsubscribe();
    this.$_stepsCountSubscription?.unsubscribe();
  }

  public checkIfCorrect(): void {
    this.app.showLoading();
    this._syncedServicesConfigService
      .redmineTimeEntryActivities(this.serviceDefinition.apiKey, this.serviceDefinition.config.apiPoint)
      .subscribe(data => {
        this.serviceDefinition.config.userId = data.user_id;

        this.timeEntryActivities = data.time_entry_activities;
        if (this.serviceDefinition.config.defaultTimeEntryActivity) {
          this.defaultTimeEntryActivity = this.timeEntryActivities.find(tea => tea.id === this.serviceDefinition.config.defaultTimeEntryActivity.id) ?? null;
        }
        console.log(this.timeEntryActivities);

        // this correction is also made on API's side
        // add last / if not provided by user
        this.serviceDefinition.config.apiPoint
          = this.serviceDefinition.config.apiPoint.endsWith('/')
            ? this.serviceDefinition.config.apiPoint
            : `${this.serviceDefinition.config.apiPoint}/`;
        // add https:// if not provided by user
        this.serviceDefinition.config.apiPoint
          = (this.serviceDefinition.config.apiPoint.startsWith('https://') || this.serviceDefinition.config.apiPoint.startsWith('http://'))
            ? this.serviceDefinition.config.apiPoint
            : `https://${this.serviceDefinition.config.apiPoint}`;

        this.inputDataChecked = true;
        this.app.hideLoading();
        this.app.buildNotification('It seems OK! Choose your default activity and continue with next step.');
      }, (error) => {
        this.app.hideLoading();
        this.app.buildNotification('Something went wrong. Check the fields again please.');
      });
  }

  public changeDefaultTimeEntryActivity(): void {
    this.serviceDefinition.config.defaultTimeEntryActivity = new DefaultTimeEntryActivity(
      Number(this.defaultTimeEntryActivity.id),
      this.defaultTimeEntryActivity.name,
    );
  }

  public nextStep(): void {
    // set default TE activity
    this.changeDefaultTimeEntryActivity();
    const index = this.user.serviceDefinitions.findIndex(serviceDefinition => serviceDefinition.name === 'Redmine');
    if (index !== -1) {
      this.user.serviceDefinitions.splice(index, 1);
    }
    this.user.serviceDefinitions.push(this.serviceDefinition);
  }

}

/**
 * Not exported class only used here to display timeEntryActivities
 * (same as DefaultTimeEntryActivity in config or ServiceObject, but logically makes sense to create utility class)
 */
class TimeEntryActivity {
  id: number | string;
  name: string;

  constructor(id: number | string, name: string) {
    this.id = id;
    this.name = name;
  }
}