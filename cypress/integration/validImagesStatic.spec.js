const baseUrl = 'http://localhost:9001'

const assertWidthHeightPath = function (attr, attrValue, width, height, path) {
  cy.get(`img[${attr}="${attrValue}"]`).then(img => {
    cy.wrap(img).its('0.height').should('be', height)
    cy.wrap(img).its('0.width').should('be', width)
    cy.wrap(img).its('0.src').should('be', path)
  })
}

const checkAllImages = function () {
  const imageStylesPath = baseUrl + '/image-styles/'
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