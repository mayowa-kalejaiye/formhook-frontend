import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Force light theme for the application. This runs early on
                  // document load to avoid flashes of dark-mode styling caused by
                  // system preferences or previously stored values.
                  var root = document.documentElement;
                  root.classList.remove('dark');
                  try { localStorage.setItem('theme', 'light'); } catch(e) {}
                } catch (e) {}
              })();
            `,
          }}
        />
        <style dangerouslySetInnerHTML={{__html: `
          /* Inline light-mode variables to ensure product pages render
             with the light palette immediately, before other CSS loads. */
          :root {
            --background: #ffffff;
            --foreground: #0f172a;
            --card: #ffffff;
            --card-foreground: #0f172a;
            --popover: #ffffff;
            --popover-foreground: #0f172a;
            --primary: #3b82f6; /* blue-500 */
            --primary-foreground: #ffffff;
            --secondary: #93c5fd; /* blue-300 */
            --secondary-foreground: #0f172a;
            --muted: #f1f5f9; /* slate-100 */
            --muted-foreground: #64748b; /* slate-500 */
            --accent: #f8fafc;
            --accent-foreground: #0f172a;
            --destructive: #ef4444; /* red-500 */
            --destructive-foreground: #ffffff;
            --border: #e6edf3;
            --input: #f8fafc;
            --ring: #60a5fa;
          }
          html, body, #__next { background-color: #ffffff !important; color: #0f172a !important; }
        `}} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
