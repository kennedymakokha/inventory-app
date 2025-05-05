type Item = {
    product_name?: string;
    price?: number | string;
    description?: string;
};

type SetMsgFn = (msg: { msg: string; state: "error" | "success" }) => void;

const requiredFields: { key: keyof Item; label: string; type?: "number" | "string" }[] = [
    { key: "product_name", label: "Product Name", type: "string" },
    { key: "price", label: "Price", type: "number" },
    { key: "description", label: "Description", type: "string" },
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
