'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getContractTemplate,
  type ContractType,
} from '@/lib/contracts/contractTemplates';
import ContractDocumentA4 from '@/components/contracts/ContractDocumentA4';
import {
  saveContract,
  type ContractStatus,
  type SignedContractRecord,
} from '@/lib/contracts/contractStore';

const PRINT_BODY_CLASS = 'printing-contract';

type SignMode = 'electronic' | 'paper';

/**
 * لوحة التوقيع الإلكتروني والورقي — Canvas + طباعة + رفع نسخة ممسوحة.
 */
export default function ContractSignModal({
  open,
  onClose,
  childId,
  childName,
  contractType = 'parent',
  signerRoleDefault = '',
  isAr,
  onSigned,
}: {
  open: boolean;
  onClose: () => void;
  childId: string;
  childName?: string;
  contractType?: ContractType;
  signerRoleDefault?: string;
  isAr: boolean;
  onSigned?: (record: SignedContractRecord) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasSignatureRef = useRef(false);
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState(signerRoleDefault);
  const [mode, setMode] = useState<SignMode>('electronic');
  const [scannedCopy, setScannedCopy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const template = getContractTemplate(contractType);

  useEffect(() => {
    if (!open) return;
    setSignerName('');
    setSignerRole(signerRoleDefault);
    setMode('electronic');
    setScannedCopy(null);
    setError(null);
    hasSignatureRef.current = false;
    clearCanvas();
  }, [open, signerRoleDefault]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  };

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    hasSignatureRef.current = false;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0b1f14';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (!open || mode !== 'electronic') return;
    clearCanvas();
  }, [open, mode, clearCanvas]);

  const pointerPos = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return {
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    drawingRef.current = true;
    const { x, y } = pointerPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const { x, y } = pointerPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasSignatureRef.current = true;
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const canvasIsBlank = () => !hasSignatureRef.current;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = isAr ? 'عقد_تآلف' : 'Taaluf_Contract';
    document.body.classList.add(PRINT_BODY_CLASS);
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      document.title = originalTitle;
      document.body.classList.remove(PRINT_BODY_CLASS);
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
    window.setTimeout(restore, 1500);
  };

  const handleUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(
        isAr ? 'يُرجى رفع صورة (JPG/PNG).' : 'Please upload an image (JPG/PNG).'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setScannedCopy(String(reader.result));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    const name = signerName.trim();
    const role = signerRole.trim();
    if (!name || !role) {
      setError(
        isAr
          ? 'يُرجى إدخال الاسم والدور.'
          : 'Please enter name and role.'
      );
      return;
    }

    let status: ContractStatus = 'signed_electronic';
    let signatureImageBase64: string | undefined;
    let scannedCopyBase64: string | undefined;

    if (mode === 'electronic') {
      if (canvasIsBlank()) {
        setError(
          isAr
            ? 'يُرجى رسم التوقيع على اللوحة.'
            : 'Please draw your signature on the pad.'
        );
        return;
      }
      signatureImageBase64 = canvasRef.current?.toDataURL('image/png');
    } else {
      if (!scannedCopy) {
        setError(
          isAr
            ? 'يُرجى رفع صورة العقد الموقّع يدوياً.'
            : 'Please upload a scan of the signed paper contract.'
        );
        return;
      }
      status = 'signed_paper';
      scannedCopyBase64 = scannedCopy;
    }

    setBusy(true);
    const signedAt = new Date().toISOString();
    const record: SignedContractRecord = {
      childId,
      contractType,
      status,
      templateVersion: template.version,
      signerName: name,
      signerRole: role,
      signedAt,
      signatureImageBase64,
      scannedCopyBase64,
      childName: contractType === 'parent' ? childName : undefined,
      providerName: contractType === 'provider' ? name : undefined,
    };
    saveContract(record);
    setBusy(false);
    onSigned?.(record);
    onClose();
  };

  if (!open) return null;

  const previewRecord: SignedContractRecord = {
    childId,
    contractType,
    status: 'pending',
    templateVersion: template.version,
    signerName: signerName || '—',
    signerRole: signerRole || '—',
    signedAt: new Date().toISOString(),
    childName,
  };

  return (
    <div className="fixed inset-0 z-[250] flex flex-col bg-black/55 print:hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-4 py-3 text-white">
        <strong className="text-sm font-black">
          {isAr ? '📝 توقيع الاتفاقية' : '📝 Sign agreement'}
        </strong>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-xl border border-white/20 px-4 py-2 text-xs font-bold"
          >
            {isAr ? '🖨️ طباعة للنسخة الورقية' : '🖨️ Print paper copy'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 px-4 py-2 text-xs font-bold"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-slate-100 p-4 lg:flex-row lg:p-6">
        <div className="hidden flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:block lg:block">
          <ContractDocumentA4
            template={template}
            record={previewRecord}
            isAr={isAr}
          />
        </div>

        <div className="w-full shrink-0 space-y-4 lg:max-w-md">
          <div className="rounded-2xl border border-white/90 bg-white p-5 shadow-lg">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('electronic')}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-black transition ${
                  mode === 'electronic'
                    ? 'bg-[#2E7D8E] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isAr ? '✍️ توقيع إلكتروني' : '✍️ E-sign'}
              </button>
              <button
                type="button"
                onClick={() => setMode('paper')}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-black transition ${
                  mode === 'paper'
                    ? 'bg-[#2E7D8E] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isAr ? '📄 نسخة ورقية' : '📄 Paper copy'}
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="block text-xs font-bold text-slate-600">
                {isAr ? 'الاسم الكامل' : 'Full name'}
                <input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder={isAr ? 'اسم ولي الأمر' : 'Parent / provider name'}
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                {isAr ? 'الدور' : 'Role'}
                <input
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder={
                    isAr ? 'ولي أمر / أخصائي' : 'Parent / Specialist'
                  }
                />
              </label>
            </div>

            {mode === 'electronic' ? (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-600">
                    {isAr ? 'ارسم توقيعك' : 'Draw your signature'}
                  </p>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[10px] font-bold text-[#2E7D8E] underline"
                  >
                    {isAr ? 'مسح' : 'Clear'}
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={160}
                  className="mt-2 w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-white"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-[11px] leading-6 text-slate-500">
                  {isAr
                    ? 'اطبع العقد، وقّعه يدوياً، ثم ارفع صورة النسخة الموقّعة.'
                    : 'Print the contract, sign manually, then upload a scan.'}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 w-full text-xs"
                  onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
                />
                {scannedCopy && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={scannedCopy}
                    alt={isAr ? 'نسخة ممسوحة' : 'Scanned copy'}
                    className="mt-2 max-h-32 rounded-lg border border-slate-200"
                  />
                )}
              </div>
            )}

            {error && (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={submit}
              className="mt-4 w-full rounded-2xl bg-[#2E7D8E] py-3 text-sm font-black text-white shadow-md hover:bg-[#236372] disabled:opacity-60"
            >
              {isAr ? '✓ حفظ التوقيع والاعتماد' : '✓ Save & confirm signature'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { PRINT_BODY_CLASS };
