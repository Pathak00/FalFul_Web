import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pop-up-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pop-up-dialog.html',
  styleUrls: ['./pop-up-dialog.scss'],
})
export class PopUpDialogComponent {
  @Input() title = 'Warning';
  @Input() message = 'Are you sure?';

  @Input() okText = 'OK';
  @Input() cancelText = 'Cancel';

  @Input() ShowOk = true;

  @Input() showCancel = true;

  @Output() confirm = new EventEmitter<boolean>();

  onOk(): void {
    this.confirm.emit(true);
  }

  onCancel(): void {
    this.confirm.emit(false);
  }
}
