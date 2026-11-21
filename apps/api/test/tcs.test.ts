import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma";
import { setTcsFetchForTests } from "../src/modules/couriers/tcs.client";
import { matchCity, statusForCheckpoint, tcsMobile } from "../src/modules/couriers/tcs.service";
import { placeCodOrder, signedInAgent } from "./helpers";

/** A fake TCS API: records bookings and serves whatever tracking a test sets. */
const fake = {
  bookings: [] as Record<string, unknown>[],
  cancelled: [] as string[],
  tracking: {} as Record<string, unknown>,
  calls: [] as string[],
};
let next = 779400000000;

function fakeTcs(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = new URL(String(input));
  fake.calls.push(`${init?.method ?? "GET"} ${url.pathname}`);
  const json = (body: unknown, status = 200) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    );
  const authed = () => new Headers(init?.headers).get("authorization") === "Bearer bearer-1";
  switch (url.pathname) {
    case "/auth/api/auth":
      return url.searchParams.get("clientsecret") === "secret"
        ? json({
            result: { accessToken: "bearer-1", expiry: "2099-01-01T00:00:00Z" },
            status: true,
            code: "0200",
          })
        : json({ result: null, status: false, code: "401" }, 401);
    case "/ecom/api/authentication/token":
      return authed() && url.searchParams.get("password") === "pass"
        ? json({ accesstoken: "access-1", expiry: "2099-01-01T00:00:00Z", message: "success" })
        : json({ result: null, status: false, code: "401" }, 401);
    case "/ecom/api/booking/create": {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      if (!authed() || body.accesstoken !== "access-1") return json({ code: 401 }, 401);
      fake.bookings.push(body);
      return json({
        response: "SUCCESS",
        consignmentNo: String(next++),
        code: "200",
        status: true,
        message: "success",
      });
    }
    case "/ecom/api/booking/cancel": {
      const body = JSON.parse(String(init?.body)) as { consignmentNumber: string };
      fake.cancelled.push(body.consignmentNumber);
      return json({ message: "SUCCESS" });
    }
    case "/ecom/api/print/label":
      return Promise.resolve(
        new Response("%PDF-1.4 fake label", { headers: { "content-type": "application/pdf" } }),
      );
    case "/ecom/api/setup/citylistbycountry":
      return json({
        message: "SUCCESS",
        data: [
          { citycode: "LHE", cityname: "LAHORE" },
          { citycode: "KHI", cityname: "KARACHI" },
          { citycode: "ISB", cityname: "ISLAMABAD" },
        ],
      });
    case "/tracking/api/Tracking/GetDynamicTrackDetail":
      return json(fake.tracking[url.searchParams.get("consignee") ?? ""] ?? { message: "FAIL" });
    default:
      return json({ message: "not found" }, 404);
  }
}

const SETTINGS = {
  enabled: true,
  environment: "sandbox",
  clientId: "205659575",
  clientSecret: "secret",
  username: "store",
  password: "pass",
  accountNumber: "04011K1",
  costCenterCode: "LHR-01",
  serviceCode: "O",
  shipperName: "Amazon Group",
  shipperAddress: "Main Boulevard, Gulberg III",
  shipperCity: "LAHORE",
  shipperMobile: "0300 1112223",
  defaultWeightKg: 0.5,
};

beforeAll(() => setTcsFetchForTests(fakeTcs as typeof fetch));
afterAll(async () => {
  setTcsFetchForTests(null);
  await prisma.setting.deleteMany({ where: { key: { startsWith: "tcs." } } });
});

