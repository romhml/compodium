import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'

import App from './App.vue'
import './assets/main.css'
import { createRouter, createWebHashHistory } from 'vue-router'

const app = createApp(App)

const router = createRouter({
  history: createWebHashHistory(),
  routes: []
})

app.use(router)
app.use(ui)

app.mount('#app')
