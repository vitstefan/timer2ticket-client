import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { User } from 'src/app/models/user';
import { AppData } from 'src/app/singletons/app-data';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  @ViewChild('template', { static: true }) template;

  public user: User;

  constructor(
    private _appData: AppData,
    private _viewContainerRef: ViewContainerRef,
  ) { }

  ngOnInit(): void {
    this._viewContainerRef.createEmbeddedView(this.template);
    
    this.user = this._appData.userValue;
  }

}
