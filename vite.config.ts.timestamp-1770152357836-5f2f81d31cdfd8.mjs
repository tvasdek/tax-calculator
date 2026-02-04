// vite.config.ts
import { defineConfig, loadEnv } from "file:///D:/Dropbox%20(Personal)/Projects/Tax_Calculator/App/Code/taxpulse-oe/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Dropbox%20(Personal)/Projects/Tax_Calculator/App/Code/taxpulse-oe/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///D:/Dropbox%20(Personal)/Projects/Tax_Calculator/App/Code/taxpulse-oe/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      // 2. ADD THE PWA CONFIGURATION HERE
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
        manifest: {
          name: "My Finance Tracker",
          short_name: "Finance",
          description: "Track expenses and income",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          // Removes the browser bar
          orientation: "portrait",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png"
            }
          ]
        }
      })
    ],
    // Your existing env var logic remains exactly the same
    define: {
      "process.env.API_KEY": JSON.stringify(env.API_KEY || "")
    },
    server: {
      port: 3e3
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxEcm9wYm94IChQZXJzb25hbClcXFxcUHJvamVjdHNcXFxcVGF4X0NhbGN1bGF0b3JcXFxcQXBwXFxcXENvZGVcXFxcdGF4cHVsc2Utb2VcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXERyb3Bib3ggKFBlcnNvbmFsKVxcXFxQcm9qZWN0c1xcXFxUYXhfQ2FsY3VsYXRvclxcXFxBcHBcXFxcQ29kZVxcXFx0YXhwdWxzZS1vZVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovRHJvcGJveCUyMChQZXJzb25hbCkvUHJvamVjdHMvVGF4X0NhbGN1bGF0b3IvQXBwL0NvZGUvdGF4cHVsc2Utb2Uvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG4vLyAxLiBJTVBPUlQgVEhFIFBXQSBQTFVHSU4gSEVSRVxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgLy8gTG9hZCBlbnYgZmlsZSBiYXNlZCBvbiBgbW9kZWAgaW4gdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3QoKSxcbiAgICAgIC8vIDIuIEFERCBUSEUgUFdBIENPTkZJR1VSQVRJT04gSEVSRVxuICAgICAgVml0ZVBXQSh7XG4gICAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxuICAgICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24uaWNvJywgJ2FwcGxlLXRvdWNoLWljb24ucG5nJywgJ21hc2staWNvbi5zdmcnXSxcbiAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICBuYW1lOiAnTXkgRmluYW5jZSBUcmFja2VyJyxcbiAgICAgICAgICBzaG9ydF9uYW1lOiAnRmluYW5jZScsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdUcmFjayBleHBlbnNlcyBhbmQgaW5jb21lJyxcbiAgICAgICAgICB0aGVtZV9jb2xvcjogJyNmZmZmZmYnLFxuICAgICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjZmZmZmZmJyxcbiAgICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsIC8vIFJlbW92ZXMgdGhlIGJyb3dzZXIgYmFyXG4gICAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdCcsXG4gICAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiAncHdhLTE5MngxOTIucG5nJyxcbiAgICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNyYzogJ3B3YS01MTJ4NTEyLnBuZycsXG4gICAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIF0sXG4gICAgLy8gWW91ciBleGlzdGluZyBlbnYgdmFyIGxvZ2ljIHJlbWFpbnMgZXhhY3RseSB0aGUgc2FtZVxuICAgIGRlZmluZToge1xuICAgICAgJ3Byb2Nlc3MuZW52LkFQSV9LRVknOiBKU09OLnN0cmluZ2lmeShlbnYuQVBJX0tFWSB8fCBcIlwiKSxcbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgcG9ydDogMzAwMCxcbiAgICB9XG4gIH07XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXdZLFNBQVMsY0FBYyxlQUFlO0FBQzlhLE9BQU8sV0FBVztBQUVsQixTQUFTLGVBQWU7QUFFeEIsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFFeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRTNDLFNBQU87QUFBQSxJQUNMLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQTtBQUFBLE1BRU4sUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFFBQ2QsZUFBZSxDQUFDLGVBQWUsd0JBQXdCLGVBQWU7QUFBQSxRQUN0RSxVQUFVO0FBQUEsVUFDUixNQUFNO0FBQUEsVUFDTixZQUFZO0FBQUEsVUFDWixhQUFhO0FBQUEsVUFDYixhQUFhO0FBQUEsVUFDYixrQkFBa0I7QUFBQSxVQUNsQixTQUFTO0FBQUE7QUFBQSxVQUNULGFBQWE7QUFBQSxVQUNiLE9BQU87QUFBQSxZQUNMO0FBQUEsY0FDRSxLQUFLO0FBQUEsY0FDTCxPQUFPO0FBQUEsY0FDUCxNQUFNO0FBQUEsWUFDUjtBQUFBLFlBQ0E7QUFBQSxjQUNFLEtBQUs7QUFBQSxjQUNMLE9BQU87QUFBQSxjQUNQLE1BQU07QUFBQSxZQUNSO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUE7QUFBQSxJQUVBLFFBQVE7QUFBQSxNQUNOLHVCQUF1QixLQUFLLFVBQVUsSUFBSSxXQUFXLEVBQUU7QUFBQSxJQUN6RDtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
