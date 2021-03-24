import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';
import { FirstContext, Routable } from '../route.model';
import { RouteService } from '../route.service';

@Component({
  selector: 'app-first',
  templateUrl: './first.component.html',
  styleUrls: ['./first.component.scss']
})
export class FirstComponent implements OnInit, OnDestroy, Routable {

  @HostBinding('id')
  id!: string;

  isModal = false;
  outlet!: string;
  number!: string | null;

  get showBackButton(): boolean {
    return this.route.showBackButton(this.activatedRoute);
  }

  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private route: RouteService
  ) {
    this.number = this.route.getParameter(this.activatedRoute, 'number');
    this.id = this.route.getParameter(this.activatedRoute, 'id');
    console.log(`first component id is ${this.id}`);
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    console.log(`first component with number ${this.number} is destroyed`);
  }

  saveContext(): void {
    console.log('called saved context first component');
    const context = new FirstContext();
    context.data = {
      number: this.number
    };
    this.route.setComponentSessionData(this.id, context);
  }

  openModal(event: Event): void {
    const ref = this.dialog.open(ModalComponent, {
      width: '80vw',
      height: '80vh',
      // disableClose: true
    });
  }

  navigate(url: string): void {
    this.route.navigate(url, {
      number: this.route.randomInt(1, 100)
    }, this);
  }

  goBack(): void {
    this.route.goBack(this);
  }

}
