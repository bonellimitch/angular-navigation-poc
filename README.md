# Angular Navigation POC (WIP)
Angular Navigatione POC - Named Router Outlets with Dialogs


## Introduzione
Il progetto si pone come obbiettivo quello di implementare dinamicamente la creazione di router outlet secondari su modali per innestare fino a N livelli di modali navigabili. 

Ogni modale dovrà permette all'utente di navigare in avanti oppure di tornare ai componenti precedentemente visualizzati sulla modale stessa senza andare a influire nella navigazione delle altre modali o della route principale.


## Punti chiave
- **route.service.ts**: servizio che dovrebbe gestire tutti gli aspetti della navigazione, history stack e salvataggio parametri

## Punti aperti

- **primary router outlet**: analizzare se opportuno gestire in modo uniforme anche il primary router outlet salvando nel service `route.serivice.ts` lo stack di navigazione ed i parametri.
- **gestione query params**: i query params sono comuni sia al primary outlet che ai secondary outlet, l'idea è che solo il primary outlet sfrutti questi paramentri mentre sui secondary outlet tutti viene gestito da uno stack nel service `route.service.ts`



## References

Thanks to https://github.com/dawidgarus for the `named-outlet.directive.ts`