import { ChangeDetectorRef, ComponentFactoryResolver, Injectable, ViewContainerRef } from '@angular/core';
import {
  ActivatedRoute,
  ActivationStart,
  ChildrenOutletContexts,
  Router,
  RouterOutlet,
  NavigationEnd,
  NavigationStart,
  Navigation
} from '@angular/router';
import { modalRoutes } from './app-routing.module';
import * as _ from 'lodash';
import { Location } from '@angular/common';
import { RouteEntry, NamedRouterOutlet, Routable, Context, RouteUtility, ComponentType } from './route.model';
import { filter } from 'rxjs/operators';

// url we don't want to track in history for whatever reason
export const BLACKLIST_URLS = [];

@Injectable({
  providedIn: 'root'
})
export class RouteService {

  routerOutletStack: NamedRouterOutlet[] = [];
  private routerOutletStackKey = 'routerOutletStack';

  componentSessionContext: { [p: string]: Context } = {};
  private componentSessionContextKey = 'componentSessionData';

  routerOutletMap: Map<string, RouterOutlet> = new Map();

  primaryRouterOutletQueryParams: any;

  lastNavigationStartEvent!: NavigationStart;

  lastActivationStartEvent!: ActivationStart;

  // indicates if the service is loading now for the first time
  firstLoad = true;

  static generateUniqueID(): number {
    return Math.round((Math.random() * 1000) - 1);
  }

  get isModalOpen(): boolean {
    return this.routerOutletStack.length > 1;
  }

  get status(): any {
    return {
      routerOutletStack: this.routerOutletStack,
      componentSessionContext: this.componentSessionContext
    };
  }

  get primaryRouterOutlet(): NamedRouterOutlet | null {
    return this.routerOutletStack ? this.routerOutletStack[0] : null;
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private location: Location,
  ) {

    this.initializeRouteService();
  }

  private initializeRouteService(): void {

    (window as any).routeService = this;

    // 1. inizializzo la mappa dei componenti - contesti
    this.initializeComponentsSessionContext();

    // 2. gestione router outlet principale
    this.handlePrimaryRouterOutlet();

    // 3. mi metto in ascolto degli eventi di routing
    this.router.events.subscribe(e => {

      this.handleNamedOutletDeactivation(e);

      // 4.1 ad ogni evento di routing aggiorno il routerOutletStack
      this.persistRouterOutletStack();
    });

    // 4. mi metto in ascolto degli eventi sui queryParams per salvarmi gli ultimi parametri
    this.activatedRoute.queryParams.subscribe(params => {
      this.primaryRouterOutletQueryParams = params;
    });
  }

  private handleNamedOutletDeactivation(e: any): void {
    // quick and dirty per risolvere problema apertura N modali
    if (e instanceof ActivationStart && e.snapshot.outlet.startsWith('modal')) {
      this.routerOutletMap.get(e.snapshot.outlet)?.deactivate();
    }
  }

  // private handlePrimaryRouterOutletSack(e: any): void {
  //   const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
  //   if (e instanceof ActivationEnd && activeRouterOutlet.outlet === 'primary' && e.snapshot.url.length > 0) {
  //     activeRouterOutlet.pushEntry(new RouteEntry(e.snapshot.url[0].path, e.snapshot.queryParams));
  //   }
  // }

  /**
   * Metodo proxy verso router.navigate di Angular che deve implementare tutta la gestione
   * della navigazione sia per il primary outlet che per i secondary outlet, salvanto contemporaneamente 
   * i dati necessari per mantenere la history.
   */
  navigate(url: string, params?: any, currentComponent?: Routable): void {

    // 1. salvo contesto
    if (currentComponent) {
      currentComponent.saveContext();
    }

    // 2. integro parametri con component ID
    const componentId = this.generateComponentID(url);
    params = Object.assign({}, params, { id: componentId });

    const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
    if (!this.isModalOpen) {
      // activeRouterOutlet.stack.push(new StackEntry(url, params));
      this.router.navigate([url], {
        queryParams: params
      });
    } else if (this.isModalOpen) {
      const outlets = {};
      (outlets as any)[activeRouterOutlet.outlet] = url ? [`${url}`] : null;
      activeRouterOutlet.pushEntry(new RouteEntry(url, params));
      this.router.navigate([{ outlets }], {
        skipLocationChange: false,
        queryParams: this.primaryRouterOutletQueryParams,
      });
    }
  }

