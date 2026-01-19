import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZardButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardButtonComponent],
  templateUrl: './import-modal.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class ImportModalComponent {
  @Input() itemCount = 0;
  @Input() projectName = '';
  @Output() action = new EventEmitter<{
    type: 'add' | 'replace' | 'cancel';
    projectName: string;
  }>();

  onAction(type: 'add' | 'replace' | 'cancel') {
    this.action.emit({ type, projectName: this.projectName });
  }
}
