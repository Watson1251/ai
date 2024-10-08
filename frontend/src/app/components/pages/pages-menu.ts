import { NbMenuItem } from "@nebular/theme";

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: "تحويل الصوت إلى نص",
    icon: "edit-2-outline",
  },
  {
    title: "التعرف على هوية المتحدث",
    icon: "message-square-outline",
  },
  {
    title: "التزييف العميق",
    icon: "eye-outline",
    children: [
      {
        title: "الكشف",
        icon: "search-outline",
        link: "/pages/deepfake/detection",
      },
      {
        title: "التوليد",
        icon: "repeat-outline",
      },
    ],
  },
  {
    title: "التعرف على الصور",
    icon: "image-outline",
    children: [
      {
        title: "التعرف على الوجوه",
        icon: "person-outline",
        link: "/pages/fr/search",
        home: true,
      },
      {
        title: "التشابه بين الوجوه",
        icon: "people-outline",
        link: "/pages/fr/compare",
      },
    ],
  },
];
