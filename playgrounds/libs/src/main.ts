import './assets/main.css'

import ui from '@nuxt/ui/vue-plugin'
import vuetify from './plugins/vuetify'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import { createApp } from 'vue'
import App from './App.vue'

createApp(App)
  .use(ui)
  .use(vuetify)
  .use(PrimeVue, {
    theme: {
      preset: Aura
    }
  })
  .mount('#app')
