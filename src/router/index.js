import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import LoginView from '@/views/LoginView.vue'
import ZaboravljenaLozinkaView from '@/views/ZaboravljenaLozinkaView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ProjektiView from '@/views/ProjektiView.vue'
import ProjektDetailView from '@/views/ProjektDetailView.vue'
import ProblemDetailView from '@/views/ProblemDetailView.vue'
import KorisnikView from '@/views/KorisnikView.vue'
import AdminKorisniciView from '@/views/AdminKorisniciView.vue'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Javne rute — dostupne bez prijave, prikazuju se unutar AuthLayouta (centrirani card)
    {
      path: '/login',
      component: AuthLayout,
      children: [
        { path: '', component: LoginView },
        { path: '/zaboravljena-lozinka', component: ZaboravljenaLozinkaView }
      ]
    },

    // Zaštićene rute — requiresAuth blokira neprijavljene korisnike u beforeEach guardu
    // Sve se prikazuju unutar DashboardLayouta (navigacija + sidebar)
    {
      path: '/',
      meta: { requiresAuth: true },
      component: DashboardLayout,
      children: [
        { path: '', component: DashboardView },
        { path: 'projekti', component: ProjektiView },
        { path: 'projekti/:projektId', component: ProjektDetailView },
        { path: 'projekti/:projektId/problemi/:problemId', component: ProblemDetailView },
        { path: 'korisnik', component: KorisnikView },
        // requiresAdmin dodatno blokira sve koji nisu administratori
        { path: 'admin/korisnici', component: AdminKorisniciView, meta: { requiresAdmin: true } }
      ]
    },

    // Catch-all ruta — prikazuje se za sve nepostojeće putanje
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFoundView
    }
  ],
})

// Navigation guard koji se izvodi prije svake navigacije.
// authStore.user je null dok Firebase ne završi inicijalizaciju (init() u App.vue),
// pa guard funkcionira tek nakon što je auth stanje poznato.
router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.user) {
    return { path: '/login' }
  }

  if (to.meta.requiresAdmin && !authStore.jeAdministrator) {
    return { path: '/' }
  }
})

export default router
