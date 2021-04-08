import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Utilities } from 'src/app/utilities/utilities';

@Component({
  selector: 'app-job-logs-modal',
  templateUrl: './job-logs-modal.component.html',
  styleUrls: ['./job-logs-modal.component.css']
})
export class JobLogsModalComponent {

  public utilities = Utilities;

  constructor(
    public dialogRef: MatDialogRef<JobLogsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data) { }

}
