# BugTracker

BugTracker je web aplikacija namijenjena upravljanju greškama (bugovima) i zadacima unutar softverskih projekata. Aplikacija omogućuje razvojnim timovima jednostavno prijavljivanje, praćenje i rješavanje problema tijekom razvoja softvera.

Cilj aplikacije je poboljšati organizaciju rada unutar tima, povećati transparentnost razvoja te olakšati komunikaciju između članova tima.

Projekt je razvijen kao dio kolegija **Programsko inženjerstvo**.

## Funkcionalnosti

Aplikacija omogućuje sljedeće funkcionalnosti:

- registracija i prijava korisnika
- kreiranje projekata
- prijavljivanje bugova (issues)
- dodjeljivanje bugova članovima tima
- promjena statusa bugova (Open, In Progress, Resolved, Closed)
- komentiranje bugova
- pregled svih bugova po projektu
- filtriranje bugova prema statusu, prioritetu i korisniku
- dashboard za pregled stanja projekta

## Uloge korisnika

Sustav podržava više korisničkih uloga:

- **Administrator**
  - upravlja korisnicima i projektima

- **Developer**
  - rješava prijavljene bugove
  - mijenja status bugova

- **Tester / Reporter**
  - prijavljuje nove bugove
  - dodaje komentare i dodatne informacije

## Tehnologije

Projekt koristi sljedeće tehnologije:

### Frontend

- Vue.js
- Vue Router
- Tailwind CSS

### Backend

- Firebase Authentication
- Firebase Firestore
- Firebase SDK v8

## Arhitektura aplikacije

Aplikacija koristi modernu SPA (Single Page Application) arhitekturu:

- Frontend (Vue.js)
- Firebase
