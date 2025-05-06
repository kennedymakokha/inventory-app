type Item = {
    product_id?: string;
    quantity?: number | string;
  
};

type SetMsgFn = (msg: { msg: string; state: "error" | "success" }) => void;

const requiredFields: { key: keyof Item; label: string; type?: "number" | "string" }[] = [
    { key: "product_id", label: "Product Name", type: "string" },
    { key: "quantity", label: "quantity", type: "number" },
   
];

export const validateItem = (item: Item, setMsg: SetMsgFn): boolean => {
    for (const field of requiredFields) {
        const value = item[field.key];

        if (
            value === undefined ||
            value === "" ||
            (field.type === "number" && isNaN(Number(value)))
        ) {
            setMsg({
                msg: `Enter a valid ${field.label}`,
                state: "error",
            });
            return false;
        }
    }
    return true;
};
