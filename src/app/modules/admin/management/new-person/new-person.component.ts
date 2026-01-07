import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {
    FormBuilder,
    ReactiveFormsModule,
    UntypedFormGroup, Validators,
} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {Subject} from "rxjs";
import {MatButtonModule} from "@angular/material/button";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatDialogRef} from "@angular/material/dialog";
import {PersonService} from "./person.service";

@Component({
    selector: 'new-person',
    templateUrl: './new-person.component.html',
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinner,
    ]
})
export class NewPersonComponent implements OnInit, OnDestroy {
    personService = inject(PersonService);
    newPersonForm: UntypedFormGroup;
    private unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        public matDialogRef: MatDialogRef<NewPersonComponent>,
        private formBuilder: FormBuilder
    ) {
    }

    ngOnInit(): void
    {
        this.newPersonForm = this.formBuilder.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', Validators.required],
            phone: [''],
            warnings: [0, [Validators.required, Validators.min(0)]],
            comment: [null],
        });
    }

    ngOnDestroy(): void
    {
        this.unsubscribeAll.next(null);
        this.unsubscribeAll.complete();
    }

    createPerson(): void
    {
        this.newPersonForm.disable();

        this.personService.createPerson(this.newPersonForm.getRawValue()).subscribe({
            next: (person) => {
                // this.toastr.success('Personne créée avec succès');
                this.matDialogRef.close(person);
            },
            error: (err) => {
                // this.toastr.error(err.error.message || 'Il y a eu un problème lors de la création de la personne');
                this.newPersonForm.enable();
            }
        });
    }

    incrementWarnings(): void
    {
        const currentWarnings = this.newPersonForm.get('warnings').value;
        this.newPersonForm.get('warnings').setValue(currentWarnings + 1);
    }
}
