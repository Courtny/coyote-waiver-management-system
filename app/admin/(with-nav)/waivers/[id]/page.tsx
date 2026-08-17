'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import AdminPageShell from '@/components/admin/AdminPageShell';

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

  const loadWaiver = useCallback(async () => {
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
  }, [params.id, router]);

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
  }, [router, loadWaiver]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading waiver details...</p>
      </div>
    );
  }

  if (error || !waiver) {
    return (
      <AdminPageShell title="Waiver" backHref="/admin/dashboard">
        <div className="rounded border border-border bg-card p-6">
          <div className="text-center">
            <p className="mb-4 text-destructive">{error || 'Waiver not found'}</p>
            <button type="button" onClick={() => router.push('/admin/dashboard')} className="inline-flex items-center justify-center rounded border border-border bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-muted">
              Back to Dashboard
            </button>
          </div>
        </div>
      </AdminPageShell>
    );
  }

  const currentYear = new Date().getFullYear();
  const hasCurrentYearWaiver = waiver.waiverYear === currentYear;

  return (
    <AdminPageShell
      title={`${waiver.firstName} ${waiver.lastName}`}
      backHref="/admin/dashboard"
      description={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {hasCurrentYearWaiver ? (
            <span className="inline-flex items-center gap-1 font-semibold text-status-green">
              <CheckCircle size={18} />
              Valid {currentYear} waiver
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-destructive">
              <XCircle size={18} />
              Expired (year: {waiver.waiverYear})
            </span>
          )}
          <span className="text-muted-foreground">·</span>
          <span>{waiver.email}</span>
        </div>
      }
    >
        <div className="rounded border border-border bg-card p-6 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              C&L Entreprises DBA Coyote Airsoft and Paintball
            </h1>
            <h2 className="text-xl text-foreground mb-4">
              Field Waiver Disclosure and Release
            </h2>
          </div>

          <div className="space-y-8">
            {/* Waiver Sections - Read Only */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                1. Acknowledgment of Risk
              </h3>
              <p className="text-foreground leading-relaxed">
                I understand that paintball and airsoft are physical activities involving inherent risks, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Cuts, bruises, and welts</li>
                <li>Eye or facial injuries (especially if safety gear is removed)</li>
                <li>Falls due to uneven terrain or obstacles</li>
                <li>Equipment malfunction</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                2. Assumption of Risk
              </h3>
              <p className="text-foreground leading-relaxed">
                I voluntarily agree to assume all risks associated with participation, whether known or unknown, even arising from the negligence of the Releasees (field owners) or others.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                3. Release and Waiver
              </h3>
              <p className="text-foreground leading-relaxed">
                In consideration of being allowed to participate, I hereby release, waive, and discharge C&L Entreprises DBA Coyote Airsoft and Paintball, its owners, employees, and agents from any and all liability, claims, or causes of action for personal injury, property damage, or wrongful death.
              </p>
              <p className="text-foreground leading-relaxed">
                I understand and agree that C&L Entreprises DBA Coyote Airsoft and Paintball, its owners, employees, and agents are not responsible for any lost or stolen personal property while on the premises, and I assume all risk of loss or theft of my personal belongings.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                4. Safety Rules Agreement
              </h3>
              <p className="text-foreground leading-relaxed">
                I agree to follow all posted safety rules and verbal instruction whether online or in person posted including by not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Keeping goggles/masks on at all times in playing areas</li>
                <li>Following &quot;barrel sock&quot; and safety-on protocols in staging areas</li>
                <li>Maintaining the minimum engagement distances</li>
              </ul>
              <div className="mt-4 p-4 bg-muted rounded">
                <p className="text-sm text-muted-foreground mb-2">Initial: <span className="font-semibold text-foreground">{waiver.safetyRulesInitial}</span></p>
                <p className="text-sm text-muted-foreground">
                  By signing above you have certified that you have agreed to follow our safety protocols. Breaking any of our safety protocols could result in immediate expulsion without a refund.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                5. Medical Consent
              </h3>
              <p className="text-foreground leading-relaxed">
                I certify that I am physically fit to participate. In the event of an injury, I consent to emergency medical treatment at my own expense
              </p>
              <p className="text-foreground leading-relaxed">
                In the event of an allergic reaction I consent to a trained professional giving me medical treatment
              </p>
              <p className="text-foreground leading-relaxed">
                In the event of a medical emergency such as an allergic reaction or other disability or illness that the Releasees were not made aware of, I release the Releasees of all expenses, liabilities, claims, or wrongful deaths
              </p>
              <div className="mt-4 p-4 bg-muted rounded">
                <p className="text-sm text-muted-foreground mb-2">Initial: <span className="font-semibold text-foreground">{waiver.medicalConsentInitial}</span></p>
                <p className="text-sm text-muted-foreground">
                  By initialing above you have certified that you are physically fit to play and take all liability of yourself regarding medical awareness.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                6. Photo Release
              </h3>
              <p className="text-foreground leading-relaxed">
                I hereby grant C&L Enterprises DBA Coyote Airsoft and Paintball permission to use my likeness in a photograph, video, or other digital media (&quot;photos&quot;) in any and all of its publications, including web-based publications, without payment or other consideration. I understand and agree that all photos will become the property of Coyote Airsoft and Paintball and will not be returned. I hereby irrevocably authorize Coyote Airsoft and Paintball to edit, alter, copy, exhibit, publish, or distribute these photos for any lawful purpose.
              </p>
              <div className="mt-4 p-4 bg-muted rounded">
                <p className="text-sm text-muted-foreground">
                  Photo Release: <span className="font-semibold text-foreground">{waiver.photoRelease ? 'Yes' : 'No'}</span>
                </p>
              </div>
            </div>

            {waiver.minorNames && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  7. Minority Age
                </h3>
                <p className="text-foreground leading-relaxed">
                  If the participant is of minority age (under 18 years of age), the undersigned parent or guardian hereby gives permission for Releasees to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball and/or Airsoft games.
                </p>
                <div className="mt-4 p-4 bg-muted rounded">
                  <p className="text-sm text-muted-foreground mb-2">Minor Names:</p>
                  <p className="font-semibold text-foreground">{waiver.minorNames}</p>
                </div>
              </div>
            )}

            {/* Personal Information Section */}
            <div className="border-t-2 border-border pt-8 space-y-6">
              <h3 className="text-xl font-semibold text-foreground">
                PERSONAL INFORMATION
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">First Name</label>
                  <div className="p-3 bg-muted rounded text-foreground font-medium">
                    {waiver.firstName}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Last Name</label>
                  <div className="p-3 bg-muted rounded text-foreground font-medium">
                    {waiver.lastName}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Email</label>
                  <div className="p-3 bg-muted rounded text-foreground">
                    {waiver.email}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Year of Birth</label>
                  <div className="p-3 bg-muted rounded text-foreground">
                    {waiver.yearOfBirth}
                  </div>
                </div>

                {waiver.phone && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Phone Number</label>
                    <div className="p-3 bg-muted rounded text-foreground">
                      {waiver.phone}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Emergency Contact Phone</label>
                  <div className="p-3 bg-muted rounded text-foreground">
                    {waiver.emergencyContactPhone}
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="border-t-2 border-border pt-8 space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                SIGNATURE
              </h3>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Electronic Signature</label>
                <div className="border-2 border-input rounded bg-card p-4">
                  {waiver.signature && (
                    <img
                      src={waiver.signature}
                      alt="Signature"
                      className="max-w-full h-auto"
                      style={{ maxHeight: '200px' }}
                    />
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Signed on: {new Date(waiver.signatureDate).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Final Acknowledgment */}
            <div className="bg-yellow-50 p-6 rounded border border-yellow-200">
              <p className="font-semibold text-yellow-900 leading-relaxed text-center">
                I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE COYOTE FORCE FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.
              </p>
            </div>

            {/* Submission Metadata */}
            <div className="border-t-2 border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Submission Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
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
    </AdminPageShell>
  );
}
