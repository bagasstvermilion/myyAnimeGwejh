describe("debug character modal bio cleanup", () => {
  it("shows cleaned bio text", () => {
    cy.viewport(1280, 900);
    cy.visit("/anime/154587");
    cy.wait(1500);
    cy.contains("button", "Character").click();
    cy.wait(1000);
    cy.get('[class*="grid-cols-3"] button').first().click();
    cy.wait(500);
    cy.screenshot("character-modal-clean-bio", { capture: "viewport" });
  });
});
