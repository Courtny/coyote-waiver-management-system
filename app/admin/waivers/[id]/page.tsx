'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

interface WaiverDetail {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  yearOfBirth: string;
  phone?: string;
  emergencyContactPhone: string;
  safetyRulesInitial: string;
  medicalConsentInitial: string;
  photoRelease: boolean;
  minorNames?: string;
  signature: string;
  signatureDate: string;
  waiverYear: number;
  createdAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function WaiverDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [waiver, setWaiver] = useState<WaiverDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check');
        if (response.status === 401 || !response.ok) {
          router.push('/admin/login');
        } else {
          setIsAuthenticated(true);
          loadWaiver();
        }
      } catch {
        router.push('/admin/login');
      }
    };
    checkAuth();
  }, [router]);

  const loadWaiver = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/waivers/${params.id}`);
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load waiver');
      }

      const data = await response.json();
      setWaiver(data.waiver);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading waiver details...</p>
      </div>
    );
  }

  if (error || !waiver) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Waiver not found'}</p>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="btn btn-secondary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const hasCurrentYearWaiver = waiver.waiverYear === currentYear;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>

        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              C&L Entreprises DBA Coyote Airsoft and Paintball
            </h1>
            <h2 className="text-xl text-gray-700 mb-4">
              Field Waiver Disclosure and Release
            </h2>
            <div className="flex items-center justify-center gap-2">
              {hasCurrentYearWaiver ? (
                <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                  <CheckCircle size={20} />
                  Valid {currentYear} Waiver
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                  <XCircle size={20} />
                  Expired (Year: {waiver.waiverYear})
                </span>
              )}
            </div>
          </div>

          <div className="space-y-8">
            {/* Waiver Sections - Read Only */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                1. Acknowledgment of Risk
              </h3>
              <p className="text-gray-700 leading-relaxed">
                I understand that paintball and airsoft are physical activities involving inherent risks, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Cuts, bruises, and welts</li>
                <li>Eye or facial injuries (especially if safety gear is removed)</li>
                <li>Falls due to uneven terrain or obstacles</li>
                <li>Equipment malfunction</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                2. Assumption of Risk
              </h3>
              <p className="text-gray-700 leading-relaxed">
                I voluntarily agree to assume all risks associated with participation, whether known or unknown, even arising from the negligence of the Releasees (field owners) or others.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                3. Release and Waiver
              </h3>
              <p className="text-gray-700 leading-relaxed">
                In consideration of being allowed to participate, I hereby release, waive, and discharge C&L Entreprises DBA Coyote Airsoft and Paintball, its owners, employees, and agents from any and all liability, claims, or causes of action for personal injury, property damage, or wrongful death.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                4. Safety Rules Agreement
              </h3>
              <p className="text-gray-700 leading-relaxed">
                I agree to follow all posted safety rules and verbal instruction whether online or in person posted including by not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Keeping goggles/masks on at all times in playing areas</li>
                <li>Following "barrel sock" and safety-on protocols in staging areas</li>
                <li>Maintaining the minimum engagement distances</li>
              </ul>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Initial: <span className="font-semibold text-gray-900">{waiver.safetyRulesInitial}</span></p>
                <p className="text-sm text-gray-600">
                  By signing above you have certified that you have agreed to follow our safety protocols. Breaking any of our safety protocols could result in immediate expulsion without a refund.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                5. Medical Consent
              </h3>
              <p className="text-gray-700 leading-relaxed">
                I certify that I am physically fit to participate. In the event of an injury, I consent to emergency medical treatment at my own expense
              </p>
              <p className="text-gray-700 leading-relaxed">
                In the event of an allergic reaction I consent to a trained professional giving me medical treatment
              </p>
              <p className="text-gray-700 leading-relaxed">
                In the event of a medical emergency such as an allergic reaction or other disability or illness that the Releasees were not made aware of, I release the Releasees of all expenses, liabilities, claims, or wrongful deaths
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Initial: <span className="font-semibold text-gray-900">{waiver.medicalConsentInitial}</span></p>
                <p className="text-sm text-gray-600">
                  By initialing above you have certified that you are physically fit to play and take all liability of yourself regarding medical awareness.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                6. Photo Release
              </h3>
              <p className="text-gray-700 leading-relaxed">
                I hereby grant C&L Enterprises DBA Coyote Airsoft and Paintball permission to use my likeness in a photograph, video, or other digital media ("photos") in any and all of its publications, including web-based publications, without payment or other consideration. I understand and agree that all photos will become the property of Coyote Airsoft and Paintball and will not be returned. I hereby irrevocably authorize Coyote Airsoft and Paintball to edit, alter, copy, exhibit, publish, or distribute these photos for any lawful purpose.
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Photo Release: <span className="font-semibold text-gray-900">{waiver.photoRelease ? 'Yes' : 'No'}</span>
                </p>
              </div>
            </div>

            {waiver.minorNames && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  7. Minority Age
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  If the participant is of minority age (under 18 years of age), the undersigned parent or guardian hereby gives permission for Releasees to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball and/or Airsoft games.
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Minor Names:</p>
                  <p className="font-semibold text-gray-900">{waiver.minorNames}</p>
                </div>
              </div>
            )}

            {/* Personal Information Section */}
            <div className="border-t-2 border-gray-200 pt-8 space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">
                PERSONAL INFORMATION
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">First Name</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {waiver.firstName}
                  </div>
                </div>

                <div>
                  <label className="label">Last Name</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {waiver.lastName}
                  </div>
                </div>

                <div>
                  <label className="label">Email</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {waiver.email}
                  </div>
                </div>

                <div>
                  <label className="label">Year of Birth</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {waiver.yearOfBirth}
                  </div>
                </div>

                {waiver.phone && (
                  <div>
                    <label className="label">Phone Number</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                      {waiver.phone}
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Emergency Contact Phone</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {waiver.emergencyContactPhone}
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="border-t-2 border-gray-200 pt-8 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                SIGNATURE
              </h3>
              <div>
                <label className="label">Electronic Signature</label>
                <div className="border-2 border-gray-300 rounded-lg bg-white p-4">
                  {waiver.signature && (
                    <img
                      src={waiver.signature}
                      alt="Signature"
                      className="max-w-full h-auto"
                      style={{ maxHeight: '200px' }}
                    />
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Signed on: {new Date(waiver.signatureDate).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Final Acknowledgment */}
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <p className="font-semibold text-yellow-900 leading-relaxed text-center">
                I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE COYOTE FORCE FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.
              </p>
            </div>

            {/* Submission Metadata */}
            <div className="border-t-2 border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Submission Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-semibold">Waiver ID:</span> {waiver.id}
                </div>
                <div>
                  <span className="font-semibold">Waiver Year:</span> {waiver.waiverYear}
                </div>
                {waiver.createdAt && (
                  <div>
                    <span className="font-semibold">Submitted:</span> {new Date(waiver.createdAt).toLocaleString()}
                  </div>
                )}
                {waiver.ipAddress && (
                  <div>
                    <span className="font-semibold">IP Address:</span> {waiver.ipAddress}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
