export interface Category {
    name: string;
    count: number;
    active: boolean;
}

export interface FilterGroup {
    label: string;
    options: string[];
}

export const categories: Category[] = [
    { name: "All Laptops", count: 53, active: true },
    { name: "Inspiron", count: 18, active: false },
    { name: "XPS", count: 9, active: false },
    { name: "Vostro", count: 7, active: false },
    { name: "Latitude", count: 11, active: false },
    { name: "Alienware", count: 5, active: false },
    { name: "G Series Gaming", count: 3, active: false },
];

export const filterGroups: FilterGroup[] = [
    { label: "Processor Brand", options: ["Intel", "AMD"] },
    { label: "Memory (RAM)", options: ["8GB", "16GB", "32GB", "64GB"] },
    { label: "Storage", options: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"] },
    { label: "Display Size", options: ['13"', '14"', '15.6"', '16"', '17"'] },
    { label: "Price", options: ["Under $500", "$500 – $999", "$1,000 – $1,499", "$1,500+"] },
];
