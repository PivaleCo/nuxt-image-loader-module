const baseUrl = 'http://localhost:9001'

const assertWidthHeightPath = function (attr, attrValue, width, height, path) {
  cy.get(`img[${attr}="${attrValue}"]`).its('0.height').should('be.eq', height)
  cy.get(`img[${attr}="${attrValue}"]`).its('0.width').should('be.eq', width)
  cy.get(`img[${attr}="${attrValue}"]`).its('0.src').should('be.eq', path)
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