<script setup lang="ts">
import JsonEditorVue from 'json-editor-vue'
import { Mode } from 'vanilla-jsoneditor'

defineProps<{
  readonly?: boolean
}>()

const modelValue = defineModel<Record<string, any>>({ default: () => {} })

watch(modelValue, () => jsonValue.value = modelValue.value)

const jsonValue = shallowRef(modelValue.value)

watch(jsonValue, (value) => {
  if (value && typeof value === 'object') {
    modelValue.value = value
  }
})
</script>

<template>
  <div class="json-editor">
    <JsonEditorVue
      ref="editor"
      v-model="jsonValue"
      class="h-full w-full"
      :mode="Mode.text"
      :stringified="false"
      :main-menu-bar="false"
      :status-bar="false"
      :indentation="2"
      :tab-size="2"
      :read-only="readonly"
    />
  </div>
</template>

<style>
.json-editor {
  --jse-font-familly: var(--font-sans);
  --jse-font-familly-mono: var(--font-mono);

  --jse-error-color: var(--ui-error);
  --jse-warning-color: var(--ui-warning);
  --jse-info-color: var(--ui-info);

  /* over all fonts, sizes, and colors */
  --jse-theme-color: var(--ui-primary);
  --jse-theme-color-highlight: var(--ui-primary);
  --jse-background-color: rgba(var(--ui-bg-elevated), 0.5);
  --jse-text-color: var(--ui-text);
  --jse-text-color-inverse: var(--ui-text-inverted);

  /* main, menu, modal */
  --jse-main-border: 0;
  --jse-menu-color: var(--ui-bg-inverted);
  --jse-modal-background: var(--ui-bg-muted);
  --jse-modal-overlay-background: rgba(0, 0, 0, 0.5);
  --jse-modal-code-background: var(--ui-bg-muted);

  /* tooltip in text mode */
  --jse-tooltip-color: var(--jse-text-color);
  --jse-tooltip-background: var(--ui-bg-accented);
  --jse-tooltip-border: 1px solid var(--ui-border-accented);
  --jse-tooltip-action-button-color: inherit;
  --jse-tooltip-action-button-background: var(--ui-border-accented);

  /* panels: navigation bar, gutter, search box */
  --jse-panel-background: var(--ui-bg-muted);
  --jse-panel-background-border: 1px solid var(--ui-border);
  --jse-panel-color: var(--jse-text-color);
  --jse-panel-color-readonly: var(--ui-text-dimmed);
  --jse-panel-border: 1px solid var(--ui-border);
  --jse-panel-button-color-highlight: var(--ui-bg-inverted);
  --jse-panel-button-background-highlight: var(--ui-border);

  /* navigation-bar */
  --jse-navigation-bar-background: var(--ui-bg-accented);
  --jse-navigation-bar-background-highlight: var(--ui-bg-elevated);
  --jse-navigation-bar-dropdown-color: var(--jse-text-color);

  /* context menu */
  --jse-context-menu-background: var(--ui-bg-accented);
  --jse-context-menu-background-highlight: var(--ui-bg-elevated);
  --jse-context-menu-separator-color: var(--ui-border);
  --jse-context-menu-color: var(--jse-text-color);
  --jse-context-menu-pointer-background: var(--ui-border);
  --jse-context-menu-pointer-background-highlight: var(--ui-border-accented);
  --jse-context-menu-pointer-color: var(--jse-context-menu-color);

  /* contents: json key and values */
  --jse-key-color: #9C3EDA; /* Key color */
  --jse-value-color: #91B859; /* Default value color */
  --jse-value-color-number: #F76D47; /* Number value color */
  --jse-value-color-boolean: #39ADB5; /* Boolean value color */
  --jse-value-color-null: #39ADB5; /* Null value color */
  --jse-value-color-string: #91B859; /* String value color */
  --jse-delimiter-color: #39ADB5; /* Delimiter color */
  --jse-value-color-url: #39ADB5; /* URL value color */

  --jse-edit-outline: 2px solid var(--jse-text-color);

  /* contents: selected or hovered */
  --jse-selection-background-color: var(--ui-bg-accented);
  --jse-selection-background-inactive-color: var(--ui-bg-muted);
  --jse-hover-background-color: var(--ui-bg-muted);
  --jse-active-line-background-color: rgba(255, 255, 255, 0.06);
  --jse-search-match-background-color: var(--ui-bg-muted);

  /* contents: section of collapsed items in an array */
  --jse-collapsed-items-background-color: var(--ui-bg-muted);
  --jse-collapsed-items-selected-background-color: var(--ui-bg-accented);
  --jse-collapsed-items-link-color: var(--ui-text-dimmed);
  --jse-collapsed-items-link-color-highlight: var(--ui-text-toned);

  /* contents: highlighting of search results */
  --jse-search-match-color: var(--ui-text-toned);
  --jse-search-match-outline: 1px solid var(--ui-text-toned);
  --jse-search-match-active-color: var(--ui-text-highlighted);
  --jse-search-match-active-outline: 1px solid var(--ui-text-highlighted);

  /* contents: inline tags inside the JSON document */
  --jse-tag-background: var(--ui-bg-accented);
  --jse-tag-color: var(--ui-text-dimmed);

  /* contents: table */
  --jse-table-header-background: var(--ui-bg-muted);
  --jse-table-header-background-highlight: var(--ui-bg-accented);
  --jse-table-row-odd-background: rgba(255, 255, 255, 0.1);

  /* controls in modals: inputs, buttons, and `a` */
  --jse-input-background: var(--ui-bg-accented);
  --jse-input-border: var(--jse-main-border);
  --jse-button-background: var(--ui-border);
  --jse-button-background-highlight: var(--ui-border-accented);
  --jse-button-color: var(--ui-bg-inverted);
  --jse-button-secondary-background: var(--ui-bg-accented);
  --jse-button-secondary-background-highlight: var(--ui-bg-elevated);
  --jse-button-secondary-background-disabled: var(--ui-border);
  --jse-button-secondary-color: var(--jse-text-color);
  --jse-a-color: var(--ui-text-toned);
  --jse-a-color-highlight: var(--ui-text-highlighted);

  /* svelte-select */
  --jse-svelte-select-background: var(--ui-bg-accented);
  --jse-svelte-select-border: 1px solid var(--ui-border);
  --list-background: var(--ui-bg-accented);
  --item-hover-bg: var(--ui-bg-elevated);
  --multi-item-bg: var(--ui-bg-accented);
  --input-color: var(--ui-text-dimmed);
  --multi-clear-bg: var(--ui-border);
  --multi-item-clear-icon-color: var(--ui-text-dimmed);
  --multi-item-outline: 1px solid var(--ui-border);
  --list-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.4);

  /* color picker */
  --jse-color-picker-background: var(--ui-bg-accented);
  --jse-color-picker-border-box-shadow: var(--ui-border) 0 0 0 1px;
}

.dark .json-editor {
  /* contents: json key and values */
  --jse-key-color: #C792EA; /* Key color */
  --jse-value-color: #C3E88D; /* Default value color */
  --jse-value-color-number: #F78C6C; /* Number value color */
  --jse-value-color-boolean: #89DDFF; /* Boolean value color */
  --jse-value-color-null: #F78C6C; /* Null value color */
  --jse-value-color-string: #C3E88D; /* String value color */
  --jse-value-color-url: #89DDFF; /* URL value color */
  --jse-delimiter-color: #89DDFF; /* Delimiter color */
}

.json-editor .cm-gutters {
  visibility: hidden;
  width: 0px;
}

.json-editor .cm-gutter-lint {
  width: 0px;
}

.json-editor .cm-gutter {
  visibility: hidden;
  width: 0px;
}
</style>
