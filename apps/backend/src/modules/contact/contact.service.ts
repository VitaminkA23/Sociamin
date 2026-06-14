import { prisma } from "../../config/prisma.js";
import type { SubmitContactInput, ContactMessageResponse } from "./contact.types.js";

export async function submitContact(
  input: SubmitContactInput
): Promise<ContactMessageResponse> {
  return prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
    },
    select: {
      id: true,
      name: true,
      email: true,
      subject: true,
      message: true,
      createdAt: true,
    },
  });
}