import { describe, expect, it } from "vitest";
import { breadcrumbJsonLd, listingMetadata, metaDescription, pageTitle } from "./seo";

describe("pageTitle", () => {
  it("drops a trailing store name so the title template doesn't repeat it", () => {
    expect(pageTitle("Digital Thermometer | Amazon Group", "x")).toBe("Digital Thermometer");
    expect(pageTitle("Sunscreen - amazon group", "x")).toBe("Sunscreen");
    expect(pageTitle(null, "Fallback")).toBe("Fallback");
    expect(pageTitle("Amazon Group", "Fallback")).toBe("Amazon Group");
  });
});

describe("metaDescription", () => {
  it("flattens whitespace and cuts long text at a word", () => {
    expect(metaDescription("  A\n\nshort   one ")).toBe("A short one");
    const long = "word ".repeat(60);
    const out = metaDescription(long)!;
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.endsWith("word…")).toBe(true);
    expect(metaDescription("")).toBeUndefined();
  });
});

describe("listingMetadata", () => {
  it("gives later pages their own canonical and keeps filtered views out of the index", () => {
    expect(listingMetadata("/shop", {})).toEqual({ alternates: { canonical: "/shop" } });
    expect(listingMetadata("/shop", { page: "3" })).toEqual({
      alternates: { canonical: "/shop?page=3" },
    });
    expect(listingMetadata("/shop", { sort: "price_asc" })).toEqual({
      alternates: { canonical: "/shop" },
      robots: { index: false, follow: true },
    });
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers the items and links all but the current page", () => {
    const data = breadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "Skincare" }]);
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "http://localhost:3000/" },
      { "@type": "ListItem", position: 2, name: "Skincare" },
    ]);
  });
});
