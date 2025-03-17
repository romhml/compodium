<template>
  <div id="compodium-default-preview">
    <slot />
  </div>
</template>

<style>
html {
  background: var(--ui-bg, white);
}

html.dark {
  background: var(--ui-bg, oklch(0.21 0.006 285.885));
}

body {
  margin: 0;
  padding: 0;
}

#compodium-default-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px
}
</style>
