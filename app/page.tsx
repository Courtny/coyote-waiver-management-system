import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Coyote Airsoft and Paintball Waiver
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Please ign your waiver to get access to the playing field.
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
              className="btn btn-secondary w-full sm:w-auto min-w-[200px] text-center"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
