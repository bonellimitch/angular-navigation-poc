import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteService } from '../route.service';

@Component({
  selector: 'app-second',
  templateUrl: './second.component.html',
  styleUrls: ['./second.component.scss']
})
export class SecondComponent implements OnInit, OnDestroy {

  isModal = false;
  outlet!: string;
  number!: number;

  constructor(
    // private router: Router,
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
    console.log(`second component with number ${this.number} is destroyed`);
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

  goBack(): void {
    this.route.goBack();
  }
}
