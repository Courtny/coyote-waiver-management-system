'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, Checkbox, Input, Label } from '@coyote-force/ui';

export default function WaiverPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    yearOfBirth: '',
    phone: '',
    emergencyContactPhone: '',
    safetyRulesInitial: '',
    medicalConsentInitial: '',
    photoRelease: false,
    minorNames: '',
    signature: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 200;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaleX = (canvas.width / dpr) / rect.width;
    const scaleY = (canvas.height / dpr) / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSignature();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png');
    setFormData({
      ...formData,
      signature: dataURL,
    });
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFormData({
      ...formData,
      signature: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/waivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
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
          <h2 className="mb-4 text-2xl font-semibold text-status-green">✓ Waiver Submitted Successfully</h2>
          <p className="mb-6 text-muted-foreground">
            Your waiver has been recorded. You will be redirected to the home page shortly.
          </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="px-6">
          {/* Logo Space */}
          <div className="flex justify-center items-center mb-8 py-4">
            <div className="w-full max-w-xs h-24 flex items-center justify-center">
              <img 
                src="https://cdn.prod.website-files.com/630920951424cec14d1998c7/630e172d632760de2ea309dd_coyote-magfed-opengraph.png" 
                alt="Coyote Airsoft and Paintball Logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-heading mb-2 text-3xl font-semibold tracking-tight text-foreground">
              C&L Enterprises DBA Coyote Airsoft and Paintball
            </h1>
            <h2 className="text-xl text-muted-foreground">
              Field Waiver Disclosure and Release
            </h2>
          </div>
        
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Acknowledgment of Risk */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                1. Acknowledgment of Risk
              </h3>
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

            {/* Section 2: Assumption of Risk */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                2. Assumption of Risk
              </h3>
              <p className="leading-relaxed text-foreground">
                I voluntarily agree to assume all risks associated with participation, whether known or unknown, even arising from the negligence of the Releasees (field owners) or others.
              </p>
            </div>

            {/* Section 3: Release and Waiver */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                3. Release and Waiver
              </h3>
              <p className="leading-relaxed text-foreground">
                In consideration of being allowed to participate, I hereby release, waive, and discharge C&L Entreprises DBA Coyote Airsoft and Paintball, its owners, employees, and agents from any and all liability, claims, or causes of action for personal injury, property damage, or wrongful death.
              </p>
              <p className="leading-relaxed text-foreground">
                I understand and agree that C&L Entreprises DBA Coyote Airsoft and Paintball, its owners, employees, and agents are not responsible for any lost or stolen personal property while on the premises, and I assume all risk of loss or theft of my personal belongings.
              </p>
            </div>

            {/* Section 4: Safety Rules Agreement */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                4. Safety Rules Agreement
              </h3>
              <p className="leading-relaxed text-foreground">
                I agree to follow all posted safety rules and verbal instruction whether online or in person posted including by not limited to:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-foreground">
                <li>Keeping goggles/masks on at all times in playing areas</li>
                <li>Following &quot;barrel sock&quot; and safety-on protocols in staging areas</li>
                <li>Maintaining the minimum engagement distances</li>
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground">
                A list of all field rules can be located on our website or posted around the field. You may also ask a staff member for a paper copy
              </p>
              <div className="space-y-2">
                <Label htmlFor="safetyRulesInitial">
                  Please Initial Here: *
                </Label>
                <Input
                  type="text"
                  id="safetyRulesInitial"
                  name="safetyRulesInitial"
                  className="max-w-xs"
                  required
                  maxLength={10}
                  value={formData.safetyRulesInitial}
                  onChange={handleChange}
                  placeholder="Your initials"
                />
                <p className="text-sm text-muted-foreground">
                  By signing above you have certified that you have agreed to follow our safety protocols. Breaking any of our safety protocols could result in immediate expulsion without a refund.
                </p>
              </div>
            </div>

            {/* Section 5: Medical Consent */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                5. Medical Consent
              </h3>
              <p className="leading-relaxed text-foreground">
                I certify that I am physically fit to participate. In the event of an injury, I consent to emergency medical treatment at my own expense
              </p>
              <p className="leading-relaxed text-foreground">
                In the event of an allergic reaction I consent to a trained professional giving me medical treatment
              </p>
              <p className="leading-relaxed text-foreground">
                In the event of a medical emergency such as an allergic reaction or other disability or illness that the Releasees were not made aware of, I release the Releasees of all expenses, liabilities, claims, or wrongful deaths
              </p>
              <div className="space-y-2">
                <Label htmlFor="medicalConsentInitial">
                  Please Initial Here: *
                </Label>
                <Input
                  type="text"
                  id="medicalConsentInitial"
                  name="medicalConsentInitial"
                  className="max-w-xs"
                  required
                  maxLength={10}
                  value={formData.medicalConsentInitial}
                  onChange={handleChange}
                  placeholder="Your initials"
                />
                <p className="text-sm text-muted-foreground">
                  By initialing above you have certified that you are physically fit to play and take all liability of yourself regarding medical awareness.
                </p>
              </div>
            </div>

            {/* Section 6: Photo Release */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                6. Photo Release
              </h3>
              <p className="leading-relaxed text-foreground">
                I hereby grant C&L Enterprises DBA Coyote Airsoft and Paintball permission to use my likeness in a photograph, video, or other digital media (&quot;photos&quot;) in any and all of its publications, including web-based publications, without payment or other consideration. I understand and agree that all photos will become the property of Coyote Airsoft and Paintball and will not be returned. I hereby irrevocably authorize Coyote Airsoft and Paintball to edit, alter, copy, exhibit, publish, or distribute these photos for any lawful purpose.
              </p>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    name="photoRelease"
                    checked={formData.photoRelease}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, photoRelease: checked === true })
                    }
                  />
                  <span className="text-foreground">I agree to the photo release terms</span>
                </label>
              </div>
            </div>

            {/* Section 7: Minority Age */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                7. Minority Age
              </h3>
              <p className="leading-relaxed text-foreground">
                If the participant is of minority age (under 18 years of age), the undersigned parent or guardian hereby gives permission for Releasees to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball and/or Airsoft games.
              </p>
              <p className="leading-relaxed text-foreground">
                If the participant is left alone with no parent or guardian on the premise, the Releasees do not hold any responsibility of the participant and are released of any liability and risk associated with the minor.
              </p>
              <div className="space-y-2">
                <Label htmlFor="minorNames">
                  List Minor Names (if applicable, comma-separated):
                </Label>
                <Input
                  type="text"
                  id="minorNames"
                  name="minorNames"
                  value={formData.minorNames}
                  onChange={handleChange}
                  placeholder="e.g., John Doe, Jane Doe"
                />
              </div>
            </div>

            <div className="space-y-6 border-t-2 border-border pt-8">
              <h3 className="text-xl font-semibold text-foreground">
                PERSONAL INFORMATION
              </h3>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
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
                  <Label htmlFor="lastName">Last Name *</Label>
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
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
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
              </div>
            </div>

            <div className="space-y-4 border-t-2 border-border pt-8">
              <h3 className="text-xl font-semibold text-foreground">
                SIGNATURE *
              </h3>
              <div className="space-y-2">
                <Label htmlFor="signature">Sign here</Label>
                <div className="relative mb-2 rounded border-2 border-input bg-card">
                  <canvas
                    ref={canvasRef}
                    id="signature"
                    className="block h-[200px] w-full max-w-full cursor-crosshair touch-none border-0"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive-solid"
                    size="sm"
                    onClick={clearSignature}
                  >
                    Clear Signature
                  </Button>
                  {formData.signature && (
                    <span className="flex items-center text-sm text-status-green">
                      ✓ Signature captured
                    </span>
                  )}
                </div>
                <input
                  type="hidden"
                  name="signature"
                  value={formData.signature}
                  required={!formData.signature}
                />
              </div>
              <div className="space-y-2 rounded bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  By hitting accept, you are consenting to the use of your electronic signature in lieu of an original signature on paper.
                </p>
                <p>
                  You have the right to request that you sign a paper copy instead which is available at our location. By hitting accept, you are waiving that right.
                </p>
                <p>
                  Your agreement to use an electronic signature with us for any documents will continue until such time as you notify us in writing that you no longer wish to use an electronic signature. There is no penalty for withdrawing your consent.
                </p>
              </div>
            </div>

            <div className="rounded border border-khaki/50 bg-khaki/15 p-6">
              <p className="text-center font-semibold leading-relaxed text-foreground">
                I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE COYOTE FORCE FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.
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
                disabled={isSubmitting || !formData.photoRelease || !formData.signature}
              >
                {isSubmitting ? 'Submitting...' : 'Accept & Submit Waiver'}
              </Button>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
                <p>Your information is securely stored and protected</p>
                <Button variant="link" asChild>
                  <Link href="/admin/login">
                    Staff Dashboard Access
                  </Link>
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
