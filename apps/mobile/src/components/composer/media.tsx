import { useState } from "react";
import { getDraftImages } from "@/stores/note-draft";
import { ImageCarousel } from "../image-carousel";
import ImageCropperModal from "./drawers/image-cropper-modal";

interface Props {
  images: string[];
  onRemove: (uri: string) => void;
  onReplace: (uri: string, replacement: string) => void;
}

export default function Media({ images, onRemove, onReplace }: Props) {
  const [editingUri, setEditingUri] = useState<string | null>(null);

  if (images.length === 0) return null;
  return (
    <>
      <ImageCarousel
        images={getDraftImages(images)}
        onRemove={onRemove}
        onEdit={(uri) => setEditingUri(uri)}
      />
      <ImageCropperModal
        visible={editingUri !== null}
        uri={editingUri}
        onClose={() => setEditingUri(null)}
        onComplete={(newUri) => {
          if (editingUri) onReplace(editingUri, newUri);
          setEditingUri(null);
        }}
      />
    </>
  );
}
