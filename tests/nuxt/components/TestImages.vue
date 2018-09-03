<template>
  <div>

    <nuxt-img src="https://www.reallifedigital.com/sites/default/files/fields/articles/images/dclon2017.jpg" image-style="medium" alt="Remote image" />

    <!-- Landscape image -->
    <h2>Original cat</h2>
    <p><nuxt-img src="/cat.jpg" alt="Original cat" class="test-static-class" data-thing="test-data-thing-static" style="text-align:center" /></p>
    <h2>Small cat using <code>image-style</code> prop</h2>
    <p><nuxt-img src="/cat.jpg" image-style="small" :alt="dataAlt" :class="dataClass" :data-thing="dataThing" :style="dataStyle" /></p>
    <h2>Medium cat using query string</h2>
    <p><nuxt-img src="/cat.jpg?style=medium" alt="Medium cat" /></p>
    <h2>Large cat using <code>image-style</code> prop</h2>
    <p><nuxt-img src="/cat.jpg" image-style="large" alt="Large cat" /></p>

    <!-- Portrait image -->
    <h2>Original eagle</h2>
    <p><nuxt-img src="/nested/deeply/eagle.jpg" alt="Original eagle" /></p>
    <h2>Small eagle using query string</h2>
    <p><nuxt-img src="/nested/deeply/eagle.jpg?style=small" alt="Small eagle" /></p>
    <h2>Medium eagle using <code>image-style</code> prop</h2>
    <p><nuxt-img src="/nested/deeply/eagle.jpg" image-style="medium" alt="Medium eagle" /></p>
    <h2>Large eagle using query string</h2>
    <p><nuxt-img src="/nested/deeply/eagle.jpg?style=large" alt="Large eagle" /></p>

    <h2>Invalid image style (original image)</h2>
    <p><nuxt-img src="/nested/deeply/eagle.jpg" image-style="nada" alt="Original eagle with invalid image style" /></p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      dataAlt: 'Small cat',
      dataClass: 'test-bound-class',
      dataThing: 'test-data-thing-bound',
      dataStyle: 'text-align:center'
    }
  }
}
</script>