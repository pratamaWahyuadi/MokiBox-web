"use client";

/**
 * Inline script di <head> yang pasang class .moki-mellow di <html>
 * SEBELUM React hydrate, supaya tidak ada flash warna saat page load.
 * Baca dari localStorage "mokibox.theme" (sesuai nama store).
 */
export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem("mokibox.theme");var s=t?JSON.parse(t).state&&JSON.parse(t).state.theme:"system";if(s==="mellow"||(s==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("moki-mellow")}else{document.documentElement.classList.remove("moki-mellow")}}catch(e){}})();`,
      }}
    />
  );
}
