import Link from 'next/link';
import { Button, Card, CardContent } from '@coyote-force/ui';

export const metadata = {
  title: 'Coyote Safety Waiver – Sign the Waiver',
  description:
    'Please sign our waiver to get access to the playing field. Coyote Airsoft & Paintball.',
}

export default function Home() {
  return (
    <div 
        className="relative flex min-h-screen items-center justify-center px-4 py-8"
        style={{
          backgroundImage: 'url(/coyote-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 1,
        }}
      >
        <div className="absolute inset-0 bg-black/60" style={{ zIndex: 1 }}></div>
      
      <div className="relative z-10 mx-auto w-auto">
        <div className="mb-6 flex items-center justify-center">
          <img 
            src="/Coyote-Airsoft-Paintball-Logo.svg" 
            alt="Coyote Airsoft and Paintball Logo" 
            className="h-auto drop-shadow-lg"
            style={{ width: '200px' }}
          />
        </div>
        
        <Card className="bg-card/95 backdrop-blur-sm">
          <CardContent className="px-8 py-2 text-center">
            <h1 className="font-heading mb-2 text-3xl font-semibold tracking-tight text-foreground">
              Coyote Safety Waiver
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Please sign our waiver to get access to the playing field.
            </p>
          
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild className="w-full min-w-[200px] uppercase tracking-[0.08em] sm:w-auto">
                <Link href="/waiver">
                  Sign Waiver
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/admin/login">
                  Admin Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
