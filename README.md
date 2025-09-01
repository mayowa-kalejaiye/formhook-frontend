## Troubleshooting

### Dashboard or Data Not Showing

- Ensure you are logged in and have a valid JWT token in your browser's localStorage.
- If you see a hydration error or blank dashboard, try the following:
  - Reload the page after login.
  - Check the browser console for errors or failed network/API requests.
  - Make sure your backend API is running and accessible at the URL set in `.env.local`.
  - If you see "Redirecting to login...", your session may have expired—log in again.
- If you want the dashboard UI to always show (even with empty data), you can adjust the conditional rendering in `src/pages/dashboard.tsx` to show placeholders or error messages instead of hiding the UI.

If you need more help, see the backend API docs or open an issue.
# FormHook Frontend

A modern admin dashboard for FormHook, built with Next.js (TypeScript), React Hook Form, and Tailwind CSS.

## Features
- Authentication (signup, login, logout)
- Dashboard: list, create, and manage forms
- Form builder: name, notification email, webhook URL
- View form submissions: table, filters, pagination, CSV export
- Embed code preview for each form
- Responsive, minimalist UI with Tailwind CSS
- Modular structure: components, pages, services, context
- API integration with FastAPI backend

## Getting Started

### 1. Install dependencies
```
npm install
```

### 2. Set backend base URL
Create a `.env.local` file in the project root:
```
NEXT_PUBLIC_API_BASE_URL=https://formhook-backend.onrender.com
```

### 3. Run the development server
```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### 4. Build for production
```
npm run build
```

## Project Structure
```
src/
  components/
  pages/
  services/
  context/
  ...
```

## API Endpoints
See the backend API docs: https://formhook-backend.onrender.com/docs

## Tech Stack
- [Next.js](https://nextjs.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Axios](https://axios-http.com/) or Fetch

## License
MIT
