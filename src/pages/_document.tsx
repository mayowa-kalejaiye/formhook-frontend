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
                  var theme = localStorage.getItem('theme') || 'system';
                  var root = document.documentElement;
                  
                  if (theme === 'dark') {
                    root.classList.add('dark');
                  } else if (theme === 'light') {
                    root.classList.remove('dark');
                  } else if (theme === 'system') {
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      root.classList.add('dark');
                    } else {
                      root.classList.remove('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
