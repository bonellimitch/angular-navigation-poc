import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';
import { RouteService } from '../route.service';

@Component({
  selector: 'app-first',
  templateUrl: './first.component.html',
  styleUrls: ['./first.component.scss']
})
export class FirstComponent implements OnInit, OnDestroy {

  isModal = false;
  outlet!: string;
  number!: string | null;

  constructor(
    // private router: Router,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private route: RouteService
  ) {
    this.number = this.route.getParameter('number');
  }


  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.isModal = params.isModal;
      this.outlet = params.outlet;
    });
  }

  ngOnDestroy(): void {
    console.log(`first component with number ${this.number} is destroyed`);
  }

  openModal(event: Event): void {
    const ref = this.dialog.open(ModalComponent, {
      width: '80vw',
      height: '80vh'
    });
  }

  navigate(url: string): void {
    this.route.navigate(url, {
      number: this.route.randomInt(1, 100)
    });

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
