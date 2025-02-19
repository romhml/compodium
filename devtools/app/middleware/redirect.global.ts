export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/components') && to.path !== '/welcome') {
    return navigateTo('/components')
  }
})
