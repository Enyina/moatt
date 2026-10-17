import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Moatt Studio', description: 'Design clothing on a 3D mannequin.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
