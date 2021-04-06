import { ChangeDetectorRef, ComponentFactoryResolver, Inject, Injectable, InjectionToken, ViewContainerRef } from '@angular/core';
import {
  ActivatedRoute,
  ActivationStart,
  ChildrenOutletContexts,
  Router,
  RouterOutlet,
  NavigationEnd,
  NavigationStart,
  Navigation,
  Event,
  Routes
} from '@angular/router';
import * as _ from 'lodash';
import { Location } from '@angular/common';
import { RouteEntry, NamedRouterOutlet, Routable, Context, RouteUtility } from './route.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
// import { ModalComponent } from './modal/modal.component';
import { ComponentType } from '@angular/cdk/portal';

export const DIALOG_MODULE_COMPONENT = new InjectionToken<ComponentType<any>>('DIALOG_MODULE_COMPONENT');

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

  // riferimento agli ultimi parametri in query string configurati
  primaryRouterOutletQueryParams: any;

  lastNavigationStartEvent!: NavigationStart;

  lastActivationStartEvent!: ActivationStart;

  // pilota la skipLocationChange nel routing su modale
  skipLocationChangeOnModalNavigation = false;

  // tiene traccia del numero di location.back da fare al dismiss di tutte le modale se skipLocationChangeOnModalNavigation = false
  backs = 0;

  // indica se il service si sta caricando ora per la prima volta
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
    private dialog: MatDialog,
    @Inject('MODAL_ROUTES') public modalRoutes: Routes,
    @Inject(DIALOG_MODULE_COMPONENT) public modalCommponent: ComponentType<any>
  ) {
    this.initializeRouteService();
  }

  private initializeRouteService(): void {

    (window as any).routeService = this;

    // 1. inizializzo la mappa dei componenti - contesti
    this.initializeComponentsSessionContext();

    // 3. mi metto in ascolto degli eventi di routing
    this.router.events.subscribe(e => {

      // 3.1 gestione router outlet primario
      this.handlePrimaryRouterOutlet(e);

      // 3.2 gestione named router outlets
      this.handleNamedOutletRouterOutlets(e);

      // 3.3 salvataggio routerOutletStack alla fine di ogni navigazione
      if (e instanceof NavigationEnd) {
        this.persistRouterOutletStack();
      }
    });

    // 5. mi metto in ascolto degli eventi sui queryParams per salvarmi gli ultimi parametri
    this.activatedRoute.queryParams.subscribe(params => {
      this.primaryRouterOutletQueryParams = params;
    });
  }

  /**
   * Metodo proxy verso router.navigate di Angular che deve implementare tutta la gestione
   * della navigazione sia per il primary outlet che per i secondary outlet, salvanto contemporaneamente
   * i dati necessari per mantenere la history.
   */
  navigate(url: string, params?: any, currentComponent?: Routable, isPopstate = false): void {

    // 1. salvo contesto
    if (currentComponent) {
      currentComponent.saveContext();
    }

    // 2. integro parametri con component ID
    const componentId = this.generateComponentID(url);
    params = Object.assign({}, params, { id: componentId });

    const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
    if (!this.isModalOpen) {
      this.router.navigate([url], {
        queryParams: params
      });
    } else if (this.isModalOpen) {
      const outlets = {};
      (outlets as any)[activeRouterOutlet.name] = url ? [`${url}`] : null;
      if (!isPopstate) {
        activeRouterOutlet.pushEntry(new RouteEntry(url, params));
      }
      this.backs = this.backs + 1;
      this.router.navigate([{ outlets }], {
        skipLocationChange: this.skipLocationChangeOnModalNavigation,
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
      this.location.back();
    } else {
      const entry = this.popPreviousUrl();
      if (entry) {
        this.navigate(entry.url, entry.params, currentComponent, true);
      }
    }
  }

  openNavigationModal(currentComponent: Routable): MatDialogRef<ComponentType<any>, any> {
    currentComponent.saveContext();
    const ref = this.dialog.open(this.modalCommponent, {
      width: '80vw',
      height: '80vh',
    });
    return ref;
  }

  showBackButton(activatedRoute: ActivatedRoute): boolean {
    if (activatedRoute) {
      const routerHistory = this.getRouterOutletByActivatedRoute(activatedRoute);
      return (routerHistory && routerHistory.currentIndex >= 1) as boolean;
    }
    return false;
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
    this.cleanUpLocation(activeRouterOutlet);
    this.routerOutletStack.pop();
    const outlet = this.routerOutletMap.get(activeRouterOutlet.name);
    if (outlet) {
      outlet.deactivate();
      outlet.ngOnDestroy();
    }
  }

  cleanUpLocation(activeRouterOutlet: NamedRouterOutlet): void {
    // 1. necessario ripulire la location solo se non è configurato il skipLocationChange
    if (!this.skipLocationChangeOnModalNavigation) {
      if (activeRouterOutlet.name === 'modal_1') {
        // for (let i = 0; i < this.backs; i++) {
        //   this.location.back();
        // }
        window.history.go(- this.backs);
        this.backs = 0;
      }
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
    return routerHistory ? routerHistory.getCurrentRouteEntryParams() : null;
  }

  /**
   * Metodo che data la activatedRoute e il componentId ritorna il contesto di sessione del componente.
   * 
   * Nota: non posso basarmi sul currentIndex perchè un componente in background potrebbe lanciare funzioni
   * e avere bisogno del contesto e il suo contesto non deve tenere in considerazione quello del componente che invece
   * in quel momento è in foreground.
   */
  getContext(activatedRoute: ActivatedRoute, componentId: string): Context[] {
    const sessionContext: Context[] = [];

    const routerOutlet = this.getRouterOutletByActivatedRoute(activatedRoute);
    const routerOutletIndex = this.routerOutletStack.findIndex(router => router.name === routerOutlet?.name);
    const routerStack = this.routerOutletStack.slice(0, routerOutletIndex + 1);

    for (const namedRouterOutlet of routerStack) {
      for (const entry of namedRouterOutlet.history) {
        if (entry.componentId && this.getContextById(entry.componentId)) {
          sessionContext.push(this.getContextById(entry.componentId));
        }

        if (entry.componentId === componentId) {
          break;
        }
      }
    }
    return sessionContext.reverse();
  }

  getContextById(componentId: string): Context {
    return this.componentSessionContext[componentId];
  }

  /**
   * Restituisce il router outlet attualmente attivo, ovvero quello incima allo stack
   * di router outlet che sono stati istanziati.
   */
  getCurrentActiveRouterOutlet(): NamedRouterOutlet {
    return this.routerOutletStack[this.routerOutletStack.length - 1];
  }

  private getRouterOutletByActivatedRoute(activatedRoute: ActivatedRoute): NamedRouterOutlet | undefined {
    return this.routerOutletStack.find(outlet => outlet.name === activatedRoute.outlet);
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
    return activeRouterOutlet.popEntry();  // previous
  }

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  /**
   * Aggiunge dinamicamente le route alle route di angular
   */
  addDynamicModalRoutes(): NamedRouterOutlet {
    const name = this.getRouterOutletName();

    // 1. ripulisco eventuali rotte già associato al router outlet
    this.router.config = this.router.config.filter(route => route.outlet !== name);

    // 2. creo il name router outlet e lo aggiungo allo stack
    const routerOutlet = new NamedRouterOutlet(name);
    this.routerOutletStack.push(routerOutlet);

    // 3. aggiungo le rotte associato al nuovo router outlet
    const routes = _.cloneDeep(this.modalRoutes);
    for (const route of routes) {
      route.outlet = name;
    }

    this.router.config.push(...routes);
    return routerOutlet;
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

  private handlePrimaryRouterOutlet(event: Event): void {
    if (event instanceof NavigationStart || event instanceof ActivationStart || event instanceof NavigationEnd) {
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
      }
      this.persistRouterOutletStack();
    }
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
        const historyEntry = this.primaryRouterOutlet.history[index];
        historyEntry.id = this.lastNavigationStartEvent.id;
        this.primaryRouterOutlet.currentIndex = index;
      } else {
        this.primaryRouterOutlet.currentIndex = 0;
      }
    }
  }

  private handleNamedOutletRouterOutlets(e: Event): void {
    // quick and dirty per risolvere problema apertura N modali
    if (e instanceof ActivationStart && e.snapshot.outlet.startsWith('modal')) {
      this.routerOutletMap.get(e.snapshot.outlet)?.deactivate();
    }
  }
}
