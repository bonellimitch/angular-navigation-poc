import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-first',
  templateUrl: './first.component.html',
  styleUrls: ['./first.component.scss']
})
export class FirstComponent implements OnInit {

  isModal = false;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.isModal = params.isModal;
    });
  }

  openModal(event: Event): void {
    const ref = this.dialog.open(ModalComponent, {
      width: '80vw',
      height: '80vh'
    });
    ref.afterClosed().subscribe(response => {
      console.log(response);
      this.router.navigate([{
        outlets: {
          modalOutlet: null,
          primary: ['first']
        }
      }]);
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