  generateComponentID(url: string): string {
    let componentName = url.replace('/', '-');
    componentName = componentName.charAt(0) === '-' ? componentName.substring(1, componentName.length) : componentName;
    return `${componentName}-${RouteService.generateUniqueID()}`;
  }

  /**
   * Metodo che deve implementare tutta la gestione del goBack in stile browser anche su modale e
   * quindi su router outlet secondary (location.back() funziona bene solo con il primary outlet)
   */
  goBack(currentComponent: Routable): void {
    if (!this.isModalOpen) {
      // this.popPreviousUrl();
      this.location.back();
    } else {
      const entry = this.popPreviousUrl();
      this.location.back();
      if (entry) {
        this.navigate(entry.url, entry.params, currentComponent);
      }
    }
  }

  showBackButton(activatedRoute: ActivatedRoute): boolean {
    if (activatedRoute) {
      const routerHistory = this.getRouterOutletByActivatedRoute(activatedRoute);
      return (routerHistory && routerHistory.currentIndex >= 1) as boolean;
    }
    return false;
  }

  /**
   * Ripulisce la route settando come path 'null', attenzione: nella definizione delle route
   * deve essere prevista una route '' altrimenti va in errore.
   */
  clearRoute(): void {
    if (!this.isModalOpen) {
      this.router.navigate([null]);
    } else if (this.isModalOpen) {
      const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
      const outlets = {};
      (outlets as any)[activeRouterOutlet.outlet] = null;
      this.router.navigate([{ outlets }], {
        skipLocationChange: false,
        queryParams: this.primaryRouterOutletQueryParams
      });
    }
  }

  /**
   * Crea il router outlet con il nome passato in input e lo salva nella mappa dei router outlet
   */
  createRouterOutlet(
    parentContexts: ChildrenOutletContexts,
    location: ViewContainerRef,
    resolver: ComponentFactoryResolver,
    name: string,
    changeDetector: ChangeDetectorRef): RouterOutlet {
    const outlet = new RouterOutlet(parentContexts, location, resolver, name, changeDetector);
    this.routerOutletMap.set(name, outlet);
    return outlet;
  }

  /**
   * Ripulisce il router outlet e quindi:
   *  - prende il router outlet attivo
   *  - resetta la route
   *  - toglie dalle route quelle aggiunte a runtime per il router outlet che stiamo ripulendo
   *  - disattiva il router outlet
   */
  clearRouterOutlet(): void {
    const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
    this.clearRoute();
    this.clearDynamicModalRoutes(activeRouterOutlet.outlet);
    const outlet = this.routerOutletMap.get(activeRouterOutlet.outlet);
    if (outlet) {
      outlet.deactivate();
      outlet.ngOnDestroy();
    }
  }

  getActiveRouterOutletByName(name: string): RouterOutlet | undefined {
    return this.routerOutletMap.get(name);
  }

  /**
   * Metodo usato dai componenti per ottenere i parametri di input con il quale
   * è stato invocato in base al contesto (primary router outlet o secondary router outlet)
   */
  getParameter(activatedRoute: ActivatedRoute, name: string): any {
    const params = this.getRouterOutletParams(activatedRoute);
    return params ? params[name] : null;
  }

  /**
   * Metodo usato dai componenti per ottenere i parametri di input con il quale
   * è stato invocato in base al contesto (primary router outlet o secondary router outlet)
   */
  getParameters(activatedRoute: ActivatedRoute): any {
    return this.getRouterOutletParams(activatedRoute);
  }

