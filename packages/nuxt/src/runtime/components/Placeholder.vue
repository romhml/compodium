<template>
  <div class="placeholder">
    <svg
      class="placeholder-svg"
      fill="none"
    >
      <defs>
        <pattern
          id="pattern-5c1e4f0e-62d5-498b-8ff0-cf77bb448c8e"
          x="0"
          y="0"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path d="M-3 13 15-5M-5 5l18-18M-1 21 17 3" />
        </pattern>
      </defs>
      <rect
        stroke="none"
        fill="url(#pattern-5c1e4f0e-62d5-498b-8ff0-cf77bb448c8e)"
        width="100%"
        height="100%"
      />
    </svg>

    <slot />
  </div>
</template>

<style scoped>
.placeholder {
  position: relative;
  overflow: hidden;
  border-radius: var(--ui-radius, 0.375rem);
  border: 1px dashed var(--ui-border-accented, oklch(0.871 0.006 286.286));
  opacity: 0.75;
  padding-left: 1rem;
  padding-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark .placeholder {
  opacity: 0.75;
  border: 1px dashed var(--ui-border-accented, oklch(0.37 0.013 285.805));
}
</style>
