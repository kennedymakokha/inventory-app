type DropdownOption = {
    label: string;
    value: string | number;
};

export function toDropdownOptions<T extends Record<string, any>>(
    data: T[],
    labelKey: keyof T,
    valueKey: keyof T = "_id" as keyof T
): DropdownOption[] {
    return data.map(item => ({
        label: String(item[labelKey]).trim(),
        value: item[valueKey],
    }));
}

export const uniqueInventory = (data: any) => {
    const seen = new Set();
    return data.filter((item: any) => {
        if (seen.has(item.product_id)) return false;
        seen.add(item.product_id);
        return true;
    });
};
