import './globals.css';

export const metadata = {
  title: 'Reward System - Mansilly',
  description: 'Task and Reward Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
