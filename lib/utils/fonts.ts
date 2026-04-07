import localFont from "next/font/local";

export const aeonik = localFont({
  variable: "--font-aeonik",
  src: [
    {
      path: "../../public/fonts/AeonikTRIAL-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/AeonikTRIAL-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/fonts/AeonikTRIAL-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/AeonikTRIAL-RegularItalic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/AeonikTRIAL-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/AeonikTRIAL-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
  display: "swap",
});
