import type { Clip, LibraryFace } from "@/lib/types";

export const trendingClips: Clip[] = [
  {
    id: "blinding-lights",
    title: "The Weeknd - Blinding Lights",
    poster: "/media/poster-lights.jpg",
    frame: "/media/frame-weeknd.jpg",
    faces: [
      {
        id: "weeknd",
        name: "The Weeknd",
        box: { x: 51, y: 27, w: 18, h: 32 },
        avatar: "/media/frame-weeknd.jpg",
        avatarPosition: "60% 40%",
      },
      {
        id: "backing",
        name: "Geri Vokal",
        box: { x: 17, y: 30, w: 16, h: 30 },
        avatar: "/media/frame-weeknd.jpg",
        avatarPosition: "25% 42%",
      },
      {
        id: "crowd-1",
        name: "Seyirci 1",
        box: { x: 76, y: 36, w: 22, h: 38 },
        avatar: "/media/frame-weeknd.jpg",
        avatarPosition: "88% 58%",
      },
    ],
  },
  {
    id: "dune",
    title: "Dune Savaş Sahnesi",
    poster: "/media/poster-dune.jpg",
    frame: "/media/frame-dune.jpg",
    faces: [
      {
        id: "dune-lead",
        name: "Ana Karakter",
        box: { x: 18, y: 2, w: 64, h: 72 },
        avatar: "/media/frame-dune.jpg",
        avatarPosition: "center 35%",
      },
    ],
  },
  {
    id: "weeknd-encore",
    title: "The Weeknd",
    poster: "/media/frame-crowd.jpg",
    frame: "/media/frame-crowd.jpg",
    faces: [
      {
        id: "encore-lead",
        name: "Solist",
        box: { x: 62, y: 40, w: 14, h: 26 },
        avatar: "/media/frame-crowd.jpg",
        avatarPosition: "69% 50%",
      },
      {
        id: "encore-crowd",
        name: "Seyirci",
        box: { x: 38, y: 68, w: 18, h: 24 },
        avatar: "/media/frame-crowd.jpg",
        avatarPosition: "46% 78%",
      },
    ],
  },
];

export const initialLibrary: LibraryFace[] = [
  {
    id: "scan",
    name: "Previous Scan",
    image: "/media/avatar-scan.jpg",
    source: "library",
  },
  {
    id: "emre",
    name: "Emre Kaya",
    image: "/media/avatar-emre.jpg",
    source: "library",
  },
  {
    id: "seyirci",
    name: "Seyirci 1",
    image: "/media/avatar-seyirci.jpg",
    source: "library",
  },
  {
    id: "demir",
    name: "M. Demir (Ben)",
    image: "/media/avatar-demir.jpg",
    source: "library",
  },
];

export const DEMO_USER = {
  displayName: "M. Demir",
  email: "m.demir@swapface.app",
  credits: 120,
};
