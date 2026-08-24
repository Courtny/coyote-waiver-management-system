'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import AdminPageShell from '@/components/admin/AdminPageShell';
import type { WaiverType } from '@/lib/types';

interface WaiverDetail {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  yearOfBirth: string;
  phone?: string;
  emergencyContactPhone: string;
  emergencyContactName?: string;
  safetyRulesInitial: string;
  medicalConsentInitial: string;
  photoRelease: boolean;
  minorNames?: string;
  signature: string;
  signatureDate: string;
  waiverYear: number;
  waiverType?: WaiverType;
  guardianName?: string;
  guardianSignature?: string;
  createdAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

function SubmissionMeta({ waiver }: { waiver: WaiverDetail }) {
  return (
    <div className="border-t-2 border-border pt-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Submission Details</h3>
      <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground md:grid-cols-2">
        <div>
          <span className="font-semibold">Waiver ID:</span> {waiver.id}
        </div>
        <div>
          <span className="font-semibold">Type:</span>{' '}
          {waiver.waiverType === 'camping' ? 'Camping' : 'Field'}
        </div>
        <div>
          <span className="font-semibold">Waiver Year:</span> {waiver.waiverYear}
        </div>
        {waiver.createdAt && (
          <div>
            <span className="font-semibold">Submitted:</span>{' '}
            {new Date(waiver.createdAt).toLocaleString()}
          </div>
        )}
        {waiver.ipAddress && (
          <div>
            <span className="font-semibold">IP Address:</span> {waiver.ipAddress}
          </div>
        )}
      </div>
    </div>
  );
}

function CampingWaiverDetail({ waiver }: { waiver: WaiverDetail }) {
  return (
    <div className="mx-auto max-w-4xl rounded border border-border bg-card p-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Coyote Airsoft and Paintball
        </h1>
        <h2 className="mb-2 text-xl text-foreground">
          Release of Liability, Waiver of Claims, and Assumption of Risk Agreement
        </h2>
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Camping Waiver
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">1. Parties and Facility</h3>
          <p className="leading-relaxed text-foreground">
            In consideration of being permitted to use the camping grounds, facilities, and property located at Coyote Airsoft and Paintball (hereinafter referred to as the &quot;Field&quot;), the undersigned Participant (and, if the Participant is a minor, the Parent or Legal Guardian) freely and voluntarily executes this Release of Liability.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">2. Acknowledgment of Risks</h3>
          <p className="leading-relaxed text-foreground">
            I understand and acknowledge that camping at a paintball and airsoft facility involves inherent risks, hazards, and dangers that cannot be entirely eliminated regardless of the care taken to avoid injuries. These risks include, but are not limited to:
          </p>
          <ul className="ml-4 list-inside list-disc space-y-2 text-foreground">
            <li>
              <span className="font-semibold">Property Hazards:</span> Rough terrain, uneven ground, slips, trips, falls, mud, holes, tree branches, and wildlife (e.g., insects, snakes, ticks, or large animals).
            </li>
            <li>
              <span className="font-semibold">Environmental Factors:</span> Extreme weather conditions, including severe storms, lightning, high winds, extreme heat or cold, and flash flooding.
            </li>
            <li>
              <span className="font-semibold">Fire and Equipment Risks:</span> Use of campfires, grills, propane stoves, generators, and personal camping equipment resulting in burns, smoke inhalation, or carbon monoxide exposure.
            </li>
            <li>
              <span className="font-semibold">Third-Party Conduct:</span> Actions of other campers, visitors, or participants, including reckless behavior, consumption of prohibited substances, or accidental discharge of equipment.
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">3. Assumption of Risk</h3>
          <p className="leading-relaxed text-foreground">
            I knowingly and freely assume all such risks, both known and unknown, associated with camping at the Field, whether arising from the negligence of the releasees or otherwise, and assume full responsibility for my participation, safety, and personal property.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">4. Release and Waiver of Liability</h3>
          <p className="leading-relaxed text-foreground">
            I hereby release, waive, and forever discharge Coyote Airsoft and Paintball, its owners, operators, employees, agents, landowners, and volunteers (collectively, the &quot;Releasees&quot;) from any and all liability, claims, demands, or causes of action arising out of negligence. I agree not to sue the Releasees for any injury, disability, death, or property damage suffered by me while camping on the premises.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">5. Rules and Regulations Compliance</h3>
          <p className="leading-relaxed text-foreground">
            I agree to obey all posted rules and verbal instructions given by the Field staff while camping. I specifically acknowledge and agree to the following property policies:
          </p>
          <ul className="ml-4 list-inside list-disc space-y-2 text-foreground">
            <li>
              <span className="font-semibold">Quiet Hours:</span> Quiet hours are strictly enforced after 10:00 PM. Excessive noise, loud music, or disruptive behavior after this time is prohibited.
            </li>
            <li>
              <span className="font-semibold">Campfire Regulations:</span> All campfires must be completely off the ground and fully contained in an approved elevated fire pit or ring. No open ground fires are permitted.
            </li>
            <li>
              <span className="font-semibold">Conduct:</span> The consumption of illegal drugs or the unauthorized use of alcohol may result in immediate expulsion from the property without a refund.
            </li>
          </ul>
        </div>

        <div className="space-y-6 border-t-2 border-border pt-8">
          <h3 className="text-xl font-semibold text-foreground">
            6. Participant Information &amp; Signatures
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">First Name</label>
              <div className="rounded bg-muted p-3 font-medium text-foreground">{waiver.firstName}</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Last Name</label>
              <div className="rounded bg-muted p-3 font-medium text-foreground">{waiver.lastName}</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Email</label>
              <div className="rounded bg-muted p-3 text-foreground">{waiver.email}</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Phone</label>
              <div className="rounded bg-muted p-3 text-foreground">{waiver.phone || '—'}</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Year of Birth</label>
              <div className="rounded bg-muted p-3 text-foreground">{waiver.yearOfBirth}</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Emergency Contact Name
              </label>
              <div className="rounded bg-muted p-3 text-foreground">
                {waiver.emergencyContactName || '—'}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Emergency Contact Phone
              </label>
              <div className="rounded bg-muted p-3 text-foreground">
                {waiver.emergencyContactPhone}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t-2 border-border pt-8">
          <h3 className="text-xl font-semibold text-foreground">Participant Signature</h3>
          <div className="rounded border-2 border-input bg-card p-4">
            {waiver.signature && (
              <img
                src={waiver.signature}
                alt="Participant signature"
                className="h-auto max-w-full"
                style={{ maxHeight: '200px' }}
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Signed on: {new Date(waiver.signatureDate).toLocaleString()}
          </p>
        </div>

        {(waiver.guardianName || waiver.guardianSignature) && (
          <div className="space-y-4 rounded border border-khaki/50 bg-khaki/15 p-6">
            <h3 className="text-xl font-semibold text-foreground">
              Parent/Guardian (Minor Participant)
            </h3>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Parent/Guardian Name
              </label>
              <div className="rounded bg-muted p-3 font-medium text-foreground">
                {waiver.guardianName || '—'}
              </div>
            </div>
            {waiver.guardianSignature && (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Parent/Guardian Signature
                </label>
                <div className="rounded border-2 border-input bg-card p-4">
                  <img
                    src={waiver.guardianSignature}
                    alt="Guardian signature"
                    className="h-auto max-w-full"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="rounded border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-center font-semibold leading-relaxed text-yellow-900">
            I HAVE READ THIS RELEASE OF LIABILITY, WAIVER OF CLAIMS, AND ASSUMPTION OF RISK AGREEMENT AND AGREE TO ITS TERMS.
          </p>
        </div>

        <SubmissionMeta waiver={waiver} />
      </div>
    </div>
  );
}

function FieldWaiverDetail({ waiver }: { waiver: WaiverDetail }) {
  return (
    <div className="mx-auto max-w-4xl rounded border border-border bg-card p-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          C&L Entreprises DBA Coyote Airsoft and Paintball
        </h1>
        <h2 className="mb-4 text-xl text-foreground">Field Waiver Disclosure and Release</h2>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">1. Acknowledgment of Risk</h3>
          <p className="leading-relaxed text-foreground">
            I understand that paintball and airsoft are physical activities involving inherent risks, including but not limited to:
          </p>
          <ul className="ml-4 list-inside list-disc space-y-2 text-foreground">
            <li>Cuts, bruises, and welts</li>
            <li>Eye or facial injuries (especially if safety gear is removed)</li>
            <li>Falls due to uneven terrain or obstacles</li>
            <li>Equipment malfunction</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">2. Assumption of Risk</h3>
          <p className="leading-relaxed text-foreground">
            I voluntarily agree to assume all risks associated with participation, whether known or unknown, even arising from the negligence of the Releasees (field owners) or others.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">3. Release and Waiver</h3>
          <p className="leading-relaxed text-foreground">
            In consideration of being allowed to participate, I hereby release, waive, and discharge C&L Entreprises DBA Coyote Airsoft and Paintball, its owners, employees, and agents from any and all liability, claims, or causes of action for personal injury, property damage, or wrongful death.
          </p>
          <p className="leading-relaxed text-foreground">
            I understand and agree that C&L Entreprises DBA Coyote Airsoft and Paintball, its owners, employees, and agents are not responsible for any lost or stolen personal property while on the premises, and I assume all risk of loss or theft of my personal belongings.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">4. Safety Rules Agreement</h3>
          <p className="leading-relaxed text-foreground">
            I agree to follow all posted safety rules and verbal instruction whether online or in person posted including by not limited to:
          </p>
          <ul className="ml-4 list-inside list-disc space-y-2 text-foreground">
            <li>Keeping goggles/masks on at all times in playing areas</li>
            <li>Following &quot;barrel sock&quot; and safety-on protocols in staging areas</li>
            <li>Maintaining the minimum engagement distances</li>
          </ul>
          <div className="mt-4 rounded bg-muted p-4">
            <p className="mb-2 text-sm text-muted-foreground">
              Initial:{' '}
              <span className="font-semibold text-foreground">{waiver.safetyRulesInitial}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              By signing above you have certified that you have agreed to follow our safety protocols. Breaking any of our safety protocols could result in immediate expulsion without a refund.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">5. Medical Consent</h3>
          <p className="leading-relaxed text-foreground">
            I certify that I am physically fit to participate. In the event of an injury, I consent to emergency medical treatment at my own expense
          </p>
          <p className="leading-relaxed text-foreground">
            In the event of an allergic reaction I consent to a trained professional giving me medical treatment
          </p>
          <p className="leading-relaxed text-foreground">
            In the event of a medical emergency such as an allergic reaction or other disability or illness that the Releasees were not made aware of, I release the Releasees of all expenses, liabilities, claims, or wrongful deaths
          </p>
          <div className="mt-4 rounded bg-muted p-4">
            <p className="mb-2 text-sm text-muted-foreground">
              Initial:{' '}
              <span className="font-semibold text-foreground">{waiver.medicalConsentInitial}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              By initialing above you have certified that you are physically fit to play and take all liability of yourself regarding medical awareness.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">6. Photo Release</h3>
          <p className="leading-relaxed text-foreground">
            I hereby grant C&L Enterprises DBA Coyote Airsoft and Paintball permission to use my likeness in a photograph, video, or other digital media (&quot;photos&quot;) in any and all of its publications, including web-based publications, without payment or other consideration. I understand and agree that all photos will become the property of Coyote Airsoft and Paintball and will not be returned. I hereby irrevocably authorize Coyote Airsoft and Paintball to edit, alter, copy, exhibit, publish, or distribute these photos for any lawful purpose.
          </p>
          <div className="mt-4 rounded bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Photo Release:{' '}
              <span className="font-semibold text-foreground">
                {waiver.photoRelease ? 'Yes' : 'No'}
              </span>
            </p>
          </div>
        </div>

        {waiver.minorNames && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">7. Minority Age</h3>
            <p className="leading-relaxed text-foreground">
              If the participant is of minority age (under 18 years of age), the undersigned parent or guardian hereby gives permission for Releasees to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball and/or Airsoft games.
            </p>
            <div className="mt-4 rounded bg-muted p-4">
              <p className="mb-2 text-sm text-muted-foreground">Minor Names:</p>
              <p className="font-semibold text-foreground">{waiver.minorNames}</p>
            </div>
          </div>
        )}

        <div className="space-y-6 border-t-2 border-border pt-8">
          <h3 className="text-xl font-semibold text-foreground">PERSONAL INFORMATION</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">First Name</label>
              <div className="rounded bg-muted p-3 font-medium text-foreground">{waiver.firstName}</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Last Name</label>
              <div className="rounded bg-muted p-3 font-medium text-foreground">{waiver.lastName}</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Email</label>
              <div className="rounded bg-muted p-3 text-foreground">{waiver.email}</div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Year of Birth</label>
              <div className="rounded bg-muted p-3 text-foreground">{waiver.yearOfBirth}</div>
            </div>
            {waiver.phone && (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Phone Number</label>
                <div className="rounded bg-muted p-3 text-foreground">{waiver.phone}</div>
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Emergency Contact Phone
              </label>
              <div className="rounded bg-muted p-3 text-foreground">
                {waiver.emergencyContactPhone}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t-2 border-border pt-8">
          <h3 className="text-xl font-semibold text-foreground">SIGNATURE</h3>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Electronic Signature
            </label>
            <div className="rounded border-2 border-input bg-card p-4">
              {waiver.signature && (
                <img
                  src={waiver.signature}
                  alt="Signature"
                  className="h-auto max-w-full"
                  style={{ maxHeight: '200px' }}
                />
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Signed on: {new Date(waiver.signatureDate).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="rounded border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-center font-semibold leading-relaxed text-yellow-900">
            I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE COYOTE FORCE FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.
          </p>
        </div>

        <SubmissionMeta waiver={waiver} />
      </div>
    </div>
  );
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
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="inline-flex items-center justify-center rounded border border-border bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </AdminPageShell>
    );
  }

  const currentYear = new Date().getFullYear();
  const hasCurrentYearWaiver = waiver.waiverYear === currentYear;
  const isCamping = waiver.waiverType === 'camping';

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
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
              isCamping ? 'bg-khaki/30 text-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {isCamping ? 'Camping' : 'Field'}
          </span>
          <span className="text-muted-foreground">·</span>
          <span>{waiver.email}</span>
        </div>
      }
    >
      {isCamping ? (
        <CampingWaiverDetail waiver={waiver} />
      ) : (
        <FieldWaiverDetail waiver={waiver} />
      )}
    </AdminPageShell>
  );
}
