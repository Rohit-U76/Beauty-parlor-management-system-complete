import React from 'react';
import { DirectUpiPaymentModal, DirectUpiPaymentModalProps } from './DirectUpiPaymentModal';

export type RazorpayModalProps = DirectUpiPaymentModalProps;

/**
 * RazorpayModal has been updated to DirectUpiPaymentModal to process direct-to-bank UPI
 * and PhonePe QR scanner payments with zero gateway commissions, while retaining compatibility.
 */
export const RazorpayModal: React.FC<RazorpayModalProps> = (props) => {
  return <DirectUpiPaymentModal {...props} />;
};

export default RazorpayModal;
