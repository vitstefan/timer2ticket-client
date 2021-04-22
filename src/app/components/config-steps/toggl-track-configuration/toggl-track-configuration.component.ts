import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { Workspace as UserWorkspace } from 'src/app/models/service_definition/config/config';
import { ServiceDefinition } from 'src/app/models/service_definition/service_definition';
import { User } from 'src/app/models/user';
import { SyncedServicesConfigService } from 'src/app/services/synced-services-config.service';
import { AppData } from 'src/app/singletons/app-data';

@Component({
  selector: 'app-toggl-track-configuration',
  templateUrl: './toggl-track-configuration.component.html',
  styleUrls: ['./toggl-track-configuration.component.css']
})
export class TogglTrackConfigurationComponent implements OnInit, OnDestroy {

  constructor(
    private _appData: AppData,
    private _syncedServicesConfigService: SyncedServicesConfigService,
    public app: AppComponent,
  ) { }

  private _route = 'config-steps/toggl-track-configuration';

  private $_userToEditSubscription: Subscription;
  private $_stepsCountSubscription: Subscription;

  public user: User;
  public stepsCount: number;

  public steps;

  public chosenWorkspace: Workspace;

  public inputDataChecked: boolean;

  public workspaces: Workspace[];

  public serviceDefinition: ServiceDefinition;

  public isWorkspaceChangeEnabled: boolean;

  ngOnInit(): void {
    this.$_userToEditSubscription = this._appData.userToEdit.subscribe(user => {
      this.user = user;

      const togglTrackServiceDefinition = this.user.serviceDefinitions.find(sd => sd.name === 'TogglTrack');
      if (togglTrackServiceDefinition) {
        this.serviceDefinition = togglTrackServiceDefinition;
        this.chosenWorkspace = togglTrackServiceDefinition.config.workspace
          ? new Workspace(
            togglTrackServiceDefinition.config.workspace.id,
            togglTrackServiceDefinition.config.workspace.name
          )
          : null;
        if (this.chosenWorkspace) {
          this.workspaces = [
            this.chosenWorkspace
          ];
        }
      } else {
        this.serviceDefinition = new ServiceDefinition('TogglTrack');
        this.workspaces = [];
        this.chosenWorkspace = null;
      }

      // do not allow workspace change when already chosen before
      this.isWorkspaceChangeEnabled = this.user.status === 'registrated';
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
      .togglTrackWorkspaces(this.serviceDefinition.apiKey)
      .subscribe(data => {
        this.serviceDefinition.config.userId = data.user_id;

        this.workspaces = data.workspaces;
        if (this.serviceDefinition.config.workspace) {
          this.chosenWorkspace = this.workspaces.find(workspace => workspace.id === this.serviceDefinition.config.workspace.id) ?? null;
        }

        this.inputDataChecked = true;
        this.app.hideLoading();
        this.app.buildNotification('It seems OK! Choose your workspace and continue with next step.');
      }, (error) => {
        this.app.hideLoading();
        this.app.buildNotification('Something went wrong. Check the API key again please.');
      });
  }

  public changeWorkspace(): void {
    this.serviceDefinition.config.workspace = new UserWorkspace(
      Number(this.chosenWorkspace.id),
      this.chosenWorkspace.name,
    );
  }

  public nextStep(): void {
    this.changeWorkspace();
    const index = this.user.serviceDefinitions.findIndex(serviceDefinition => serviceDefinition.name === 'TogglTrack');
    if (index !== -1) {
      this.user.serviceDefinitions.splice(index, 1);
    }
    this.user.serviceDefinitions.push(this.serviceDefinition);
  }

}

/**
 * Not exported class only used here to display workspaces
 * (same as Workspace in config or ServiceObject, but logically makes sense to create utility class)
 */
class Workspace {
  id: number | string;
  name: string;

  constructor(id: number | string, name: string) {
    this.id = id;
    this.name = name;
  }
}