import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {
    FormArray,
    FormBuilder, FormGroup,
    ReactiveFormsModule,
    UntypedFormGroup, Validators,
} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatDrawerToggleResult, MatSidenavModule} from "@angular/material/sidenav";
import {SponsorsService} from "../sponsors.service";
import {SponsorListComponent} from "../list/list.component";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {MatButtonModule, MatIconAnchor} from "@angular/material/button";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {debounceTime, filter, map, Observable, Subject, takeUntil} from "rxjs";
import {LinkType, Sponsor} from "../sponsors.types";
import {environment} from "../../../../../../environments/environment";
import {FuseConfirmationService} from "../../../../../../@fuse/services/confirmation";
import {AsyncPipe} from "@angular/common";
import {FormArrayPipe} from "../../../../../core/utils/formArrayPipe";
import {FormControlPipe} from "../../../../../core/utils/formControlPipe";
import {FormGroupPipe} from "../../../../../core/utils/formGroupPipe";
import {MatTooltip} from "@angular/material/tooltip";
import {capitalizeFirstLetter} from "../../../../../core/utils/tool";
import {round} from "lodash-es";
import {Person} from "../../person.types";
import {PersonService} from "../../new-person/person.service";

@Component({
    selector: 'sponsor-update',
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
        MatDatepickerModule,
        AsyncPipe,
        FormArrayPipe,
        FormControlPipe,
        FormGroupPipe,
        MatTooltip
    ]
})
export class SponsorEditComponent implements OnInit {
    sponsor: Sponsor;
    linkTypes$: Observable<LinkType[]>;
    sponsorForm: UntypedFormGroup;
    sponsorImgFile: File;
    contractFiles: File[] = [];
    sponsorImgPreviewUrl: string;
    personResultSets: Person[];
    protected readonly capitalizeFirstLetter = capitalizeFirstLetter;
    protected readonly round = round;
    private unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private sponsorsService: SponsorsService,
        private personService: PersonService,
        private formBuilder: FormBuilder,
        private fuseConfirmationService: FuseConfirmationService,
        private changeDetectorRef: ChangeDetectorRef,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private sponsorListComponent: SponsorListComponent
    ) {
    }

    ngOnInit(): void
    {
        // Open the drawer
        this.sponsorListComponent.matDrawer.open();

        this.sponsorForm = this.formBuilder.group({
            name: [null, Validators.required],
            description: [null],
            filePath: [null],
            alt: [null],
            displayWebsite: [false],
            contactId: [''],
            sponsorships: this.formBuilder.array([]),
            links: this.formBuilder.array([]),
        });

        this.linkTypes$ = this.sponsorsService.linkTypes$;

        this.sponsorsService.sponsor$
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(sponsor => {
                this.sponsor = sponsor;


                // Fill the form
                this.sponsorForm.patchValue({...sponsor, contactId: sponsor.contact?.id});

                (this.sponsorForm.get('sponsorships') as FormArray).clear();
                sponsor.sponsorships.forEach((sponsorship) => {
                    const sponsorshipForm = this.formBuilder.group({
                        id: sponsorship.id,
                        contractFilePath: sponsorship.contractFilePath,
                        status: sponsorship.status,
                        counterparts: this.formBuilder.array([])
                    });

                    (sponsorshipForm.get('counterparts') as FormArray).clear();
                    sponsorship.sponsorshipCounterparts.forEach(counterpart => {
                        const counterpartForm = this.formBuilder.group({
                            id: counterpart.id,
                            counterpartType: counterpart.counterpartType,
                            amount: counterpart.amount,
                            otherCounterpart: counterpart.otherCounterpart,
                        });

                        counterpartForm.get('counterpartType').valueChanges.subscribe(value => {
                            if (value === 'amount') {
                                counterpartForm.patchValue({ otherCounterpart: null });
                            } else if (value === 'other') {
                                counterpartForm.patchValue({ amount: null });
                            }
                        });

                        (sponsorshipForm.get('counterparts') as FormArray).push(counterpartForm);
                    });

                    (this.sponsorForm.get('sponsorships') as FormArray).push(sponsorshipForm);
                });

                (this.sponsorForm.get('links') as FormArray).clear();
                sponsor.links.forEach(link => {
                    let linkValue = link.url;
                    if (link.linkType?.id && link.linkType?.id < 4) {
                        const regex = /\/([^\/]+)\/?$/;
                        const match = link.url.match(regex);
                        if (match && match[1]) {
                            linkValue = match[1];
                        }
                    }

                    const linkForm = this.formBuilder.group({
                        id: link.id,
                        linkTypeId: [link.linkType.id, Validators.required],
                        link: [linkValue, Validators.required],
                    });

                    linkForm.get('link').valueChanges.subscribe(value => {
                        if (linkForm.get('linkTypeId').value && +linkForm.get('linkTypeId').value < 4) {
                            const regex = /\/([^\/]+)\/?$/;
                            const match = value.match(regex);
                            if (match && match[1]) {
                                linkForm.patchValue({ link: match[1] }, { emitEvent: false });
                            }
                        }
                    });

                    (this.sponsorForm.get('links') as FormArray).push(linkForm);
                });

                // Mark for check
                this.changeDetectorRef.markForCheck();
            });

        this.sponsorForm.get('contactId').valueChanges
            .pipe(
                debounceTime(300),
                map((value) => {
                    // Set the personResultSets to null if there is no value or
                    // the length of the value is smaller than the minLength
                    // so the autocomplete panel can be closed
                    if ( !value || value.length < 3 )
                    {
                        this.personResultSets = null;
                    }

                    // Continue
                    return value;
                }),
                // Filter out undefined/null/false statements and also
                // filter out the values that are smaller than minLength
                filter(value => value && value.length >= 3)
            )
            .subscribe((value) => {
                this.personService.getPersons(1, 50, null, null, value).subscribe({
                    next: (persons) => {
                        // Store the result sets
                        this.personResultSets = persons.persons;
                    }
                });

            });
    }

    updateSponsor(): void
    {
        this.sponsorForm.disable();

        // Get the sponsor object
        let sponsor = this.sponsorForm.getRawValue();

        // Update the sponsor
        this.sponsorsService.updateSponsor(this.sponsor.id, sponsor, this.sponsorImgFile, this.contractFiles).subscribe({
            next: () => {
                this.changeDetectorRef.markForCheck();
                this.router.navigate(['../../'], { relativeTo: this.activatedRoute });
            },
            error: (err) => {
                this.sponsorForm.enable();
            }
        });
    }

    addLink(): void
    {
        const linkForm = this.formBuilder.group({
            id: null,
            linkTypeId: '',
            link: '',
        });

        linkForm.get('link').valueChanges.subscribe(value => {
            if (linkForm.get('linkTypeId').value && +linkForm.get('linkTypeId').value < 4) {
                const regex = /\/([^\/]+)\/?$/;
                const match = value.match(regex);
                if (match && match[1]) {
                    linkForm.patchValue({ link: match[1] }, { emitEvent: false });
                }
            }
        });

        (this.sponsorForm.get('links') as FormArray).push(linkForm);
    }

    removeLink(index: number): void
    {
        (this.sponsorForm.get('links') as FormArray).removeAt(index);
    }

    onContractFileChange(files: FileList, index: number): void
    {
        if (files && files.length > 0 && this.isValidFile(files[0])) {
            this.contractFiles[index] = files[0];
            this.changeDetectorRef.markForCheck();
        }
    }

    removeContractFile(index: number): void
    {
        this.contractFiles[index] = null;
        (this.sponsorForm.get('sponsorships') as FormArray).at(index).patchValue({ contractFilePath: '' });
        this.changeDetectorRef.markForCheck();
    }

    removeContractFileServer(index: number): void
    {
        // Open the confirmation dialog
        const confirmation = this.fuseConfirmationService.open({
            title  : 'Supprimer le contrat',
            message: 'Êtes-vous sûr de vouloir supprimer ce contrat de sponsor ? Cette action est irréversible.',
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
                const sponsorshipForm = (this.sponsorForm.get('sponsorships') as FormArray).at(index);
                const sponsorshipId = sponsorshipForm.get('id').value;
                if (!sponsorshipId) {
                    // this.toastr.error('Impossible de supprimer le contrat.');
                    return
                }

                // Delete the sponsorship contract on the server
                this.sponsorsService.deleteContractFile(sponsorshipId).subscribe(() => {
                    // this.toastr.success('Le contrat a été supprimé avec succès.');
                    this.sponsor.sponsorships[index].contractFilePath = null;
                    sponsorshipForm.patchValue({ contractFilePath: '' });
                    this.changeDetectorRef.markForCheck();
                });
            }
        });
    }

    addSponsorship(): void
    {
        (this.sponsorForm.get('sponsorships') as FormArray).push(this.formBuilder.group({
            id: null,
            contractFilePath: null,
            status: [null, Validators.required],
            counterparts: this.formBuilder.array([])
        }));
    }

    removeSponsorship(index: number): void
    {
        (this.sponsorForm.get('sponsorships') as FormArray).removeAt(index);
    }

    addCounterpart(sponsorship: FormGroup): void
    {
        const counterpartForm = this.formBuilder.group({
            id: null,
            counterpartType: 'amount',
            amount: null,
            otherCounterpart: null,
        });

        counterpartForm.get('counterpartType').valueChanges.subscribe(value => {
            if (value === 'amount') {
                counterpartForm.patchValue({ otherCounterpart: null });
            } else if (value === 'other') {
                counterpartForm.patchValue({ amount: null });
            }
        });

        (sponsorship.get('counterparts') as FormArray).push(counterpartForm);
    }

    removeCounterpart(sponsorship: FormGroup, index: number): void
    {
        (sponsorship.get('counterparts') as FormArray).removeAt(index);
    }

    onImageChange(event): void
    {
        const input = event.target as HTMLInputElement;

        if (!(input.files?.length > 0) || !this.isValidFile(input.files[0])) {
            return;
        }

        const files = input.files;

        this.sponsorImgFile = files[0];
        this.sponsorImgPreviewUrl = URL.createObjectURL(this.sponsorImgFile);
        this.changeDetectorRef.markForCheck();

        input.value = '';
    }

    viewImage(): void
    {
        const imagePath = this.sponsorImgPreviewUrl || this.getFilePath(this.sponsorForm.get('imagePath')?.value);

        if (imagePath) {
            window.open(imagePath, '_blank');
        }
    }

    removeImage(): void
    {
        this.sponsorImgFile = null;
        this.changeDetectorRef.markForCheck();

        if (this.sponsorForm.get('filePath')?.value) {
            // Open the confirmation dialog
            const confirmation = this.fuseConfirmationService.open({
                title  : 'Supprimer l\'image de l\'événement',
                message: 'Êtes-vous sûr de vouloir supprimer l\'image du sponsor ? Attention, cette action est irréversible.',
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
                    // Delete the sponsor image on the server
                    this.sponsorsService.deleteSponsorImage(this.sponsor.id).subscribe(() => {
                        this.sponsor.filePath = null;
                        this.sponsorForm.get('filePath').setValue(null);
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

    getLink(linkTypeId: number, link: string): string
    {
        if (!link) {
            return '';
        }

        switch (linkTypeId) {
            case 1: // Instagram
                return `https://www.instagram.com/${link}`;
            case 2: // Facebook
                return `https://www.facebook.com/${link}`;
            case 3: // Youtube
                return `https://www.youtube.com/${link}`;
            default:
                return link;
        }
    }

    displayPersonFn(value?: number): any
    {
        if (this.personResultSets) {
            const person: Person = this.personResultSets.find(p => p.id === value);

            return value ? person.firstName + ' ' + person.lastName + ' | ' + person.email : undefined;
        }

        if (this.sponsor?.contact?.id) {
            return this.sponsor.contact.firstName + ' ' + this.sponsor.contact.lastName + ' | ' + this.sponsor.contact.email
        }
    }

    getFileNameFromPath(filePath: string): string
    {
        const parts = filePath.split('/');
        return parts[parts.length - 1];
    }

    closeDrawer(): Promise<MatDrawerToggleResult>
    {
        return this.sponsorListComponent.matDrawer.close();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }
}
