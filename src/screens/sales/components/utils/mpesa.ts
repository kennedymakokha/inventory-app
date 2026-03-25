import { Business, useBusiness } from "../../../../context/BusinessContext";

export const handleSTK = async (phone: string, amount: number, business: Business) => {


    const requestId = `STK-${Date.now()}`;
    try {
        const response = await fetch(`https://a899-102-205-188-82.ngrok-free.app/v1/payments/stk`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": `${business?.api_key}`,
                "Idempotency-Key": requestId,
            },
            body: JSON.stringify({
                amount: 1,
                phone: `254${phone}`,
                accountReference: business?.business_name?.substring(0, 12),
                description: "Retail Goods"
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "STK Initiation Failed");

        // Polling Logic
        let status = "pending";
        for (let i = 0; i < 15; i++) {
            await new Promise(res => setTimeout(res, 5000));
            const statusCheck = await fetch(`https://a899-102-205-188-82.ngrok-free.app/callbacks/stk/status/${requestId}`, {
                headers: { "x-api-key": `${business?.api_key}` }
            });
            const statusData = await statusCheck.json();
            if (statusData.status === "success") return { success: true, mpesa: statusData.mpesa };
            if (statusData.status === "failed") return { success: false, error: "Payment declined" };
        }
        return { success: false, error: "Payment timeout" };
    } catch (error: any) {
        return { success: false, error: error.message || "Network Error" };
    }
};