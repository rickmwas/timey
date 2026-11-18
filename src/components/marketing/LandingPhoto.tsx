"use client";

import { Building2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface LandingPhotoProps {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  frameClassName: string;
  imageClassName?: string;
}

export function LandingPhoto({
  src,
  alt,
  sizes,
  priority = false,
  frameClassName,
  imageClassName = "object-cover",
}: LandingPhotoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <figure className="min-w-0">
      <div
        className={`relative isolate overflow-hidden rounded-3xl bg-navy-100 ${frameClassName}`}
      >
        {imageFailed ? (
          <div
            role="img"
            aria-label={alt}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-navy-100 p-6 text-center text-navy-900"
          >
            <Building2 aria-hidden="true" size={32} />
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className={imageClassName}
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
    </figure>
  );
}
