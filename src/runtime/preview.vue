<template>
  <div id="compodium-default-preview">
    <slot />
  </div>
</template>

<style>
body {
  margin: 0px;
}

#compodium-default-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  padding: 20px;
  background-color: transparent;

}
</style>
