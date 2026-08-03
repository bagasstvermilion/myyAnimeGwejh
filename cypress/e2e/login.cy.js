describe("Login mobile & dekstop", () => {
  it("login dekstop with right credentials", () => {
    cy.viewport(1280, 800);
    cy.visit("/");
    cy.contains("Masuk").click();
    cy.get('input[type="email"]').type("tester@jp.com");
    cy.wait(200);
    cy.get('input[type="password"').type("12345678");
    cy.wait(200);
    cy.get('button[type="submit"]').click();
    cy.contains("[Tester] Tester1").should("be.visible");
  });

  it("login dekstop with wrong username", () => {
    cy.viewport(1280, 800);
    cy.visit("/");
    cy.contains("Masuk").click();
    cy.get('input[type="email"]').type("bsjadhbsh@jp.com");
    cy.wait(200);
    cy.get('input[type="password"]').type("12345678");
    cy.wait(200);
    cy.get('button[type="submit"]').click();
    cy.contains("Invalid login credentials").should("be.visible");
  });

  it("login dekstop with wrong password", () => {
    cy.viewport(1280, 800);
    cy.visit("/");
    cy.contains("Masuk").click();
    cy.get('input[type="email"]').type("test@jp.com");
    cy.wait(200);
    cy.get('input[type="password"]').type("87654321");
    cy.wait(200);
    cy.get('button[type="submit"]').click();
    cy.contains("Invalid login credentials").should("be.visible");
  });

  it("login mobile with right credentials", () => {
    cy.viewport(390, 844);
    cy.visit("/");
    cy.contains("Masuk").click();
    cy.get('input[type="email"]').type("tester@jp.com");
    cy.wait(200);
    cy.get('input[type="password"]').type("12345678");
    cy.wait(200);
    cy.get('button[type="submit"]').click();
    cy.contains("[Tester] Tester1").should("be.visible");
  });
});
