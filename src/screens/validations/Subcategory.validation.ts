type Item = {
    sub_category_name?: string;
  
    description?: string;
};

type SetMsgFn = (msg: { msg: string; state: "error" | "success" }) => void;

const requiredFields: { key: keyof Item; label: string; type?: "number" | "string" }[] = [
    { key: "sub_category_name", label: "Sub Category Name", type: "string" },
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
