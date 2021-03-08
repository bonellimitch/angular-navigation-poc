import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteService } from '../route.service';

@Component({
  selector: 'app-second',
  templateUrl: './second.component.html',
  styleUrls: ['./second.component.scss']
})
export class SecondComponent implements OnInit {

  isModal = false;
  outlet!: string;

  constructor(
    // private router: Router,
    private activatedRoute: ActivatedRoute,
    private route: RouteService
  ) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.isModal = params.isModal;
      this.outlet = params.outlet;
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
