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
  // outletNotActivated = true;

  constructor(
    private route: RouteService,
    private dialogRef: MatDialogRef<ModalComponent>
  ) { }

  ngOnInit(): void {
    this.outlet = this.route.addDynamicModalRoutes();

    this.dialogRef.afterClosed().subscribe(response => {
      console.log('aftet closed fired');
      this.route.clearRouterOutlet();
    });
  }

  /**
   * Quando il router outlet è inizializzato allora se necessario navigo al componente
   */
  initialized(event?: any): void {
    this.route.navigate('first', {
      number: this.route.randomInt(1, 100)
    });
  }
}
