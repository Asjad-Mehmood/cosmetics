import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { testOutbox } from "../src/lib/mailer";
import { prisma } from "../src/lib/prisma";
import { app, PNG_1PX, signedInAgent, uniqueEmail } from "./helpers";

beforeEach(() => {
  testOutbox.length = 0;
});

const PDF = Buffer.from("%PDF-1.4\n%test prescription\n");
const body = (overrides: Record<string, unknown> = {}) => ({
  name: "Ayesha Khan",
  phone: "0300 1234567",
  email: "",
  city: "Lahore",
  notes: "Panadol 500mg, 2 strips",
  allowSubstitutes: true,
  files: [PNG_1PX.toString("base64"), PDF.toString("base64")],
  ...overrides,
});

describe("prescriptions", () => {
  it("a guest uploads a prescription and staff review it, with private files", async () => {
    const res = await request(app).post("/api/v1/prescriptions").send(body());
    expect(res.status).toBe(201);
    const rx = res.body.data;
    expect(rx.reference).toMatch(/^RX-[2-9A-HJ-NP-Z]{6}$/);
    expect(rx).toMatchObject({
      status: "PENDING",
      phone: "03001234567",
      email: null,
      fileCount: 2,
    });
    // The response never carries the files.
    expect(JSON.stringify(res.body)).not.toContain(PNG_1PX.toString("base64"));

    // Not for customers or the public.
    const { agent: customer } = await signedInAgent();
    expect((await customer.get("/api/v1/admin/prescriptions")).status).toBe(403);

    const { agent: staff } = await signedInAgent("SUPPORT");
    const list = await staff.get(`/api/v1/admin/prescriptions?q=${rx.reference}`);
    expect(list.status).toBe(200);
    const row = list.body.data[0];
    expect(row.files.map((f: { contentType: string }) => f.contentType)).toEqual([
      "image/png",
      "application/pdf",
    ]);

    const fileUrl = `/api/v1/admin/prescriptions/${rx.id}/files/${row.files[0].id}`;
    expect((await request(app).get(fileUrl)).status).toBe(401);
    expect((await customer.get(fileUrl)).status).toBe(403);
    const file = await staff.get(fileUrl);
    expect(file.status).toBe(200);
    expect(file.headers["cache-control"]).toBe("private, no-store");
    expect(file.headers["content-type"]).toBe("image/png");

    const updated = await staff.patch(`/api/v1/admin/prescriptions/${rx.id}`).send({
      status: "CONFIRMED",
      pharmacistNote: "Available, Rs 450 in total.",
      orderNumber: "AG-10099",
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ status: "CONFIRMED", orderNumber: "AG-10099" });
    expect(updated.body.data.reviewedBy).toBeTruthy();

    // Only a manager can delete, and the files go with it.
    expect((await staff.delete(`/api/v1/admin/prescriptions/${rx.id}`)).status).toBe(403);
    const { agent: manager } = await signedInAgent("MANAGER");
    expect((await manager.delete(`/api/v1/admin/prescriptions/${rx.id}`)).status).toBe(204);
    expect(await prisma.prescriptionFile.count({ where: { prescriptionId: rx.id } })).toBe(0);
  });

  it("signed-in customers see their own, and get emails as the status changes", async () => {
    const { agent, user } = await signedInAgent();
    const email = uniqueEmail("rx");
    const res = await agent.post("/api/v1/prescriptions").send(body({ email }));
    expect(res.status).toBe(201);
    await new Promise((r) => setTimeout(r, 50));
    expect(testOutbox.some((m) => m.to === email && m.subject.includes("Received"))).toBe(true);

    const mine = await agent.get("/api/v1/prescriptions");
    expect(mine.body.data.map((p: { id: string }) => p.id)).toContain(res.body.data.id);
    expect(mine.body.data.every((p: { userId?: string }) => p.userId === undefined)).toBe(true);
    expect(await prisma.prescription.count({ where: { userId: user.id } })).toBeGreaterThan(0);

    const { agent: staff } = await signedInAgent("SUPPORT");
    testOutbox.length = 0;
    await staff
      .patch(`/api/v1/admin/prescriptions/${res.body.data.id}`)
      .send({ status: "REJECTED", pharmacistNote: "The prescription has expired." });
    await new Promise((r) => setTimeout(r, 50));
    const mail = testOutbox.find((m) => m.to === email);
    expect(mail?.subject).toContain("Not accepted");
    expect(mail?.text).toContain("The prescription has expired.");
  });

  it("rejects files that aren't photos or PDFs, and empty uploads", async () => {
    const exe = Buffer.from("MZ\x90\x00 not a prescription at all").toString("base64");
    const bad = await request(app)
      .post("/api/v1/prescriptions")
      .send(body({ files: [exe] }));
    expect(bad.status).toBe(400);
    expect(bad.body.error.message).toContain("only photos");
    expect(
      (
        await request(app)
          .post("/api/v1/prescriptions")
          .send(body({ files: [] }))
      ).status,
    ).toBe(422);
  });
});
