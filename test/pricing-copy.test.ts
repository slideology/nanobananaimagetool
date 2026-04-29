import { describe, expect, it } from "vitest";

import { FREE_PLAN } from "../app/constants/product";
import { BASIC_PLAN } from "../app/constants/pricing";

describe("pricing copy", () => {
  it("uses the unified 60-credit free signup messaging", () => {
    expect(FREE_PLAN.features[0]?.text).toBe("60 Free Credits on Sign Up");
    expect(BASIC_PLAN.limit.credits).toBe(60);
  });
});
