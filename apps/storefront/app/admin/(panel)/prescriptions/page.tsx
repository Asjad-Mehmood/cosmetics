import { Prescriptions } from "@/admin/components/prescriptions";
import { screen } from "@/admin/lib/page";

const { metadata, Page } = screen("Prescriptions", Prescriptions);
export { metadata };
export default Page;
