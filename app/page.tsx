import Link from 'next/link';

export default function Home() {
  return (
    <div 
        className="min-h-screen py-8 px-4 relative flex items-center justify-center"
        style={{
          backgroundImage: 'url(/coyote-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 1,
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60" style={{ zIndex: 1 }}></div>
      
      <div className="w-auto mx-auto relative z-10">
        {/* Logo above container */}
        <div className="flex justify-center items-center mb-6">
          <img 
            src="/Coyote-Airsoft-Paintball-Logo.svg" 
            alt="Coyote Airsoft and Paintball Logo" 
            className="h-auto drop-shadow-lg"
            style={{ width: '200px' }}
          />
        </div>
        
        <div className="card bg-white/95 backdrop-blur-sm shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Coyote Safety Waiver
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Please sign our waiver to get access to the playing field.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/waiver" 
              className="btn btn-primary w-full sm:w-auto min-w-[200px] text-center"
            >
              Sign Waiver
            </Link>
            <Link 
              href="/admin/login" 
              // (No className prop for simple hyperlink)
            >
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
