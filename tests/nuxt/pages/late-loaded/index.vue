<template>
  <section class="container">
    <h1>Late loaded images</h1>

    <nuxt-link to="/">Go to home page</nuxt-link>

    <p><nuxt-img :src="src" image-style="medium" :alt="dataAlt" /></p>

  </section>
</template>

<script>
import TestImages from '@/components/TestImages.vue'
export default {
  components: {
    TestImages
  },
  data () {
    return {
      dataAlt: `How do you like those apples`,
      src: '' // Not loaded immediately.
    }
  },
  mounted () {
    // Delay populating image source into <nuxt-img>.
    // /apples.jpg should resolve to ../../image-styles/apples--medium.jpg
    setTimeout(() => {
      this.src = '/apples.jpg'
    }, 1000)
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
