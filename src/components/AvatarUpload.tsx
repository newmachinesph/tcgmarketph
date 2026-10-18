"use client";

import { useRef } from "react";
import { CameraIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface AvatarUploadProps {
  value?: string | null;
  name: string;
  onChange: (dataUrl: string) => void;
  size?: "md" | "lg";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2)
  ).toUpperCase();
}

async function resizeToSquare(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const SIZE = 256;
        const canvas = document.createElement("canvas");
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d")!;
        const side = Math.min(img.width, img.height);
        ctx.drawImage(
          img,
          (img.width - side) / 2, (img.height - side) / 2,
          side, side,
          0, 0, SIZE, SIZE,
        );
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function AvatarUpload({ value, name, onChange, size = "md" }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const sizeClass = size === "lg" ? "size-24 text-2xl" : "size-20 text-xl";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }
    try {
      onChange(await resizeToSquare(file));
    } catch { /* ignore */ }
    e.target.value = "";
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`${sizeClass} group relative flex items-center justify-center overflow-hidden rounded-2xl border border-accent/20 bg-accent/10 font-bold text-[#F2F2F2] transition hover:border-accent/40`}
        aria-label="Change avatar"
      >
        {value ? (
          <img src={value} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <span>{getInitials(name || "?")}</span>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <CameraIcon className="size-5 text-white" />
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
