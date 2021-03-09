import { ChangeDetectorRef, ComponentFactoryResolver, Directive, EventEmitter, Input, OnDestroy, OnInit, Output, ViewContainerRef } from '@angular/core';
import { ChildrenOutletContexts, RouterOutlet } from '@angular/router';
import { RouteService } from './route.service';

// @Directive({
//   selector: '[appNamedOutlet]'
// })
@Directive({
  selector: 'named-outlet',
  exportAs: 'outlet'
})
export class NamedOutletDirective implements OnInit {
  public outlet!: RouterOutlet;
  @Input() public name!: string;

  @Output() public initialized = new EventEmitter<any>();

  constructor(
    private parentContexts: ChildrenOutletContexts,
    private location: ViewContainerRef,
    private resolver: ComponentFactoryResolver,
    private changeDetector: ChangeDetectorRef,
    private route: RouteService
  ) { }

  ngOnInit(): void {
    this.outlet = this.route.createRouterOutlet(this.parentContexts, this.location, this.resolver, this.name, this.changeDetector);
    this.outlet.ngOnInit();
    this.initialized.next();
  }
}
