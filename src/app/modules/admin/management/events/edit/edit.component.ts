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
import {Subject, takeUntil} from "rxjs";
import {Event} from "../events.types";
import {environment} from "../../../../../../environments/environment";
import {FuseConfirmationService} from "../../../../../../@fuse/services/confirmation";

@Component({
    selector: 'event-update',
    templateUrl: './edit.component.html',
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
        MatDatepickerModule
    ]
})
export class EventEditComponent implements OnInit {
    event: Event;
    eventForm: UntypedFormGroup;
    eventImgFile: File;
    eventImgPreviewUrl: string;
    private unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private eventsService: EventsService,
        private formBuilder: FormBuilder,
        private fuseConfirmationService: FuseConfirmationService,
        private changeDetectorRef: ChangeDetectorRef,
        private router: Router,
        private eventsListComponent: EventsListComponent
    ) {
    }

    ngOnInit(): void
    {
        // Open the drawer
        this.eventsListComponent.matDrawer.open();

        this.eventForm = this.formBuilder.group({
            name: ['', Validators.required],
            fromDate: [null, Validators.required],
            toDate: [null, Validators.required],
            imagePath: [''],
        });

        this.eventsService.event$
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(event => {
                this.event = event;

                this.eventForm.patchValue(event);

                this.changeDetectorRef.markForCheck();
            });
    }

    updateEvent(): void
    {
        this.eventForm.disable();

        this.eventsService.updateEvent(this.event.id, this.eventForm.getRawValue(), this.eventImgFile).subscribe({
            next: () => {
                this.router.navigate(['../']);
                this.changeDetectorRef.markForCheck();
            },
            error: (err) => {
                this.eventForm.enable();
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
        const imagePath = this.eventImgPreviewUrl || this.getFilePath(this.eventForm.get('imagePath')?.value);

        if (imagePath) {
            window.open(imagePath, '_blank');
        }
    }

    removeImage(): void
    {
        this.eventImgFile = null;
        this.changeDetectorRef.markForCheck();

        if (this.eventForm.get('imagePath')?.value) {
            // Open the confirmation dialog
            const confirmation = this.fuseConfirmationService.open({
                title  : 'Supprimer l\'image de l\'événement',
                message: 'Êtes-vous sûr de vouloir supprimer l\'image de l\'événement ? Attention, cette action est irréversible.',
                actions: {
                    confirm: {
                        label: 'Supprimer',
                    },
                    cancel: {
                        label: 'Annuler',
                    }
                }
            });

            // Subscribe to the confirmation dialog closed action
            confirmation.afterClosed().subscribe((result) => {
                // If the confirm button pressed...
                if (result === 'confirmed') {
                    // Delete the event image on the server
                    this.eventsService.deleteEventImage(this.event.id).subscribe(() => {
                        this.event.imagePath = null;
                        this.eventForm.get('imagePath').setValue(null);
                        this.changeDetectorRef.markForCheck();
                    });
                }
            });
        }
    }

    isValidFile(file: File): boolean
    {
        const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        return validExtensions.includes(fileExtension);
    }

    getFilePath(path: string): string
    {
        if (!path) {
            return null;
        }

        return environment.apiUrl + '/' + path
    }

    closeDrawer(): Promise<MatDrawerToggleResult>
    {
        return this.eventsListComponent.matDrawer.close();
    }
}
