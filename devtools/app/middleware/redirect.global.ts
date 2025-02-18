export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/components')) {
    return navigateTo('/components')
  }
})
