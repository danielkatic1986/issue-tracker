import { defineStore } from "pinia"
import { ref, computed } from "vue"

export const useIssuesStore = defineStore('issuesStore', () => {
    const nazivApp = 'Issue Tracker'

    function proba() {
        nazivApp = 'Issue Tracker promijenjeno'
    }

    return {
        nazivApp,
        proba
    }
}, {persist: true})