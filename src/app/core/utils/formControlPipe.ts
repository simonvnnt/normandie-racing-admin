import {Pipe, PipeTransform} from '@angular/core';
import {AbstractControl, FormControl} from "@angular/forms";

@Pipe({
    standalone: true,
    name: 'formControl'
})
export class FormControlPipe implements PipeTransform
{
    transform(control: AbstractControl | null): FormControl {
        return control as FormControl;
    }
}
