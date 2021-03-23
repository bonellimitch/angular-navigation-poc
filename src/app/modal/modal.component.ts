import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { RouteService } from '../route.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

  outlet!: any;

  constructor(
    private route: RouteService,
    private dialogRef: MatDialogRef<ModalComponent>,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.outlet = this.route.addDynamicModalRoutes();
    this.dialogRef.afterClosed().subscribe(response => {
      this.route.clearRouterOutlet();
      this.location.back();
    });
  }

  /**
   * Quando il router outlet è inizializzato allora se necessario navigo al componente
   */
  initialized(event?: any): void {
    const outlet = this.route.getActiveRouterOutletByName(this.outlet);
    if (outlet && !outlet.isActivated) {
      this.route.navigate('first');
    }
  }

}
