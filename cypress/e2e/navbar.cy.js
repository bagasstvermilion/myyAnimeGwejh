describe("Navbar & Sidebar", () => {
  it("shows the desktop nav links on wide viewports", () => {
    cy.viewport(1280, 800);
    cy.visit("/");
    cy.contains("a", "Browse").should("be.visible");
    cy.contains("a", "My List").should("be.visible");
  });

  it("opens the mobile sidebar and navigates to Browse", () => {
    cy.viewport(390, 844);
    cy.visit("/");
    cy.get('button[aria-label="Buka menu"]').click();
    cy.get('[data-cy="mobile-nav-sidebar"]').contains("a", "Browse").click();
    cy.url().should("include", "/browse");
  });

  it("opens the mobile sidebar and navigates to My List", () => {
    cy.viewport(390, 844);
    cy.visit("/");
    cy.get('button[aria-label="Buka menu"]').click();
    cy.get('[data-cy="mobile-nav-sidebar"]').contains("a", "My List").click();
    cy.url().should("include", "/my-list");
  });
});
