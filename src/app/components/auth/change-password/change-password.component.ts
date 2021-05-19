import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppComponent } from 'src/app/app.component';
import { UserService } from 'src/app/services/user.service';
import { AppData } from 'src/app/singletons/app-data';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {

  public oldPassword = '';
  public newPassword = '';
  public newPasswordAgain = '';

  constructor(
    private _appData: AppData,
    private _userService: UserService,
    private _router: Router,
    public app: AppComponent,
  ) { }

  ngOnInit(): void {
  }

  public changePassword(): void {
    if (this.newPassword !== this.newPasswordAgain) {
      this.app.buildNotification('New passwords are not the same.');
      return;
    }

    this.app.showLoading();
    this._userService
      .changePassword(this._appData.userValue._id, this.oldPassword, this.newPassword, this.newPasswordAgain)
      .subscribe((user) => {
        this.app.buildNotification('The change was successful. Next time when you log in, provide the new password. The old one will not work.', 8);
        this._router.navigate(['overview']);
        this.app.hideLoading();
      }, (errorStatus) => {
        if (errorStatus < 500) {
          this.app.buildNotification('Wrong old password.');
        } else {
          this.app.buildNotification('Server did not respond. Try again please.');
        }
        this.app.hideLoading();
      });
  }

}