  /**
   * Metodo che restituisce i parametri passati in input al componente sfruttando lo stack di history
   * del router outlet attivo.
   */
  private getRouterOutletParams(activatedRoute: ActivatedRoute): any {
    if (activatedRoute.outlet === 'primary') {
      return activatedRoute.snapshot.queryParams;
    }
    const routerHistory = this.getRouterOutletByActivatedRoute(activatedRoute);
    if (routerHistory && routerHistory.history.length > 0) {
      const entry = routerHistory.history[routerHistory.history.length - 1];
      return entry && entry.params ? entry.params : null;
    }
    return null;
  }

  /**
   * Restituisce il router outlet attualmente attivo, ovvero quello incima allo stack
   * di router outlet che sono stati istanziati.
   */
  getCurrentActiveRouterOutlet(): NamedRouterOutlet {
    return this.routerOutletStack[this.routerOutletStack.length - 1];
  }

  private getRouterOutletByActivatedRoute(activatedRoute: ActivatedRoute): NamedRouterOutlet | undefined {
    return this.routerOutletStack.find(outlet => outlet.outlet === activatedRoute.outlet);
  }

  /**
   * Ritorna la history del router outlet attualmente attivo
   */
  public getCurrentRouterOutletHistory(): RouteEntry[] {
    const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
    return activeRouterOutlet ? activeRouterOutlet.history : [];
  }

  /**
   * Restituisce l'entry dello stack del componente precedente quello attualmente visualizzato.
   */
  public getPreviousUrl(): RouteEntry {
    const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
    return activeRouterOutlet.history[activeRouterOutlet.history.length - 2];
  }

  /**
   * Restituisce l'entru dello stack del componente precedentemente visualizzato e contemporaneamente 
   * elimina dallo stack le entry necessarie per ripulire la history.
   *
   * Metodo usato per implementare il goBack();
   */
  public popPreviousUrl(): RouteEntry | undefined {
    const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
    activeRouterOutlet.popEntry(); // current
    return activeRouterOutlet.popEntry();  //previous
  }

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  /**
   * Aggiunge dinamicamente le route alle route di angular
   */
  addDynamicModalRoutes(): string {
    const name = this.getRouterOutletName();
    this.routerOutletStack.push(new NamedRouterOutlet(name));
    const routes = _.cloneDeep(modalRoutes);
    for (const route of routes) {
      route.outlet = name;
    }

    this.router.config.push(...routes);
    return name;
  }

  /**
   * Dato il nome dell router outlet ripulisce le route ad esso associato, ripristinando le route
   * angular originali.
   */
  clearDynamicModalRoutes(outlet: string): void {
    const routes = this.router.config.filter(route => route.outlet !== outlet);
    this.router.resetConfig(routes);
    this.routerOutletStack.pop();
  }

  getRouterOutletName(): string {
    const name = 'modal_' + this.getNextRouterOutletIndex(); // genera problema 'Cannot activate an already activated outlet'
    return name;
  }

  getNextRouterOutletIndex(): number {
    return this.routerOutletStack.length;
  }

  /**
   * Salvataggio context componenti in session storage e router outlet stack
   */
  private persistRouterOutletStack(): void {
    sessionStorage.setItem(this.routerOutletStackKey, JSON.stringify(this.routerOutletStack));
  }

  initializeRouterOutletStack(event: NavigationEnd): void {
    const persistedRouterOutletStack: any[] = sessionStorage.getItem(this.routerOutletStackKey) ?
      JSON.parse(sessionStorage.getItem(this.routerOutletStackKey) as string) : undefined;

    if (persistedRouterOutletStack) {
      for (const outlet of persistedRouterOutletStack) {
        if (outlet.outlet === 'primary') {
          this.routerOutletStack.push(new NamedRouterOutlet(outlet.outlet, outlet.history, outlet.currentIndex));
          const entry = this.routerOutletStack[0].history.find(historyEntry => historyEntry.url === event.url);
          if (entry && this.lastNavigationStartEvent) {
            entry.id = this.lastNavigationStartEvent.id;
          }
        }
      }
    }

    // se non è stato recuperato lo stato del router outlet primario lo inizializzo qui
    if (this.routerOutletStack.length === 0) {
      this.routerOutletStack.push(new NamedRouterOutlet('primary'));
    }
  }


