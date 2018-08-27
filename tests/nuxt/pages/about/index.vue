<template>
  <section class="container">
    <h1>Hello from about</h1>

    <nuxt-link to="/">Go to home page</nuxt-link>

    <TestImages />

  </section>
</template>

<script>
import TestImages from '@/components/TestImages.vue'
export default {
  components: {
    TestImages
  },
  data () {
    return {}
  }
}
</script>

<style>
.container {
  min-height: 100vh;
  justify-content: center;
  align-items: center;
  text-align: center;
}

h1 {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; /* 1 */
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

h2 {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  margin-top: 15px;
}
</style>
