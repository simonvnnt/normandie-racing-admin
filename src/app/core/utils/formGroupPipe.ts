import {Pipe, PipeTransform} from '@angular/core';
import {AbstractControl, FormGroup} from "@angular/forms";

@Pipe({
    standalone: true,
    name: 'formGroup'
})
export class FormGroupPipe implements PipeTransform
{
    transform(control: AbstractControl | null): FormGroup {
        return control as FormGroup;
    }
}
