# BugTracker

BugTracker je web aplikacija namijenjena upravljanju greškama (bugovima) i zadacima unutar softverskih projekata. Aplikacija omogućuje razvojnom timu jednostavno prijavljivanje, praćenje i rješavanje problema tijekom razvoja softvera.

Cilj aplikacije je poboljšati organizaciju rada unutar tima, povećati transparentnost razvoja te olakšati komunikaciju između članova tima.

Aplikacija je razvijena kao projekt za kolegij **Programsko inženjerstvo** te sam ju radio samostalno.

[Fakultet informatike u Puli](https://fipu.unipu.hr)

[Programsko inženjerstvo](http://ntankovic.unipu.hr/pi)

Mentor: [doc. dr. sc. Nikola Tanković](https://ntankovic.unipu.hr)

## Funkcionalnosti

- registracija i prijava korisnika
- kreiranje projekata
- prijavljivanje bugova (issue)
- dodjeljivanje bugova članovima tima
- promjena statusa bugova (Open, In Progress, Resolved, Closed)
- komentiranje bugova
- pregled svih bugova po projektu
- filtriranje bugova po statusu, prioritetu i dodijeljenom korisniku

## Uloge korisnika

Sustav podržava više korisničkih uloga:

- **Administrator** – upravlja projektima i korisnicima
- **Developer** – rješava prijavljene bugove
- **Tester / Reporter** – prijavljuje nove bugove

## Tehnologije

Projekt koristi sljedeće tehnologije:

- **Vue.js** – frontend framework
- **Vue Router** – navigacija između stranica
- **Pinia / Vue state management** – upravljanje stanjem aplikacije
- **REST API / Firebase / Supabase** – backend i baza podataka
- **CSS / Tailwind / Bootstrap** – stiliziranje korisničkog sučelja

## Struktura aplikacije

Aplikacija se sastoji od nekoliko glavnih modula:

- upravljanje korisnicima
- upravljanje projektima
- upravljanje bugovima
- sustav komentara
- dashboard za pregled stanja projekta

## Cilj projekta

Cilj projekta je demonstrirati primjenu principa **programskog inženjerstva**, uključujući:

- analizu zahtjeva
- dizajn sustava
- razvoj web aplikacije
- upravljanje zadacima i bugovima

## Buduća poboljšanja

- email notifikacije
- napredni sustav filtriranja
- Kanban board
- statistika bugova po projektu

## Link na javni prototip

(Javni prototip)[#]