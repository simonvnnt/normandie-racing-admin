import {Pipe, PipeTransform} from '@angular/core';
import {AbstractControl, FormArray} from "@angular/forms";

@Pipe({
    standalone: true,
    name: 'formArray'
})
export class FormArrayPipe implements PipeTransform
{
    transform(control: AbstractControl | null): FormArray {
        return control as FormArray;
    }
}
