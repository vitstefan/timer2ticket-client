import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AppData } from '../singletons/app-data';

@Injectable({ providedIn: 'root' })
export class OverviewGuard implements CanActivate {
  constructor(
    private router: Router,
    private appData: AppData
  ) { }

  //inspiration: https://jasonwatmore.com/post/2020/07/09/angular-10-jwt-authentication-example-tutorial
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.appData.userValue
      && this.appData.userValue.serviceDefinitions.length > 1
      && this.appData.userValue.configSyncJobDefinition
      && this.appData.userValue.timeEntrySyncJobDefinition) {
      return true; // very basic validation
    }
    this.router.navigate(['/config-steps/services-choose'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}