import { AfterContentInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from './models/user';
import { AppData } from './singletons/app-data';

declare var buildNotification: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy, AfterContentInit {

  public user: User;

  private $_userSubscription: Subscription;

  public loadingHidden: boolean;

  constructor(
    public router: Router,
    private _appData: AppData,
  ) { }

  ngOnInit(): void {
    //redirect to login right away
    this.redirectToLogin();

    this.$_userSubscription = this._appData.user.subscribe((user) => {
      this.user = user;
    });

    this.loadingHidden = true;
  }

  ngOnDestroy(): void {
    this.$_userSubscription?.unsubscribe();
  }

  ngAfterContentInit() {
    this.loadingHidden = true;
  }

  private redirectToLogin(): void {
    this.router.navigate(['login'], { replaceUrl: true });
  }

  /**
   * Builds Notifs notification with given content.
   * Can be closed with clicking the canvas or close button.
   * @param content Text to be displayed.
   * @param lifespan Type of lifespan, default: 9 => is closed after 5 s and can be closed; 8 => has to be closed by user, ... (see notifs.js what each value means).
   */
  public buildNotification(content: String, lifespan: number = 9) {
    new buildNotification(content, 0, 0, 2, 0, lifespan);
  }

  public hideLoading(): void {
    this.loadingHidden = true;
  }

  public showLoading(): void {
    this.loadingHidden = false;
  }
}
