import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {
    FormBuilder,
    ReactiveFormsModule,
    UntypedFormGroup, Validators,
} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatDrawerToggleResult, MatSidenavModule} from "@angular/material/sidenav";
import {EventsService} from "../events.service";
import {EventsListComponent} from "../list/list.component";
import {Router, RouterLink} from "@angular/router";
import {MatButtonModule, MatIconAnchor} from "@angular/material/button";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatTooltip} from "@angular/material/tooltip";

@Component({
    selector: 'event-create',
    templateUrl: './create.component.html',
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatInputModule,
        MatIconModule,
        MatSlideToggleModule,
        MatSidenavModule,
        RouterLink,
        MatIconAnchor,
        MatButtonModule,
        MatProgressSpinner,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatTooltip
    ]
})
export class EventCreateComponent implements OnInit {
    newEventForm: UntypedFormGroup;
    eventImgFile: File;
    eventImgPreviewUrl: string;

    constructor(
        private eventsService: EventsService,
        private formBuilder: FormBuilder,
        private changeDetectorRef: ChangeDetectorRef,
        private router: Router,
        private eventsListComponent: EventsListComponent
    ) {
    }

    ngOnInit(): void
    {
        // Open the drawer
        this.eventsListComponent.matDrawer.open();

        this.newEventForm = this.formBuilder.group({
            name: ['', Validators.required],
            link: [''],
            fromDate: [null, Validators.required],
            toDate: [null, Validators.required],
            imagePath: [''],
        });
    }

    createEvent(): void
    {
        this.newEventForm.disable();

        this.eventsService.createEvent(this.newEventForm.getRawValue(), this.eventImgFile).subscribe({
            next: () => {
                this.router.navigate(['../']);
                this.changeDetectorRef.markForCheck();
            },
            error: (err) => {
                this.newEventForm.enable();
            }
        });
    }

    onImageChange(event): void
    {
        const input = event.target as HTMLInputElement;

        if (!(input.files?.length > 0) || !this.isValidFile(input.files[0])) {
            return;
        }

        const files = input.files;

        this.eventImgFile = files[0];
        this.eventImgPreviewUrl = URL.createObjectURL(this.eventImgFile);
        this.changeDetectorRef.markForCheck();

        input.value = '';
    }

    viewImage(): void
    {
        if (this.eventImgPreviewUrl) {
            window.open(this.eventImgPreviewUrl, '_blank');
        }
    }

    removeImage(): void
    {
        this.eventImgFile = null;
        this.newEventForm.patchValue({ imagePath: '' });
        this.changeDetectorRef.markForCheck();
    }

    isValidFile(file: File): boolean
    {
        const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        return validExtensions.includes(fileExtension);
    }

    closeDrawer(): Promise<MatDrawerToggleResult>
    {
        return this.eventsListComponent.matDrawer.close();
    }
}
