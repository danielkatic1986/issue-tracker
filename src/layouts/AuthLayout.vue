<script setup>
// Layout za javne stranice (prijava, zaboravljena lozinka).
// Dijeli ekran na pola: lijeva strana je dekorativna slika (skrivena na mobitelu),
// desna strana prikazuje aktualni view (RouterView).
</script>

<template>
  <div class="h-screen flex overflow-hidden">
    <div class="hidden md:block relative w-1/2 h-screen overflow-hidden">
      <img src="@/assets/BugTracker-big-img.jpg" alt="BugTracker" class="absolute top-1/2 -translate-y-1/2 w-full object-cover" />
    </div>
    <div class="flex w-full md:w-1/2 h-screen items-center justify-center p-8">
      <RouterView />
    </div>
  </div>
</template>
