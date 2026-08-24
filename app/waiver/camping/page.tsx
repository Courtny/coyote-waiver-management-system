'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, Input, Label } from '@coyote-force/ui';
import SignaturePad from '@/components/SignaturePad';

function isUnder18(yearOfBirth: string): boolean {
  const yob = Number(yearOfBirth);
  if (!Number.isFinite(yob) || yob < 1900) return false;
  return new Date().getFullYear() - yob < 18;
}

export default function CampingWaiverPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    yearOfBirth: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    signature: '',
    guardianName: '',
    guardianSignature: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const needsGuardian = useMemo(
    () => isUnder18(formData.yearOfBirth),
    [formData.yearOfBirth]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const canSubmit =
    !!formData.signature &&
    (!needsGuardian || (!!formData.guardianName.trim() && !!formData.guardianSignature));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          yearOfBirth: formData.yearOfBirth,
          phone: formData.phone,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          signature: formData.signature,
          guardianName: needsGuardian ? formData.guardianName : undefined,
          guardianSignature: needsGuardian ? formData.guardianSignature : undefined,
          waiverType: 'camping',
          // Field-only columns required by DB NOT NULL constraints
          safetyRulesInitial: '',
          medicalConsentInitial: '',
          photoRelease: false,
          signatureDate: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit waiver');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent>
            <h2 className="mb-4 text-2xl font-semibold text-status-green">
              ✓ Camping Waiver Submitted Successfully
            </h2>
            <p className="mb-6 text-muted-foreground">
              Your camping waiver has been recorded. You will be redirected to the home page shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="px-6">
            <div className="mb-8 flex items-center justify-center py-4">
              <div className="flex h-24 w-full max-w-xs items-center justify-center">
                <img
                  src="https://cdn.prod.website-files.com/630920951424cec14d1998c7/630e172d632760de2ea309dd_coyote-magfed-opengraph.png"
                  alt="Coyote Airsoft and Paintball Logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            <div className="mb-8 text-center">
              <h1 className="font-heading mb-2 text-3xl font-semibold tracking-tight text-foreground">
                Coyote Airsoft and Paintball
              </h1>
              <h2 className="text-xl text-muted-foreground">
                Release of Liability, Waiver of Claims, and Assumption of Risk Agreement
              </h2>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                Camping Waiver
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                IMPORTANT: PLEASE READ CAREFULLY BEFORE SIGNING. THIS IS A LEGAL DOCUMENT THAT AFFECTS YOUR LEGAL RIGHTS.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  1. Parties and Facility
                </h3>
                <p className="leading-relaxed text-foreground">
                  In consideration of being permitted to use the camping grounds, facilities, and property located at Coyote Airsoft and Paintball (hereinafter referred to as the &quot;Field&quot;), the undersigned Participant (and, if the Participant is a minor, the Parent or Legal Guardian) freely and voluntarily executes this Release of Liability.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  2. Acknowledgment of Risks
                </h3>
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
                <h3 className="text-xl font-semibold text-foreground">
                  3. Assumption of Risk
                </h3>
                <p className="leading-relaxed text-foreground">
                  I knowingly and freely assume all such risks, both known and unknown, associated with camping at the Field, whether arising from the negligence of the releasees or otherwise, and assume full responsibility for my participation, safety, and personal property.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  4. Release and Waiver of Liability
                </h3>
                <p className="leading-relaxed text-foreground">
                  I hereby release, waive, and forever discharge Coyote Airsoft and Paintball, its owners, operators, employees, agents, landowners, and volunteers (collectively, the &quot;Releasees&quot;) from any and all liability, claims, demands, or causes of action arising out of negligence. I agree not to sue the Releasees for any injury, disability, death, or property damage suffered by me while camping on the premises.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  5. Rules and Regulations Compliance
                </h3>
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Participant First Name *</Label>
                    <Input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Participant Last Name *</Label>
                    <Input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="yearOfBirth">Year of Birth *</Label>
                    <Input
                      type="number"
                      id="yearOfBirth"
                      name="yearOfBirth"
                      required
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.yearOfBirth}
                      onChange={handleChange}
                      placeholder="YYYY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                    <Input
                      type="text"
                      id="emergencyContactName"
                      name="emergencyContactName"
                      required
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                  <Input
                    type="tel"
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    required
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                  />
                </div>

                <SignaturePad
                  id="signature"
                  label="Participant Signature *"
                  value={formData.signature}
                  onChange={(signature) => setFormData((prev) => ({ ...prev, signature }))}
                  required
                />
              </div>

              {needsGuardian && (
                <div className="space-y-6 rounded border border-khaki/50 bg-khaki/15 p-6">
                  <h3 className="text-xl font-semibold text-foreground">
                    For Minors Under 18 Years of Age
                  </h3>
                  <p className="leading-relaxed text-foreground">
                    I am the parent or legal guardian of the minor participant named above. I have read this document, understand its terms, and freely consent to their participation in camping at Coyote Airsoft and Paintball under these conditions.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Parent/Guardian Name (Printed) *</Label>
                    <Input
                      type="text"
                      id="guardianName"
                      name="guardianName"
                      required={needsGuardian}
                      value={formData.guardianName}
                      onChange={handleChange}
                    />
                  </div>
                  <SignaturePad
                    id="guardianSignature"
                    label="Parent/Guardian Signature *"
                    value={formData.guardianSignature}
                    onChange={(guardianSignature) =>
                      setFormData((prev) => ({ ...prev, guardianSignature }))
                    }
                    required
                  />
                </div>
              )}

              <div className="space-y-2 rounded bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  By hitting accept, you are consenting to the use of your electronic signature in lieu of an original signature on paper.
                </p>
                <p>
                  You have the right to request that you sign a paper copy instead which is available at our location. By hitting accept, you are waiving that right.
                </p>
              </div>

              <div className="rounded border border-khaki/50 bg-khaki/15 p-6">
                <p className="text-center font-semibold leading-relaxed text-foreground">
                  I HAVE READ THIS RELEASE OF LIABILITY, WAIVER OF CLAIMS, AND ASSUMPTION OF RISK AGREEMENT AND AGREE TO ITS TERMS.
                </p>
              </div>

              {error && (
                <div className="rounded border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <Button
                  type="submit"
                  className="w-full uppercase tracking-[0.08em]"
                  disabled={isSubmitting || !canSubmit}
                >
                  {isSubmitting ? 'Submitting...' : 'Accept & Submit Camping Waiver'}
                </Button>
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
                  <p>Your information is securely stored and protected</p>
                  <Button variant="link" asChild>
                    <Link href="/admin/login">Staff Dashboard Access</Link>
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
