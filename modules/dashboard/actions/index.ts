"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/modules/auth/actions";
import { revalidatePath } from "next/cache";

/* ---------------- STAR MARK ---------------- */

export const toggleStarMarked = async (
  playgroundId: string,
  isChecked: boolean
) => {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("User Id is Required");
  }

  try {
    if (isChecked) {
      await db.starMark.create({
        data: {
          userId,
          playgroundId,
          isMarked: isChecked,
        },
      });
    } else {
      await db.starMark.delete({
        where: {
          userId_playgroundId: {
            userId,
            playgroundId,
          },
        },
      });
    }

    revalidatePath("/dashboard");

    return { success: true, isMarked: isChecked };
  } catch (error) {
    console.error("Error updating star mark:", error);
    return { success: false, error: "Failed to update star mark" };
  }
};

/* ---------------- GET PLAYGROUNDS ---------------- */

export const getAllPlaygroundForUser = async () => {
  const user = await currentUser();

  if (!user?.id) return [];

  try {
    const playgrounds = await db.playground.findMany({
      where: {
        userId: user.id,
      },
      include: {
        user: true,
        Starmark: {
          where: {
            userId: user.id,
          },
          select: {
            isMarked: true,
          },
        },
      },
    });

    return playgrounds;
  } catch (error) {
    console.error("Error fetching playgrounds:", error);
    return [];
  }
};

/* ---------------- CREATE PLAYGROUND ---------------- */

export const createPlayground = async (data: {
  title: string;
  template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
  description?: string;
}) => {
  const user = await currentUser();

  if (!user?.id) throw new Error("Unauthorized");

  const { template, title, description } = data;

  try {
    const playground = await db.playground.create({
      data: {
        title,
        description,
        template,
        userId: user.id,
      },
    });

    return playground;
  } catch (error) {
    console.error("Error creating playground:", error);
    return null;
  }
};

/* ---------------- DELETE PLAYGROUND ---------------- */

export const deleteProjectById = async (id: string) => {
  const user = await currentUser();
  if (!user?.id) throw new Error("Unauthorized");

  try {
    await db.playground.deleteMany({
      where: {
        id,
        userId: user.id, // 🔥 SECURITY FIX
      },
    });

    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error deleting project:", error);
  }
};

/* ---------------- EDIT PLAYGROUND ---------------- */

export const editProjectById = async (
  id: string,
  data: { title: string; description: string }
) => {
  const user = await currentUser();
  if (!user?.id) throw new Error("Unauthorized");

  try {
    await db.playground.updateMany({
      where: {
        id,
        userId: user.id, // 🔥 SECURITY FIX
      },
      data,
    });

    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error editing project:", error);
  }
};

/* ---------------- DUPLICATE PLAYGROUND ---------------- */

export const duplicateProjectById = async (id: string) => {
  const user = await currentUser();
  if (!user?.id) throw new Error("Unauthorized");

  try {
    const originalPlayground = await db.playground.findFirst({
      where: {
        id,
        userId: user.id, // 🔥 SECURITY FIX
      },
    });

    if (!originalPlayground) {
      throw new Error("Original playground not found");
    }

    const duplicatedPlayground = await db.playground.create({
      data: {
        title: `${originalPlayground.title} (Copy)`,
        description: originalPlayground.description,
        template: originalPlayground.template,
        userId: user.id,
      },
    });

    revalidatePath("/dashboard");

    return duplicatedPlayground;
  } catch (error) {
    console.error("Error duplicating project:", error);
    return null;
  }
};