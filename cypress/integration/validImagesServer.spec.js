const baseUrl = 'http://localhost:9000'

const assertWidthHeightPath = function (attr, attrValue, width, height, path) {
  cy.get(`img[${attr}="${attrValue}"]`).its('0.height').should('be.eq', height)
  cy.get(`img[${attr}="${attrValue}"]`).its('0.width').should('be.eq', width)
  cy.get(`img[${attr}="${attrValue}"]`).its('0.src').should('be.eq', baseUrl + path)
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