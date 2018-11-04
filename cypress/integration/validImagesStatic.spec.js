const baseUrl = 'http://localhost:9001'
const imageStylesPath = baseUrl + '/image-styles/'

const assertWidthHeightPath = function (attr, attrValue, width, height, path) {
  cy.get(`img[${attr}="${attrValue}"]`).then(img => {
    cy.wrap(img).its('0.height').should('be.eq', height)
    cy.wrap(img).its('0.width').should('be.eq', width)
    cy.wrap(img).its('0.src').should('be.eq', path)
  })
}

const checkAllImages = function () {
  assertWidthHeightPath('alt', 'Original cat', 467, 700, `${imageStylesPath}cat.jpg`)
  assertWidthHeightPath('alt', 'Small cat', 160, 90, `${imageStylesPath}cat--small.jpg`)
  assertWidthHeightPath('alt', 'Medium cat', 320, 180, `${imageStylesPath}cat--medium.jpg`)
  assertWidthHeightPath('alt', 'Large cat', 640, 360, `${imageStylesPath}cat--large.jpg`)

  assertWidthHeightPath('alt', 'Original eagle', 900, 549, `${imageStylesPath}nested/deeply/eagle.jpg`)
  assertWidthHeightPath('alt', 'Small eagle', 160, 90, `${imageStylesPath}nested/deeply/eagle--small.jpg`)
  assertWidthHeightPath('alt', 'Medium eagle', 320, 180, `${imageStylesPath}nested/deeply/eagle--medium.jpg`)
  // Invalid image style 'nada' is stripped off the URL because it's not valid.
  assertWidthHeightPath('alt', 'Original eagle with invalid image style', 900, 549, `${imageStylesPath}nested/deeply/eagle.jpg`)

  // Check arbitrary and standard attributes pass through unaltered by the
  // <nuxt-img> component when *not* bound to data attributes.
  cy.get(`img[alt="Original cat"]`).then(img => {
    cy.wrap(img).its('0.classList').should('has', 'test-static-class')
    cy.wrap(img).its('0.alt').should('be.eq', 'Original cat')
    cy.wrap(img).its('0.attributes.data-thing.value').should('be.eq', 'test-data-thing-static')
    cy.wrap(img).its('0.attributes.style.value').should('be.eq', 'text-align:center')
  })

  // Check arbitrary and standard attributes pass through unaltered by the
  // <nuxt-img> component when bound to data attributes.
  cy.get(`img[alt="Small cat"]`).then(img => {
    cy.wrap(img).its('0.classList').should('has', 'test-bound-class')
    cy.wrap(img).its('0.alt').should('be.eq', 'Small cat')
    cy.wrap(img).its('0.attributes.data-thing.value').should('be.eq', 'test-data-thing-bound')
    cy.wrap(img).its('0.attributes.style.value').should('be.eq', 'text-align:center')
  })
}

describe('Original and processing images load', function() {
  it('Shows correct images on the index page via server based request', function() {
    cy.visit(`${baseUrl}/index.html`)
    checkAllImages()
  })
  it('Shows correct images on the about page when navigating via client router redirection', function() {
    cy.get('a[href="/about"]').click()
    checkAllImages()
  })
  it('Shows correct images on the about page via server based request', function() {
    cy.visit(`${baseUrl}/about`)
    checkAllImages()
  })
})

describe('Late loaded images can be force generated in nuxt module config', function() {
  it('Loads apples image after dynamically loading it 1 second after page loads', function() {
    cy.visit(`${baseUrl}/late-loaded`)
    const imageStylesPath = baseUrl + '/image-styles/'
    assertWidthHeightPath('alt', `How do you like those apples`, 320, 180, `${imageStylesPath}apples--medium.jpg`)
  })
})

describe('Image headers are correct', function() {
  it('Should contain images with Cache-Control headers', function() {
    const imageUrls = [
      `${imageStylesPath}cat.jpg`,
      `${imageStylesPath}cat--small.jpg`,
      `${imageStylesPath}cat--medium.jpg`,
      `${imageStylesPath}cat--large.jpg`,
      `${imageStylesPath}nested/deeply/eagle.jpg`,
      `${imageStylesPath}nested/deeply/eagle--small.jpg`,
      `${imageStylesPath}nested/deeply/eagle--medium.jpg`,
    ]
    imageUrls.forEach(image => {
      cy.request(image).then(response => {
        expect(response.status).to.eq(200)
        expect(response.headers).to.have.property('cache-control')
        // The test scaffold for serving statically uses the http-server module
        // which defaults to 3600 for the cache expiry time.
        expect(response.headers['cache-control']).to.eq('max-age=3600')
      })
    })
  })
  it('Should return a 404 response when an image is not found', function () {
    const invalidImageUrls = [
      `${imageStylesPath}cat-not-here.jpg`
    ]

    invalidImageUrls.forEach(imageUrl => {
      cy.request({
        url: imageUrl,
        failOnStatusCode: false
      }).then(response => {
        expect(response.status).to.eq(404)
      })
    })
  })
})