import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

export function priceDifferenceValidator(currentAmount: number): ValidatorFn
{
    return (control: AbstractControl): ValidationErrors | null => {
        const enteredAmount = control.value;
        const difference = currentAmount - enteredAmount;
        const percentageDifference = (difference / currentAmount) * 100;

        return percentageDifference > 30 ? { priceDifference: true } : null;
    };
}
