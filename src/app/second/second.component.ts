import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-second',
  templateUrl: './second.component.html',
  styleUrls: ['./second.component.scss']
})
export class SecondComponent implements OnInit {

  isModal = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.isModal = params.isModal;
    });
  }

  navigate(url: string): void {
    if (!this.isModal) {
      this.router.navigate([url]);
    } else {
      this.router.navigate([{ outlets: { modalOutlet: [url] } }], { queryParams: { isModal: this.isModal } });
    }
  }
}
