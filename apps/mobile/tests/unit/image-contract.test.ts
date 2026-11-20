import { describe, expect, test } from "bun:test";
import type { ComponentProps } from "react";
import type { ImageCarousel } from "../../src/components/image-carousel";
import { getDraftImages } from "../../src/stores/note-draft";
import { getNoteBody } from "../../src/queries/notes/queries";
import { makeNote } from "../helpers/fixtures";

type CarouselImages = ComponentProps<typeof ImageCarousel>["images"];

describe("imagens do composer e do feed", () => {
  test("prepara imagens de rascunho sem IDs fictícios nem alteração das URIs", () => {
    const uris = ["file:///primeira.jpg", "file:///segunda.jpg"];
    const images: CarouselImages = getDraftImages(uris);

    expect(images).toEqual([
      { imageUrl: "file:///primeira.jpg" },
      { imageUrl: "file:///segunda.jpg" },
    ]);
    expect(uris).toEqual(["file:///primeira.jpg", "file:///segunda.jpg"]);
  });

  test("um rascunho sem imagens fornece uma lista vazia", () => {
    const images: CarouselImages = getDraftImages([]);
    expect(images).toEqual([]);
  });

  test("entrega as imagens persistidas ao carrossel sem perder seus dados", () => {
    const note = makeNote({
      noteImages: [{ id: 1, noteId: 42, imageUrl: "file:///salva.jpg" }],
    });
    const images: CarouselImages = getNoteBody(note).images;

    expect(images).toBe(note.noteImages);
    expect(images).toMatchObject([{ id: 1, noteId: 42, imageUrl: "file:///salva.jpg" }]);
  });
});
