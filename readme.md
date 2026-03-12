# BugTracker

BugTracker je web aplikacija namijenjena upravljanju greškama/problemima (bugovima) i/ili zadacima unutar softverskih projekata. Aplikacija omogućuje razvojnom timu jednostavno prijavljivanje, praćenje i rješavanje problema tijekom razvoja softvera.

Cilj aplikacije je poboljšati organizaciju rada unutar tima, povećati transparentnost razvoja te olakšati komunikaciju između članova tima.

Aplikacija je razvijena kao projekt za kolegij **Programsko inženjerstvo** te je samostalno izrađena.

[Fakultet informatike u Puli](https://fipu.unipu.hr)

[Programsko inženjerstvo](http://ntankovic.unipu.hr/pi)

Mentor: [doc. dr. sc. Nikola Tanković](https://ntankovic.unipu.hr)

## Funkcionalnosti

- registracija i prijava korisnika
- kreiranje projekata
- prijavljivanje problema (issue)
- dodjeljivanje problema članovima tima
- promjena statusa problema (Open, In Progress, Resolved, Closed)
- komentiranje problema
- pregled svih problema po projektu
- filtriranje problema po statusu, prioritetu i dodijeljenom korisniku

## Uloge korisnika

Sustav podržava više korisničkih uloga:

- **Administrator** – upravlja projektima i korisnicima
- **Developer** – rješava prijavljene probleme
- **Tester / Reporter** – prijavljuje nove probleme

## Tehnologije

Projekt koristi sljedeće tehnologije:

- **Vue.js** – frontend framework
- **Vue Router** – navigacija između stranica
- **Firebase** – backend i baza podataka
- **CSS / Tailwind** – stiliziranje korisničkog sučelja

## Struktura aplikacije

Aplikacija se sastoji od nekoliko glavnih modula:

- upravljanje korisnicima
- upravljanje projektima
- upravljanje problemima
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

## UseCase dijagram

![UseCase dijagram](UseCase.png)

## Link na javni prototip

(Javni prototip)[#]