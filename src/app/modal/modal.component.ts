import { TOUCH_BUFFER_MS } from '@angular/cdk/a11y';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteService } from '../route.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

  outlet!: any;

  constructor(
    private router: Router,
    private route: RouteService,
    private activatedRoute: ActivatedRoute,
    private dialogRef: MatDialogRef<ModalComponent>
  ) { }

  ngOnInit(): void {

    this.outlet = this.route.addDynamicModalRoutes();

    // const outlets = {};
    // (outlets as any)[this.outlet] = ['first'];

    // this.router.navigate([{ outlets }], {
    //   queryParams: { isModal: true, outlet: this.outlet },
    //   skipLocationChange: true
    // });

    // this.route.navigate();

    // this.route.navigate('first');


    this.dialogRef.afterClosed().subscribe(response => {
      // const resetOutlets = {};
      // (resetOutlets as any)[this.outlet] = null;
      // this.router.navigate([{
      //   outlets: resetOutlets
      // }], {
      //   skipLocationChange: true
      // });

      // this.route.navigate();

      // this.route.clearDynamicModalRoutes(this.outlet);

      this.route.clearRouterOutlet();

      // this.router.navigate([{
      //   outlets: {
      //     modalOutlet: null,
      //     primary: ['first']
      //   }
      // }]);
    });
  }

  initialized(event?: any): void {
    const outlet = this.route.getActiveRouterOutletByName(this.outlet);
    if (outlet && !outlet.isActivated) {
      this.route.navigate('first');
    }
  }

}
