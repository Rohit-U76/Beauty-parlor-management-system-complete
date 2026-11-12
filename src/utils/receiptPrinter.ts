import { Appointment } from '../types';

/**
 * Generates an official, clean salon printable receipt HTML document.
 * Formatted cleanly for thermal & standard A4 / Letter PDF print.
 */
export async function generateReceiptHtml(appointment: Appointment): Promise<string> {
  const advancePaid = appointment.advancePaid || Math.round((appointment.totalAmount || 0) * 0.1);
  const balanceDue = appointment.balanceDue !== undefined 
    ? appointment.balanceDue 
    : Math.max(0, (appointment.totalAmount || 0) - advancePaid);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Salon Receipt #${appointment.bookingRef} - Modern Unisex Salon Mohol</title>
      <style>
        @page {
          size: auto;
          margin: 10mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #18181b;
          background: #ffffff;
          padding: 20px;
          display: flex;
          justify-content: center;
        }
        .receipt-card {
          width: 100%;
          max-width: 600px;
          border: 1px solid #e4e4e7;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          background: #ffffff;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #cbd5e1;
          padding-bottom: 18px;
          margin-bottom: 18px;
        }
        .salon-brand {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #581c87;
          text-transform: uppercase;
        }
        .salon-sub {
          font-size: 12px;
          color: #52525b;
          margin-top: 3px;
          line-height: 1.4;
        }
        .deposit-badge {
          display: inline-block;
          margin-top: 10px;
          padding: 5px 14px;
          border-radius: 9999px;
          background: #ecfdf5;
          color: #047857;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.5px;
          border: 1px solid #a7f3d0;
        }
        .section-title {
          font-size: 11px;
          font-weight: 800;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 14px 0 8px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 7px 0;
          border-bottom: 1px solid #f4f4f5;
          font-size: 13px;
        }
        .label {
          color: #71717a;
          font-weight: 500;
        }
        .val {
          font-weight: 700;
          color: #18181b;
          text-align: right;
        }
        .summary-box {
          margin-top: 18px;
          background: #faf5ff;
          border: 1px solid #e9d5ff;
          border-radius: 12px;
          padding: 16px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 13px;
        }
        .summary-row.total {
          border-top: 2px dashed #d8b4fe;
          margin-top: 8px;
          padding-top: 10px;
          font-size: 15px;
          font-weight: 800;
          color: #581c87;
        }
        .terms-box {
          margin-top: 16px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 10px;
          font-size: 10px;
          color: #64748b;
          line-height: 1.5;
        }
        .footer {
          text-align: center;
          margin-top: 18px;
          font-size: 11px;
          color: #a1a1aa;
        }
        @media print {
          body {
            padding: 0;
            background: #ffffff;
          }
          .receipt-card {
            border: none;
            box-shadow: none;
            padding: 0;
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="salon-brand">MODERN UNISEX SALON</div>
          <div class="salon-sub">B.N. Gund Complex, Near Kanya Prashala & ICICI Bank, Mohol, Solapur - 413213</div>
          <div class="salon-sub">Helpline & WhatsApp: +91 81040 26257 | Founder & Master Stylist: Dinesh Ghodake</div>
          <div class="deposit-badge">10% ADVANCE ONLINE PAYMENT CONFIRMED</div>
        </div>

        <div class="section-title">Booking Details</div>
        <div class="info-row">
          <span class="label">Booking Reference Number</span>
          <span class="val" style="font-family:monospace; color:#581c87;">#${appointment.bookingRef}</span>
        </div>
        <div class="info-row">
          <span class="label">Client Name</span>
          <span class="val">${appointment.clientName}</span>
        </div>
        <div class="info-row">
          <span class="label">Client Mobile Phone</span>
          <span class="val">${appointment.clientPhone}</span>
        </div>
        ${appointment.clientEmail ? `
        <div class="info-row">
          <span class="label">Client Email</span>
          <span class="val">${appointment.clientEmail}</span>
        </div>` : ''}
        <div class="info-row">
          <span class="label">Reserved Salon Service</span>
          <span class="val">${appointment.serviceName}</span>
        </div>
        <div class="info-row">
          <span class="label">Assigned Master Stylist</span>
          <span class="val">${appointment.stylistName || 'Master Stylist (Dinesh Ghodake)'}</span>
        </div>
        <div class="info-row">
          <span class="label">Appointment Date</span>
          <span class="val">${appointment.date}</span>
        </div>
        <div class="info-row">
          <span class="label">Reserved Time Slot</span>
          <span class="val">${appointment.timeSlot}</span>
        </div>

        <div class="summary-box">
          <div class="summary-row">
            <span class="label">Total Service Bill:</span>
            <span class="val">₹${appointment.totalAmount}</span>
          </div>
          <div class="summary-row">
            <span class="label">10% Online Advance Deposit (Verified Paid):</span>
            <span class="val" style="color:#047857;">- ₹${advancePaid}</span>
          </div>
          <div class="summary-row total">
            <span>Balance Payable at Counter:</span>
            <span style="color:#b45309;">₹${balanceDue}</span>
          </div>
        </div>

        <div class="terms-box">
          <strong>Important Salon Policies:</strong><br/>
          • Prior appointment recommended; chairs allocated with zero wait time.<br/>
          • 10% advance deposit secures chair and stylist availability.<br/>
          • Balance payable upon service completion via Cash, UPI, or Card at the desk.<br/>
          • Please arrive 10-15 minutes prior to your reserved slot.
        </div>

        <div class="footer">
          Modern Unisex Salon Mohol • Excellence in Hair, Skin & Luxury Grooming
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Triggers printing of the official receipt using an isolated printable DOM container.
 * Seamlessly isolates the receipt for paper and PDF printing, with immediate download fallback.
 */
export async function printSalonReceipt(appointment: Appointment): Promise<boolean> {
  try {
    const html = await generateReceiptHtml(appointment);

    // 1. Clean up any existing print containers
    const existingContainer = document.getElementById('salon-receipt-print-container');
    if (existingContainer) existingContainer.remove();
    const existingStyle = document.getElementById('salon-receipt-print-style');
    if (existingStyle) existingStyle.remove();

    // 2. Inject dedicated print stylesheet
    const printStyle = document.createElement('style');
    printStyle.id = 'salon-receipt-print-style';
    printStyle.textContent = `
      @media screen {
        #salon-receipt-print-container {
          display: none !important;
        }
      }
      @media print {
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        body > *:not(#salon-receipt-print-container) {
          display: none !important;
        }
        #salon-receipt-print-container {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          background: #ffffff !important;
          color: #18181b !important;
          z-index: 99999999 !important;
          margin: 0 !important;
          padding: 10mm !important;
        }
        #salon-receipt-print-container * {
          visibility: visible !important;
        }
      }
    `;
    document.head.appendChild(printStyle);

    // 3. Inject receipt DOM container
    const printContainer = document.createElement('div');
    printContainer.id = 'salon-receipt-print-container';
    printContainer.innerHTML = html;
    document.body.appendChild(printContainer);

    // 4. Always initiate file download guarantee alongside print
    try {
      await downloadReceiptFile(appointment);
    } catch (dlErr) {
      console.warn('Backup file download exception:', dlErr);
    }

    // 5. Trigger native print
    let printSucceeded = false;
    try {
      window.print();
      printSucceeded = true;
    } catch (e) {
      console.warn('Native window.print blocked in iframe:', e);
    }

    // 6. Cleanup DOM after print dialog closes
    setTimeout(() => {
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
      if (document.head.contains(printStyle)) {
        document.head.removeChild(printStyle);
      }
    }, 4000);

    return printSucceeded;
  } catch (error) {
    console.error('Print receipt failed, saving HTML receipt instead:', error);
    await downloadReceiptFile(appointment);
    return false;
  }
}

/**
 * Triggers a direct download of the official HTML receipt that can be saved as PDF or printed anytime.
 */
export async function downloadReceiptFile(appointment: Appointment): Promise<void> {
  const html = await generateReceiptHtml(appointment);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `ModernSalon_Receipt_${appointment.bookingRef || appointment.id}.html`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, 1000);
}
