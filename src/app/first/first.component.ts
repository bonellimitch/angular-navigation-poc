import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';
import { RouteService } from '../route.service';

@Component({
  selector: 'app-first',
  templateUrl: './first.component.html',
  styleUrls: ['./first.component.scss']
})
export class FirstComponent implements OnInit {

  isModal = false;
  outlet!: string;

  constructor(
    // private router: Router,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private route: RouteService
  ) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.isModal = params.isModal;
      this.outlet = params.outlet;
    });
  }

  openModal(event: Event): void {
    const ref = this.dialog.open(ModalComponent, {
      width: '80vw',
      height: '80vh'
    });
  }

  navigate(url: string): void {
    this.route.navigate(url);

    // if (!this.isModal) {
    //   this.router.navigate([url]);
    // } else {
    //   const outlets = {};
    //   (outlets as any) [this.outlet] = [url];
    //   // this.router.navigate([{ outlets }], { queryParams: { isModal: true } });
    //   this.router.navigate([{ outlets }], {
    //     queryParams: {
    //       isModal: this.isModal,
    //       outlet: this.outlet
    //     },
    //     skipLocationChange: true
    //   });
    // }
  }
}
