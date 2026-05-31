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
    {
      path: '/login',
      component: AuthLayout,
      children: [
        { path: '', component: LoginView },
        { path: '/zaboravljena-lozinka', component: ZaboravljenaLozinkaView }
      ]
    },
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
        { path: 'admin/korisnici', component: AdminKorisniciView, meta: { requiresAdmin: true } }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFoundView
    }
  ],
})

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
