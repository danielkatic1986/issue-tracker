<template>
  <div class="h-full overflow-y-auto">
    <div class="p-6 flex flex-col gap-4">

      <div class="grid grid-cols-3 gap-4">
        <div class="bg-[#eceef7] dark:bg-gray-700 rounded-2xl px-6 py-5">
          <p class="text-xs font-medium text-gray-400 dark:text-gray-400 mb-3">Problemi</p>
          <p class="text-3xl font-bold text-gray-800 dark:text-gray-100">{{ ucitavanje ? '—' : ukupnoProblema }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-400 mt-1.5">{{ ucitavanje ? '' : `${otvoreniProblemi} otvorenih` }}</p>
        </div>
        <div class="bg-[#eceef7] dark:bg-gray-700 rounded-2xl px-6 py-5">
          <p class="text-xs font-medium text-gray-400 dark:text-gray-400 mb-3">Riješeno</p>
          <p class="text-3xl font-bold text-gray-800 dark:text-gray-100">{{ ucitavanje ? '—' : ukupnoRjesenja }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-400 mt-1.5">{{ ucitavanje ? '' : rjesenostLabel }}</p>
        </div>
        <div class="bg-[#eceef7] dark:bg-gray-700 rounded-2xl px-6 py-5">
          <p class="text-xs font-medium text-gray-400 dark:text-gray-400 mb-3">Projekti</p>
          <p class="text-3xl font-bold text-gray-800 dark:text-gray-100">{{ ucitavanje ? '—' : projekti.length }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-400 mt-1.5">{{ ucitavanje ? '' : `${aktivniProjekti} aktivnih` }}</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Stanje problema</h3>
          <div v-if="ucitavanje" class="py-8 flex items-center justify-center">
            <span class="text-xs text-gray-300 dark:text-gray-600">Učitavanje...</span>
          </div>
          <div v-else-if="ukupnoProblema === 0" class="py-8 flex items-center justify-center">
            <p class="text-sm text-gray-300 dark:text-gray-600">Nema prijavljenih problema</p>
          </div>
          <div v-else class="space-y-4">
            <div class="flex rounded-full overflow-hidden h-2.5 bg-gray-100 dark:bg-gray-600">
              <div v-if="otvoreniProblemi"   :style="{ width: pct(otvoreniProblemi) + '%' }"   class="bg-blue-400" />
              <div v-if="uTijekuProblemi"    :style="{ width: pct(uTijekuProblemi) + '%' }"    class="bg-amber-400" />
              <div v-if="ukupnoRjesenja"     :style="{ width: pct(ukupnoRjesenja) + '%' }"     class="bg-green-400" />
              <div v-if="zatvoreniProblemi"  :style="{ width: pct(zatvoreniProblemi) + '%' }"  class="bg-gray-300" />
            </div>
            <div class="space-y-3">
              <div v-for="row in statusReci" :key="row.label" class="flex items-center gap-3">
                <span :class="['w-2 h-2 rounded-full shrink-0', row.dot]" />
                <span class="text-xs text-gray-500 dark:text-gray-400 w-20 shrink-0">{{ row.label }}</span>
                <div class="flex-1 bg-gray-100 dark:bg-gray-600 rounded-full h-1.5">
                  <div :class="['h-1.5 rounded-full transition-all duration-500', row.bar]" :style="{ width: pct(row.count) + '%' }" />
                </div>
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-200 w-6 text-right">{{ row.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Prioriteti</h3>
          <div v-if="ucitavanje" class="py-8 flex items-center justify-center">
            <span class="text-xs text-gray-300 dark:text-gray-600">Učitavanje...</span>
          </div>
          <div v-else-if="ukupnoProblema === 0" class="py-8 flex items-center justify-center">
            <p class="text-sm text-gray-300 dark:text-gray-600">Nema prijavljenih problema</p>
          </div>
          <div v-else class="space-y-4">
            <div class="flex rounded-full overflow-hidden h-2.5 bg-gray-100 dark:bg-gray-600">
              <div v-if="nizakProblemi"    :style="{ width: pct(nizakProblemi) + '%' }"    class="bg-gray-400" />
              <div v-if="srednjiProblemi"  :style="{ width: pct(srednjiProblemi) + '%' }"  class="bg-blue-400" />
              <div v-if="visokiProblemi"   :style="{ width: pct(visokiProblemi) + '%' }"   class="bg-orange-400" />
              <div v-if="kriticniProblemi" :style="{ width: pct(kriticniProblemi) + '%' }" class="bg-red-400" />
            </div>
            <div class="space-y-3">
              <div v-for="row in prioritetReci" :key="row.label" class="flex items-center gap-3">
                <span :class="['w-2 h-2 rounded-full shrink-0', row.dot]" />
                <span class="text-xs text-gray-500 dark:text-gray-400 w-20 shrink-0">{{ row.label }}</span>
                <div class="flex-1 bg-gray-100 dark:bg-gray-600 rounded-full h-1.5">
                  <div :class="['h-1.5 rounded-full transition-all duration-500', row.bar]" :style="{ width: pct(row.count) + '%' }" />
                </div>
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-200 w-6 text-right">{{ row.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Nedavni problemi</h3>
          <div v-if="ucitavanje" class="py-8 flex items-center justify-center">
            <span class="text-xs text-gray-300 dark:text-gray-600">Učitavanje...</span>
          </div>
          <div v-else-if="nedavniProblemi.length === 0" class="py-8 flex items-center justify-center">
            <span class="text-xs text-gray-300 dark:text-gray-600">Nema prijavljenih problema</span>
          </div>
          <ul v-else class="space-y-1">
            <li v-for="p in nedavniProblemi" :key="p.id">
              <RouterLink
                :to="`/projekti/${p.projektId}/problemi/${p.id}`"
                class="flex flex-col gap-0.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              >
                <span class="text-xs font-medium text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {{ p.naslov }}
                </span>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ p.projektNaziv }}</span>
                  <span :class="['text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0', statusBoja(p.status)]">
                    {{ p.status }}
                  </span>
                </div>
              </RouterLink>
            </li>
          </ul>
        </div>

      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl p-5">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Pregled projekata</h3>

        <div v-if="ucitavanje" class="py-6 flex items-center justify-center">
          <span class="text-xs text-gray-300 dark:text-gray-600">Učitavanje...</span>
        </div>

        <div v-else-if="projektStats.length === 0" class="py-6 flex items-center justify-center">
          <span class="text-xs text-gray-300 dark:text-gray-600">Nema projekata</span>
        </div>

        <div v-else>
          <div class="grid grid-cols-[1fr_60px_80px_80px_80px_120px] gap-4 px-3 mb-2">
            <span class="text-xs text-gray-400 dark:text-gray-500 font-medium">Projekt</span>
            <span class="text-xs text-gray-400 dark:text-gray-500 font-medium text-center">Ukupno</span>
            <span class="text-xs text-gray-400 dark:text-gray-500 font-medium text-center">Otvoreni</span>
            <span class="text-xs text-gray-400 dark:text-gray-500 font-medium text-center">U tijeku</span>
            <span class="text-xs text-gray-400 dark:text-gray-500 font-medium text-center">Riješeni</span>
            <span class="text-xs text-gray-400 dark:text-gray-500 font-medium text-center">Riješenost</span>
          </div>

          <div class="space-y-1">
            <RouterLink
              v-for="ps in projektStats"
              :key="ps.id"
              :to="`/projekti/${ps.id}`"
              class="grid grid-cols-[1fr_60px_80px_80px_80px_120px] gap-4 items-center px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <div class="min-w-0">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {{ ps.naziv }}
                </span>
                <span :class="['text-[10px] font-medium', ps.status === 'aktivan' ? 'text-green-500' : 'text-gray-400 dark:text-gray-500']">
                  {{ ps.status }}
                </span>
              </div>
              <span class="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center">{{ ps.ukupno }}</span>
              <div class="flex justify-center">
                <span v-if="ps.otvoreni" class="text-xs font-medium bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  {{ ps.otvoreni }}
                </span>
                <span v-else class="text-xs text-gray-300 dark:text-gray-600">—</span>
              </div>
              <div class="flex justify-center">
                <span v-if="ps.uTijeku" class="text-xs font-medium bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                  {{ ps.uTijeku }}
                </span>
                <span v-else class="text-xs text-gray-300 dark:text-gray-600">—</span>
              </div>
              <div class="flex justify-center">
                <span v-if="ps.rjeseni" class="text-xs font-medium bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                  {{ ps.rjeseni }}
                </span>
                <span v-else class="text-xs text-gray-300 dark:text-gray-600">—</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-gray-100 dark:bg-gray-600 rounded-full h-1.5">
                  <div
                    class="h-1.5 rounded-full bg-green-400 transition-all duration-500"
                    :style="{ width: ps.pct + '%' }"
                  />
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400 w-8 text-right shrink-0">{{ ps.pct }}%</span>
              </div>
            </RouterLink>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { dohvatiSveProjekte } from '@/services/projektService'
import { dohvatiSveProbleme, STATUSI_PROBLEMA, PRIORITETI } from '@/services/problemService'

const projekti          = ref([])
const sviProblemi       = ref([])
const ukupnoProblema    = ref(0)
const ukupnoRjesenja    = ref(0)
const otvoreniProblemi  = ref(0)
const uTijekuProblemi   = ref(0)
const zatvoreniProblemi = ref(0)
const aktivniProjekti   = ref(0)
const nizakProblemi     = ref(0)
const srednjiProblemi   = ref(0)
const visokiProblemi    = ref(0)
const kriticniProblemi  = ref(0)
const nedavniProblemi   = ref([])
const ucitavanje        = ref(true)

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

const prioritetReci = computed(() => [
  { label: 'Nizak',    count: nizakProblemi.value,    dot: 'bg-gray-400',   bar: 'bg-gray-400'   },
  { label: 'Srednji',  count: srednjiProblemi.value,  dot: 'bg-blue-400',   bar: 'bg-blue-400'   },
  { label: 'Visok',    count: visokiProblemi.value,   dot: 'bg-orange-400', bar: 'bg-orange-400' },
  { label: 'Kritičan', count: kriticniProblemi.value, dot: 'bg-red-400',    bar: 'bg-red-400'    },
])

const projektStats = computed(() =>
  projekti.value.map(p => {
    const pp = sviProblemi.value.filter(pr => pr.projektId === p.id)
    const ukupno  = pp.length
    const otvoreni = pp.filter(pr => pr.status === STATUSI_PROBLEMA.OTVOREN).length
    const uTijeku  = pp.filter(pr => pr.status === STATUSI_PROBLEMA.U_TIJEKU).length
    const rjeseni  = pp.filter(pr => pr.status === STATUSI_PROBLEMA.RIJEŠEN).length
    const pct      = ukupno ? Math.round((rjeseni / ukupno) * 100) : 0
    return { ...p, ukupno, otvoreni, uTijeku, rjeseni, pct }
  })
)

function pct(count) {
  if (!ukupnoProblema.value) return 0
  return Math.round((count / ukupnoProblema.value) * 100)
}

function statusBoja(status) {
  switch (status) {
    case STATUSI_PROBLEMA.OTVOREN:  return 'bg-blue-100 text-blue-600'
    case STATUSI_PROBLEMA.U_TIJEKU: return 'bg-amber-100 text-amber-600'
    case STATUSI_PROBLEMA.RIJEŠEN:  return 'bg-green-100 text-green-600'
    case STATUSI_PROBLEMA.ZATVOREN: return 'bg-gray-100 text-gray-500'
    default:                        return 'bg-red-100 text-red-500'
  }
}

onMounted(async () => {
  try {
    const sviProjekti = await dohvatiSveProjekte()
    projekti.value = sviProjekti
    aktivniProjekti.value = sviProjekti.filter((p) => p.status === 'aktivan').length

    let total = 0, rjeseni = 0, otvoreni = 0, uTijeku = 0, zatvoreni = 0
    let nizak = 0, srednji = 0, visok = 0, kritican = 0
    const sakupljeni = []

    for (const projekt of sviProjekti) {
      const problemi = await dohvatiSveProbleme(projekt.id)
      for (const pr of problemi) {
        total++
        if      (pr.status === STATUSI_PROBLEMA.RIJEŠEN)  rjeseni++
        else if (pr.status === STATUSI_PROBLEMA.OTVOREN)  otvoreni++
        else if (pr.status === STATUSI_PROBLEMA.U_TIJEKU) uTijeku++
        else                                               zatvoreni++

        if      (pr.prioritet === PRIORITETI.NIZAK)    nizak++
        else if (pr.prioritet === PRIORITETI.SREDNJI)   srednji++
        else if (pr.prioritet === PRIORITETI.VISOK)     visok++
        else if (pr.prioritet === PRIORITETI.KRITICAN)  kritican++

        sakupljeni.push({ ...pr, projektNaziv: projekt.naziv })
      }
    }

    sviProblemi.value       = sakupljeni
    ukupnoProblema.value    = total
    ukupnoRjesenja.value    = rjeseni
    otvoreniProblemi.value  = otvoreni
    uTijekuProblemi.value   = uTijeku
    zatvoreniProblemi.value = zatvoreni
    nizakProblemi.value     = nizak
    srednjiProblemi.value   = srednji
    visokiProblemi.value    = visok
    kriticniProblemi.value  = kritican

    nedavniProblemi.value = sakupljeni
      .sort((a, b) => (b.datumPrijave?.seconds ?? 0) - (a.datumPrijave?.seconds ?? 0))
      .slice(0, 6)
  } finally {
    ucitavanje.value = false
  }
})
</script>
