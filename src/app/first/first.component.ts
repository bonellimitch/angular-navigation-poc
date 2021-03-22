import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
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
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private route: RouteService
  ) {
    this.number = this.route.getParameter(activatedRoute, 'number');
  }


  ngOnInit(): void {
    // this.activatedRoute.queryParams.subscribe(params => {
    //   this.isModal = params.isModal;
    //   this.outlet = params.outlet;
    // });
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
  }

  goBack(): void {
    this.route.goBack();
  }
}
