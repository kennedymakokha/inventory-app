import { FineDate } from "../../../../utils/formatDate";

export const buildReceiptText = ({
    receiptNo,
    paid,
    invoiceId,
    cartItems,
    user,
    method,
    paidMpesa,
    business,
    paidCash,
    mpesaData, phoneNumber, totals, changeDue

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
        text += center(business.postal_address);
        text += center(`Tel: ${business.phone_number}`);
    }
    text += line;


    text += `Receipt No: ${receiptNo}\nInvoice ID: ${invoiceId}\nPayment: ${paymentLabel}\n`;
    // USE THE PASSED DATA INSTEAD OF STATE
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
    const vat = totalInclusive * (16 / 116);
    const net = totalInclusive + vat;

    text += `Net (Ex VAT)`.padEnd(width - net.toFixed(2).length) + net.toFixed(2) + '\n';
    text += `VAT (16%)`.padEnd(width - vat.toFixed(2).length) + vat.toFixed(2) + '\n';
    text += line;
    text += `TOTAL`.padEnd(width - totals.finalTotal.toFixed(2).length) + totals.finalTotal.toFixed(2) + '\n';
    text += line;
    if (paidCash) { text += `Cash amount`.padEnd(width - paidCash.toFixed(2).length) + paidCash.toFixed(2) + '\n'; }
    if (paidMpesa) { text += `Mpesa amount`.padEnd(width - paidMpesa.toFixed(2).length) + paidMpesa.toFixed(2) + '\n'; }
    if (paid) { text += `Amount Paid`.padEnd(width - paid.toFixed(2).length) + paid.toFixed(2) + '\n'; }
    text += `Change`.padEnd(width - (changeDue).toFixed(2).length) + (changeDue).toFixed(2) + '\n';
    text += line;

    text += center(`MPESA TILL: 123456`);
    text += center('Prices VAT Inclusive');
    text += center('Thank You!');
    if (user?.name) text += `Served by: ${user.name}\n`;

    return text;
};
