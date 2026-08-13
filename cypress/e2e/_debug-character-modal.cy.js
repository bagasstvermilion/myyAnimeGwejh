describe("debug character modal", () => {
  it("opens character modal on card click", () => {
    cy.viewport(1280, 900);
    cy.visit("/anime/16498");
    cy.wait(1500);
    cy.contains("button", "Character").click();
    cy.wait(1000);
    cy.screenshot("character-tab", { capture: "viewport" });
    cy.get('[class*="grid-cols-3"] button').first().click();
    cy.wait(500);
    cy.screenshot("character-modal-open", { capture: "viewport" });
  });
});
