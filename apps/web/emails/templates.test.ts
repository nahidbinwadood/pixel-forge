import { describe, expect, it } from "vitest";
import {
  exportReadyTemplate,
  lowCreditsTemplate,
  magicLinkTemplate,
  resetPasswordTemplate,
  verifyEmailTemplate,
  welcomeTemplate,
} from "./templates";

const URL = "https://app.example.com/verify?token=abc";

describe("email templates", () => {
  it("link templates embed the url in both the html button and the text fallback", () => {
    for (const template of [verifyEmailTemplate(URL), magicLinkTemplate(URL), resetPasswordTemplate(URL)]) {
      expect(template.html).toContain(URL);
      expect(template.text).toContain(URL);
      expect(template.html.startsWith("<!DOCTYPE html>")).toBe(true);
      expect(template.subject.length).toBeGreaterThan(0);
    }
  });

  it("welcome greets by first name when given one, and falls back otherwise", () => {
    expect(welcomeTemplate("Ada Lovelace").html).toContain("Welcome, Ada!");
    expect(welcomeTemplate(null).html).toContain("Welcome!");
  });

  it("low-credits mentions the exact balance, singular vs plural", () => {
    expect(lowCreditsTemplate(1).text).toContain("1 credit left");
    expect(lowCreditsTemplate(3).text).toContain("3 credits left");
  });

  it("export-ready links to the download url", () => {
    const download = "https://cdn.example.com/export.png?sig=xyz";
    const template = exportReadyTemplate(download);
    expect(template.html).toContain(download);
  });
});
