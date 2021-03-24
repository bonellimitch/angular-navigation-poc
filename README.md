# Angular Navigation POC (WIP)
Angular Navigatione POC - Named Router Outlets with Dialogs


## Introduzione
Il progetto si pone come obbiettivo quello di implementare dinamicamente la creazione di router outlet secondari su modali per innestare fino a N livelli di modali navigabili. 

Ogni modale dovrà permette all'utente di navigare in avanti oppure di tornare ai componenti precedentemente visualizzati sulla modale stessa senza andare a influire nella navigazione delle altre modali o della route principale.


## Punti chiave

- **route.service.ts**: servizio che dovrebbe gestire tutti gli aspetti della navigazione, history stack e salvataggio parametri

## Info

- **primary router outlet**:  ho differenziato la gestione del router primario da quelli secondari. Il router outlet primario viene gestito mettendosi in ascolto degli eventi di route principalmente legati ad angular mentre quelli secondari per popolare la struttura dati di stack vengono gestiti a mano nei metodi `nagivate` e `goBack`

- **route.service.ts**: ho esposto sulla window il service, ora da console basta chiamare `routeService.status` per vedere qual'è lo stato di navigazione e qundi (stack e strutture dati salvate dei componenti). 
  - **generazione id univoco componente**: viene gestito direttamente nel metodo `navigate` e non più nel singolo componente. Quando navighiamo ad un componente generiamo l'ID univico e lo passiamo come parametro in query string (se siamo su routing primario) o lo salviamo nello stack di parametri del service (su routing secondario). Il componente poi lo inizializza al pari degli altri parametri.
## Punti aperti

- **gestione query params**: i query params sono comuni sia al primary outlet che ai secondary outlet, l'idea è che solo il primary outlet sfrutti questi paramentri mentre sui secondary outlet tutto viene gestito da uno stack nel service `route.service.ts`
- **dipendenza circolare**: risolvere la dipendenza circolare di `route.service.ts` verso `app-routing.module.ts` e quindi verso i componenti che vengono istanziati nell'applicazione. Sfruttare l'injection Angular per iniettare le route nel `route.service.ts` evitando così la dipendenza circolare. 


## References

Thanks to https://github.com/dawidgarus for the `named-outlet.directive.ts`