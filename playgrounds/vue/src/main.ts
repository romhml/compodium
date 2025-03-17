import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'

import App from './App.vue'
import './assets/main.css'

const app = createApp(App)

app.use(ui)

app.mount('#app')
