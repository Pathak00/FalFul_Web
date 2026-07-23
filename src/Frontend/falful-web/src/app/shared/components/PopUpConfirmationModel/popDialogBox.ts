import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pop-dialog-box',
  standalone: true,
  templateUrl: './popDialogBox.html',
  styleUrl: './popDialogBox.scss',
})
export class PopDialogBoxComponent {
  @Input() title = 'Notice';

  @Input() message = '';

  @Input() isOpen = false;

  @Input() variant: 'danger' | 'warning' | 'info' = 'danger';

  @Input() confirmText = 'OK';

  @Input() showCancel = false;

  @Input() cancelText = 'Cancel';

  @Output() isOpenChange = new EventEmitter<boolean>();

  /** Emitted when the confirm button is clicked (e.g. to redirect to login). */
  @Output() confirmed = new EventEmitter<void>();

  /** Emitted when the dialog is dismissed via the cancel button or backdrop click. */
  @Output() cancelled = new EventEmitter<void>();

  confirm() {
    this.confirmed.emit();
    this.close();
  }

  cancel() {
    this.cancelled.emit();
    this.close();
  }

  close() {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }
}
