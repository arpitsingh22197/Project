"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Project } from "../types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  MoreHorizontal,
  Edit3,
  Trash2,
  Copy,
  Download,
  Eye,
} from "lucide-react";

import { toast } from "sonner";
import { MarkedToggleButton } from "./marked-toogle";

interface ProjectTableProps {
  projects: Project[];

  onUpdateProject?: (
    id: string,
    data: {
      title: string;
      description: string;
    }
  ) => Promise<void>;

  onDeleteProject?: (id: string) => Promise<void>;

  onDuplicateProject?: (id: string) => Promise<unknown>; // ✅ changed from Promise<void>
}

interface EditProjectData {
  title: string;
  description: string;
}

export default function ProjectTable({
  projects,
  onUpdateProject,
  onDeleteProject,
  onDuplicateProject,
}: ProjectTableProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);

  const [editData, setEditData] =
    useState<EditProjectData>({
      title: "",
      description: "",
    });

  const [isLoading, setIsLoading] = useState(false);

  // =========================
  // EDIT
  // =========================

  const handleEditClick = (project: Project) => {
    setSelectedProject(project);

    setEditData({
      title: project.title,
      description: project.description || "",
    });

    setEditDialogOpen(true);
  };

  // =========================
  // DELETE CLICK
  // =========================

  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  // =========================
  // UPDATE PROJECT
  // =========================

  const handleUpdateProject = async () => {
    if (!selectedProject || !onUpdateProject) return;

    setIsLoading(true);

    try {
      await onUpdateProject(selectedProject.id, editData);

      startTransition(() => {
        router.refresh();
      });

      setEditDialogOpen(false);

      toast.success("Project updated successfully");
    } catch (error) {
      console.log(error);

      toast.error("Failed to update project");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // DELETE PROJECT
  // =========================

  const handleDeleteProject = async () => {
    if (!selectedProject || !onDeleteProject) return;

    setIsLoading(true);

    try {
      await onDeleteProject(selectedProject.id);

      startTransition(() => {
        router.refresh();
      });

      setDeleteDialogOpen(false);

      setSelectedProject(null);

      toast.success("Project deleted successfully");
    } catch (error) {
      console.log(error);

      toast.error("Failed to delete project");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // DUPLICATE PROJECT
  // =========================

  const handleDuplicateProject = async (
    project: Project
  ) => {
    if (!onDuplicateProject) return;

    setIsLoading(true);

    try {
      await onDuplicateProject(project.id);

      startTransition(() => {
        router.refresh();
      });

      toast.success("Project duplicated successfully");
    } catch (error) {
      console.log(error);

      toast.error("Failed to duplicate project");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // COPY URL
  // =========================

  const copyProjectUrl = (projectId: string) => {
    if (typeof window === "undefined") return;

    const url = `${window.location.origin}/playground/${projectId}`;

    navigator.clipboard.writeText(url);

    toast.success("Project URL copied");
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>

              <TableHead>Template</TableHead>

              <TableHead>Created</TableHead>

              <TableHead>User</TableHead>

              <TableHead className="w-[50px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {projects.map((project) => {
              const isMarked =
                project.Starmark?.[0]?.isMarked ??
                false;

              return (
                <TableRow key={project.id}>
                  {/* PROJECT */}
                  <TableCell>
                    <div className="flex flex-col">
                      <Link
                        href={`/playground/${project.id}`}
                        className="hover:underline font-semibold"
                      >
                        {project.title}
                      </Link>

                      <span className="text-sm text-gray-500 line-clamp-1">
                        {project.description}
                      </span>
                    </div>
                  </TableCell>

                  {/* TEMPLATE */}
                  <TableCell>
                    <Badge variant="outline">
                      {project.template}
                    </Badge>
                  </TableCell>

                  {/* CREATED */}
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {project.createdAt
                        ? format(
                            new Date(project.createdAt),
                            "MMM dd, yyyy"
                          )
                        : "-"}
                    </span>
                  </TableCell>

                  {/* USER */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Image
                        src={
                          project.user.image ||
                          "/placeholder.svg"
                        }
                        alt={project.user.name}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />

                      <span className="text-sm">
                        {project.user.name}
                      </span>
                    </div>
                  </TableCell>

                  {/* ACTIONS */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLoading || isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        {/* MARK */}
                        <DropdownMenuItem asChild>
                          <MarkedToggleButton
                            markedForRevision={isMarked}
                            id={project.id}
                          />
                        </DropdownMenuItem>

                        {/* OPEN */}
                        <DropdownMenuItem asChild>
                          <Link href={`/playground/${project.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Open
                          </Link>
                        </DropdownMenuItem>

                        {/* EDIT */}
                        <DropdownMenuItem
                          onClick={() => handleEditClick(project)}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>

                        {/* DUPLICATE */}
                        <DropdownMenuItem
                          onClick={() => handleDuplicateProject(project)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>

                        {/* COPY URL */}
                        <DropdownMenuItem
                          onClick={() => copyProjectUrl(project.id)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Copy URL
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* DELETE */}
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(project)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ========================= */}
      {/* EDIT DIALOG */}
      {/* ========================= */}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>

            <DialogDescription>
              Update your project details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Title</Label>

              <Input
                value={editData.title}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>

              <Textarea
                value={editData.description}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={handleUpdateProject}
              disabled={isLoading || isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================= */}
      {/* DELETE DIALOG */}
      {/* ========================= */}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>

            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              your project.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isLoading || isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}