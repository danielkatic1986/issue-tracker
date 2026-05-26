import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import LoginView from '@/views/LoginView.vue'
import ZaboravljenaLozinkaView from '@/views/ZaboravljenaLozinkaView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import DashboardView from '@/views/DashboardView.vue'
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
      component: DashboardView
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

  if(to.meta.requiresAuth && !authStore.user) {
    return {path: '/login'}
  }
})

export default router
