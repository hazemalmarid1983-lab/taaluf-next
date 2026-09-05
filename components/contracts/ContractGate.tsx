'use client';

import { useCallback, useEffect, useState } from 'react';
import ContractSignModal from '@/components/contracts/ContractSignModal';
import {
  assertContractSigned,
  checkContractGate,
  contractGateLabel,
  type ContractAction,
} from '@/lib/contracts/contractGate';
import type { ContractType } from '@/lib/contracts/contractTemplates';
import {
  isContractSigned,
  type SignedContractRecord,
} from '@/lib/contracts/contractStore';

/**
 * يمنع الإجراءات غير الموقّعة ويعرض تنبيهاً لطيفاً لاستكمال التوقيع.
 */
export default function ContractGate({
  childId,
  childName,
  action,
  contractType = 'parent',
  isAr,
  signerRoleDefault,
  onSigned,
  variant = 'banner',
}: {
  childId?: string | null;
  childName?: string;
  action: ContractAction;
  contractType?: ContractType;
  isAr: boolean;
  signerRoleDefault?: string;
  onSigned?: (record: SignedContractRecord) => void;
  /** banner = inline alert · modal = full-screen block */
  variant?: 'banner' | 'modal';
}) {
  const [tick, setTick] = useState(0);
  const [signOpen, setSignOpen] = useState(false);

  const gate = checkContractGate(childId, action);
  const blocked = !gate.allowed;

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (blocked && variant === 'modal') setSignOpen(true);
  }, [blocked, variant, tick]);

  const handleSigned = (record: SignedContractRecord) => {
    refresh();
    onSigned?.(record);
    setSignOpen(false);
  };

  if (!blocked) return null;

  const label = contractGateLabel(gate, isAr);

  if (variant === 'modal') {
    return (
      <>
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-live="polite"
        >
          <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-6 shadow-2xl">
            <p className="text-3xl leading-none">📋</p>
            <h2 className="mt-3 text-lg font-black text-[#0b1f14]">
              {isAr ? 'اتفاقية مطلوبة' : 'Agreement required'}
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">{label}</p>
            <button
              type="button"
              onClick={() => setSignOpen(true)}
              className="mt-5 w-full rounded-2xl bg-[#2E7D8E] py-3 text-sm font-black text-white shadow-md hover:bg-[#236372]"
            >
              {isAr ? '✍️ توقيع الاتفاقية الآن' : '✍️ Sign agreement now'}
            </button>
          </div>
        </div>
        {childId && (
          <ContractSignModal
            open={signOpen}
            onClose={() => setSignOpen(false)}
            childId={childId}
            childName={childName}
            contractType={contractType}
            signerRoleDefault={signerRoleDefault}
            isAr={isAr}
            onSigned={handleSigned}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
        role="status"
      >
        <p className="font-black">{isAr ? '📋 اتفاقية مطلوبة' : '📋 Agreement required'}</p>
        <p className="mt-1 text-xs leading-6 opacity-90">{label}</p>
        {childId && (
          <button
            type="button"
            onClick={() => setSignOpen(true)}
            className="mt-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-900 hover:bg-amber-400"
          >
            {isAr ? '✍️ توقيع الآن' : '✍️ Sign now'}
          </button>
        )}
      </div>
      {childId && (
        <ContractSignModal
          open={signOpen}
          onClose={() => setSignOpen(false)}
          childId={childId}
          childName={childName}
          contractType={contractType}
          signerRoleDefault={signerRoleDefault}
          isAr={isAr}
          onSigned={handleSigned}
        />
      )}
    </>
  );
}

/** للاستخدام في معالجات onClick — يُرجع true إذا مُنع الإجراء */
export function blockIfContractPending(
  childId: string | null | undefined,
  action: ContractAction,
  onBlocked?: () => void
): boolean {
  if (assertContractSigned(childId, action)) return false;
  onBlocked?.();
  return true;
}

/** Hook-style helper for pages */
export function useContractBlocked(
  childId: string | null | undefined,
  action: ContractAction,
  refreshKey = 0
) {
  void refreshKey;
  return !isContractSigned(childId || '', 'parent');
}
