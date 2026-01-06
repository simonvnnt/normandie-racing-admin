import {Component, inject, Input} from '@angular/core';
import {MatCheckbox, MatCheckboxChange} from "@angular/material/checkbox";
import {MatSelect} from "@angular/material/select";

@Component({
    selector: 'app-select-all',
    templateUrl: "./select-all.component.html",
    standalone: true,
    imports: [
        MatCheckbox
    ],
})
export class SelectAllComponent {
    @Input({ required: true }) values = [];
    @Input() text = 'Tous';
    private matSelect = inject(MatSelect);

    isChecked(): boolean {
        return this.matSelect.ngControl.control.value && this.values.length > 0
            && this.matSelect.ngControl.control.value.length === this.values.length;
    }

    isIndeterminate(): boolean {
        return this.matSelect.ngControl.control.value && this.values.length > 0 && this.matSelect.ngControl.control.value.length > 0
            && this.matSelect.ngControl.control.value.length < this.values.length;
    }

    toggleSelection(change: MatCheckboxChange): void {
        if (change.checked) {
            this.matSelect.ngControl.control.setValue(this.values);
        } else {
            this.matSelect.ngControl.control.setValue([]);
        }
    }
}
