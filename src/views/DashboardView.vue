<template>
  <div class="p-6 h-full flex flex-col gap-4">

    <div class="grid grid-cols-3 gap-4">

      <div class="bg-[#eceef7] rounded-2xl px-6 py-5">
        <p class="text-xs font-medium text-gray-400 mb-3">Problemi</p>
        <p class="text-3xl font-bold text-gray-800">{{ ucitavanje ? '—' : ukupnoProblema }}</p>
        <p class="text-xs text-gray-400 mt-1.5">{{ ucitavanje ? '' : `${otvoreniProblemi} otvorenih` }}</p>
      </div>

      <div class="bg-[#eceef7] rounded-2xl px-6 py-5">
        <p class="text-xs font-medium text-gray-400 mb-3">Riješeno</p>
        <p class="text-3xl font-bold text-gray-800">{{ ucitavanje ? '—' : ukupnoRjesenja }}</p>
        <p class="text-xs text-gray-400 mt-1.5">{{ ucitavanje ? '' : rjesenostLabel }}</p>
      </div>

      <div class="bg-[#eceef7] rounded-2xl px-6 py-5">
        <p class="text-xs font-medium text-gray-400 mb-3">Projekti</p>
        <p class="text-3xl font-bold text-gray-800">{{ ucitavanje ? '—' : projekti.length }}</p>
        <p class="text-xs text-gray-400 mt-1.5">{{ ucitavanje ? '' : `${aktivniProjekti} aktivnih` }}</p>
      </div>

    </div>

    <div class="flex gap-4 flex-1 min-h-0">

      <!-- stanje problema -->
      <div class="bg-white rounded-2xl p-5 flex flex-col flex-1 min-w-0">
        <h3 class="text-sm font-semibold text-gray-800 mb-5">Stanje problema</h3>

        <div v-if="ucitavanje" class="flex-1 flex items-center justify-center">
          <span class="text-xs text-gray-300">Učitavanje...</span>
        </div>

        <div v-else-if="ukupnoProblema === 0" class="flex-1 flex items-center justify-center">
          <p class="text-sm text-gray-300">Nema prijavljenih problema</p>
        </div>

        <div v-else class="flex flex-col justify-center flex-1 gap-5">
          <div class="flex rounded-full overflow-hidden h-2.5 bg-gray-100">
            <div v-if="otvoreniProblemi"   :style="{ width: pct(otvoreniProblemi) + '%' }"   class="bg-blue-400" />
            <div v-if="uTijekuProblemi"    :style="{ width: pct(uTijekuProblemi) + '%' }"    class="bg-amber-400" />
            <div v-if="ukupnoRjesenja"     :style="{ width: pct(ukupnoRjesenja) + '%' }"     class="bg-green-400" />
            <div v-if="zatvoreniProblemi"  :style="{ width: pct(zatvoreniProblemi) + '%' }"  class="bg-gray-300" />
          </div>

          <div class="space-y-3.5">
            <div v-for="row in statusReci" :key="row.label" class="flex items-center gap-3">
              <span :class="['w-2 h-2 rounded-full shrink-0', row.dot]" />
              <span class="text-xs text-gray-500 w-20 shrink-0">{{ row.label }}</span>
              <div class="flex-1 bg-gray-100 rounded-full h-1.5">
                <div
                  :class="['h-1.5 rounded-full transition-all duration-500', row.bar]"
                  :style="{ width: pct(row.count) + '%' }"
                />
              </div>
              <span class="text-xs font-semibold text-gray-700 w-6 text-right">{{ row.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- nedavni projekti -->
      <div class="bg-white rounded-2xl p-5 w-64 shrink-0 flex flex-col">
        <h3 class="text-sm font-semibold text-gray-800 mb-4">Nedavni projekti</h3>

        <div v-if="ucitavanje" class="flex-1 flex items-center justify-center">
          <span class="text-xs text-gray-300">Učitavanje...</span>
        </div>

        <div v-else-if="recentProjects.length === 0" class="flex-1 flex items-center justify-center">
          <span class="text-xs text-gray-300">Nema projekata</span>
        </div>

        <ul v-else class="space-y-3 flex-1">
          <li
            v-for="(p, i) in recentProjects"
            :key="p.id"
            class="flex items-center justify-between gap-3"
          >
            <span class="text-xs text-gray-700 font-medium truncate">{{ p.naziv }}</span>
            <div class="flex items-center gap-1 shrink-0">
              <span
                v-for="(bar, j) in BAR_SETS[i % BAR_SETS.length]"
                :key="j"
                :class="['h-1.5 rounded-full', bar.w, bar.color]"
              />
            </div>
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { dohvatiSveProjekte } from '@/services/projektService'
import { dohvatiSveProbleme, STATUSI_PROBLEMA } from '@/services/problemService'

const projekti          = ref([])
const ukupnoProblema    = ref(0)
const ukupnoRjesenja    = ref(0)
const otvoreniProblemi  = ref(0)
const uTijekuProblemi   = ref(0)
const zatvoreniProblemi = ref(0)
const aktivniProjekti   = ref(0)
const ucitavanje        = ref(true)

const recentProjects = computed(() => projekti.value.slice(0, 6))

const rjesenostLabel = computed(() => {
  if (!ukupnoProblema.value) return '0% riješenosti'
  return `${Math.round((ukupnoRjesenja.value / ukupnoProblema.value) * 100)}% riješenosti`
})

const statusReci = computed(() => [
  { label: 'Otvoreni',  count: otvoreniProblemi.value,  dot: 'bg-blue-400',  bar: 'bg-blue-400'  },
  { label: 'U tijeku',  count: uTijekuProblemi.value,   dot: 'bg-amber-400', bar: 'bg-amber-400' },
  { label: 'Riješeni',  count: ukupnoRjesenja.value,    dot: 'bg-green-400', bar: 'bg-green-400' },
  { label: 'Zatvoreni', count: zatvoreniProblemi.value,  dot: 'bg-gray-300',  bar: 'bg-gray-300'  },
])

function pct(count) {
  if (!ukupnoProblema.value) return 0
  return Math.round((count / ukupnoProblema.value) * 100)
}

const BAR_SETS = [
  [{ w: 'w-6', color: 'bg-gray-700' }, { w: 'w-8', color: 'bg-gray-300' }],
  [{ w: 'w-8', color: 'bg-gray-700' }, { w: 'w-10', color: 'bg-gray-400' }, { w: 'w-4', color: 'bg-gray-200' }],
  [{ w: 'w-4', color: 'bg-gray-600' }, { w: 'w-6', color: 'bg-gray-300' }],
  [{ w: 'w-10', color: 'bg-gray-700' }, { w: 'w-12', color: 'bg-gray-400' }, { w: 'w-6', color: 'bg-gray-200' }, { w: 'w-3', color: 'bg-gray-100' }],
  [{ w: 'w-5', color: 'bg-gray-500' }, { w: 'w-4', color: 'bg-gray-200' }],
  [{ w: 'w-7', color: 'bg-gray-600' }, { w: 'w-8', color: 'bg-gray-300' }, { w: 'w-5', color: 'bg-gray-200' }],
]

onMounted(async () => {
  try {
    const sviProjekti = await dohvatiSveProjekte()
    projekti.value = sviProjekti
    aktivniProjekti.value = sviProjekti.filter((p) => p.status === 'aktivan').length

    let total = 0, rjeseni = 0, otvoreni = 0, uTijeku = 0, zatvoreni = 0

    for (const projekt of sviProjekti) {
      const problemi = await dohvatiSveProbleme(projekt.id)
      for (const pr of problemi) {
        total++
        if      (pr.status === STATUSI_PROBLEMA.RIJEŠEN)  rjeseni++
        else if (pr.status === STATUSI_PROBLEMA.OTVOREN)  otvoreni++
        else if (pr.status === STATUSI_PROBLEMA.U_TIJEKU) uTijeku++
        else                                               zatvoreni++
      }
    }

    ukupnoProblema.value    = total
    ukupnoRjesenja.value    = rjeseni
    otvoreniProblemi.value  = otvoreni
    uTijekuProblemi.value   = uTijeku
    zatvoreniProblemi.value = zatvoreni
  } finally {
    ucitavanje.value = false
  }
})
</script>