  setComponentSessionData(componentId: string, data: Context): void {
    this.componentSessionContext[componentId] = data;
    this.updateComponentsSessionData();
  }

  updateComponentsSessionData(): void {
    const componentsToPersist = new Object() as any;
    for (const componentId of Object.keys(this.componentSessionContext)) {
      componentsToPersist[componentId] = this.componentSessionContext[componentId].toSessionStorage();
    }
    sessionStorage.setItem(this.componentSessionContextKey, JSON.stringify(componentsToPersist));
  }

  initializeComponentsSessionContext(): void {
    const parsePersistedComonentData: any = sessionStorage.getItem(this.componentSessionContextKey) ?
      JSON.parse(sessionStorage.getItem(this.componentSessionContextKey) as string) : undefined;
    if (parsePersistedComonentData) {
      for (const componentId of Object.keys(parsePersistedComonentData)) {
        const persistedComponentData = parsePersistedComonentData[componentId];
        (this.componentSessionContext as any)[componentId] = RouteUtility.fromSessionStorage(persistedComponentData);
      }
    }
  }

  private handlePrimaryRouterOutlet(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationStart || event instanceof ActivationStart || event instanceof NavigationEnd)
      ).subscribe(event => {

        // trying to fetch eventually store navigation stack
        if (this.firstLoad) {
          this.firstLoad = false;
          this.initializeRouterOutletStack(event as NavigationEnd);
        }

        const currentNavigation = this.router.getCurrentNavigation() as Navigation;
        // we don't want to track this types of navigations
        if (currentNavigation && currentNavigation.extras.skipLocationChange) {
          return;
        }

        // temporarly storing navigation event for later use of its data
        if (event instanceof NavigationStart) {
          this.lastNavigationStartEvent = event;

          // if by any change we are replacing url / query params I need to pop the previous state
          if (currentNavigation && currentNavigation.extras.replaceUrl &&
            this.primaryRouterOutlet && event.navigationTrigger !== 'popstate') {
            this.primaryRouterOutlet.popEntry();
          }

          return;
        }

        if (event instanceof ActivationStart) {
          this.lastActivationStartEvent = event;
        }

        // NavigationEnd events
        if (this.lastActivationStartEvent.snapshot.outlet === 'primary' && event instanceof NavigationEnd) {
          this.handleImperativeNavigation(event, currentNavigation);

          this.handlePopstateNavigation(event, currentNavigation);

          this.persistRouterOutletStack();
        }
      });
  }

  private handleImperativeNavigation(event: NavigationEnd, currentNavigation: Navigation): void {
    if (this.primaryRouterOutlet && this.lastNavigationStartEvent &&
      this.lastNavigationStartEvent.navigationTrigger === 'imperative' && event.url) {
      const entry = new RouteEntry(
        event.urlAfterRedirects,
        currentNavigation.extras.queryParams as any,
        this.lastNavigationStartEvent.id);
      this.primaryRouterOutlet.pushEntry(entry);
    }
  }

  /**
   * Popstate events are triggerd in Angular when users goes BACK and FORTH using the browser buttons.
   *
   * We do not pop history entry in this case, we just update them and update the current index to indicate in
   * which state we are in.
   */
  private handlePopstateNavigation(event: NavigationEnd, currentNavigation?: Navigation): void {
    if (this.primaryRouterOutlet && this.lastNavigationStartEvent && this.lastNavigationStartEvent.navigationTrigger === 'popstate') {
      // get the history item that references the idToRestore
      let index = 0;
      if (this.lastNavigationStartEvent.restoredState) {
        index = this.primaryRouterOutlet.history
          .findIndex(entry =>
            this.lastNavigationStartEvent.restoredState &&
            entry.id === this.lastNavigationStartEvent.restoredState.navigationId);
      }

      if (index >= 0) {
        const historyEntry = this.primaryRouterOutlet.popEntry();
        historyEntry.id = this.lastNavigationStartEvent.id;
      } else {
        this.primaryRouterOutlet.currentIndex = 0;
      }
    }
  }
}
