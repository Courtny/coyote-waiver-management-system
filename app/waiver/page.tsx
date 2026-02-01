'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-green-600 text-2xl font-bold mb-4">✓ Waiver Submitted Successfully</h2>
          <p className="text-gray-600 mb-6">
            Your waiver has been recorded. You will be redirected to the home page shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              C&L Enterprises DBA Coyote Airsoft and Paintball
            </h1>
            <h2 className="text-xl text-gray-700">
              Field Waiver Disclosure and Release
            </h2>
          </div>
        
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Acknowledgment of Risk */}
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

            {/* Section 2: Assumption of Risk */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                2. Assumption of Risk
              </h3>
              <p className="text-gray-700 leading-relaxed">
                I voluntarily agree to assume all risks associated with participation, whether known or unknown, even arising from the negligence of the Releasees (field owners) or others.
              </p>
            </div>

            {/* Section 3: Release and Waiver */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                3. Release and Waiver
              </h3>
              <p className="text-gray-700 leading-relaxed">
                In consideration of being allowed to participate, I hereby release, waive, and discharge C&L Entreprises DBA Coyote Airsoft and Paintball, its owners, employees, and agents from any and all liability, claims, or causes of action for personal injury, property damage, or wrongful death.
              </p>
            </div>

            {/* Section 4: Safety Rules Agreement */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                4. Safety Rules Agreement
              </h3>
              <p className="text-gray-700 leading-relaxed">
                I agree to follow all posted safety rules and verbal instruction whether online or in person posted including by not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Keeping goggles/masks on at all times in playing areas</li>
                <li>Following &quot;barrel sock&quot; and safety-on protocols in staging areas</li>
                <li>Maintaining the minimum engagement distances</li>
              </ul>
              <p className="text-sm text-gray-600 leading-relaxed">
                A list of all field rules can be located on our website or posted around the field. You may also ask a staff member for a paper copy
              </p>
              <div className="form-group">
                <label className="label" htmlFor="safetyRulesInitial">
                  Please Initial Here: *
                </label>
                <input
                  type="text"
                  id="safetyRulesInitial"
                  name="safetyRulesInitial"
                  className="input max-w-xs"
                  required
                  maxLength={10}
                  value={formData.safetyRulesInitial}
                  onChange={handleChange}
                  placeholder="Your initials"
                />
                <p className="mt-2 text-sm text-gray-600">
                  By signing above you have certified that you have agreed to follow our safety protocols. Breaking any of our safety protocols could result in immediate expulsion without a refund.
                </p>
              </div>
            </div>

            {/* Section 5: Medical Consent */}
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
              <div className="form-group">
                <label className="label" htmlFor="medicalConsentInitial">
                  Please Initial Here: *
                </label>
                <input
                  type="text"
                  id="medicalConsentInitial"
                  name="medicalConsentInitial"
                  className="input max-w-xs"
                  required
                  maxLength={10}
                  value={formData.medicalConsentInitial}
                  onChange={handleChange}
                  placeholder="Your initials"
                />
                <p className="mt-2 text-sm text-gray-600">
                  By initialing above you have certified that you are physically fit to play and take all liability of yourself regarding medical awareness.
                </p>
              </div>
            </div>

            {/* Section 6: Photo Release */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                6. Photo Release
              </h3>
              <p className="text-gray-700 leading-relaxed">
                I hereby grant C&L Enterprises DBA Coyote Airsoft and Paintball permission to use my likeness in a photograph, video, or other digital media (&quot;photos&quot;) in any and all of its publications, including web-based publications, without payment or other consideration. I understand and agree that all photos will become the property of Coyote Airsoft and Paintball and will not be returned. I hereby irrevocably authorize Coyote Airsoft and Paintball to edit, alter, copy, exhibit, publish, or distribute these photos for any lawful purpose.
              </p>
              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="photoRelease"
                    checked={formData.photoRelease}
                    onChange={handleChange}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span className="text-gray-700">I agree to the photo release terms</span>
                </label>
              </div>
            </div>

            {/* Section 7: Minority Age */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                7. Minority Age
              </h3>
              <p className="text-gray-700 leading-relaxed">
                If the participant is of minority age (under 18 years of age), the undersigned parent or guardian hereby gives permission for Releasees to authorize emergency medical treatment as may be deemed necessary for the child named below while participating in Paintball and/or Airsoft games.
              </p>
              <p className="text-gray-700 leading-relaxed">
                If the participant is left alone with no parent or guardian on the premise, the Releasees do not hold any responsibility of the participant and are released of any liability and risk associated with the minor.
              </p>
              <div className="form-group">
                <label className="label" htmlFor="minorNames">
                  List Minor Names (if applicable, comma-separated):
                </label>
                <input
                  type="text"
                  id="minorNames"
                  name="minorNames"
                  className="input"
                  value={formData.minorNames}
                  onChange={handleChange}
                  placeholder="e.g., John Doe, Jane Doe"
                />
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="border-t-2 border-gray-200 pt-8 space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">
                PERSONAL INFORMATION
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label" htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="input"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="input"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label" htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="input"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="yearOfBirth">Year of Birth *</label>
                  <input
                    type="number"
                    id="yearOfBirth"
                    name="yearOfBirth"
                    className="input"
                    required
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.yearOfBirth}
                    onChange={handleChange}
                    placeholder="YYYY"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label" htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="input"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="emergencyContactPhone">Emergency Contact Phone *</label>
                  <input
                    type="tel"
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    className="input"
                    required
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="border-t-2 border-gray-200 pt-8 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                SIGNATURE *
              </h3>
              <div className="form-group">
                <label className="label" htmlFor="signature">Sign here</label>
                <div className="border-2 border-gray-300 rounded-lg bg-white relative mb-2">
                  <canvas
                    ref={canvasRef}
                    id="signature"
                    className="w-full max-w-full h-[200px] cursor-crosshair touch-none block border-0"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="btn btn-danger text-sm py-2 px-4"
                  >
                    Clear Signature
                  </button>
                  {formData.signature && (
                    <span className="text-green-600 text-sm flex items-center">
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
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed space-y-2">
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

            {/* Final Acknowledgment */}
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <p className="font-semibold text-yellow-900 leading-relaxed text-center">
                I HAVE READ THE ABOVE WAIVER AND RELEASE AND BY SIGNING IT AGREE IT IS MY INTENTION TO EXEMPT AND RELIEVE COYOTE FORCE FROM LIABILITY FOR PERSONAL INJURY, PROPERTY DAMAGE OR WRONGFUL DEATH CAUSED BY NEGLIGENCE OR ANY OTHER CAUSE.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !formData.photoRelease || !formData.signature}
              >
                {isSubmitting ? 'Submitting...' : 'Accept & Submit Waiver'}
              </button>
            </div>

            {/* Disclaimer Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600">
                <p>Your information is securely stored and protected</p>
                <Link 
                  href="/admin/login"
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Staff Dashboard Access
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
