const baseUrl = 'http://localhost:9000'

const assertWidthHeightPath = function (attr, attrValue, width, height, path) {
  cy.get(`img[${attr}="${attrValue}"]`).then(img => {
    cy.wrap(img).its('0.height').should('be', height)
    cy.wrap(img).its('0.width').should('be', width)
    cy.wrap(img).its('0.src').should('be', baseUrl + path)
  })
}

const checkAllImages = function () {
  assertWidthHeightPath('alt', 'Original cat', 467, 700, '/cat.jpg')
  assertWidthHeightPath('alt', 'Small cat', 160, 90, '/cat.jpg?style=small')
  assertWidthHeightPath('alt', 'Medium cat', 320, 180, '/cat.jpg?style=medium')
  assertWidthHeightPath('alt', 'Large cat', 640, 360, '/cat.jpg?style=large')

  assertWidthHeightPath('alt', 'Original eagle', 900, 549, '/nested/deeply/eagle.jpg')
  assertWidthHeightPath('alt', 'Small eagle', 160, 90, '/nested/deeply/eagle.jpg?style=small')
  assertWidthHeightPath('alt', 'Medium eagle', 320, 180, '/nested/deeply/eagle.jpg?style=medium')
  // Invalid image style 'nada' is stripped off the URL because it's not valid.
  assertWidthHeightPath('alt', 'Original eagle with invalid image style', 900, 549, '/nested/deeply/eagle.jpg')

  // Check arbitrary and standard attributes pass through unaltered by the
  // <nuxt-img> component when *not* bound to data attributes.
  cy.get(`img[alt="Original cat"]`).then(img => {
    cy.wrap(img).its('0.classList').should('has', 'test-static-class')
    cy.wrap(img).its('0.alt').should('be', 'Original cat')
    cy.wrap(img).its('0.attributes.data-thing.value').should('be', 'test-data-thing-static')
    cy.wrap(img).its('0.attributes.style.value').should('be', 'text-align:center;')
  })

  // Check arbitrary and standard attributes pass through unaltered by the
  // <nuxt-img> component when bound to data attributes.
  cy.get(`img[alt="Small cat"]`).then(img => {
    cy.wrap(img).its('0.classList').should('has', 'test-bound-class')
    cy.wrap(img).its('0.alt').should('be', 'Small cat')
    cy.wrap(img).its('0.attributes.data-thing.value').should('be', 'test-data-thing-bound')
    cy.wrap(img).its('0.attributes.style.value').should('be', 'text-align:center;')
  })
}

describe('Original and processing images load', function() {
  it('Shows correct images on the index page via server based request', function() {
    cy.visit(`${baseUrl}/`)
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

describe('Image headers are correct', function() {
  it('Should contain images with Cache-Control headers', function() {
    const imageUrls = [
      `${baseUrl}/cat.jpg`,
      `${baseUrl}/cat.jpg?style=small`,
      `${baseUrl}/cat.jpg?style=medium`,
      `${baseUrl}/cat.jpg?style=large`,
    ]
    const requests = imageUrls.forEach(image => {
      cy.request(image).then(response => {
        expect(response.status).to.eq(200)
        expect(response.headers).to.have.property('cache-control')
        // The nuxt test instance passes 'Cache-Control': 'max-age=7200' in the
        // imagesHeaders options.
        expect(response.headers['cache-control']).to.eq('max-age=7200')
      })
    })
  })

  it('Should return a 404 response when an image is not found', function () {
    const invalidImageUrls = [
      `${baseUrl}/cat-not-here.jpg`,
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

describe('Responsive images load as expected', function() {
  it("Loads the chickens image in 3 different image style sizes based on the 'thumb' responsiveStyle definition", function () {
    cy.visit(`${baseUrl}/responsive-images`)
    cy.get(`img[alt="Chickens"]`).then(img => {
      expect(img[0].srcset).to.eq('/chickens.jpg?style=small 160w, /chickens.jpg?style=medium 320w, /chickens.jpg?style=large 640w')
      expect(img[0].sizes).to.eq('(min-width: 1280px) 100vw, 50vw')
    })
  })
})