import { useState } from "react";
import { ImageCarousel } from "../image-carousel";
import ImageCropperModal from "./drawers/image-cropper-modal";
import { useEntryCacheStore } from "@/stores/entry-cache-store";

export default function Media() {
  const images = useEntryCacheStore(e => e.entryImages)
  const updateCachedEntry = useEntryCacheStore(e => e.updateCachedEntry)
  const [editingUri, setEditingUri] = useState<string | null>(null);

  if (!images || images?.length === 0) return null;
  console.log(images)
  const removeImage = (uri: string) => {
    const newImageArray = images.filter(i => !i.includes(uri))
    updateCachedEntry({ entryImages: newImageArray })
  }
  const replaceImage = (editingUri: string, newUri: string) => {
    const newImageArray = images.map(i => i === editingUri ? newUri : i)
    updateCachedEntry({ entryImages: newImageArray })
  }
  return (
    <>
      <ImageCarousel
        images={images}
        onRemove={(uri) => removeImage(uri)}
        onEdit={(uri) => setEditingUri(uri)}
      />
      <ImageCropperModal
        visible={editingUri !== null}
        uri={editingUri}
        onClose={() => setEditingUri(null)}
        onComplete={(newUri) => {
          if (editingUri) replaceImage(editingUri, newUri);
          setEditingUri(null);
        }}
      />
    </>
  );
}
