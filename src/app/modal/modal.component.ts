import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { NamedRouterOutlet } from '../route.model';
import { RouteService } from '../route.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

  outlet!: NamedRouterOutlet;
  outletNotActivated = true;

  constructor(
    private route: RouteService,
    private dialogRef: MatDialogRef<ModalComponent>,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.outlet = this.route.addDynamicModalRoutes();
    this.dialogRef.afterClosed().subscribe(response => {

      // const navigations = this.outlet.history.length;
      // for (let i = 0; i < navigations; i++) {
      //   this.location.back();
      // }
      this.route.clearRouterOutlet();
    });
  }

  /**
   * Quando il router outlet è inizializzato allora se necessario navigo al componente
   */
  initialized(event?: any): void {
    const outlet = this.route.getActiveRouterOutletByName(this.outlet.name);
    this.outletNotActivated = (outlet && !outlet.isActivated) as boolean;
    if (this.outletNotActivated) {
      this.route.navigate('first', {
        number: this.route.randomInt(1, 100)
      });
    }
  }

}
