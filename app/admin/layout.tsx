import AppTopNav from '@/components/AppTopNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppTopNav />
      {children}
    </>
  )
}
