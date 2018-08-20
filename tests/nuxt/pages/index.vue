<template>
  <section class="container">
    <h1>Hello</h1>

    <h2>Original cat</h2>
    <p><img src="/cat.jpg" alt="Original cat" /></p>
    <h2>Small cat</h2>
    <p><img src="/cat.jpg?style=small" alt="Original cat" /></p>
    <h2>Medium cat</h2>
    <p><img src="/cat.jpg?style=medium" alt="Medium cat" /></p>
    <h2>Large cat</h2>
    <p><img src="/cat.jpg?style=large" alt="Large cat" /></p>

    <h2>Original eagle</h2>
    <p><img src="/nested/deeply/eagle.jpg" alt="Original eagle" /></p>
    <h2>Small eagle</h2>
    <p><img src="/nested/deeply/eagle.jpg?style=small" alt="Small eagle" /></p>
    <h2>Medium eagle</h2>
    <p><img src="/nested/deeply/eagle.jpg?style=medium" alt="Medium eagle" /></p>
    <h2>Large eagle</h2>
    <p><img src="/nested/deeply/eagle.jpg?style=large" alt="Large eagle" /></p>

    <h2>Invalid image style (original image)</h2>
    <p><img src="/nested/deeply/eagle.jpg?style=nada" alt="Original eagle" /></p>

  </section>
</template>

<script>
  export default {
    data () {
      return {}
    },
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
