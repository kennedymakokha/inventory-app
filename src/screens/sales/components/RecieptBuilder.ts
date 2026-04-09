import { FineDate } from "../../../../utils/formatDate";

export const buildReceiptText = ({
    receiptNo,
    paid,
    invoiceId,
    cartItems,
    user,
    method,
    paidMpesa,
    customerPin,
    business,
    paidCash,
    mpesaData,
    phoneNumber,
    totals,
    changeDue,
    deliveryFee,
}: any) => {
    const paymentLabel = (paidMpesa > 0 && paidCash > 0) ? "MPESA/CASH (SPLIT)" : method;
    const width = 32;
    const line = '-'.repeat(width) + '\n';
    const center = (str: string) => {
        const space = Math.max(0, Math.floor((width - str.length) / 2));
        return ' '.repeat(space) + str + '\n';
    };

    let text = '';
    if (business) {
        text += center(business.business_name.toUpperCase());
        if (business.postal_address) text += center(business.postal_address);
        if (business.phone_number) text += center(`Tel: ${business.phone_number}`);
    }
    text += line;

    text += `Receipt No: ${receiptNo}\nInvoice ID: ${invoiceId}\nPayment: ${paymentLabel}\n`;

    // Capture Alphanumeric Customer PIN if passed
    if (customerPin && customerPin.trim().length > 0) {
        text += `Customer PIN: ${customerPin.toUpperCase()}\n`;
    }

    if (mpesaData?.receiptNumber) {
        text += `Trans ID: ${mpesaData.receiptNumber}\n`;
        text += `Paid via: ${phoneNumber}\n`;
    }

    const displayDate = mpesaData?.transactionDate
        ? FineDate(`${mpesaData.transactionDate}`)
        : new Date().toLocaleString();

    text += `Date: ${displayDate}\n${line}ITEMS\n`;

    let totalInclusive = 0;
    cartItems.forEach((item: any) => {
        const itemTotal = item.price * item.quantity;
        totalInclusive += itemTotal;
        const name = item.product_name.length > width ? item.product_name.substring(0, width) : item.product_name;
        text += `${name}\n`;
        const left = `${item.quantity} x ${item.price.toFixed(2)}`;
        const right = itemTotal.toFixed(2);
        text += left.padEnd(width - right.length) + right + '\n';
    });
    text += line;

    if (deliveryFee) {
        // const feeStr = `Delivery Fee: ${deliveryFee.toFixed(2)}`;
        // text += feeStr.padStart(width) + '\n';
        text += `Delivery Fee`.padEnd(width - deliveryFee.toFixed(2).length) + deliveryFee.toFixed(2) + '\n';
    }
    text += line;

    // --- TAX ADJUSTMENT (INCLUSIVE LOGIC) ---
    // Extracting VAT: Total / 1.16 gives Net. Total - Net gives VAT.
    const totalAmount = totals.finalTotal;
    const vat = totals.tax; // This should already be calculated in the backend for accuracy, but can be derived as: totals.finalTotal - totals.subtotal
    const net = totals.subtotal;

    text += `TOTAL`.padEnd(width - totalAmount.toFixed(2).length) + totalAmount.toFixed(2) + '\n';
    text += line;

    // Only capture Tax Breakdown if Customer PIN is passed
    if (customerPin && customerPin.trim().length > 0) {
        text += `Net (Excl VAT)`.padEnd(width - net.toFixed(2).length) + net.toFixed(2) + '\n';
        text += `VAT (16%)`.padEnd(width - vat.toFixed(2).length) + vat.toFixed(2) + '\n';
        text += line;
    }

    if (paidCash) { text += `Cash amount`.padEnd(width - paidCash.toFixed(2).length) + paidCash.toFixed(2) + '\n'; }
    if (paidMpesa) { text += `Mpesa amount`.padEnd(width - paidMpesa.toFixed(2).length) + paidMpesa.toFixed(2) + '\n'; }
    if (paid) { text += `Amount Paid`.padEnd(width - paid.toFixed(2).length) + paid.toFixed(2) + '\n'; }

    // Ensure changeDue is formatted correctly
    const changeStr = (changeDue || 0).toFixed(2);
    text += `Change`.padEnd(width - changeStr.length) + changeStr + '\n';

    text += line;

    if (business?.mpesa_till) text += center(`MPESA TILL: ${business.mpesa_till}`);
    text += center('Prices VAT Inclusive');
    text += center('Thank You!');
    if (user?.name) text += center(`Served by: ${user.name}`);

    return text;
};

export const buildDeliveryText = ({
    customerName,
    phoneNumber,
    address,
    isExpress,
    notes,
    business,
    receiptNo,
    invoiceId,
    deliveryFee,
    user,
}: any) => {

    const width = 32;
    const line = '-'.repeat(width) + '\n';
    const center = (str: string) => {
        const space = Math.max(0, Math.floor((width - str.length) / 2));
        return ' '.repeat(space) + str + '\n';
    };

    let text = '';
    if (business) {
        text += center(business.business_name.toUpperCase());
        if (business.postal_address) text += center(business.postal_address);
        if (business.phone_number) text += center(`Tel: ${business.phone_number}`);
    }
    text += line;
    text += `Receipt No: ${receiptNo}\nInvoice ID: ${invoiceId}\n`;
    text += line;
    text += `Customer: ${customerName}\n`;
    if (phoneNumber) text += `Phone: ${phoneNumber}\n`;
    if (address) text += `Address: ${address}\n`;
    if (deliveryFee) text += `Delivery Fee: ${deliveryFee.toFixed(2)}\n`;
    text += `Delivery Type: ${isExpress ? 'Express' : 'Standard'}\n`;
    if (notes) text += `Notes: ${notes}\n`;

    text += line;

    text += center('Thank You!');
    if (user?.name) text += center(`Served and Dispatched by: ${user.name}`);
    return text;
};