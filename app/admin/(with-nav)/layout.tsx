import AppTopNav from '@/components/AppTopNav'

export default function AdminWithNavLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppTopNav />
      {children}
    </>
  )
}