describe("TCS courier", () => {
  it("helpers: mobiles, cities and checkpoint wording", () => {
    expect(tcsMobile("+92 300 1234567")).toBe("03001234567");
    expect(tcsMobile("03001234567")).toBe("03001234567");
    const cities = [
      { code: "LHE", name: "LAHORE" },
      { code: "ISB", name: "ISLAMABAD" },
    ];
    expect(matchCity(" lahore ", cities)?.code).toBe("LHE");
    expect(matchCity("Islamabad Capital", cities)?.code).toBe("ISB");
    expect(matchCity("Gilgit", cities)).toBeNull();
    expect(statusForCheckpoint("Arrived at TCS Facility")).toBe("IN_TRANSIT");
    expect(statusForCheckpoint("Out For Delivery")).toBe("OUT_FOR_DELIVERY");
    expect(statusForCheckpoint("Shipment Delivered")).toBe("DELIVERED");
    expect(statusForCheckpoint("Return to Shipper")).toBeNull();
    expect(statusForCheckpoint("Booked")).toBeNull();
  });

  it("can't book until TCS is set up; settings keep secrets hidden", async () => {
    await prisma.setting.deleteMany({ where: { key: { startsWith: "tcs." } } });
    const { agent: support } = await signedInAgent("SUPPORT");
    const order = await placeCodOrder();
    const blocked = await support
      .post(`/api/v1/admin/orders/${order.number}/tcs`)
      .send({ cityName: "LAHORE", weightKg: 0.5, pieces: 1 });
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.message).toContain("TCS isn't set up");

    // Support staff can't see or change the TCS login.
    expect((await support.get("/api/v1/admin/couriers/tcs")).status).toBe(403);
    const { agent: owner } = await signedInAgent("SUPER_ADMIN");
    const saved = await owner.put("/api/v1/admin/couriers/tcs").send(SETTINGS);
    expect(saved.status).toBe(200);
    expect(saved.body.data).toMatchObject({
      configured: true,
      hasClientSecret: true,
      hasPassword: true,
      shipperMobile: "03001112223",
    });
    expect(JSON.stringify(saved.body)).not.toContain('secret"');
    const stored = await prisma.setting.findUnique({ where: { key: "tcs.password" } });
    expect(String(stored?.value)).toMatch(/^enc:v1:/);

    // Saving again without secrets keeps them.
    const again = await owner
      .put("/api/v1/admin/couriers/tcs")
      .send({ ...SETTINGS, clientSecret: "", password: "" });
    expect(again.body.data.hasPassword).toBe(true);
    const test = await owner.post("/api/v1/admin/couriers/tcs/test");
    expect(test.status).toBe(200);
    expect(test.body.data.cities).toBe(3);
  });

  it("books a Cash on Delivery order, prints the label and follows TCS tracking to delivered", async () => {
    const { agent } = await signedInAgent("SUPPORT");
    const order = await placeCodOrder({ price: 250000 });

    const draft = await agent.get(`/api/v1/admin/orders/${order.number}/tcs`);
    expect(draft.body.data).toMatchObject({
      configured: true,
      city: { code: "LHE" },
      codAmount: order.total,
    });

    const booked = await agent
      .post(`/api/v1/admin/orders/${order.number}/tcs`)
      .send({ cityName: "LAHORE", cityCode: "LHE", weightKg: 1, pieces: 1, fragile: true });
    expect(booked.status).toBe(200);
    const cn = booked.body.data.trackingNumber as string;
    expect(booked.body.data).toMatchObject({ status: "PACKED", courier: "TCS" });
    expect(booked.body.data.courierBookedAt).toBeTruthy();

    const sent = fake.bookings.at(-1) as {
      shipperinfo: Record<string, unknown>;
      consigneeinfo: Record<string, unknown>;
      shipmentinfo: Record<string, unknown>;
    };
    expect(sent.shipperinfo).toMatchObject({ tcsaccount: "04011K1", mobile: "03001112223" });
    expect(sent.consigneeinfo).toMatchObject({
      cityname: "LAHORE",
      citycode: "LHE",
      mobile: "03001234567",
    });
    expect(sent.shipmentinfo).toMatchObject({
      costcentercode: "LHR-01",
      referenceno: order.number,
      codamount: order.total / 100,
      weightinkg: 1,
      fragile: true,
      currency: "PKR",
    });

    // Booked twice? No.
    expect(
      (
        await agent
          .post(`/api/v1/admin/orders/${order.number}/tcs`)
          .send({ cityName: "LAHORE", weightKg: 1, pieces: 1 })
      ).status,
    ).toBe(409);

    const label = await agent.get(`/api/v1/admin/orders/${order.number}/tcs/label`);
    expect(label.status).toBe(200);
    expect(label.headers["content-type"]).toContain("application/pdf");

    // TCS picks it up and it's out for delivery.
    fake.tracking[cn] = {
      checkpoints: [
        { status: "Out For Delivery", datetime: "Thursday Nov 21, 2026 09:35", recievedby: null },
        {
          status: "Arrived at TCS Facility",
          datetime: "Wednesday Nov 20, 2026 10:52",
          recievedby: "LAHORE",
        },
      ],
      deliveryinfo: [],
      message: "SUCCESS",
    };
    const out = await agent.post(`/api/v1/admin/orders/${order.number}/tcs/sync`);
    expect(out.body.data.status).toBe("OUT_FOR_DELIVERY");
    expect(out.body.data.courierStatus).toBe("Out For Delivery");
    const last = out.body.data.timeline.at(-1);
    expect(last).toMatchObject({ status: "OUT_FOR_DELIVERY", by: "TCS tracking" });
    expect(last.note).toContain("TCS: Out For Delivery");

    // Delivered: the cash is marked collected.
    fake.tracking[cn] = {
      checkpoints: [
        {
          status: "Shipment Delivered",
          datetime: "Thursday Nov 21, 2026 12:58",
          recievedby: "AYESHA",
        },
      ],
      deliveryinfo: [{ status: "Delivered", code: "OK" }],
      message: "SUCCESS",
    };
    const done = await agent.post(`/api/v1/admin/orders/${order.number}/tcs/sync`);
    expect(done.body.data.status).toBe("DELIVERED");
    expect(done.body.data.paymentStatus).toBe("SUCCEEDED");
  });

  it("cancels a booking before pickup, and won't once TCS has it", async () => {
    const { agent } = await signedInAgent("SUPPORT");
    const order = await placeCodOrder();
    const booked = await agent
      .post(`/api/v1/admin/orders/${order.number}/tcs`)
      .send({ cityName: "KARACHI", weightKg: 0.5, pieces: 1 });
    const cn = booked.body.data.trackingNumber;

    const cancelled = await agent.delete(`/api/v1/admin/orders/${order.number}/tcs`);
    expect(cancelled.status).toBe(200);
    expect(fake.cancelled).toContain(cn);
    expect(cancelled.body.data).toMatchObject({
      trackingNumber: null,
      courier: null,
      courierBookedAt: null,
    });

    // Book again, TCS collects it, then cancelling is refused.
    const again = await agent
      .post(`/api/v1/admin/orders/${order.number}/tcs`)
      .send({ cityName: "KARACHI", weightKg: 0.5, pieces: 1 });
    fake.tracking[again.body.data.trackingNumber] = {
      checkpoints: [
        { status: "Arrived at TCS Facility", datetime: "Nov 21, 2026", recievedby: "LAHORE" },
      ],
      deliveryinfo: [],
    };
    const moved = await agent.post(`/api/v1/admin/orders/${order.number}/tcs/sync`);
    expect(moved.body.data.status).toBe("IN_TRANSIT");
    expect((await agent.delete(`/api/v1/admin/orders/${order.number}/tcs`)).status).toBe(409);
  });
});
