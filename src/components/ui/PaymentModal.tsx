"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditCard, QrCode, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Modal, ModalFooter } from "./Modal";
import { payments } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import type { Plan, PaymentProvider, InitPaymentResponse, Country } from "@/lib/types";

// Plan pricing in tenge
const PLAN_PRICING: Record<Plan, number> = {
  free: 0,
  single: 7990,
  pro: 24990,
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: "single" | "pro";
  country: Country;
  onSuccess: () => void;
}

type Step = "select" | "processing" | "qr" | "success" | "error";

export function PaymentModal({
  isOpen,
  onClose,
  plan,
  country,
  onSuccess,
}: PaymentModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("select");
  const [paymentData, setPaymentData] = useState<InitPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const price = PLAN_PRICING[plan];
  const planName = plan === "single" ? "Toilab One" : "Toilab Pro";

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("select");
      setPaymentData(null);
      setError(null);
      setIsPolling(false);
    }
  }, [isOpen]);

  // Poll for Kaspi payment status
  useEffect(() => {
    if (!isPolling || !paymentData?.paymentId) return;

    const pollInterval = setInterval(async () => {
      try {
        const payment = await payments.getStatus(paymentData.paymentId);
        if (payment.status === "completed") {
          setIsPolling(false);
          setStep("success");
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
        } else if (payment.status === "failed") {
          setIsPolling(false);
          setError(payment.failReason || t("payment.error.failed"));
          setStep("error");
        }
      } catch {
        // Continue polling on error
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isPolling, paymentData, onSuccess, onClose, t]);

  const handleSelectProvider = useCallback(async (provider: PaymentProvider) => {
    setStep("processing");
    setError(null);

    try {
      const response = await payments.init({ plan, provider });
      setPaymentData(response);

      if (provider === "cloudpayments") {
        // Open CloudPayments widget
        openCloudPaymentsWidget(response);
      } else if (provider === "kaspi") {
        // Show QR code
        setStep("qr");
        setIsPolling(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("payment.error.init"));
      setStep("error");
    }
  }, [plan, t]);

  const openCloudPaymentsWidget = useCallback((data: InitPaymentResponse) => {
    if (typeof window === "undefined") return;

    // @ts-expect-error CloudPayments widget global
    const widget = new window.cp.CloudPayments();

    widget.pay(
      "charge",
      {
        publicId: data.publicId,
        description: `ToiLab ${plan === "single" ? "One" : "Pro"}`,
        amount: data.amount,
        currency: "KZT",
        invoiceId: data.invoiceId,
        skin: "mini",
      },
      {
        onSuccess: () => {
          setStep("success");
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
        },
        onFail: (reason: string) => {
          setError(reason || t("payment.error.failed"));
          setStep("error");
        },
        onComplete: () => {
          // Widget closed
        },
      }
    );
  }, [plan, onSuccess, onClose, t]);

  const handleRetry = useCallback(() => {
    setStep("select");
    setError(null);
    setPaymentData(null);
  }, []);

  const renderContent = () => {
    switch (step) {
      case "select":
        return (
          <div className="space-y-4">
            <div className="text-center pb-4 border-b border-border">
              <div className="text-2xl font-bold">{formatCurrency(price, country)}</div>
              <div className="text-sm text-muted-foreground">
                {plan === "pro" ? t("payment.monthly") : t("payment.oneTime")}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleSelectProvider("cloudpayments")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-secondary/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium group-hover:text-primary transition-colors">
                    {t("payment.card")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Visa, Mastercard, Apple Pay, Google Pay
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSelectProvider("kaspi")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-secondary/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
                  <QrCode className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium group-hover:text-primary transition-colors">
                    Kaspi QR
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("payment.kaspiDescription")}
                  </div>
                </div>
              </button>
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="mt-4 text-muted-foreground">{t("payment.processing")}</div>
          </div>
        );

      case "qr":
        return (
          <div className="flex flex-col items-center py-6">
            <div className="text-center mb-6">
              <div className="text-lg font-medium">{t("payment.scanQR")}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {t("payment.scanQRDescription")}
              </div>
            </div>

            {paymentData?.kaspiQRPayUrl && (
              <div className="bg-white p-4 rounded-xl mb-6">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentData.kaspiQRPayUrl)}`}
                  alt="Kaspi QR"
                  className="w-48 h-48"
                />
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("payment.waitingForPayment")}
            </div>

            <div className="mt-6 text-center">
              <div className="text-2xl font-bold">{formatCurrency(price, country)}</div>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div className="text-xl font-semibold text-green-600">{t("payment.success")}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {t("payment.successDescription", { plan: planName })}
            </div>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <div className="text-xl font-semibold text-red-600">{t("payment.error.title")}</div>
            <div className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
              {error || t("payment.error.generic")}
            </div>
            <ModalFooter>
              <button onClick={handleRetry} className="btn-primary">
                {t("payment.retry")}
              </button>
            </ModalFooter>
          </div>
        );
    }
  };

  return (
    <>
      {/* CloudPayments script */}
      <script src="https://widget.cloudpayments.ru/bundles/cloudpayments.js" async />

      <Modal
        isOpen={isOpen}
        onClose={step === "processing" || step === "qr" ? () => {} : onClose}
        title={t("payment.title", { plan: planName })}
        size="sm"
      >
        {renderContent()}
      </Modal>
    </>
  );
}
